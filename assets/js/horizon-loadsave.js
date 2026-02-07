// ============================================================================
// Horizon Load/Save Functions for Rise/Set Locations
// Handles saving and loading rise/set location markers to/from GeoJSON
// ============================================================================

console.log('[horizon-loadsave.js] Script starting to load...');

(function() {
    'use strict';
    
    console.log('[horizon-loadsave.js] IIFE executing...');

    /**
     * Exports all rise/set markers to GeoJSON format with full formatting details
     */
    window.saveRiseSetLocations = function() {
        console.log('[saveRiseSetLocations] Function called');
        if (!window.scriptCOverlayGroups || window.scriptCOverlayGroups.length === 0) {
            // Display message in appropriate status area (NOT as browser alert)
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'No rise/set locations to save. Please run calculations first.', 'warn');
            } else {
                console.warn('No rise/set locations to save. Please run calculations first.');
            }
            return;
        }

        const features = [];
        
        // Add calculation point (observer location) if available
        if (window.HC_cachedParams && window.HC_cachedParams.center) {
            const observerLatLng = window.HC_cachedParams.center;
            const observerHeight = window.HC_cachedParams.height || 0;
            
            const observerFeature = {
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [observerLatLng.lng, observerLatLng.lat]
                },
                properties: {
                    name: 'Calculation Point (Observer Location)',
                    elevation: observerHeight,
                    featureType: 'observer'
                }
            };
            features.push(observerFeature);
        }
        
        // Add full viewshed horizon from profile data if available
        if (window.HC_profileData && window.HC_profileData.length > 0) {
            const viewshedCoordinates = [];
            window.HC_profileData.forEach(point => {
                if (point && point.latlng) {
                    viewshedCoordinates.push([point.latlng.lng, point.latlng.lat]);
                }
            });
            
            // Close the polyline if not already closed
            if (viewshedCoordinates.length > 2) {
                const first = viewshedCoordinates[0];
                const last = viewshedCoordinates[viewshedCoordinates.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                    viewshedCoordinates.push([first[0], first[1]]);
                }
            }
            
            if (viewshedCoordinates.length >= 2) {
                const viewshedFeature = {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: viewshedCoordinates
                    },
                    properties: {
                        name: 'Viewshed Horizon',
                        featureType: 'viewshed',
                        lineColor: '#808080',
                        weight: 2,
                        opacity: 0.7
                    }
                };
                features.push(viewshedFeature);
            }
        }
        
        // Iterate through all layer groups
        window.scriptCOverlayGroups.forEach(layerGroup => {
            if (!layerGroup || !layerGroup.eachLayer) return;
            
            // Skip "0 Horizon Intersections" layer group - Orthodrome Intersection markers should not be saved
            if (layerGroup.layerNameForControl === "0 Horizon Intersections") {
                return;
            }
            
            layerGroup.eachLayer(function(layer) {
                // Check if this is a Polyline (rise/set viewshed polylines)
                if (layer instanceof L.Polyline) {
                    const latlngs = layer.getLatLngs();
                    const options = layer.options;
                    
                    // Convert Leaflet LatLngs to GeoJSON coordinates
                    const coordinates = latlngs.map(ll => [ll.lng, ll.lat]);
                    
                    if (coordinates.length < 2) {
                        console.warn('Skipping polyline with insufficient coordinates');
                        return;
                    }
                    
                    // Create GeoJSON feature for polyline
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        },
                        properties: {
                            name: layerGroup.layerNameForControl || 'Viewshed Polyline',
                            // Store all visual properties for restoration
                            lineColor: options.color || '#000000',
                            weight: options.weight || 2,
                            opacity: options.opacity !== undefined ? options.opacity : 1.0,
                            // Store layer group name for organization
                            layerGroup: layerGroup.layerNameForControl || 'Unknown',
                            featureType: 'polyline'
                        }
                    };
                    
                    features.push(feature);
                }
                // Check if this is a CircleMarker (rise/set location marker)
                else if (layer instanceof L.CircleMarker) {
                    const latlng = layer.getLatLng();
                    const options = layer.options;
                    const popup = layer.getPopup();
                    const popupContent = popup ? popup.getContent() : '';
                    
                    // Extract label from popup content (format: <b>Label</b><br>...)
                    let label = '';
                    if (popupContent) {
                        const match = popupContent.match(/<b>(.*?)<\/b>/);
                        if (match) {
                            label = match[1];
                        }
                    }
                    
                    // Extract azimuth from popup content if available
                    let azimuth = null;
                    if (popupContent) {
                        const azMatch = popupContent.match(/Azimuth:\s*([\d.]+)/);
                        if (azMatch) {
                            azimuth = parseFloat(azMatch[1]);
                        }
                    }
                    
                    // Create GeoJSON feature with all marker properties
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [latlng.lng, latlng.lat]
                        },
                        properties: {
                            name: label,
                            azimuth: azimuth,
                            // Store all visual properties for restoration
                            lineColor: options.color || '#000000',
                            fillColor: options.fillColor || '#ffffff',
                            radius: options.radius || 6,
                            fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 1.0,
                            weight: options.weight || 2,
                            opacity: options.opacity !== undefined ? options.opacity : 1.0,
                            // Store layer group name for organization
                            layerGroup: layerGroup.layerNameForControl || 'Unknown',
                            featureType: 'marker'
                        }
                    };
                    
                    features.push(feature);
                }
                // Check if this is a Polygon (viewshed horizon)
                else if (layer instanceof L.Polygon) {
                    const latlngs = layer.getLatLngs();
                    const options = layer.options;
                    
                    // Convert Leaflet LatLngs to GeoJSON coordinates
                    // Handle both simple arrays and nested arrays (for polygons with holes)
                    function convertLatLngsToCoordinates(latlngs) {
                        if (!Array.isArray(latlngs)) return [];
                        
                        // Check if first element is a LatLng (simple polygon)
                        if (latlngs.length > 0 && latlngs[0] instanceof L.LatLng) {
                            return latlngs.map(ll => [ll.lng, ll.lat]);
                        }
                        
                        // Handle nested arrays (polygon with holes or multi-polygon)
                        return latlngs.map(ring => {
                            if (Array.isArray(ring) && ring.length > 0 && ring[0] instanceof L.LatLng) {
                                return ring.map(ll => [ll.lng, ll.lat]);
                            }
                            return [];
                        }).filter(ring => ring.length > 0);
                    }
                    
                    const coordinates = convertLatLngsToCoordinates(latlngs);
                    
                    if (coordinates.length === 0) {
                        console.warn('Skipping polygon with invalid coordinates');
                        return;
                    }
                    
                    // Create GeoJSON feature for polygon
                    const feature = {
                        type: 'Feature',
                        geometry: {
                            type: coordinates.length === 1 ? 'Polygon' : 'MultiPolygon',
                            coordinates: coordinates.length === 1 ? [coordinates[0]] : coordinates.map(ring => [ring])
                        },
                        properties: {
                            name: layerGroup.layerNameForControl || 'Viewshed Horizon',
                            // Store all visual properties for restoration
                            lineColor: options.color || '#808080',
                            fillColor: options.fillColor || '#F5F5F5',
                            fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.1,
                            weight: options.weight || 2,
                            opacity: options.opacity !== undefined ? options.opacity : 0.7,
                            // Store layer group name for organization
                            layerGroup: layerGroup.layerNameForControl || 'Viewshed Horizon',
                            featureType: 'polygon'
                        }
                    };
                    
                    features.push(feature);
                }
            });
        });
        
        if (features.length === 0) {
            // Display message in appropriate status area (NOT as browser alert)
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'No rise/set location markers or viewshed horizon found to save.', 'warn');
            } else {
                console.warn('No rise/set location markers or viewshed horizon found to save.');
            }
            return;
        }
        
        // Count markers and polygons for logging
        const markerCount = features.filter(f => f.properties.featureType === 'marker').length;
        const polygonCount = features.filter(f => f.properties.featureType === 'polygon').length;
        
        // Create GeoJSON FeatureCollection
        const geoJson = {
            type: 'FeatureCollection',
            features: features
        };
        
        // Convert to JSON string with formatting
        const jsonString = JSON.stringify(geoJson, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rise-set-locations-${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${markerCount} rise/set location(s) and ${polygonCount} viewshed horizon polygon(s) to GeoJSON.`);
    };
    
    /**
     * Imports GeoJSON file and restores rise/set markers with full formatting
     */
    window.openRiseSetLocations = function() {
        const fileInput = document.getElementById('input-open-rise-set');
        if (!fileInput) {
            console.error('File input element not found.');
            return;
        }
        
        fileInput.click();
    };
    
    /**
     * Handles file selection for opening saved rise/set locations
     */
    window.handleRiseSetFileSelect = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const geoJson = JSON.parse(e.target.result);
                restoreRiseSetLocations(geoJson);
            } catch (error) {
                // Display message in appropriate status area (NOT as browser alert)
                if (typeof window.displayMessage === 'function') {
                    window.displayMessage('overallStatus', 'Error reading GeoJSON file: ' + error.message, 'error');
                } else {
                    console.error('Error reading GeoJSON file: ' + error.message);
                }
                console.error('GeoJSON parse error:', error);
            }
        };
        reader.onerror = function() {
            // Display message in appropriate status area (NOT as browser alert)
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'Error reading file.', 'error');
            } else {
                console.error('Error reading file.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input so same file can be selected again
        event.target.value = '';
    };
    
    /**
     * Restores markers from GeoJSON with full formatting
     */
    function restoreRiseSetLocations(geoJson) {
        if (!geoJson || geoJson.type !== 'FeatureCollection' || !Array.isArray(geoJson.features)) {
            // Display message in appropriate status area (NOT as browser alert)
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'Invalid GeoJSON format. Expected FeatureCollection.', 'error');
            } else {
                console.error('Invalid GeoJSON format. Expected FeatureCollection.');
            }
            return;
        }
        
        const mapInstance = window.map;
        if (!mapInstance) {
            // Display message in appropriate status area (NOT as browser alert)
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'Map not available. Please ensure the map is loaded.', 'error');
            } else {
                console.error('Map not available. Please ensure the map is loaded.');
            }
            return;
        }
        
        // Group features by layerGroup
        const layerGroupsMap = new Map();
        
        geoJson.features.forEach(feature => {
            if (feature.type !== 'Feature' || !feature.geometry) {
                console.warn('Skipping invalid feature:', feature);
                return;
            }
            
            const props = feature.properties || {};
            const layerGroupName = props.layerGroup || (props.featureType === 'polygon' ? 'Viewshed Horizon' : 'Imported Locations');
            const geomType = feature.geometry.type;
            
            // Get or create layer group
            let layerGroup = layerGroupsMap.get(layerGroupName);
            if (!layerGroup) {
                layerGroup = L.layerGroup();
                layerGroup.layerNameForControl = layerGroupName;
                mapInstance.addLayer(layerGroup);
                if (window.layersControl) {
                    window.layersControl.addOverlay(layerGroup, layerGroupName);
                }
                if (!window.scriptCOverlayGroups) window.scriptCOverlayGroups = [];
                window.scriptCOverlayGroups.push(layerGroup);
                layerGroupsMap.set(layerGroupName, layerGroup);
            }
            
            // Handle Point features (markers and observer point)
            if (geomType === 'Point') {
                const coords = feature.geometry.coordinates;
                
                if (!Array.isArray(coords) || coords.length < 2) {
                    console.warn('Skipping feature with invalid coordinates:', feature);
                    return;
                }
                
                // Handle observer/calculation point differently
                if (props.featureType === 'observer') {
                    // Create observer marker with same size as rise/set markers
                    const observerMarker = L.circleMarker([coords[1], coords[0]], {
                        radius: 6,
                        fillColor: '#000000',
                        color: '#000000',
                        weight: 2,
                        opacity: 1.0,
                        fillOpacity: 0.3
                    });
                    
                    const elevation = props.elevation !== undefined ? props.elevation.toFixed(1) : 'N/A';
                    const popupContent = `<b>${props.name || 'Calculation Point'}</b><br>Lat: ${coords[1].toFixed(6)}<br>Lon: ${coords[0].toFixed(6)}<br>Elevation: ${elevation}m`;
                    observerMarker.bindPopup(popupContent);
                    
                    // Create a special layer group for observer if it doesn't exist
                    let observerGroup = layerGroupsMap.get('Calculation Point');
                    if (!observerGroup) {
                        observerGroup = L.layerGroup();
                        observerGroup.layerNameForControl = 'Calculation Point';
                        mapInstance.addLayer(observerGroup);
                        if (window.layersControl) {
                            window.layersControl.addOverlay(observerGroup, 'Calculation Point');
                        }
                        if (!window.scriptCOverlayGroups) window.scriptCOverlayGroups = [];
                        window.scriptCOverlayGroups.push(observerGroup);
                        layerGroupsMap.set('Calculation Point', observerGroup);
                    }
                    observerGroup.addLayer(observerMarker);
                } else {
                    // Regular rise/set marker
                    const marker = L.circleMarker([coords[1], coords[0]], {
                        radius: props.radius || 6,
                        fillColor: props.fillColor || '#ffffff',
                        color: props.lineColor || '#000000',
                        weight: props.weight || 2,
                        opacity: props.opacity !== undefined ? props.opacity : 1.0,
                        fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1.0
                    });
                    
                    // Restore popup with original content
                    const popupContent = `<b>${props.name || 'Location'}</b><br>Azimuth: ${props.azimuth !== null && props.azimuth !== undefined ? props.azimuth.toFixed(3) : 'N/A'}°<br>Lat: ${coords[1].toFixed(6)}<br>Lon: ${coords[0].toFixed(6)}`;
                    marker.bindPopup(popupContent);
                    
                    // Add marker to layer group
                    layerGroup.addLayer(marker);
                }
            }
            // Handle LineString features (polylines and viewshed horizon)
            else if (geomType === 'LineString') {
                const coords = feature.geometry.coordinates;
                
                if (!Array.isArray(coords) || coords.length < 2) {
                    console.warn('Skipping polyline with invalid coordinates:', feature);
                    return;
                }
                
                // Convert GeoJSON coordinates to Leaflet LatLngs
                const latlngs = coords.map(coord => L.latLng(coord[1], coord[0]));
                
                // Handle viewshed horizon differently
                if (props.featureType === 'viewshed') {
                    // Create a special layer group for viewshed horizon if it doesn't exist
                    let viewshedGroup = layerGroupsMap.get('Viewshed Horizon');
                    if (!viewshedGroup) {
                        viewshedGroup = L.layerGroup();
                        viewshedGroup.layerNameForControl = 'Viewshed Horizon';
                        mapInstance.addLayer(viewshedGroup);
                        if (window.layersControl) {
                            window.layersControl.addOverlay(viewshedGroup, 'Viewshed Horizon');
                        }
                        if (!window.scriptCOverlayGroups) window.scriptCOverlayGroups = [];
                        window.scriptCOverlayGroups.push(viewshedGroup);
                        layerGroupsMap.set('Viewshed Horizon', viewshedGroup);
                    }
                    
                    // Create viewshed horizon polyline with mid grey color
                    const viewshedPolyline = L.polyline(latlngs, {
                        color: '#808080',
                        weight: props.weight || 2,
                        opacity: props.opacity !== undefined ? props.opacity : 0.7,
                        smoothFactor: 1
                    });
                    
                    viewshedGroup.addLayer(viewshedPolyline);
                } else {
                    // Regular rise/set polyline
                    const polyline = L.polyline(latlngs, {
                        color: props.lineColor || '#000000',
                        weight: props.weight || 2,
                        opacity: props.opacity !== undefined ? props.opacity : 1.0,
                        smoothFactor: 1
                    });
                    
                    // Add polyline to layer group
                    layerGroup.addLayer(polyline);
                }
            }
            // Handle Polygon features (viewshed horizon)
            else if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                const coords = feature.geometry.coordinates;
                
                if (!Array.isArray(coords) || coords.length === 0) {
                    console.warn('Skipping polygon with invalid coordinates:', feature);
                    return;
                }
                
                // Convert GeoJSON coordinates to Leaflet LatLngs
                function convertCoordinatesToLatLngs(coords) {
                    if (geomType === 'Polygon') {
                        // Polygon: coordinates is an array of rings (first is outer, rest are holes)
                        return coords[0].map(coord => L.latLng(coord[1], coord[0]));
                    } else {
                        // MultiPolygon: coordinates is an array of polygons
                        // For now, take the first polygon's outer ring
                        if (coords.length > 0 && coords[0].length > 0) {
                            return coords[0][0].map(coord => L.latLng(coord[1], coord[0]));
                        }
                        return [];
                    }
                }
                
                const latlngs = convertCoordinatesToLatLngs(coords);
                
                if (latlngs.length === 0) {
                    console.warn('Skipping polygon with empty coordinates:', feature);
                    return;
                }
                
                // Create polygon with restored properties
                const polygon = L.polygon(latlngs, {
                    color: props.lineColor || '#808080',
                    fillColor: props.fillColor || '#F5F5F5',
                    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 0.1,
                    weight: props.weight || 2,
                    opacity: props.opacity !== undefined ? props.opacity : 0.7,
                    smoothFactor: 1
                });
                
                // Add polygon to layer group
                layerGroup.addLayer(polygon);
            } else {
                console.warn('Skipping unsupported geometry type:', geomType);
            }
        });
        
        const markerCount = geoJson.features.filter(f => f.geometry && f.geometry.type === 'Point').length;
        const polygonCount = geoJson.features.filter(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')).length;
        
        console.log(`Restored ${markerCount} rise/set location(s) and ${polygonCount} viewshed horizon polygon(s) from GeoJSON.`);
        
        // Display message in appropriate status area (NOT as browser alert)
        // Use window.displayMessage if available, otherwise console.log only
        if (typeof window.displayMessage === 'function') {
            window.displayMessage('overallStatus', `Successfully restored ${markerCount} rise/set location(s) and ${polygonCount} viewshed horizon polygon(s).`, 'success');
        } else {
            // Fallback: just log to console, no browser alert
            console.log(`Successfully restored ${markerCount} rise/set location(s) and ${polygonCount} viewshed horizon polygon(s).`);
        }
    }

    console.log('[horizon-loadsave.js] IIFE completed. Functions defined:');
    console.log('  - window.saveRiseSetLocations:', typeof window.saveRiseSetLocations);
    console.log('  - window.handleRiseSetFileSelect:', typeof window.handleRiseSetFileSelect);
})();

// Verify functions are exposed (for debugging)
console.log('[horizon-loadsave.js] Post-IIFE verification:');
console.log('  - window.saveRiseSetLocations:', typeof window.saveRiseSetLocations, window.saveRiseSetLocations);
console.log('  - window.handleRiseSetFileSelect:', typeof window.handleRiseSetFileSelect, window.handleRiseSetFileSelect);

if (typeof window.saveRiseSetLocations !== 'function') {
    console.error('ERROR: window.saveRiseSetLocations was not properly defined in horizon-loadsave.js');
}
if (typeof window.handleRiseSetFileSelect !== 'function') {
    console.error('ERROR: window.handleRiseSetFileSelect was not properly defined in horizon-loadsave.js');
}

console.log('[horizon-loadsave.js] Script loading complete.');

// Troubleshooting function - call from console: window.HC_troubleshootSaveFunctions()
window.HC_troubleshootSaveFunctions = function() {
    console.log('=== SAVE FUNCTIONS TROUBLESHOOTING ===');
    console.log('1. Checking script loading order...');
    console.log('   - horizon-loadsave.js should load before horizon.js');
    console.log('   - Check Network tab to verify horizon-loadsave.js loaded successfully');
    
    console.log('2. Checking function definitions...');
    console.log('   - window.saveRiseSetLocations:', typeof window.saveRiseSetLocations);
    console.log('   - window.handleRiseSetFileSelect:', typeof window.handleRiseSetFileSelect);
    
    console.log('3. Checking button elements...');
    const btnSaveProfile = document.getElementById('btn-save-horizon-profile');
    const btnSaveRiseSet = document.getElementById('btn-save-rise-set');
    console.log('   - btn-save-horizon-profile exists:', !!btnSaveProfile);
    console.log('   - btn-save-rise-set exists:', !!btnSaveRiseSet);
    if (btnSaveProfile) {
        console.log('   - btn-save-horizon-profile onclick:', btnSaveProfile.getAttribute('onclick'));
    }
    if (btnSaveRiseSet) {
        console.log('   - btn-save-rise-set onclick:', btnSaveRiseSet.getAttribute('onclick'));
    }
    
    console.log('4. Testing function calls...');
    if (typeof window.saveRiseSetLocations === 'function') {
        console.log('   ✓ saveRiseSetLocations is callable');
    } else {
        console.error('   ✗ saveRiseSetLocations is NOT a function');
    }
    
    console.log('5. Checking for JavaScript errors...');
    console.log('   - Check Console tab for any red error messages');
    console.log('   - Look for "horizon-loadsave.js" in error stack traces');
    
    console.log('=== TROUBLESHOOTING COMPLETE ===');
    console.log('If functions are undefined, check:');
    console.log('  1. Browser console for JavaScript errors');
    console.log('  2. Network tab - ensure horizon-loadsave.js loaded (status 200)');
    console.log('  3. Script order in index.html - horizon-loadsave.js must load before horizon.js');
    console.log('  4. No syntax errors in horizon-loadsave.js preventing IIFE execution');
    
    return {
        saveRiseSetLocations: typeof window.saveRiseSetLocations,
        handleRiseSetFileSelect: typeof window.handleRiseSetFileSelect,
        btnSaveRiseSetExists: !!btnSaveRiseSet
    };
};

