// =================================================================
// INTERVISIBILITY ANALYSIS
// =================================================================

(function() {
    'use strict';
    
    // Store loaded markers and intervisibility data
    let intervisibilityMarkers = [];
    let intervisibilityLayerGroup = null;
    let intervisibilityLines = [];
    let intervisibilityLinesLayerGroup = null;
    let isCalculating = false;
    let cancelCalculation = false;
    let isPaused = false;
    let markerDems = new Map(); // Store DEM data for each marker
    
    // Store selected field names for unique ID and display name
    let selectedUniqueIdField = null;
    let selectedDisplayNameField = null;
    let pendingGeoJson = null; // Store GeoJSON while waiting for field selection
    
    // State for pause/resume
    let pausedState = {
        markerData: null,
        completedMarkerIndices: null,
        checkedPairs: new Set(), // Track which pairs have been checked (as "i_j" strings)
        visiblePairs: [],
        currentI: 0,
        currentJ: 0,
        profilesCompleted: 0
    };
    
    // DEM cache for line-of-sight checks (to avoid fetching same DEM multiple times)
    const lineDemCache = new Map(); // Key: "lat_lng_radiusTiles_zoom", Value: { dem, lastUsed, useCount }
    const MAX_CACHE_SIZE = 3; // Reduced: Maximum number of DEMs to cache (was 10)
    const MAX_CACHE_AGE_MS = 2 * 60 * 1000; // Reduced: 2 minutes - clear old DEMs (was 5 minutes)
    
    // Generate cache key for a DEM
    function getDemCacheKey(latlng, radiusTiles, zoom) {
        // Round to 4 decimal places (~11 meters precision) to allow reuse of nearby DEMs
        const lat = Math.round(latlng.lat * 10000) / 10000;
        const lng = Math.round(latlng.lng * 10000) / 10000;
        return `${lat}_${lng}_${radiusTiles}_${zoom}`;
    }
    
    // Clean up old or least-used DEMs from cache
    function cleanupDemCache() {
        const now = Date.now();
        const entries = Array.from(lineDemCache.entries());
        
        // Remove old entries first
        for (const [key, value] of entries) {
            if (now - value.lastUsed > MAX_CACHE_AGE_MS) {
                // Explicitly clear DEM data to help garbage collection
                if (value.dem && value.dem.data) {
                    value.dem.data = null;
                }
                lineDemCache.delete(key);
            }
        }
        
        // If still over limit, remove least recently used
        if (lineDemCache.size > MAX_CACHE_SIZE) {
            const sorted = Array.from(lineDemCache.entries())
                .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
            
            const toRemove = lineDemCache.size - MAX_CACHE_SIZE;
            for (let i = 0; i < toRemove; i++) {
                const [key, value] = sorted[i];
                // Explicitly clear DEM data to help garbage collection
                if (value.dem && value.dem.data) {
                    value.dem.data = null;
                }
                lineDemCache.delete(key);
            }
        }
        
        // Force garbage collection hint (if available)
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                // GC not available, ignore
            }
        }
    }
    
    // Get or fetch DEM with caching
    async function getOrFetchLineDem(midpoint, radiusTiles, zoom, map) {
        const cacheKey = getDemCacheKey(midpoint, radiusTiles, zoom);
        
        // Check cache first
        if (lineDemCache.has(cacheKey)) {
            const cached = lineDemCache.get(cacheKey);
            // Validate cached DEM before returning it
            if (cached && cached.dem && cached.dem.data && cached.dem.zoom !== undefined) {
                cached.lastUsed = Date.now();
                cached.useCount++;
                return cached.dem;
            } else {
                // Cached DEM is invalid, remove it and fetch a new one
                lineDemCache.delete(cacheKey);
            }
        }
        
        // Clean cache aggressively before fetching new DEM
        cleanupDemCache();
        
        // If cache is still full after cleanup, force remove oldest entry
        if (lineDemCache.size >= MAX_CACHE_SIZE) {
            const sorted = Array.from(lineDemCache.entries())
                .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
            if (sorted.length > 0) {
                const [oldestKey, oldestValue] = sorted[0];
                if (oldestValue.dem && oldestValue.dem.data) {
                    oldestValue.dem.data = null;
                }
                lineDemCache.delete(oldestKey);
            }
        }
        
        // Fetch new DEM
        const dem = await window.HC_fetchTerrainPatch(midpoint, zoom, radiusTiles, map, null);
        
        // Validate DEM before caching
        if (!dem || !dem.data || dem.zoom === undefined) {
            throw new Error('Invalid DEM returned from HC_fetchTerrainPatch');
        }
        
        // Store in cache
        lineDemCache.set(cacheKey, {
            dem: dem,
            lastUsed: Date.now(),
            useCount: 1
        });
        
        return dem;
    }
    
    // Clear DEM cache (call when clearing intervisibility data)
    function clearDemCache() {
        // Explicitly clear DEM data to help garbage collection
        for (const [key, value] of lineDemCache.entries()) {
            if (value.dem && value.dem.data) {
                value.dem.data = null;
            }
        }
        lineDemCache.clear();
        markerDems.clear();
    }
    
    // Handle file selection for marker collection
    window.handleIntervisibilityFile = function(event) {
        const fileInput = event.target;
        const file = fileInput.files[0];
        if (!file) {
            fileInput.value = '';
            return;
        }
        
        // Prevent multiple simultaneous reads
        if (fileInput._reading) {
            return;
        }
        fileInput._reading = true;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const geoJson = JSON.parse(e.target.result);
                fileInput.value = '';
                fileInput._reading = false;
                showIntervisibilityFieldSelectionModal(geoJson);
            } catch (error) {
                updateIntervisibilityStatus('Error reading GeoJSON file: ' + error.message);
                fileInput.value = '';
                fileInput._reading = false;
            }
        };
        reader.onerror = function() {
            updateIntervisibilityStatus('Error reading file.');
            fileInput.value = '';
            fileInput._reading = false;
        };
        reader.readAsText(file);
    };
    
    // Alias for backward compatibility
    window.handleIntervisibilityMarkersFile = window.handleIntervisibilityFile;
    
    // Show modal for selecting unique ID and display name fields
    function showIntervisibilityFieldSelectionModal(geoJson) {
        pendingGeoJson = geoJson;
        
        // Extract Point features
        const pointFeatures = geoJson.features.filter(f => f.geometry && f.geometry.type === 'Point');
        
        if (pointFeatures.length === 0) {
            updateIntervisibilityStatus('No Point features found in GeoJSON file.');
            return;
        }
        
        // Collect property keys - limit iterations to prevent loops
        const propertyKeys = new Set();
        const maxFeatures = Math.min(pointFeatures.length, 100); // Limit to first 100 features
        for (let i = 0; i < maxFeatures; i++) {
            const props = pointFeatures[i].properties || {};
            const keys = Object.keys(props);
            for (let j = 0; j < keys.length; j++) {
                propertyKeys.add(keys[j]);
            }
        }
        
        // Populate dropdowns
        const uniqueIdSelect = document.getElementById('select-unique-id');
        const displayNameSelect = document.getElementById('select-display-name');
        
        if (!uniqueIdSelect || !displayNameSelect) {
            updateIntervisibilityStatus('Error: Modal elements not found.');
            return;
        }
        
        // Clear existing options
        uniqueIdSelect.innerHTML = '<option value="">-- Select Field --</option>';
        displayNameSelect.innerHTML = '<option value="">-- Select Field (optional) --</option>';
        
        // Add options - batch DOM updates to prevent blocking
        const sortedKeys = Array.from(propertyKeys).sort();
        
        // Use DocumentFragment for better performance
        const fragment1 = document.createDocumentFragment();
        const fragment2 = document.createDocumentFragment();
        
        for (let i = 0; i < sortedKeys.length; i++) {
            const key = sortedKeys[i];
            const option1 = document.createElement('option');
            option1.value = key;
            option1.textContent = key;
            fragment1.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = key;
            option2.textContent = key;
            fragment2.appendChild(option2);
        }
        
        // Batch append to avoid multiple reflows
        uniqueIdSelect.appendChild(fragment1);
        displayNameSelect.appendChild(fragment2);
        
        // Show modal - use setTimeout to yield to browser and prevent blocking
        setTimeout(() => {
            const modal = document.getElementById('intervisibility-field-modal');
            const overlay = document.getElementById('modal-overlay');
            if (!modal || !overlay) {
                updateIntervisibilityStatus('Error: Modal elements not found in DOM.');
                return;
            }
            
            overlay.style.display = 'block';
            modal.style.display = 'block';
            
            // Center modal initially - calculate position properly
            const modalWidth = modal.offsetWidth || 500;
            const windowWidth = window.innerWidth;
            const initialLeft = (windowWidth - modalWidth) / 2;
            modal.style.position = 'fixed';
            modal.style.top = '50px';
            modal.style.left = initialLeft + 'px';
            modal.style.transform = 'none'; // Remove transform for draggable
            
            // Initialize draggable - use setTimeout to prevent blocking
            setTimeout(() => {
                if (typeof jQuery !== 'undefined' && jQuery.ui && jQuery.ui.draggable) {
                    try {
                        if (jQuery(modal).data('ui-draggable')) {
                            jQuery(modal).draggable('destroy');
                        }
                    } catch (e) {
                        // Ignore if not draggable yet
                    }
                    
                    // Initialize draggable with proper options
                    jQuery(modal).draggable({
                        handle: '.custom-modal-header',
                        containment: 'window',
                        scroll: false,
                        cursor: 'move',
                        start: function(event, ui) {
                            // Ensure transform is removed when dragging starts
                            modal.style.transform = 'none';
                        },
                        drag: function(event, ui) {
                            // Keep transform removed during drag
                            modal.style.transform = 'none';
                        }
                    });
                }
            }, 0);
        }, 0);
    }
    
    // Close the field selection modal
    window.closeIntervisibilityFieldModal = function() {
        const modal = document.getElementById('intervisibility-field-modal');
        const overlay = document.getElementById('modal-overlay');
        if (modal && overlay) {
            overlay.style.display = 'none';
            modal.style.display = 'none';
            
            // Destroy draggable if it exists
            if (typeof jQuery !== 'undefined' && jQuery.ui && jQuery.ui.draggable) {
                jQuery(modal).draggable('destroy');
            }
        }
        pendingGeoJson = null;
    }
    
    // Confirm field selection and load markers
    window.confirmIntervisibilityFieldSelection = function() {
        try {
            // Force status update to verify function is called
            updateIntervisibilityStatus('Load Markers button clicked...');
            
            const uniqueIdField = document.getElementById('select-unique-id');
            if (!uniqueIdField) {
                alert('ERROR: Unique ID select element not found!');
                return;
            }
            
            const uniqueIdValue = uniqueIdField.value;
            // Unique ID field is optional - if not selected, will use "Site 1", "Site 2", etc.
            selectedUniqueIdField = uniqueIdValue || null;
            const displayNameSelect = document.getElementById('select-display-name');
            selectedDisplayNameField = displayNameSelect ? displayNameSelect.value || null : null;
            
            updateIntervisibilityStatus('Fields selected. Checking GeoJSON data...');
            
            // Check pendingGeoJson BEFORE closing modal
            if (!pendingGeoJson) {
                alert('ERROR: No GeoJSON data available. pendingGeoJson is null/undefined. Please reload the file.');
                updateIntervisibilityStatus('ERROR: No GeoJSON data available.');
                return;
            }
            
            if (!pendingGeoJson.features || !Array.isArray(pendingGeoJson.features)) {
                alert('ERROR: Invalid GeoJSON structure. Features array missing.');
                updateIntervisibilityStatus('ERROR: Invalid GeoJSON structure.');
                return;
            }
            
            updateIntervisibilityStatus(`GeoJSON validated. ${pendingGeoJson.features.length} features found. Loading markers...`);
            
            // Store reference before clearing
            const geoJsonToLoad = pendingGeoJson;
            pendingGeoJson = null;
            
            // Close modal AFTER storing reference
            closeIntervisibilityFieldModal();
            
            // Load markers - wrap in try-catch
            try {
                loadIntervisibilityMarkers(geoJsonToLoad);
            } catch (error) {
                alert('ERROR in loadIntervisibilityMarkers: ' + error.message);
                updateIntervisibilityStatus('ERROR: ' + error.message);
            }
        } catch (error) {
            alert('ERROR in confirmIntervisibilityFieldSelection: ' + error.message + '\nStack: ' + error.stack);
            updateIntervisibilityStatus('ERROR: ' + error.message);
        }
    }
    
    // Load markers from GeoJSON
    function loadIntervisibilityMarkers(geoJson) {
        try {
            updateIntervisibilityStatus('loadIntervisibilityMarkers called...');
            
            if (!geoJson) {
                alert('ERROR: geoJson parameter is null/undefined');
                updateIntervisibilityStatus('ERROR: geoJson parameter is null/undefined');
                return;
            }
            
            if (geoJson.type !== 'FeatureCollection') {
                alert('ERROR: Invalid GeoJSON type. Expected FeatureCollection, got: ' + geoJson.type);
                updateIntervisibilityStatus('ERROR: Invalid GeoJSON type.');
                return;
            }
            
            if (!Array.isArray(geoJson.features)) {
                alert('ERROR: GeoJSON features is not an array');
                updateIntervisibilityStatus('ERROR: GeoJSON features is not an array');
                return;
            }
            
            updateIntervisibilityStatus(`GeoJSON validated: ${geoJson.features.length} features`);
            
            const map = window.map;
            if (!map) {
                alert('ERROR: window.map is not available');
                updateIntervisibilityStatus('ERROR: Map not available.');
                return;
            }
            
            updateIntervisibilityStatus('Map found. Clearing existing data...');
            
            // Clear existing markers
            clearIntervisibilityData();
            
            updateIntervisibilityStatus('Extracting Point features...');
            
            // Extract Point features
            const pointFeatures = geoJson.features.filter(f => f.geometry && f.geometry.type === 'Point');
            
            updateIntervisibilityStatus(`Found ${pointFeatures.length} Point features`);
            
            if (pointFeatures.length === 0) {
                alert('ERROR: No Point features found in GeoJSON file.');
                updateIntervisibilityStatus('ERROR: No Point features found.');
                return;
            }
            
            // Note: selectedUniqueIdField is optional - if not set, will use "Site 1", "Site 2", etc.
            
            updateIntervisibilityStatus('Creating layer group...');
            
            // Create layer group for markers
            if (intervisibilityLayerGroup) {
                try {
                    map.removeLayer(intervisibilityLayerGroup);
                } catch (e) {
                    // Ignore if not on map
                }
            }
            intervisibilityLayerGroup = L.layerGroup();
            intervisibilityMarkers = [];
            
            if (!intervisibilityLayerGroup) {
                alert('ERROR: Failed to create layer group');
                updateIntervisibilityStatus('ERROR: Failed to create layer group');
                return;
            }
            
            updateIntervisibilityStatus(`Creating markers from ${pointFeatures.length} features...`);
            
            // Track unique IDs to detect duplicates
            const uniqueIds = new Set();
            const duplicateIds = new Set();
            
            let markersCreated = 0;
            for (let index = 0; index < pointFeatures.length; index++) {
            const feature = pointFeatures[index];
            try {
                const coords = feature.geometry.coordinates;
                if (!coords || coords.length < 2) {
                    continue; // Skip invalid coordinates
                }
                
                const latlng = L.latLng(coords[1], coords[0]);
                if (!latlng || isNaN(latlng.lat) || isNaN(latlng.lng)) {
                    continue; // Skip invalid latlng
                }
                
                const props = feature.properties || {};
                
                // Get unique ID and display name from selected fields
                let uniqueId = null;
                let displayName = null;
                
                if (selectedUniqueIdField && props[selectedUniqueIdField] !== undefined && props[selectedUniqueIdField] !== null) {
                    uniqueId = String(props[selectedUniqueIdField]);
                    // Check for duplicates
                    if (uniqueIds.has(uniqueId)) {
                        duplicateIds.add(uniqueId);
                    } else {
                        uniqueIds.add(uniqueId);
                    }
                } else {
                    // No unique ID field selected - use Site 1, Site 2, etc.
                    uniqueId = `Site ${index + 1}`;
                }
                
                if (selectedDisplayNameField && props[selectedDisplayNameField] !== undefined && props[selectedDisplayNameField] !== null) {
                    displayName = String(props[selectedDisplayNameField]);
                } else {
                    displayName = null; // No display name - will use uniqueId for display
                }
                
                // Create small purple circle marker (half size, no outline)
                const marker = L.circleMarker(latlng, {
                    radius: 3, // Half size, visible as circle
                    fillColor: '#800080', // Purple
                    color: '#800080', // Purple (but weight 0 so no outline)
                    weight: 0, // No outline
                    opacity: 1.0,
                    fillOpacity: 1.0
                });
                
                // Add popup with marker info - show display name if available, otherwise unique ID
                const popupName = displayName || uniqueId;
                const popupContent = displayName 
                    ? `<b>${displayName}</b><br>ID: ${uniqueId}<br>Lat: ${latlng.lat.toFixed(6)}<br>Lon: ${latlng.lng.toFixed(6)}`
                    : `<b>${uniqueId}</b><br>Lat: ${latlng.lat.toFixed(6)}<br>Lon: ${latlng.lng.toFixed(6)}`;
                marker.bindPopup(popupContent);
                
                intervisibilityLayerGroup.addLayer(marker);
                intervisibilityMarkers.push({
                    latlng: latlng,
                    marker: marker,
                    name: displayName, // Display name (for popups/tooltips)
                    uniqueId: uniqueId, // Unique identifier (for statistics)
                    elevation: props.elevation || props.Elevation || 0,
                    properties: props // Store all properties for reference
                });
                markersCreated++;
            } catch (error) {
                // Silently skip errors to prevent loops
                continue;
            }
        }
        
        if (markersCreated === 0) {
            updateIntervisibilityStatus('Error: No markers were created. Check that features have valid coordinates.');
            return;
        }
        
        // Warn about duplicate IDs
        if (duplicateIds.size > 0) {
            updateIntervisibilityStatus(`Warning: Found ${duplicateIds.size} duplicate unique ID(s). Statistics may be inaccurate.`);
        }
        
        // Verify markers were created
        if (!intervisibilityLayerGroup) {
            updateIntervisibilityStatus('Error: Layer group not created.');
            return;
        }
        
        if (intervisibilityMarkers.length === 0) {
            updateIntervisibilityStatus('Error: No markers in array after creation.');
            return;
        }
        
        // Add to map
        try {
            map.addLayer(intervisibilityLayerGroup);
            updateIntervisibilityStatus(`Adding ${intervisibilityMarkers.length} markers to map...`);
        } catch (error) {
            updateIntervisibilityStatus('Error adding layer to map: ' + error.message);
            return;
        }
        
        // Verify layer is on map
        if (!map.hasLayer(intervisibilityLayerGroup)) {
            updateIntervisibilityStatus('Error: Layer group not on map after adding.');
            return;
        }
        
        // Fit map to show all markers
        if (intervisibilityMarkers.length > 0) {
            try {
                const bounds = L.latLngBounds(intervisibilityMarkers.map(m => m.latlng));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            } catch (e) {
                updateIntervisibilityStatus('Warning: Could not fit bounds, but markers should be visible.');
            }
        }
        
        // Bring markers to front
        if (intervisibilityLayerGroup) {
            try {
                intervisibilityLayerGroup.eachLayer(function(layer) {
                    if (layer && typeof layer.bringToFront === 'function') {
                        layer.bringToFront();
                    }
                });
            } catch (e) {
                // Ignore
            }
        }
        
        // Add to layers control
        if (window.layersControl) {
            try {
                try {
                    window.layersControl.removeLayer(intervisibilityLayerGroup);
                } catch (e) {
                    // Ignore
                }
                window.layersControl.addOverlay(intervisibilityLayerGroup, 'Intervisibility Markers');
            } catch (e) {
                updateIntervisibilityStatus('Warning: Could not add to layers control.');
            }
        }
        
        // Enable the matrix button
        const matrixBtn = document.getElementById('btn-create-intervisibility-matrix');
        if (matrixBtn) {
            matrixBtn.disabled = false;
        } else {
            updateIntervisibilityStatus('Warning: Matrix button not found.');
        }
        
            // Show confirmation
            updateIntervisibilityStatus(`SUCCESS: Loaded ${intervisibilityMarkers.length} sites. Click "Create Intervisibility Matrix" to analyze visibility.`);
        } catch (error) {
            alert('ERROR in loadIntervisibilityMarkers: ' + error.message + '\nStack: ' + error.stack);
            updateIntervisibilityStatus('ERROR: ' + error.message);
        }
    }
    
    // Calculate horizon profile and DEM for a marker location
    async function calculateMarkerProfile(marker, map) {
        const latlng = marker.latlng;
        const elevation = marker.elevation || 0;
        
        // Use Quick resolution settings (Z11, 360 steps) for intervisibility
        // Reduced radius to save memory - 150km instead of 200km
        const zoom = 11;
        const steps = 360;
        const scanRadiusKm = 150; // Reduced from 200km to save memory
        
        // Check if functions are available
        if (typeof window.HC_fetchTerrainPatch !== 'function' || 
            typeof window.HC_getInterpolatedHeight !== 'function' || 
            typeof window.HC_calculateViewshed !== 'function') {
            throw new Error('Horizon calculation functions not available. Please ensure horizon.js is loaded.');
        }
        
        // Fetch terrain tiles
        const tileWidthKm = 40075 / Math.pow(2, zoom);
        const radiusTiles = Math.ceil(scanRadiusKm / tileWidthKm);
        
        const dem = await window.HC_fetchTerrainPatch(latlng, zoom, radiusTiles, map, (dl, tot) => {
            updateIntervisibilityStatus(`Calculating profile for ${marker.name}: Downloading tiles ${dl}/${tot}...`);
        });
        
        // Get observer height at marker location
        const observerH = window.HC_getInterpolatedHeight(dem, latlng, map) || elevation;
        
        // Calculate viewshed
        // Pass suppressStatusUpdates=true to prevent viewshed messages from appearing in horizon probe section
        updateIntervisibilityStatus(`Calculating profile for ${marker.name}: Computing viewshed...`);
        const profile = await window.HC_calculateViewshed(dem, latlng, observerH, steps, map, null, true);
        
        // Store observerH for this marker (but not DEM - too large, will be fetched as needed)
        markerDems.set(marker.latlng.toString(), { observerH: observerH });
        
        // Return profile and observerH, but note that DEM should be released after use
        // The caller is responsible for releasing the DEM immediately
        return { profile: profile, dem: dem, observerH: observerH };
    }
    
    // Update status message - displays in intervisibility section, NOT as browser alert
    function updateIntervisibilityStatus(message) {
        const statusEl = document.getElementById('intervisibility-status');
        const statusTextEl = document.getElementById('intervisibility-status-text');
        if (statusEl && statusTextEl) {
            statusTextEl.textContent = message;
            statusEl.style.display = 'block';
            // Remove spinner if message doesn't indicate calculation in progress
            const spinner = statusEl.querySelector('i');
            if (spinner) {
                if (!message.toLowerCase().includes('calculating') && !message.toLowerCase().includes('checking') && !message.toLowerCase().includes('downloading')) {
                    spinner.classList.remove('fa-spinner', 'fa-spin');
                    spinner.classList.add('fa-info-circle');
                } else if (message.toLowerCase().includes('calculating') || message.toLowerCase().includes('checking') || message.toLowerCase().includes('downloading')) {
                    spinner.classList.remove('fa-info-circle');
                    spinner.classList.add('fa-spinner', 'fa-spin');
                }
            }
        } else {
            // Fallback: log to console if elements not found (should not happen)
            console.log('Intervisibility Status:', message);
        }
    }
    
    // Hide status message
    function hideIntervisibilityStatus() {
        const statusEl = document.getElementById('intervisibility-status');
        if (statusEl) {
            statusEl.style.display = 'none';
        }
    }
    
    // Store adjacency matrix for statistics
    let adjacencyMatrix = null;
    let degreeCentrality = null;
    let ivStatisticsData = null;
    
    // Calculate comprehensive intervisibility statistics
    function calculateIntervisibilityStatistics(visiblePairs, totalSites) {
        if (!visiblePairs || visiblePairs.length === 0 || totalSites === 0) {
            return null;
        }
        
        // Build adjacency matrix and calculate degree centrality
        const adjacency = {};
        const degrees = {};
        const siteNames = {}; // Will store uniqueId for display
        const siteDisplayNames = {}; // Will store display name for popups
        
        // Initialize adjacency matrix and degrees
        intervisibilityMarkers.forEach((marker, idx) => {
            const siteId = idx;
            siteNames[siteId] = marker.uniqueId; // Use uniqueId for statistics display
            siteDisplayNames[siteId] = marker.name; // Store display name for popups
            adjacency[siteId] = {};
            degrees[siteId] = 0;
        });
        
        // Fill adjacency matrix from visible pairs
        visiblePairs.forEach(pair => {
            const idx1 = intervisibilityMarkers.findIndex(m => m.latlng.toString() === pair.marker1.latlng.toString());
            const idx2 = intervisibilityMarkers.findIndex(m => m.latlng.toString() === pair.marker2.latlng.toString());
            
            if (idx1 !== -1 && idx2 !== -1) {
                adjacency[idx1][idx2] = 1;
                adjacency[idx2][idx1] = 1;
                degrees[idx1] = (degrees[idx1] || 0) + 1;
                degrees[idx2] = (degrees[idx2] || 0) + 1;
            }
        });
        
        // Calculate average degree centrality
        const degreeValues = Object.values(degrees);
        const avgDegree = degreeValues.length > 0 
            ? (degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length).toFixed(2)
            : 0;
        
        // Calculate clustering coefficient for each site
        const clusteringCoeffs = {};
        Object.keys(adjacency).forEach(siteId => {
            const neighbors = Object.keys(adjacency[siteId]).filter(n => adjacency[siteId][n] === 1);
            const k = neighbors.length;
            
            if (k < 2) {
                clusteringCoeffs[siteId] = 0;
            } else {
                // Count triangles (neighbors that are also connected to each other)
                let triangles = 0;
                for (let i = 0; i < neighbors.length; i++) {
                    for (let j = i + 1; j < neighbors.length; j++) {
                        if (adjacency[neighbors[i]] && adjacency[neighbors[i]][neighbors[j]] === 1) {
                            triangles++;
                        }
                    }
                }
                const possibleTriangles = (k * (k - 1)) / 2;
                clusteringCoeffs[siteId] = possibleTriangles > 0 ? (triangles / possibleTriangles).toFixed(3) : 0;
            }
        });
        
        // Average clustering coefficient
        const avgClustering = Object.values(clusteringCoeffs).length > 0
            ? (Object.values(clusteringCoeffs).reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / Object.values(clusteringCoeffs).length).toFixed(3)
            : 0;
        
        // Get top 10 most intervisible sites
        const siteDegrees = Object.keys(degrees).map(siteId => ({
            siteId: parseInt(siteId),
            uniqueId: siteNames[siteId] || `Site ${parseInt(siteId) + 1}`, // Use uniqueId
            displayName: siteDisplayNames[siteId] || null, // Display name for popup
            degree: degrees[siteId],
            clustering: parseFloat(clusteringCoeffs[siteId] || 0)
        })).sort((a, b) => b.degree - a.degree);
        
        const top10 = siteDegrees.slice(0, 10);
        
        // Degree distribution for chart
        const degreeDist = {};
        Object.values(degrees).forEach(deg => {
            degreeDist[deg] = (degreeDist[deg] || 0) + 1;
        });
        
        return {
            totalSites,
            intervisibilityRatio: ((visiblePairs.length / ((totalSites * (totalSites - 1)) / 2)) * 100).toFixed(1),
            avgDegree,
            avgClustering,
            top10,
            degreeDistribution: degreeDist,
            adjacencyMatrix: adjacency,
            siteNames, // Contains uniqueIds
            siteDisplayNames, // Contains display names for popups
            degrees,
            clusteringCoeffs
        };
    }
    
    // Update comprehensive intervisibility statistics display
    function updateIntervisibilityStatistics(totalMarkers, totalPairs, intervisiblePairs, visibilityPercent, pairsChecked) {
        // Update simple stats in the collapsible section
        const statsEl = document.getElementById('intervisibility-statistics');
        if (statsEl) {
            const totalMarkersEl = document.getElementById('stat-total-markers');
            const totalPairsEl = document.getElementById('stat-total-pairs');
            const intervisiblePairsEl = document.getElementById('stat-intervisible-pairs');
            const visibilityPercentEl = document.getElementById('stat-visibility-percent');
            const pairsCheckedEl = document.getElementById('stat-pairs-checked');
            
            if (totalMarkersEl) totalMarkersEl.textContent = totalMarkers;
            if (totalPairsEl) totalPairsEl.textContent = totalPairs;
            if (intervisiblePairsEl) intervisiblePairsEl.textContent = intervisiblePairs;
            if (visibilityPercentEl) visibilityPercentEl.textContent = visibilityPercent;
            if (pairsCheckedEl) pairsCheckedEl.textContent = pairsChecked;
            
            statsEl.style.display = 'block';
        }
        
        // Calculate and display comprehensive statistics in the bottom panel
        if (window.visiblePairsForStats && window.visiblePairsForStats.length > 0) {
            const stats = calculateIntervisibilityStatistics(window.visiblePairsForStats, totalMarkers);
            if (stats) {
                ivStatisticsData = stats;
                displayComprehensiveStatistics(stats, totalMarkers);
            }
        }
    }
    
    // Display comprehensive statistics in the bottom panel
    function displayComprehensiveStatistics(stats, totalSites) {
        // Show the statistics panel (fixed at bottom, like horizon results)
        const panel = document.getElementById('iv-results-panel');
        if (panel) {
            panel.style.display = 'flex';
            panel.classList.remove('minimized');
            panel.classList.add('expanded');
            // Ensure it's positioned correctly
            panel.style.position = 'fixed';
            panel.style.bottom = '0';
            panel.style.left = '0';
            panel.style.right = '0';
            panel.style.width = '100%';
            panel.style.zIndex = '1000';
        }
        
        // Update key metrics
        const totalSitesEl = document.getElementById('stat-total-sites');
        const ratioEl = document.getElementById('stat-intervisibility-ratio');
        const avgDegreeEl = document.getElementById('stat-avg-degree');
        const clusteringEl = document.getElementById('stat-clustering-coeff');
        
        if (totalSitesEl) totalSitesEl.textContent = totalSites;
        if (ratioEl) ratioEl.textContent = stats.intervisibilityRatio + '%';
        if (avgDegreeEl) avgDegreeEl.textContent = stats.avgDegree;
        if (clusteringEl) clusteringEl.textContent = stats.avgClustering;
        
        // Display Top 10 sites
        const topSitesTable = document.getElementById('top-sites-table');
        if (topSitesTable) {
            if (stats.top10.length === 0) {
                topSitesTable.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No data available</td></tr>';
            } else {
                topSitesTable.innerHTML = stats.top10.map((site, idx) => {
                    const percent = totalSites > 1 ? ((site.degree / (totalSites - 1)) * 100).toFixed(1) : 0;
                    // Use uniqueId for display, add title attribute with display name if available
                    const displayTitle = site.displayName ? `title="${site.displayName}"` : '';
                    return `<tr>
                        <td>${idx + 1}</td>
                        <td ${displayTitle} style="cursor: ${site.displayName ? 'help' : 'default'};">${site.uniqueId}</td>
                        <td>${site.degree}</td>
                        <td>${percent}%</td>
                    </tr>`;
                }).join('');
            }
        }
        
        // Create degree distribution chart
        createDegreeDistributionChart(stats.degreeDistribution);
        
        // Display adjacency matrix
        displayAdjacencyMatrix(stats.adjacencyMatrix, stats.siteNames, stats.siteDisplayNames, totalSites);
    }
    
    // Create degree distribution chart
    function createDegreeDistributionChart(degreeDist) {
        const ctx = document.getElementById('iv-degree-chart');
        if (!ctx) return;
        
        const degrees = Object.keys(degreeDist).map(Number).sort((a, b) => a - b);
        const counts = degrees.map(d => degreeDist[d]);
        
        // Destroy existing chart if it exists
        if (window.ivDegreeChart) {
            window.ivDegreeChart.destroy();
        }
        
        window.ivDegreeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: degrees.map(d => d.toString()),
                datasets: [{
                    label: 'Number of Sites',
                    data: counts,
                    backgroundColor: 'rgba(66, 139, 202, 0.6)',
                    borderColor: 'rgba(66, 139, 202, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        title: {
                            display: true,
                            text: 'Number of Sites'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Degree (Number of Connections)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Distribution of Intervisibility Connections',
                        font: {
                            size: 14
                        }
                    }
                }
            }
        });
    }
    
    // Display adjacency matrix
    function displayAdjacencyMatrix(adjacency, siteNames, siteDisplayNames, totalSites) {
        const container = document.getElementById('adjacency-matrix-container');
        if (!container) {
            return;
        }
        
        // No size limit - horizontal scrolling is now available for any size matrix
        
        // Create table with proper structure for sticky column
        // Override global table styles that interfere
        // Calculate minimum table width to ensure it's wider than container
        const firstColWidth = 120; // First column width in pixels
        const dataColWidth = 30; // Each data column width
        const minTableWidth = firstColWidth + (totalSites * dataColWidth);
        
        let html = `<table id="adjacency-matrix-table" style="font-size: 9px; margin: 0; border-collapse: separate !important; border-spacing: 0; width: ${minTableWidth}px !important; min-width: ${minTableWidth}px !important; max-width: none !important; border: 1px solid #ddd; display: table !important; table-layout: fixed !important;">`;
        
        // Header row
        html += '<thead><tr style="display: table-row !important;">';
        html += `<th style="position: sticky; left: 0; background: #f5f5f5; z-index: 12; border: 1px solid #ddd; border-right: 2px solid #333; padding: 5px 8px; text-align: left; font-weight: bold; white-space: nowrap; box-shadow: 2px 0 2px rgba(0,0,0,0.1); display: table-cell !important; width: ${firstColWidth}px !important; min-width: ${firstColWidth}px !important;">Site</th>`;
        for (let i = 0; i < totalSites; i++) {
            const uniqueId = siteNames[i] || `Site ${i + 1}`;
            const displayName = siteDisplayNames && siteDisplayNames[i] ? siteDisplayNames[i] : null;
            const titleAttr = displayName ? `title="${displayName}"` : '';
            const cursorStyle = displayName ? 'cursor: help;' : '';
            const displayText = uniqueId.length > 8 ? uniqueId.substring(0, 8) + '...' : uniqueId;
            html += `<th ${titleAttr} style="writing-mode: vertical-rl; text-orientation: mixed; border: 1px solid #ddd; padding: 2px 4px; text-align: center; background-color: #f5f5f5; width: ${dataColWidth}px !important; min-width: ${dataColWidth}px !important; display: table-cell !important; ${cursorStyle}">${displayText}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Data rows
        for (let i = 0; i < totalSites; i++) {
            const uniqueId = siteNames[i] || `Site ${i + 1}`;
            const displayName = siteDisplayNames && siteDisplayNames[i] ? siteDisplayNames[i] : null;
            const titleAttr = displayName ? `title="${displayName}"` : '';
            const cursorStyle = displayName ? 'cursor: help;' : '';
            const displayText = uniqueId.length > 15 ? uniqueId.substring(0, 15) + '...' : uniqueId;
            html += `<tr style="display: table-row !important;">`;
            html += `<td ${titleAttr} style="position: sticky; left: 0; background: white; z-index: 11; border: 1px solid #ddd; border-right: 2px solid #333; font-weight: bold; padding: 5px 8px; text-align: left; white-space: nowrap; box-shadow: 2px 0 2px rgba(0,0,0,0.1); display: table-cell !important; width: ${firstColWidth}px !important; min-width: ${firstColWidth}px !important; ${cursorStyle}">${displayText}</td>`;
            for (let j = 0; j < totalSites; j++) {
                const value = adjacency[i] && adjacency[i][j] === 1 ? 1 : 0;
                const bgColor = value === 1 ? '#5cb85c' : '#ffffff';
                html += `<td style="background-color: ${bgColor}; border: 1px solid #ddd; text-align: center; padding: 2px; width: ${dataColWidth}px !important; min-width: ${dataColWidth}px !important; display: table-cell !important;">${value}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
        
        // CRITICAL: Force horizontal scrollbar - the fundamental issue is wrapper width constraint
        const wrapper = document.getElementById('adjacency-matrix-wrapper');
        const table = document.getElementById('adjacency-matrix-table');
        const containerEl = document.getElementById('adjacency-matrix-container');
        
        if (wrapper && table && containerEl) {
            // Use requestAnimationFrame to ensure DOM is fully rendered
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Get ALL parent elements that might constrain width
                    const parentCol = wrapper.closest('.col-md-12');
                    const parentRow = wrapper.closest('.row');
                    const panelBody = wrapper.closest('.panel-body');
                    const panel = wrapper.closest('.panel');
                    
                    // Get computed styles for width calculations
                    const wrapperStyle = window.getComputedStyle(wrapper);
                    const paddingLeft = parseFloat(wrapperStyle.paddingLeft) || 0;
                    const paddingRight = parseFloat(wrapperStyle.paddingRight) || 0;
                    const borderLeft = parseFloat(wrapperStyle.borderLeftWidth) || 0;
                    const borderRight = parseFloat(wrapperStyle.borderRightWidth) || 0;
                    
                    // CRITICAL: Calculate parent's available width accounting for ALL constraints
                    let maxWrapperWidth = window.innerWidth; // Fallback
                    
                    if (parentCol) {
                        const colStyle = window.getComputedStyle(parentCol);
                        const colPaddingLeft = parseFloat(colStyle.paddingLeft) || 0;
                        const colPaddingRight = parseFloat(colStyle.paddingRight) || 0;
                        maxWrapperWidth = parentCol.clientWidth - colPaddingLeft - colPaddingRight;
                        
                        // Ensure parent allows overflow
                        parentCol.style.setProperty('overflow-x', 'visible', 'important');
                        parentCol.style.setProperty('max-width', '100%', 'important');
                    } else if (parentRow) {
                        const rowStyle = window.getComputedStyle(parentRow);
                        const rowPaddingLeft = parseFloat(rowStyle.paddingLeft) || 0;
                        const rowPaddingRight = parseFloat(rowStyle.paddingRight) || 0;
                        maxWrapperWidth = parentRow.clientWidth - rowPaddingLeft - rowPaddingRight;
                    }
                    
                    // Account for panel-body padding if it exists
                    if (panelBody) {
                        const bodyStyle = window.getComputedStyle(panelBody);
                        const bodyPaddingLeft = parseFloat(bodyStyle.paddingLeft) || 0;
                        const bodyPaddingRight = parseFloat(bodyStyle.paddingRight) || 0;
                        maxWrapperWidth = Math.min(maxWrapperWidth, panelBody.clientWidth - bodyPaddingLeft - bodyPaddingRight);
                        panelBody.style.setProperty('overflow-x', 'visible', 'important');
                    }
                    
                    // CRITICAL: Constrain wrapper to calculated width (don't let it expand)
                    wrapper.style.setProperty('width', maxWrapperWidth + 'px', 'important');
                    wrapper.style.setProperty('max-width', maxWrapperWidth + 'px', 'important');
                    wrapper.style.setProperty('box-sizing', 'border-box', 'important');
                    
                    // Calculate wrapper content area (accounting for padding and borders)
                    const wrapperContentWidth = maxWrapperWidth - paddingLeft - paddingRight - borderLeft - borderRight;
                    
                    // Ensure table is ALWAYS wider than wrapper content (minimum 500px extra)
                    let finalTableWidth = Math.max(minTableWidth, wrapperContentWidth + 500);
                    
                    // Set table width explicitly
                    table.style.setProperty('width', finalTableWidth + 'px', 'important');
                    table.style.setProperty('min-width', finalTableWidth + 'px', 'important');
                    table.style.setProperty('max-width', 'none', 'important');
                    table.style.setProperty('box-sizing', 'content-box', 'important');
                    
                    // Set container to wrap table
                    containerEl.style.setProperty('display', 'inline-block', 'important');
                    containerEl.style.setProperty('width', 'auto', 'important');
                    containerEl.style.setProperty('min-width', finalTableWidth + 'px', 'important');
                    containerEl.style.setProperty('box-sizing', 'content-box', 'important');
                    
                    // CRITICAL: Force scrollbars - MUST be after width is set
                    wrapper.style.setProperty('overflow-x', 'scroll', 'important');
                    wrapper.style.setProperty('overflow-y', 'auto', 'important');
                    
                    // Ensure ALL parents allow overflow
                    if (parentRow) {
                        parentRow.style.setProperty('overflow-x', 'visible', 'important');
                        parentRow.style.setProperty('max-width', '100%', 'important');
                    }
                    if (panel) {
                        panel.style.setProperty('overflow-x', 'visible', 'important');
                    }
                    
                    // Force multiple reflows to ensure browser recalculates
                    void wrapper.offsetWidth;
                    void table.offsetWidth;
                    void containerEl.offsetWidth;
                    
                    // CRITICAL: Final verification - if still no scrollbar, force it more aggressively
                    setTimeout(() => {
                        if (wrapper.scrollWidth <= wrapper.clientWidth) {
                            console.warn('Table still not wider than wrapper, forcing aggressive width increase');
                            const forcedWidth = Math.max(wrapper.clientWidth + 2000, finalTableWidth + 1000);
                            table.style.setProperty('width', forcedWidth + 'px', 'important');
                            table.style.setProperty('min-width', forcedWidth + 'px', 'important');
                            containerEl.style.setProperty('min-width', forcedWidth + 'px', 'important');
                            
                            // Force another reflow
                            void wrapper.offsetWidth;
                            void table.offsetWidth;
                        }
                        
                        // Final debug output
                        console.log('Adjacency Matrix - Final State:', {
                            wrapperWidth: wrapper.clientWidth,
                            wrapperScrollWidth: wrapper.scrollWidth,
                            wrapperContentWidth: wrapperContentWidth,
                            tableWidth: table.offsetWidth,
                            tableScrollWidth: table.scrollWidth,
                            tableStyleWidth: table.style.width,
                            containerWidth: containerEl.offsetWidth,
                            minTableWidth: minTableWidth,
                            finalTableWidth: finalTableWidth,
                            hasScrollbar: wrapper.scrollWidth > wrapper.clientWidth,
                            wrapperOverflow: window.getComputedStyle(wrapper).overflowX,
                            parentColWidth: parentCol ? parentCol.clientWidth : 'N/A',
                            parentRowWidth: parentRow ? parentRow.clientWidth : 'N/A',
                            panelBodyWidth: panelBody ? panelBody.clientWidth : 'N/A'
                        });
                    }, 50);
                });
            });
        }
    }
    
    // Export adjacency matrix to CSV
    window.exportAdjacencyMatrix = function() {
        if (!ivStatisticsData || !ivStatisticsData.adjacencyMatrix) {
            alert('No adjacency matrix data available.');
            return;
        }
        
        const { adjacencyMatrix, siteNames } = ivStatisticsData;
        const sites = Object.keys(adjacencyMatrix).map(Number).sort((a, b) => a - b);
        
        // Create CSV - use uniqueId (siteNames contains uniqueIds)
        let csv = 'Site';
        sites.forEach(i => {
            const uniqueId = siteNames[i] || `Site ${i + 1}`;
            csv += `,"${uniqueId}"`;
        });
        csv += '\n';
        
        sites.forEach(i => {
            const uniqueId = siteNames[i] || `Site ${i + 1}`;
            csv += `"${uniqueId}"`;
            sites.forEach(j => {
                const value = adjacencyMatrix[i] && adjacencyMatrix[i][j] === 1 ? 1 : 0;
                csv += `,${value}`;
            });
            csv += '\n';
        });
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `adjacency-matrix-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    // Pause calculation
    window.pauseIntervisibilityCalculation = function() {
        isPaused = true;
        updateIntervisibilityStatus('Calculation paused. Click Resume to continue...');
        $('#btn-pause-intervisibility').hide();
        $('#btn-resume-intervisibility').show();
    };
    
    // Resume calculation
    window.resumeIntervisibilityCalculation = function() {
        if (!isPaused) return;
        
        isPaused = false;
        $('#btn-pause-intervisibility').show();
        $('#btn-resume-intervisibility').hide();
        updateIntervisibilityStatus('Resuming calculation...');
        // The main loop will automatically continue when isPaused becomes false
    };
    
    // Cancel calculation
    window.cancelIntervisibilityCalculation = function() {
        cancelCalculation = true;
        isPaused = false;
        updateIntervisibilityStatus('Cancelling calculation...');
        $('#btn-pause-intervisibility').hide();
        $('#btn-resume-intervisibility').hide();
    };
    
    // Create intervisibility matrix
    window.createIntervisibilityMatrix = async function() {
        if (intervisibilityMarkers.length < 2) {
            updateIntervisibilityStatus('Need at least 2 sites to create intervisibility matrix.');
            return;
        }
        
        if (isCalculating) {
            updateIntervisibilityStatus('Calculation already in progress.');
            return;
        }
        
        const map = window.map;
        if (!map) {
            updateIntervisibilityStatus('Map not available.');
            return;
        }
        
        // Check if required functions are available
        if (typeof window.HC_fetchTerrainPatch !== 'function' || 
            typeof window.HC_calculateViewshed !== 'function' || 
            typeof window.HC_getInterpolatedHeight !== 'function') {
            updateIntervisibilityStatus('Required horizon calculation functions not available. Please ensure horizon.js is loaded.');
            return;
        }
        
        // Initialize calculation state
        isCalculating = true;
        cancelCalculation = false;
        
        // Show cancel button, pause button and disable create button
        // Hide save button and statistics during calculation
        $('#btn-create-intervisibility-matrix').prop('disabled', true);
        $('#btn-cancel-intervisibility').show();
        $('#btn-pause-intervisibility').show();
        $('#btn-resume-intervisibility').hide();
        $('#btn-save-intervisibility-matrix').hide();
        $('#btn-view-intervisibility-statistics').hide();
        const statsEl = document.getElementById('intervisibility-statistics');
        if (statsEl) {
            statsEl.style.display = 'none';
        }
        
        // Clear existing lines
        if (intervisibilityLinesLayerGroup) {
            map.removeLayer(intervisibilityLinesLayerGroup);
            if (window.layersControl) {
                try {
                    window.layersControl.removeLayer(intervisibilityLinesLayerGroup);
                } catch (e) {
                    // Layer not in control yet, that's fine
                }
            }
        }
        intervisibilityLines = [];
        
        // Create new lines layer group and add to map immediately
        intervisibilityLinesLayerGroup = L.layerGroup();
        map.addLayer(intervisibilityLinesLayerGroup);
        
        // Add to layers control if available and ensure it's visible
        if (window.layersControl) {
            try {
                window.layersControl.removeLayer(intervisibilityLinesLayerGroup);
            } catch (e) {
                // Layer not in control yet, that's fine
            }
            window.layersControl.addOverlay(intervisibilityLinesLayerGroup, 'Intervisibility Lines');
            // Ensure the layer is checked/visible in the control
            if (window.layersControl._map && window.layersControl._map.hasLayer) {
                // Force the layer to be visible
                if (!map.hasLayer(intervisibilityLinesLayerGroup)) {
                    map.addLayer(intervisibilityLinesLayerGroup);
                }
            }
        }
        
        updateIntervisibilityStatus('Phase 1: Calculating horizon profiles for all markers...');
        
        // PHASE 1: Calculate horizon profiles and DEMs for each marker
        // Store only profile and observerH - we don't need to keep the DEM in memory
        const markerData = new Map();
        markerDems.clear();
        let profilesCompleted = 0;
        
        for (let i = 0; i < intervisibilityMarkers.length; i++) {
            if (cancelCalculation) {
                break;
            }
            
            const marker = intervisibilityMarkers[i];
            updateIntervisibilityStatus(`Phase 1: Calculating profile ${i + 1}/${intervisibilityMarkers.length}: ${marker.name}...`);
            
            try {
                const result = await calculateMarkerProfile(marker, map);
                // Store only profile and observerH - we don't need to keep the DEM in memory
                // The DEM will be fetched again for line-of-sight checks if needed (with caching)
                markerData.set(i, {
                    profile: result.profile,
                    observerH: result.observerH,
                    // Don't store dem - it's too large and we can fetch it again if needed
                    // dem: result.dem
                });
                profilesCompleted++;
                
                // Aggressively clean up marker DEM immediately after profile calculation
                // This frees up memory since we only need the profile for validation
                if (result.dem) {
                    if (result.dem.data) {
                        result.dem.data = null; // Clear Float32Array
                    }
                    // Remove all references to help GC
                    result.dem = null;
                }
                
                // Clean cache more aggressively - every 2 profiles to prevent memory buildup
                if (profilesCompleted % 2 === 0) {
                    cleanupDemCache();
                    // Force garbage collection hint
                    if (window.gc) {
                        try {
                            window.gc();
                        } catch (e) {}
                    }
                    // Yield to browser to allow GC to run
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } catch (error) {
                if (!cancelCalculation) {
                    console.error(`Error calculating profile for marker ${marker.name}:`, error);
                    updateIntervisibilityStatus(`Error calculating profile for marker ${marker.name}: ${error.message}`);
                }
                break;
            }
            
            // Yield to browser periodically
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Final aggressive cleanup after all profiles are calculated
        cleanupDemCache();
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {}
        }
        // Give GC time to work before proceeding to intervisibility checks
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we have at least 2 completed profiles to check pairs
        if (profilesCompleted < 2) {
            hideIntervisibilityStatus();
            $('#btn-create-intervisibility-matrix').prop('disabled', false);
            $('#btn-cancel-intervisibility').hide();
            $('#btn-pause-intervisibility').hide();
            $('#btn-resume-intervisibility').hide();
            isCalculating = false;
            cancelCalculation = false;
            if (cancelCalculation) {
                updateIntervisibilityStatus(`Calculation cancelled. Only ${profilesCompleted} profile(s) completed. Need at least 2 profiles to check intervisibility.`);
            } else {
                updateIntervisibilityStatus(`Need at least 2 completed profiles to check intervisibility. Only ${profilesCompleted} profile(s) completed.`);
            }
            cancelCalculation = false;
            return;
        }
        
        // If cancelled during profile calculation but we have enough profiles, continue with pair checking
        if (cancelCalculation && profilesCompleted < intervisibilityMarkers.length) {
            updateIntervisibilityStatus(`Profile calculation cancelled. Checking intervisibility for ${profilesCompleted} completed profiles...`);
            // Reset cancel flag to allow pair checking to proceed
            // User can cancel again during pair checking if needed
            cancelCalculation = false;
        }
        
        // PHASE 2: Check intervisibility for each pair of markers (only check i < j to avoid duplicates)
        // Only check pairs where both markers have completed profiles
        const total = (profilesCompleted * (profilesCompleted - 1)) / 2;
        let checked = 0;
        const visiblePairs = []; // Store visible pairs to avoid duplicates
        
        updateIntervisibilityStatus(`Phase 2: Checking intervisibility between ${profilesCompleted} marker pairs...`);
        
        // Only check pairs for markers that have completed profiles
        const completedMarkerIndices = Array.from(markerData.keys()).sort((a, b) => a - b);
        
        for (let idx1 = 0; idx1 < completedMarkerIndices.length; idx1++) {
            if (cancelCalculation) break;
            
            // Check for pause
            while (isPaused && !cancelCalculation) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            if (cancelCalculation) break;
            
            const i = completedMarkerIndices[idx1];
            pausedState.currentI = idx1;
            
            // Update status to show which marker we're checking pairs for
            const currentMarker = intervisibilityMarkers[i];
            const pairsForThisMarker = completedMarkerIndices.length - idx1 - 1; // Number of pairs to check for this marker
            updateIntervisibilityStatus(`Phase 2: Site ${idx1 + 1}/${completedMarkerIndices.length} (${currentMarker.name}): Checking ${pairsForThisMarker} pairs...`);
            
            // Yield after starting a new marker's pairs
            await new Promise(resolve => setTimeout(resolve, 0));
            
            let pairsCheckedForMarker = 0;
            for (let idx2 = idx1 + 1; idx2 < completedMarkerIndices.length; idx2++) {
                if (cancelCalculation) break;
                
                // Check for pause
                while (isPaused && !cancelCalculation) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                if (cancelCalculation) break;
                
                const j = completedMarkerIndices[idx2];
                pausedState.currentJ = idx2;
                
                // Skip if this pair was already checked (for resume after pause)
                const pairKey = `${i}_${j}`;
                if (pausedState.checkedPairs && pausedState.checkedPairs.has(pairKey)) {
                    checked++; // Count it even though we skip
                    continue;
                }
                
                const marker1 = intervisibilityMarkers[i];
                const marker2 = intervisibilityMarkers[j];
                const data1 = markerData.get(i);
                const data2 = markerData.get(j);
                
                if (!data1 || !data2) continue;
                
                checked++;
                pairsCheckedForMarker++;
                updateIntervisibilityStatus(`Phase 2: Site ${idx1 + 1}/${completedMarkerIndices.length} (${marker1.name}): ${pairsCheckedForMarker}/${pairsForThisMarker} pairs checked | Total: ${checked}/${total} (${marker1.name} ↔ ${marker2.name})...`);
                
                // Note: We don't pass DEMs anymore since they're not stored in markerData
                // The checkIntervisibility function will fetch DEMs as needed (with caching)
                const isVisible = await checkIntervisibility(
                    marker1.latlng, 
                    marker2.latlng, 
                    data1.observerH, 
                    data2.observerH,
                    null, // dem1 not needed - will be fetched if fallback is used
                    null, // dem2 not needed - will be fetched if fallback is used
                    data1.profile, // Pass viewshed profile for validation
                    data2.profile  // Pass target's viewshed profile (for reverse check if needed)
                );
                
                if (isVisible) {
                    // Store the pair (only one direction since we're only checking i < j)
                    visiblePairs.push({ marker1: marker1, marker2: marker2 });
                    pausedState.visiblePairs = visiblePairs; // Update paused state
                }
                
                // Mark this pair as checked (for resume after pause)
                if (!pausedState.checkedPairs) {
                    pausedState.checkedPairs = new Set();
                }
                pausedState.checkedPairs.add(pairKey);
                
                // ALWAYS yield to browser after each pair check to prevent freezing
                // This ensures the UI remains responsive and calculations are done incrementally
                await new Promise(resolve => setTimeout(resolve, 0));
                
                // OPTIMIZATION: More aggressive cache cleanup - every 5 pairs instead of 10
                const BATCH_SIZE = 5;
                if (checked % BATCH_SIZE === 0) {
                    cleanupDemCache();
                    // Force garbage collection hint
                    if (window.gc) {
                        try {
                            window.gc();
                        } catch (e) {}
                    }
                    // Extra yield after cleanup
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        }
        
        // Final cache cleanup
        cleanupDemCache();
        
        // Initialize linesToAdd early to prevent undefined errors on cancellation
        let linesToAdd = [];
        
        // Add all visible lines to the map at once (no real-time updates)
        console.log(`Adding ${visiblePairs.length} intervisible lines to map...`);
        console.log(`Layer group exists: ${intervisibilityLinesLayerGroup !== null}`);
        console.log(`Layer group on map: ${map.hasLayer(intervisibilityLinesLayerGroup)}`);
        
        let linesAdded = 0;
        const uniquePairs = new Map(); // Use Map to avoid duplicates based on coordinate pairs
        
        // Create all lines first
        visiblePairs.forEach((pair, index) => {
            try {
                // Create a unique key for this pair to avoid duplicates
                const key1 = `${pair.marker1.latlng.lat.toFixed(6)}_${pair.marker1.latlng.lng.toFixed(6)}_${pair.marker2.latlng.lat.toFixed(6)}_${pair.marker2.latlng.lng.toFixed(6)}`;
                const key2 = `${pair.marker2.latlng.lat.toFixed(6)}_${pair.marker2.latlng.lng.toFixed(6)}_${pair.marker1.latlng.lat.toFixed(6)}_${pair.marker1.latlng.lng.toFixed(6)}`;
                
                // Skip if we've already added this line (or its reverse)
                if (uniquePairs.has(key1) || uniquePairs.has(key2)) {
                    console.log(`Skipping duplicate line ${index + 1}`);
                    return;
                }
                
                const line = L.polyline([pair.marker1.latlng, pair.marker2.latlng], {
                    color: '#808080', // Mid grey
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '10, 5' // Dashed line
                });
                
                linesToAdd.push(line);
                uniquePairs.set(key1, true);
                linesAdded++;
            } catch (error) {
                console.error(`Error creating line ${index + 1}:`, error, pair);
            }
        });
        
        // Create a single GeoJSON layer with all lines as features (instead of 30 separate layers)
        const geoJsonFeatures = linesToAdd.map(line => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: line.getLatLngs().map(ll => [ll.lng, ll.lat])
                },
                properties: {}
            };
        });
        
        const geoJsonData = {
            type: 'FeatureCollection',
            features: geoJsonFeatures
        };
        
        // Remove the old layer group
        if (intervisibilityLinesLayerGroup) {
            map.removeLayer(intervisibilityLinesLayerGroup);
            if (window.layersControl) {
                try {
                    window.layersControl.removeLayer(intervisibilityLinesLayerGroup);
                } catch (e) {
                    // Ignore
                }
            }
        }
        
        // Create a single GeoJSON layer with all lines
        intervisibilityLinesLayerGroup = L.geoJSON(geoJsonData, {
            style: {
                color: '#808080', // Mid grey
                weight: 2,
                opacity: 0.7,
                dashArray: '10, 5' // Dashed line
            }
        });
        
        // Store individual lines for reference (for clearing later) - create from GeoJSON features
        intervisibilityLines = linesToAdd; // Use linesToAdd directly instead of mapping from geoJsonFeatures
        
        console.log(`Successfully created 1 GeoJSON layer with ${geoJsonFeatures.length} LineString features.`);
        
        // Ensure the layer group is on the map and visible
        if (!map.hasLayer(intervisibilityLinesLayerGroup)) {
            console.warn('Intervisibility lines layer group not on map, adding it...');
            map.addLayer(intervisibilityLinesLayerGroup);
        }
        
        // Ensure the layer group is on the map
        if (!map.hasLayer(intervisibilityLinesLayerGroup)) {
            map.addLayer(intervisibilityLinesLayerGroup);
        }
        
        // Force the layer to be visible in the layers control
        if (window.layersControl) {
            try {
                // Ensure it's registered in the control
                window.layersControl.addOverlay(intervisibilityLinesLayerGroup, 'Intervisibility Lines');
                
                // Force visibility by directly adding to map if not already there
                if (!map.hasLayer(intervisibilityLinesLayerGroup)) {
                    map.addLayer(intervisibilityLinesLayerGroup);
                }
                
                // Try to check the checkbox in the layers control (for GroupedLayers control)
                setTimeout(() => {
                    try {
                        const controlContainer = window.layersControl._container;
                        if (controlContainer) {
                            // Look for checkboxes
                            const checkboxes = controlContainer.querySelectorAll('input[type="checkbox"]');
                            checkboxes.forEach(checkbox => {
                                const label = checkbox.closest('label');
                                if (label && (label.textContent.includes('Intervisibility Lines') || 
                                    label.textContent.trim() === 'Intervisibility Lines')) {
                                    if (!checkbox.checked) {
                                        checkbox.checked = true;
                                        // Trigger click to ensure layer control updates
                                        checkbox.click();
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Could not update checkbox:', e);
                    }
                }, 100);
            } catch (e) {
                console.warn('Could not update layers control:', e);
            }
        }
        
        // Force a redraw and zoom to show all lines
        setTimeout(() => {
            map.invalidateSize();
            if (linesToAdd.length > 0) {
                const bounds = new L.LatLngBounds();
                linesToAdd.forEach(line => {
                    try {
                        const lineBounds = line.getBounds();
                        if (lineBounds && lineBounds.isValid()) {
                            bounds.extend(lineBounds);
                        }
                    } catch (e) {
                        // Skip invalid lines
                    }
                });
                if (bounds.isValid() && !bounds.getNorthWest().equals(bounds.getSouthEast())) {
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
                }
            }
            
            // Force each line to redraw
            linesToAdd.forEach(line => {
                if (line.redraw) {
                    line.redraw();
                }
            });
        }, 300);
        
        // Ensure markers are on top by bringing marker layer to front
        if (intervisibilityLayerGroup && map.hasLayer(intervisibilityLayerGroup)) {
            // Use eachLayer to bring each marker to front
            intervisibilityLayerGroup.eachLayer(function(layer) {
                if (layer && typeof layer.bringToFront === 'function') {
                    layer.bringToFront();
                }
            });
        }
        
        // Finalize
        hideIntervisibilityStatus();
        $('#btn-create-intervisibility-matrix').prop('disabled', false);
        $('#btn-cancel-intervisibility').hide();
        $('#btn-pause-intervisibility').hide();
        $('#btn-resume-intervisibility').hide();
        isCalculating = false;
        
        // Calculate statistics
        const totalSites = profilesCompleted;
        const totalPossiblePairs = (totalSites * (totalSites - 1)) / 2;
        const intervisiblePairs = visiblePairs.length;
        const visibilityPercentage = totalPossiblePairs > 0 ? ((intervisiblePairs / totalPossiblePairs) * 100).toFixed(1) : 0;
        
        // Store visiblePairs globally for statistics calculation
        window.visiblePairsForStats = visiblePairs;
        
        if (cancelCalculation) {
            cancelCalculation = false;
            const message = checked > 0 
                ? `Calculation cancelled. Found ${intervisiblePairs} intervisible connections out of ${checked} pairs checked (from ${profilesCompleted} completed site profiles).`
                : `Calculation cancelled. Completed ${profilesCompleted} site profiles but no pairs were checked yet.`;
            updateIntervisibilityStatus(message);
            updateIntervisibilityStatistics(totalSites, totalPossiblePairs, intervisiblePairs, visibilityPercentage, checked);
        } else {
            cancelCalculation = false;
            updateIntervisibilityStatus(`Intervisibility matrix created. Found ${intervisiblePairs} intervisible connections out of ${checked} pairs checked (from ${profilesCompleted} completed site profiles).`);
            updateIntervisibilityStatistics(totalSites, totalPossiblePairs, intervisiblePairs, visibilityPercentage, checked);
            
            // Show Save button and statistics on completion
            $('#btn-save-intervisibility-matrix').show();
            
            // Show View Statistics button in sidebar
            $('#btn-view-intervisibility-statistics').show();
            
            // Hide statistics initially, show on completion
            const statsEl = document.getElementById('intervisibility-statistics');
            if (statsEl) {
                statsEl.style.display = 'block';
            }
        }
    };
    
    // Check if two points are intervisible using DEM data (same method as horizon.js)
    /**
     * Interpolate horizon altitude at a specific azimuth from viewshed profile
     * @param {number} targetAzimuth - Target azimuth in degrees (0-360)
     * @param {Array} profile - Viewshed profile array with {x: azimuth, y: altitude} objects
     * @returns {number|null} Interpolated horizon altitude in degrees, or null if cannot interpolate
     */
    function interpolateHorizonAltitude(targetAzimuth, profile) {
        if (!profile || profile.length === 0) return null;
        
        // Normalize azimuth to 0-360
        const normalizedAz = ((targetAzimuth % 360) + 360) % 360;
        
        // Find two points that bracket the target azimuth
        let p1 = null, p2 = null;
        
        for (let i = 0; i < profile.length; i++) {
            const point = profile[i];
            if (!point || point.x === undefined || point.y === undefined) continue;
            
            const pointAz = ((point.x % 360) + 360) % 360;
            
            if (pointAz <= normalizedAz) {
                p1 = point;
            }
            if (pointAz >= normalizedAz && !p2) {
                p2 = point;
                break;
            }
        }
        
        // Handle wrap-around (azimuth near 0/360)
        if (!p1 || !p2) {
            // Try wrapping: look for point near 360 if target is near 0, or vice versa
            if (normalizedAz < 5) {
                // Target near 0, look for point near 360
                for (let i = profile.length - 1; i >= 0; i--) {
                    const point = profile[i];
                    if (!point || point.x === undefined || point.y === undefined) continue;
                    const pointAz = ((point.x % 360) + 360) % 360;
                    if (pointAz > 355) {
                        p1 = point;
                        break;
                    }
                }
            } else if (normalizedAz > 355) {
                // Target near 360, look for point near 0
                for (let i = 0; i < profile.length; i++) {
                    const point = profile[i];
                    if (!point || point.x === undefined || point.y === undefined) continue;
                    const pointAz = ((point.x % 360) + 360) % 360;
                    if (pointAz < 5) {
                        p2 = point;
                        break;
                    }
                }
            }
        }
        
        if (!p1 || !p2) {
            // Fallback to nearest neighbor
            let nearest = null;
            let minDist = Infinity;
            for (let i = 0; i < profile.length; i++) {
                const point = profile[i];
                if (!point || point.x === undefined || point.y === undefined) continue;
                const pointAz = ((point.x % 360) + 360) % 360;
                const dist = Math.abs(pointAz - normalizedAz);
                const wrapDist = Math.min(dist, 360 - dist);
                if (wrapDist < minDist) {
                    minDist = wrapDist;
                    nearest = point;
                }
            }
            return nearest ? nearest.y : null;
        }
        
        // Linear interpolation
        const az1 = ((p1.x % 360) + 360) % 360;
        const az2 = ((p2.x % 360) + 360) % 360;
        
        // Handle wrap-around
        let azDiff = az2 - az1;
        if (azDiff < 0) azDiff += 360;
        if (azDiff === 0) return p1.y; // Same azimuth
        
        let targetAzForInterp = normalizedAz;
        if (azDiff > 180) {
            // Wrap-around case
            if (normalizedAz < az1) targetAzForInterp += 360;
            if (az2 < az1) {
                const adjustedAz2 = az2 + 360;
                const ratio = (targetAzForInterp - az1) / (adjustedAz2 - az1);
                return p1.y + (p2.y - p1.y) * ratio;
            }
        }
        
        const ratio = (targetAzForInterp - az1) / azDiff;
        return p1.y + (p2.y - p1.y) * ratio;
    }
    
    /**
     * Check intervisibility between two points using standard GIS line-of-sight method.
     * 
     * Based on ArcGIS methodology with Earth curvature correction and viewshed validation.
     * 
     * Step 1: Pre-validation - Check distance limit (viewshed radius = 200km)
     * Step 2: Viewshed horizon validation - Check if target is above horizon
     * Step 3: Fetch DEM that covers the entire line between the two points
     * Step 4: Test obstructions with Earth curvature correction
     *         For each intermediate point at distance D_ox from observer:
     *         H_LOS = H_obs + (H_tgt - H_obs) * (D_ox / D_total)
     *         Apply curvature correction: H_LOS_corrected = H_LOS - curvature_drop + refraction_lift
     * Step 5: If any terrain height H_x > H_LOS_corrected, points are not intervisible
     * 
     * @param {L.LatLng} latlng1 - Observer point (P_obs)
     * @param {L.LatLng} latlng2 - Target point (P_tgt)
     * @param {number} elevation1 - Observer elevation (H_obs)
     * @param {number} elevation2 - Target elevation (H_tgt)
     * @param {Object} dem1 - DEM data for observer region (not used, kept for compatibility)
     * @param {Object} dem2 - DEM data for target region (not used, kept for compatibility)
     * @param {Array} profile1 - Viewshed profile for observer (for horizon validation)
     * @param {Array} profile2 - Viewshed profile for target (optional, for reverse check)
     * @returns {boolean} True if points are intervisible, false otherwise
     */
    async function checkIntervisibility(latlng1, latlng2, elevation1, elevation2, dem1, dem2, profile1, profile2) {
        const map = window.map;
        if (!map) return false;
        
        // Step 1: Define points with elevations
        const P_obs = latlng1;
        const P_tgt = latlng2;
        const H_obs = elevation1;
        const H_tgt = elevation2;
        
        // Step 1: Pre-validation - Check distance limit
        const VIEWSHED_RADIUS_KM = 150; // Reduced to match reduced scan radius in profile calculation
        const VIEWSHED_RADIUS_M = VIEWSHED_RADIUS_KM * 1000;
        
        // Step 2: Calculate total distance (D_total) in meters
        const D_total = P_obs.distanceTo(P_tgt); // Distance in meters
        
        if (D_total === 0) {
            return true; // Same point, always visible
        }
        
        // Reject pairs beyond viewshed radius
        if (D_total > VIEWSHED_RADIUS_M) {
            return false; // Target is beyond viewshed radius, cannot be intervisible
        }
        
        // Step 3: Viewshed horizon validation
        // Calculate target's azimuth from observer
        const bearing = getBearingBetweenLatLngs(P_obs, P_tgt);
        
        // Interpolate horizon altitude at target's azimuth
        if (profile1 && profile1.length > 0) {
            const horizonAltitude = interpolateHorizonAltitude(bearing, profile1);
            
            if (horizonAltitude !== null && !isNaN(horizonAltitude)) {
                // Calculate required target altitude considering observer height and distance
                // For a point at distance D, the geometric altitude (in degrees) is approximately:
                // alt ≈ atan((H_tgt - H_obs) / D) * (180 / π)
                // But we need to account for Earth's curvature for accurate calculation
                
                // Calculate geometric altitude angle to target
                const heightDiff = H_tgt - H_obs; // Height difference in meters
                const geometricAltitudeRad = Math.atan2(heightDiff, D_total);
                const geometricAltitudeDeg = geometricAltitudeRad * (180 / Math.PI);
                
                // If target's geometric altitude is below the horizon, it cannot be intervisible
                if (geometricAltitudeDeg < horizonAltitude) {
                    return false; // Target is below horizon, not intervisible
                }
            }
        }
        
        // Step 4: Fetch DEM that covers the entire line between the two points
        // Calculate midpoint between observer and target
        const midLat = (P_obs.lat + P_tgt.lat) / 2;
        const midLng = (P_obs.lng + P_tgt.lng) / 2;
        const midpoint = L.latLng(midLat, midLng);
        
        // Calculate required radius to cover both endpoints
        // Add 10% buffer to ensure full coverage
        const distanceKm = D_total / 1000; // Convert meters to kilometers
        const requiredRadiusKm = (distanceKm / 2) * 1.1; // Half distance + 10% buffer
        
        // Use same zoom level as marker profiles (Z11 for good balance of accuracy and speed)
        const zoom = 11;
        
        // Fetch terrain patch covering the entire line (with caching)
        const tileWidthKm = 40075 / Math.pow(2, zoom);
        const radiusTiles = Math.ceil(requiredRadiusKm / tileWidthKm);
        
        let lineDem;
        try {
            // Use cached DEM if available, otherwise fetch new one
            lineDem = await getOrFetchLineDem(midpoint, radiusTiles, zoom, map);
            
            // Validate that lineDem is valid
            if (!lineDem || !lineDem.data || lineDem.zoom === undefined) {
                throw new Error('Invalid DEM returned from cache');
            }
        } catch (error) {
            console.error('Error fetching DEM for intervisibility check:', error);
            // Fallback: try using the provided DEMs (less accurate but better than nothing)
            // But only if dem1 or dem2 are available (they're null now, so skip fallback)
            if (dem1 || dem2) {
                return await checkIntervisibilityWithFallback(latlng1, latlng2, elevation1, elevation2, dem1, dem2, profile1, profile2);
            } else {
                // No DEMs available, cannot check intervisibility
                console.warn('Cannot check intervisibility: No DEM available');
                return false;
            }
        }
        
        // Determine sampling interval based on DEM resolution
        // Use approximately 30-50m intervals for good accuracy
        // This ensures we sample at least every DEM cell
        // Cap maximum samples to prevent very long calculations for very long distances
        const sampleInterval = 50; // meters
        const numSamples = Math.min(200, Math.max(10, Math.ceil(D_total / sampleInterval))); // Cap at 200 samples
        
        // Constants for Earth curvature correction (ArcGIS standard)
        const EARTH_DIAMETER_M = 12740000; // Earth's diameter in meters
        const EARTH_RADIUS_M = EARTH_DIAMETER_M / 2; // 6,370,000 meters
        const REFRACTIVITY_COEFFICIENT = 0.13; // Standard atmospheric refraction coefficient
        
        // Step 5: Test obstructions along the sightline with Earth curvature correction
        // Sample points along the horizontal projection of the sightline
        for (let i = 1; i < numSamples; i++) {
            // Check for cancellation periodically
            if (cancelCalculation) {
                return false;
            }
            
            // Yield to browser more frequently to prevent freezing
            // Yield every 5 samples for better responsiveness
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            // Calculate distance from observer (D_ox)
            const D_ox = (i / numSamples) * D_total;
            
            // Calculate fraction along the line for lat/lng interpolation
            const fraction = i / numSamples;
            
            // Calculate intermediate point coordinates (P_x)
            const lat = P_obs.lat + (P_tgt.lat - P_obs.lat) * fraction;
            const lng = P_obs.lng + (P_tgt.lng - P_obs.lng) * fraction;
            const P_x = L.latLng(lat, lng);
            
            // Get actual terrain height (H_x) at point P_x using the line DEM
            // Check if lineDem is valid before using it
            let H_x = null;
            if (lineDem && lineDem.data && lineDem.zoom !== undefined) {
                H_x = window.HC_getInterpolatedHeight(lineDem, P_x, map);
            }
            
            // Skip if we can't get elevation (shouldn't happen with proper DEM, but handle gracefully)
            if (H_x === null || isNaN(H_x)) {
                // If we can't get elevation from the line DEM, try to fetch a new DEM for this point
                // or skip if dem1/dem2 are not available (they're null now since we don't store them)
                if (!dem1 && !dem2) {
                    // No fallback DEMs available, skip this point
                    continue;
                }
                
                // If fallback DEMs are provided, try to use them (but check for null first)
                let fallbackH_x = null;
                const distToObserver = P_x.distanceTo(P_obs);
                const distToTarget = P_x.distanceTo(P_tgt);
                
                if (distToObserver < distToTarget) {
                    if (dem1) {
                        fallbackH_x = window.HC_getInterpolatedHeight(dem1, P_x, map);
                    }
                    if ((fallbackH_x === null || isNaN(fallbackH_x)) && dem2) {
                        fallbackH_x = window.HC_getInterpolatedHeight(dem2, P_x, map);
                    }
                } else {
                    if (dem2) {
                        fallbackH_x = window.HC_getInterpolatedHeight(dem2, P_x, map);
                    }
                    if ((fallbackH_x === null || isNaN(fallbackH_x)) && dem1) {
                        fallbackH_x = window.HC_getInterpolatedHeight(dem1, P_x, map);
                    }
                }
                
                if (fallbackH_x === null || isNaN(fallbackH_x)) {
                    continue; // Skip this point if we can't get elevation
                }
                
                // Use fallback elevation with curvature correction
                let H_LOS = H_obs + (H_tgt - H_obs) * (D_ox / D_total);
                
                // Apply Earth curvature correction for distances > 10km
                if (D_total > 10000) {
                    const D_remaining = D_total - D_ox;
                    const curvatureDrop = (D_ox * D_remaining) / (2 * EARTH_RADIUS_M);
                    const refractionLift = REFRACTIVITY_COEFFICIENT * curvatureDrop;
                    H_LOS = H_LOS - curvatureDrop + refractionLift;
                }
                
                if (fallbackH_x > H_LOS + 1) {
                    return false; // Blocked
                }
                continue;
            }
            
            // Calculate required line-of-sight height (H_LOS) at this point
            // H_LOS = H_obs + (H_tgt - H_obs) * (D_ox / D_total)
            let H_LOS = H_obs + (H_tgt - H_obs) * (D_ox / D_total);
            
            // Apply Earth curvature correction for distances > 10km (ArcGIS methodology)
            if (D_total > 10000) { // 10km threshold
                const D_remaining = D_total - D_ox; // Distance from sample point to target
                
                // Curvature drop: how much the Earth curves away from a straight line
                // Formula: curvature_drop = (D_ox × D_remaining) / (2 × Earth_Radius)
                const curvatureDrop = (D_ox * D_remaining) / (2 * EARTH_RADIUS_M);
                
                // Atmospheric refraction lift: light bends slightly, making objects appear higher
                // Formula: refraction_lift = R_refr × curvature_drop
                const refractionLift = REFRACTIVITY_COEFFICIENT * curvatureDrop;
                
                // Corrected line-of-sight height
                // Z_actual = Z_surface - curvature_drop + refraction_lift
                H_LOS = H_LOS - curvatureDrop + refractionLift;
            }
            
            // Step 6: Comparison - if terrain height exceeds LOS height, blocked
            // Add 1m buffer for vegetation/buildings
            if (H_x > H_LOS + 1) {
                return false; // Blocked - not intervisible
            }
        }
        
        // All intermediate points passed - clear line of sight
        return true; // Intervisible
    }
    
    /**
     * Fallback intervisibility check using provided DEMs (less accurate but used if line DEM fetch fails)
     */
    async function checkIntervisibilityWithFallback(latlng1, latlng2, elevation1, elevation2, dem1, dem2, profile1, profile2) {
        const map = window.map;
        if (!map) return false;
        
        const P_obs = latlng1;
        const P_tgt = latlng2;
        const H_obs = elevation1;
        const H_tgt = elevation2;
        const D_total = P_obs.distanceTo(P_tgt);
        
        if (D_total === 0) return true;
        
        // Apply same pre-validation as main function
        const VIEWSHED_RADIUS_M = 200 * 1000;
        if (D_total > VIEWSHED_RADIUS_M) {
            return false; // Beyond viewshed radius
        }
        
        // Viewshed horizon validation
        if (profile1 && profile1.length > 0) {
            const bearing = getBearingBetweenLatLngs(P_obs, P_tgt);
            const horizonAltitude = interpolateHorizonAltitude(bearing, profile1);
            
            if (horizonAltitude !== null && !isNaN(horizonAltitude)) {
                const heightDiff = H_tgt - H_obs;
                const geometricAltitudeRad = Math.atan2(heightDiff, D_total);
                const geometricAltitudeDeg = geometricAltitudeRad * (180 / Math.PI);
                
                if (geometricAltitudeDeg < horizonAltitude) {
                    return false; // Below horizon
                }
            }
        }
        
        // Constants for Earth curvature correction
        const EARTH_RADIUS_M = 6370000;
        const REFRACTIVITY_COEFFICIENT = 0.13;
        
        const sampleInterval = 50;
        // Cap maximum samples to prevent very long calculations
        const numSamples = Math.min(200, Math.max(10, Math.ceil(D_total / sampleInterval))); // Cap at 200 samples
        
        for (let i = 1; i < numSamples; i++) {
            // Check for cancellation periodically
            if (cancelCalculation) {
                return false;
            }
            
            // Yield to browser more frequently to prevent freezing
            // Yield every 5 samples for better responsiveness
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
            
            const D_ox = (i / numSamples) * D_total;
            const fraction = i / numSamples;
            const lat = P_obs.lat + (P_tgt.lat - P_obs.lat) * fraction;
            const lng = P_obs.lng + (P_tgt.lng - P_obs.lng) * fraction;
            const P_x = L.latLng(lat, lng);
            
            let H_x = null;
            const distToObserver = P_x.distanceTo(P_obs);
            const distToTarget = P_x.distanceTo(P_tgt);
            
            if (distToObserver < distToTarget) {
                H_x = window.HC_getInterpolatedHeight(dem1, P_x, map);
                if (H_x === null || isNaN(H_x)) {
                    H_x = window.HC_getInterpolatedHeight(dem2, P_x, map);
                }
            } else {
                H_x = window.HC_getInterpolatedHeight(dem2, P_x, map);
                if (H_x === null || isNaN(H_x)) {
                    H_x = window.HC_getInterpolatedHeight(dem1, P_x, map);
                }
            }
            
            if (H_x === null || isNaN(H_x)) {
                continue;
            }
            
            let H_LOS = H_obs + (H_tgt - H_obs) * (D_ox / D_total);
            
            // Apply Earth curvature correction for distances > 10km
            if (D_total > 10000) {
                const D_remaining = D_total - D_ox;
                const curvatureDrop = (D_ox * D_remaining) / (2 * EARTH_RADIUS_M);
                const refractionLift = REFRACTIVITY_COEFFICIENT * curvatureDrop;
                H_LOS = H_LOS - curvatureDrop + refractionLift;
            }
            
            if (H_x > H_LOS + 1) {
                return false;
            }
        }
        
        return true;
    }
    
    // Get bearing between two lat/lng points
    function getBearingBetweenLatLngs(latlng1, latlng2) {
        const lat1 = latlng1.lat * Math.PI / 180;
        const lat2 = latlng2.lat * Math.PI / 180;
        const dLon = (latlng2.lng - latlng1.lng) * Math.PI / 180;
        
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        
        const bearing = Math.atan2(y, x);
        return ((bearing * 180 / Math.PI) + 360) % 360;
    }
    
    // Save intervisibility matrix to GeoJSON file
    window.saveIntervisibilityMatrix = function() {
        if (!intervisibilityLinesLayerGroup || intervisibilityMarkers.length === 0) {
            updateIntervisibilityStatus('No intervisibility matrix to save. Please create a matrix first.');
            return;
        }
        
        const map = window.map;
        if (!map) {
            updateIntervisibilityStatus('Map not available.');
            return;
        }
        
        // Create GeoJSON FeatureCollection with markers and lines
        const features = [];
        
        // Add marker features
        intervisibilityMarkers.forEach(marker => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [marker.latlng.lng, marker.latlng.lat]
                },
                properties: {
                    name: marker.name,
                    elevation: marker.elevation || 0,
                    featureType: 'intervisibility-marker'
                }
            });
        });
        
        // Add line features from the layer group
        if (intervisibilityLinesLayerGroup) {
            let linesExtracted = 0;
            
            // Method 1: Try toGeoJSON() if available (most reliable for GeoJSON layers)
            if (typeof intervisibilityLinesLayerGroup.toGeoJSON === 'function') {
                try {
                    const geoJsonData = intervisibilityLinesLayerGroup.toGeoJSON();
                    if (geoJsonData && geoJsonData.features && Array.isArray(geoJsonData.features)) {
                        geoJsonData.features.forEach(feature => {
                            if (feature.geometry && feature.geometry.type === 'LineString') {
                                // Ensure properties are set correctly
                                if (!feature.properties) {
                                    feature.properties = {};
                                }
                                feature.properties.featureType = 'intervisibility-line';
                                features.push(feature);
                                linesExtracted++;
                            }
                        });
                    }
                } catch (e) {
                    console.warn('toGeoJSON() failed, trying alternative method:', e);
                }
            }
            
            // Method 2: If toGeoJSON didn't work or extracted 0 lines, iterate through layers
            if (linesExtracted === 0) {
                intervisibilityLinesLayerGroup.eachLayer(function(layer) {
                    // Check if layer has a feature property (GeoJSON layers store features this way)
                    if (layer.feature && layer.feature.geometry) {
                        // Ensure properties are set correctly
                        if (!layer.feature.properties) {
                            layer.feature.properties = {};
                        }
                        layer.feature.properties.featureType = 'intervisibility-line';
                        features.push(layer.feature);
                        linesExtracted++;
                    } else if (layer instanceof L.Polyline || layer instanceof L.Path) {
                        // Fallback: extract coordinates from polyline
                        try {
                            const latlngs = layer.getLatLngs();
                            if (latlngs && latlngs.length >= 2) {
                                // Handle both flat arrays and nested arrays
                                let coordinates = [];
                                if (Array.isArray(latlngs[0]) && typeof latlngs[0][0] === 'number') {
                                    // Already in coordinate format [lat, lng] or [lng, lat]
                                    coordinates = latlngs.map(ll => {
                                        if (Array.isArray(ll) && ll.length >= 2) {
                                            // Assume [lng, lat] format
                                            return [ll[0], ll[1]];
                                        }
                                        return [ll.lng, ll.lat];
                                    });
                                } else {
                                    // Array of L.LatLng objects
                                    coordinates = latlngs.map(ll => {
                                        if (ll instanceof L.LatLng) {
                                            return [ll.lng, ll.lat];
                                        } else if (Array.isArray(ll) && ll.length >= 2) {
                                            return [ll[1], ll[0]]; // Convert [lat, lng] to [lng, lat]
                                        }
                                        return [ll.lng, ll.lat];
                                    });
                                }
                                
                                features.push({
                                    type: 'Feature',
                                    geometry: {
                                        type: 'LineString',
                                        coordinates: coordinates
                                    },
                                    properties: {
                                        featureType: 'intervisibility-line',
                                        color: '#808080',
                                        weight: 2,
                                        opacity: 0.7,
                                        dashArray: '10, 5'
                                    }
                                });
                                linesExtracted++;
                            }
                        } catch (e) {
                            console.warn('Error extracting line from polyline:', e, layer);
                        }
                    }
                });
            }
            
            console.log(`Extracted ${linesExtracted} line features for saving.`);
        }
        
        // Save visiblePairs data for statistics reconstruction
        const visiblePairsData = [];
        if (window.visiblePairsForStats && window.visiblePairsForStats.length > 0) {
            window.visiblePairsForStats.forEach(pair => {
                const idx1 = intervisibilityMarkers.findIndex(m => m.latlng.toString() === pair.marker1.latlng.toString());
                const idx2 = intervisibilityMarkers.findIndex(m => m.latlng.toString() === pair.marker2.latlng.toString());
                if (idx1 !== -1 && idx2 !== -1) {
                    visiblePairsData.push({
                        site1Index: idx1,
                        site2Index: idx2,
                        site1Name: pair.marker1.name,
                        site2Name: pair.marker2.name,
                        site1Lat: pair.marker1.latlng.lat,
                        site1Lng: pair.marker1.latlng.lng,
                        site2Lat: pair.marker2.latlng.lat,
                        site2Lng: pair.marker2.latlng.lng
                    });
                }
            });
        }
        
        const geoJson = {
            type: 'FeatureCollection',
            features: features,
            metadata: {
                name: 'Intervisibility Matrix',
                created: new Date().toISOString(),
                markerCount: intervisibilityMarkers.length,
                lineCount: features.filter(f => f.properties.featureType === 'intervisibility-line').length,
                visiblePairs: visiblePairsData // Save visible pairs data for statistics
            }
        };
        
        // Download as file
        const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `intervisibility-matrix-${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateIntervisibilityStatus(`Intervisibility matrix saved successfully.`);
    };
    
    // Load saved intervisibility matrix from GeoJSON file
    window.loadIntervisibilityMatrix = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const geoJson = JSON.parse(e.target.result);
                
                if (!geoJson || geoJson.type !== 'FeatureCollection') {
                    updateIntervisibilityStatus('Invalid GeoJSON format. Expected FeatureCollection.');
                    return;
                }
                
                const map = window.map;
                if (!map) {
                    updateIntervisibilityStatus('Map not available.');
                    return;
                }
                
                // Clear existing data
                clearIntervisibilityData();
                
                // Separate markers and lines
                const markerFeatures = geoJson.features.filter(f => 
                    f.geometry && f.geometry.type === 'Point' && 
                    f.properties && f.properties.featureType === 'intervisibility-marker'
                );
                const lineFeatures = geoJson.features.filter(f => 
                    f.geometry && f.geometry.type === 'LineString' && 
                    f.properties && f.properties.featureType === 'intervisibility-line'
                );
                
                // Load markers
                if (markerFeatures.length > 0) {
                    intervisibilityLayerGroup = L.layerGroup();
                    intervisibilityMarkers = [];
                    
                    markerFeatures.forEach((feature, index) => {
                        const coords = feature.geometry.coordinates;
                        const latlng = L.latLng(coords[1], coords[0]);
                        const props = feature.properties || {};
                        
                        const marker = L.circleMarker(latlng, {
                            radius: 3,
                            fillColor: '#800080',
                            color: '#800080',
                            weight: 0,
                            opacity: 1.0,
                            fillOpacity: 1.0
                        });
                        
                        const name = props.name || `Site ${index + 1}`;
                        marker.bindPopup(`<b>${name}</b><br>Lat: ${latlng.lat.toFixed(6)}<br>Lon: ${latlng.lng.toFixed(6)}`);
                        
                        intervisibilityLayerGroup.addLayer(marker);
                        intervisibilityMarkers.push({
                            latlng: latlng,
                            marker: marker,
                            name: name,
                            elevation: props.elevation || 0
                        });
                    });
                    
                    map.addLayer(intervisibilityLayerGroup);
                    if (window.layersControl) {
                        window.layersControl.addOverlay(intervisibilityLayerGroup, 'Intervisibility Markers');
                    }
                }
                
                // Load lines
                console.log(`Loading ${lineFeatures.length} line features from saved file.`);
                if (lineFeatures.length > 0) {
                    const geoJsonData = {
                        type: 'FeatureCollection',
                        features: lineFeatures
                    };
                    
                    // Clear any existing lines layer
                    if (intervisibilityLinesLayerGroup) {
                        map.removeLayer(intervisibilityLinesLayerGroup);
                        if (window.layersControl) {
                            try {
                                window.layersControl.removeLayer(intervisibilityLinesLayerGroup);
                            } catch (e) {
                                // Ignore
                            }
                        }
                    }
                    
                    intervisibilityLinesLayerGroup = L.geoJSON(geoJsonData, {
                        style: {
                            color: '#808080',
                            weight: 2,
                            opacity: 0.7,
                            dashArray: '10, 5'
                        }
                    });
                    
                    map.addLayer(intervisibilityLinesLayerGroup);
                    console.log(`Added ${lineFeatures.length} lines to map. Layer on map: ${map.hasLayer(intervisibilityLinesLayerGroup)}`);
                    
                    if (window.layersControl) {
                        window.layersControl.addOverlay(intervisibilityLinesLayerGroup, 'Intervisibility Lines');
                    }
                    
                    // Store lines for reference
                    intervisibilityLines = [];
                    intervisibilityLinesLayerGroup.eachLayer(function(layer) {
                        intervisibilityLines.push(layer);
                    });
                    console.log(`Stored ${intervisibilityLines.length} line layers for reference.`);
                } else {
                    console.warn('No line features found in saved file.');
                }
                
                // Rebuild visiblePairs from saved metadata or from loaded lines
                const loadedVisiblePairs = [];
                
                // First, try to use saved visiblePairs data from metadata (more reliable)
                if (geoJson.metadata && geoJson.metadata.visiblePairs && Array.isArray(geoJson.metadata.visiblePairs)) {
                    geoJson.metadata.visiblePairs.forEach(pairData => {
                        // Match by index first (most reliable)
                        if (pairData.site1Index !== undefined && pairData.site2Index !== undefined) {
                            if (pairData.site1Index < intervisibilityMarkers.length && pairData.site2Index < intervisibilityMarkers.length) {
                                const marker1 = intervisibilityMarkers[pairData.site1Index];
                                const marker2 = intervisibilityMarkers[pairData.site2Index];
                                if (marker1 && marker2) {
                                    loadedVisiblePairs.push({ marker1: marker1, marker2: marker2 });
                                }
                            }
                        } else if (pairData.site1Lat !== undefined && pairData.site1Lng !== undefined) {
                            // Fallback: match by coordinates (with tolerance)
                            const marker1 = intervisibilityMarkers.find(m => 
                                Math.abs(m.latlng.lat - pairData.site1Lat) < 0.0001 && 
                                Math.abs(m.latlng.lng - pairData.site1Lng) < 0.0001
                            );
                            const marker2 = intervisibilityMarkers.find(m => 
                                Math.abs(m.latlng.lat - pairData.site2Lat) < 0.0001 && 
                                Math.abs(m.latlng.lng - pairData.site2Lng) < 0.0001
                            );
                            if (marker1 && marker2) {
                                loadedVisiblePairs.push({ marker1: marker1, marker2: marker2 });
                            }
                        }
                    });
                }
                
                // If no saved pairs data, try to rebuild from loaded lines (less reliable but better than nothing)
                if (loadedVisiblePairs.length === 0 && intervisibilityLinesLayerGroup) {
                    intervisibilityLinesLayerGroup.eachLayer(function(layer) {
                        if (layer.feature && layer.feature.geometry && layer.feature.geometry.type === 'LineString') {
                            const coords = layer.feature.geometry.coordinates;
                            if (coords.length >= 2) {
                                const latlng1 = L.latLng(coords[0][1], coords[0][0]);
                                const latlng2 = L.latLng(coords[coords.length - 1][1], coords[coords.length - 1][0]);
                                
                                // Match markers by coordinates with tolerance
                                const marker1 = intervisibilityMarkers.find(m => 
                                    Math.abs(m.latlng.lat - latlng1.lat) < 0.0001 && 
                                    Math.abs(m.latlng.lng - latlng1.lng) < 0.0001
                                );
                                const marker2 = intervisibilityMarkers.find(m => 
                                    Math.abs(m.latlng.lat - latlng2.lat) < 0.0001 && 
                                    Math.abs(m.latlng.lng - latlng2.lng) < 0.0001
                                );
                                
                                if (marker1 && marker2) {
                                    loadedVisiblePairs.push({ marker1: marker1, marker2: marker2 });
                                }
                            }
                        }
                    });
                }
                
                // Store for statistics calculation
                window.visiblePairsForStats = loadedVisiblePairs;
                
                // Calculate and display statistics if we have data
                if (geoJson.metadata && loadedVisiblePairs.length > 0 && intervisibilityMarkers.length > 0) {
                    const totalSites = geoJson.metadata.markerCount || intervisibilityMarkers.length;
                    const totalPairs = (totalSites * (totalSites - 1)) / 2;
                    const intervisiblePairs = loadedVisiblePairs.length;
                    const visibilityPercent = totalPairs > 0 ? ((intervisiblePairs / totalPairs) * 100).toFixed(1) : 0;
                    
                    // Show the view button and calculate statistics
                    $('#btn-view-intervisibility-statistics').show();
                    updateIntervisibilityStatistics(totalSites, totalPairs, intervisiblePairs, visibilityPercent, totalPairs);
                } else if (geoJson.metadata && geoJson.metadata.lineCount > 0) {
                    // Fallback: use metadata counts if available but no pairs data
                    const totalSites = geoJson.metadata.markerCount || intervisibilityMarkers.length;
                    const totalPairs = (totalSites * (totalSites - 1)) / 2;
                    const intervisiblePairs = geoJson.metadata.lineCount;
                    const visibilityPercent = totalPairs > 0 ? ((intervisiblePairs / totalPairs) * 100).toFixed(1) : 0;
                    
                    $('#btn-view-intervisibility-statistics').show();
                    updateIntervisibilityStatistics(totalSites, totalPairs, intervisiblePairs, visibilityPercent, totalPairs);
                } else {
                    // No statistics available for loaded matrix
                    $('#btn-view-intervisibility-statistics').hide();
                }
                
                updateIntervisibilityStatus(`Loaded intervisibility matrix: ${markerFeatures.length} sites, ${lineFeatures.length} intervisibility lines.`);
                $('#btn-create-intervisibility-matrix').prop('disabled', false);
                $('#btn-save-intervisibility-matrix').show();
                
            } catch (error) {
                updateIntervisibilityStatus('Error loading intervisibility matrix: ' + error.message);
                console.error('Error loading intervisibility matrix:', error);
            }
        };
        reader.readAsText(file);
    };
    
    // Clear intervisibility data
    function clearIntervisibilityData() {
        const map = window.map;
        if (map) {
            if (intervisibilityLayerGroup) {
                map.removeLayer(intervisibilityLayerGroup);
                if (window.layersControl) {
                    try {
                        window.layersControl.removeLayer(intervisibilityLayerGroup);
                    } catch (e) {
                        // Layer not in control yet, that's fine
                    }
                }
            }
            
            if (intervisibilityLinesLayerGroup) {
                map.removeLayer(intervisibilityLinesLayerGroup);
                if (window.layersControl) {
                    try {
                        window.layersControl.removeLayer(intervisibilityLinesLayerGroup);
                    } catch (e) {
                        // Layer not in control yet, that's fine
                    }
                }
            }
            
            intervisibilityLines.forEach(line => {
                if (map.hasLayer(line)) {
                    map.removeLayer(line);
                }
            });
        }
        
        intervisibilityMarkers = [];
        intervisibilityLayerGroup = null;
        intervisibilityLines = [];
        intervisibilityLinesLayerGroup = null;
        
        // Clear marker DEMs
        markerDems.clear();
        
        // Clear line DEM cache to free memory
        clearDemCache();
    }
    
    
    // Initialize button handlers
    $(document).ready(function() {
        $('#btn-open-intervisibility-markers').click(function() {
            $('#input-intervisibility-markers').click();
        });
        
        $('#btn-create-intervisibility-matrix').click(function() {
            if (typeof window.createIntervisibilityMatrix === 'function') {
                window.createIntervisibilityMatrix();
            }
        });
        
        // Save Intervisibility Matrix button handler
        $('#btn-save-intervisibility-matrix').click(function() {
            if (typeof window.saveIntervisibilityMatrix === 'function') {
                window.saveIntervisibilityMatrix();
            }
        });
        
        // Load Saved Intervisibility Matrix button handler
        $('#btn-load-intervisibility-matrix').click(function() {
            $('#input-load-intervisibility-matrix').click();
        });
        
        $('#input-load-intervisibility-matrix').on('change', function(event) {
            if (typeof window.loadIntervisibilityMatrix === 'function') {
                window.loadIntervisibilityMatrix(event);
            }
        });
        
        // Toggle statistics panel (optimized for performance)
        $('#btn-toggle-iv-results').on('click', function(e) {
            e.stopPropagation();
            const panel = $('#iv-results-panel');
            const icon = $('#icon-toggle-iv');
            
            if (panel.hasClass('minimized')) {
                panel.removeClass('minimized').addClass('expanded');
                icon.attr('class', 'fa fa-window-minimize');
            } else {
                panel.removeClass('expanded').addClass('minimized');
                icon.attr('class', 'fa fa-window-maximize');
            }
        });
        
        // Make panel heading clickable to toggle (like horizon results) - direct toggle, no nested click
        $('#iv-results-header').on('click', function(e) {
            // Only toggle if clicking on the header itself, not on buttons
            if (e.target === this || $(e.target).closest('.btn-group').length === 0) {
                const panel = $('#iv-results-panel');
                const icon = $('#icon-toggle-iv');
                
                if (panel.hasClass('minimized')) {
                    panel.removeClass('minimized').addClass('expanded');
                    icon.attr('class', 'fa fa-window-minimize');
                } else {
                    panel.removeClass('expanded').addClass('minimized');
                    icon.attr('class', 'fa fa-window-maximize');
                }
            }
        });
        
        $('#btn-pause-intervisibility').click(function() {
            if (typeof window.pauseIntervisibilityCalculation === 'function') {
                window.pauseIntervisibilityCalculation();
            }
        });
        
        $('#btn-resume-intervisibility').click(function() {
            if (typeof window.resumeIntervisibilityCalculation === 'function') {
                window.resumeIntervisibilityCalculation();
            }
        });
        
        $('#btn-cancel-intervisibility').click(function() {
            if (typeof window.cancelIntervisibilityCalculation === 'function') {
                window.cancelIntervisibilityCalculation();
            }
        });
    });
    
})();


