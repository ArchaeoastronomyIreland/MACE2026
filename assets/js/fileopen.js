//Create a color dictionary based off of lines geojson feature.properties.stroke
var lineColors = {
  
  "#ff7800": "ff7800",
  "#ffb74d": "#ffb74d",
  "#fff176": "#fff176",
  "#aed581": "#97dc4bff",
  "#7283a7": "#759ae8ff",
  "#ff8a65": "#ff8a65",
  "#a1887f": "#cbdadfff",
  "#dce775": "#f9e9e7ff",
  "#f3e5f5": "#666666ff",
  "#e1bee7": "#666666ff",
  "10": "darkblue",
  "11": "#FF0000",
  "12": "#2c3c65",
  "13": "#FF0000",
  "14": "#3195b7",
  "15": "#fd9a00",
  "16": "#009b2e",
  "17": "#009b2e",
  "18": "#ff3135",
  "19": "#ff3135",
  "GS": "#6e6e6e",
  "J": "#976900",
  "Z": "#976900",
  "L": "#969696",
  "N": "#ffff00",
  "Q": "#ffff00",
  "#ff8040": "#9370DB"
};

// Style function for GeoJSON layers (kept for compatibility)
var style = function (feature) {
    return {
        //color: lineColors[feature.properties.stroke],
        color: '#F474F0',
        steps: 50,
        geodesic: "true",
        geodesic_steps: 50,
        geodesic_wrap: "true",
        weight: 0.5,
        opacity: 1.0,
        dashArray: "5 5",
        radius: 3
    };
};

// Remove any existing file layer control from the map (wrapped in function to avoid syntax errors)
(function removeOldFileLayerControls() {
    // Wait for map to be available
    function checkAndRemove() {
        var mapInstance = typeof window.map !== 'undefined' ? window.map : (typeof map !== 'undefined' ? map : null);
        if (mapInstance && mapInstance.getContainer) {
            var mapContainer = mapInstance.getContainer();
            var fileLayerControls = mapContainer.querySelectorAll('.leaflet-control-filelayer');
            if (fileLayerControls && fileLayerControls.length > 0) {
                fileLayerControls.forEach(function(controlEl) {
                    if (controlEl.parentNode) {
                        controlEl.parentNode.removeChild(controlEl);
                    }
                });
            }
        }
    }
    
    // Try immediately, or wait for map
    if (typeof window.map !== 'undefined' || typeof map !== 'undefined') {
        checkAndRemove();
    } else {
        // Wait a bit for map to be created
        setTimeout(checkAndRemove, 1000);
    }
})();

// Simple file loading functionality - rewritten from scratch
(function() {
    'use strict';
    
    // Create hidden file input element
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.geojson,.json,.kml,.gpx';
    fileInput.style.display = 'none';
    fileInput.id = 'sidebar-file-layer-input';
    document.body.appendChild(fileInput);
    
    // Helper function to normalize color values (handle various formats)
    function normalizeColor(color) {
        if (!color) return null;
        var str = String(color).trim();
        // Handle hex colors with/without #
        if (str.match(/^#?[0-9A-Fa-f]{6}$/)) {
            return str.startsWith('#') ? str : '#' + str;
        }
        // Handle hex colors with alpha
        if (str.match(/^#?[0-9A-Fa-f]{8}$/)) {
            var hex = str.startsWith('#') ? str.substring(1) : str;
            return '#' + hex.substring(0, 6); // Remove alpha for Leaflet
        }
        // Handle named colors
        var namedColors = {
            'red': '#FF0000', 'green': '#00FF00', 'blue': '#0000FF',
            'yellow': '#FFFF00', 'orange': '#FFA500', 'purple': '#800080',
            'pink': '#FFC0CB', 'black': '#000000', 'white': '#FFFFFF',
            'grey': '#808080', 'gray': '#808080', 'lightgrey': '#D3D3D3',
            'lightgray': '#D3D3D3', 'darkgrey': '#A9A9A9', 'darkgray': '#A9A9A9'
        };
        if (namedColors[str.toLowerCase()]) {
            return namedColors[str.toLowerCase()];
        }
        return str; // Return as-is if can't normalize
    }
    
    // Function to extract styling from GeoJSON feature properties - comprehensive parsing
    function getStyleFromFeature(feature) {
        var props = feature.properties || {};
        var style = {
            color: '#808080', // Mid grey outline
            weight: 2,
            opacity: 1.0,
            fillColor: '#800080', // Purple fill
            fillOpacity: 1.0, // Solid fill
            dashArray: null,
            radius: 4 // Original size
        };
        
        // Check for nested style object (various formats)
        if (props.style && typeof props.style === 'object') {
            if (props.style.color) style.color = normalizeColor(props.style.color) || style.color;
            if (props.style.weight) style.weight = parseFloat(props.style.weight) || 2;
            if (props.style.opacity !== undefined) style.opacity = parseFloat(props.style.opacity) || 1.0;
            if (props.style.fillColor) style.fillColor = normalizeColor(props.style.fillColor) || style.fillColor;
            if (props.style.fillOpacity !== undefined) style.fillOpacity = parseFloat(props.style.fillOpacity) || 0.2;
            if (props.style.dashArray) style.dashArray = props.style.dashArray;
            if (props.style.radius) style.radius = parseFloat(props.style.radius) || 4;
            if (props.style.stroke) style.color = normalizeColor(props.style.stroke) || style.color;
            if (props.style.fill) style.fillColor = normalizeColor(props.style.fill) || style.fillColor;
        }
        
        // SimpleStyle spec properties (marker-color, stroke, fill, etc.)
        if (props['marker-color']) {
            var markerColor = normalizeColor(props['marker-color']);
            if (markerColor) {
                style.color = markerColor;
                style.fillColor = markerColor;
            }
        }
        if (props['marker-size']) {
            var size = props['marker-size'];
            if (size === 'small') style.radius = 3;
            else if (size === 'medium') style.radius = 5;
            else if (size === 'large') style.radius = 7;
            else style.radius = parseFloat(size) || 4;
        }
        
        // Stroke/outline color (many variations)
        var strokeColor = props.stroke || props['stroke-color'] || props.color || 
                         props['outline-color'] || props.outlineColor || 
                         props['border-color'] || props.borderColor ||
                         props['line-color'] || props.lineColor;
        if (strokeColor) {
            var normalized = normalizeColor(strokeColor);
            if (normalized) style.color = normalized;
        }
        
        // Stroke/outline width (many variations)
        var strokeWidth = props['stroke-width'] || props.strokeWidth || props.weight || 
                         props['outline-width'] || props.outlineWidth ||
                         props['border-width'] || props.borderWidth ||
                         props['line-width'] || props.lineWidth ||
                         props.width;
        if (strokeWidth !== undefined && strokeWidth !== null) {
            style.weight = parseFloat(strokeWidth) || 2;
        }
        
        // Stroke opacity
        var strokeOpacity = props['stroke-opacity'] || props.strokeOpacity || 
                           props['outline-opacity'] || props.outlineOpacity ||
                           props.opacity;
        if (strokeOpacity !== undefined && strokeOpacity !== null) {
            style.opacity = parseFloat(strokeOpacity);
            if (isNaN(style.opacity)) style.opacity = 1.0;
        }
        
        // Fill color (many variations)
        var fillColor = props.fill || props.fillColor || props['fill-color'] ||
                       props['background-color'] || props.backgroundColor;
        if (fillColor) {
            var normalized = normalizeColor(fillColor);
            if (normalized) style.fillColor = normalized;
        }
        
        // Fill opacity
        var fillOpacity = props['fill-opacity'] || props.fillOpacity ||
                         props['background-opacity'] || props.backgroundOpacity;
        if (fillOpacity !== undefined && fillOpacity !== null) {
            style.fillOpacity = parseFloat(fillOpacity);
            if (isNaN(style.fillOpacity)) style.fillOpacity = 0.2;
        }
        
        // Dash array / line style
        if (props.dashArray || props['dash-array'] || props.dasharray) {
            style.dashArray = props.dashArray || props['dash-array'] || props.dasharray;
        } else if (props['stroke-dasharray'] || props.strokeDasharray) {
            style.dashArray = props['stroke-dasharray'] || props.strokeDasharray;
        } else if (props.dashed || props['line-style'] === 'dashed' || props.lineStyle === 'dashed') {
            style.dashArray = '5 5';
        }
        
        // Point/marker radius
        if (props.radius !== undefined && props.radius !== null) {
            style.radius = parseFloat(props.radius) || 4;
        } else if (props['marker-radius'] || props.markerRadius) {
            style.radius = parseFloat(props['marker-radius'] || props.markerRadius) || 4;
        }
        
        // Check for light grey outline preference
        if (strokeColor && (String(strokeColor).toLowerCase() === '#d3d3d3' || 
            String(strokeColor).toLowerCase() === '#d3d3d3ff' ||
            String(strokeColor).toLowerCase() === 'lightgrey' ||
            String(strokeColor).toLowerCase() === 'light gray')) {
            style.color = '#D3D3D3';
        }
        
        // If fill is present but no stroke color specified, use light grey outline
        if (fillColor && !strokeColor) {
            style.color = '#D3D3D3';
        }
        
        return style;
    }
    
    // Function to extract styling from KML (after conversion to GeoJSON)
    function getStyleFromKMLFeature(feature) {
        // KML styling is often converted to GeoJSON properties by toGeoJSON
        // Use the same comprehensive extraction as GeoJSON
        return getStyleFromFeature(feature);
    }
    
    // Function to handle dropped files
    function handleDroppedFiles(files) {
        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var fileName = file.name.toLowerCase();
                // Check if it's a supported file type
                if (fileName.endsWith('.geojson') || fileName.endsWith('.json') || 
                    fileName.endsWith('.kml') || fileName.endsWith('.gpx')) {
                    loadFile(file);
                }
            }
        }
    }
    
    // Set up drag and drop on the map
    function setupDragAndDrop() {
        var mapInstance = typeof window.map !== 'undefined' ? window.map : (typeof map !== 'undefined' ? map : null);
        if (!mapInstance || !mapInstance.getContainer) {
            return false;
        }
        
        var mapContainer = mapInstance.getContainer();
        
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function(eventName) {
            mapContainer.addEventListener(eventName, function(e) {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        // Handle drag enter/leave for visual feedback
        mapContainer.addEventListener('dragenter', function() {
            mapContainer.style.opacity = '0.7';
        });
        
        mapContainer.addEventListener('dragleave', function() {
            mapContainer.style.opacity = '1';
        });
        
        // Handle drop
        mapContainer.addEventListener('drop', function(e) {
            mapContainer.style.opacity = '1';
            var files = e.dataTransfer.files;
            handleDroppedFiles(files);
        });
        
        return true;
    }
    
    // Try to set up drag and drop when map is ready
    function trySetupDragAndDrop() {
        if (!setupDragAndDrop()) {
            setTimeout(trySetupDragAndDrop, 200);
        }
    }
    
    // Start trying to set up drag and drop
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trySetupDragAndDrop);
    } else {
        trySetupDragAndDrop();
    }
    
    // Function to load a file and add it to the map
    function loadFile(file) {
        var reader = new FileReader();
        var fileName = file.name;
        var isKML = fileName.toLowerCase().endsWith('.kml');
        
        reader.onload = function(e) {
            try {
                var data = e.target.result;
                var geoJson;
                
                // Determine file type and convert to GeoJSON if needed
                if (isKML) {
                    // Convert KML to GeoJSON using toGeoJSON
                    if (typeof toGeoJSON !== 'undefined') {
                        var kml = new DOMParser().parseFromString(data, 'text/xml');
                        geoJson = toGeoJSON.kml(kml);
                    } else {
                        console.error('toGeoJSON library not available for KML conversion');
                        return;
                    }
                } else if (fileName.toLowerCase().endsWith('.gpx')) {
                    // Convert GPX to GeoJSON using toGeoJSON
                    if (typeof toGeoJSON !== 'undefined') {
                        var gpx = new DOMParser().parseFromString(data, 'text/xml');
                        geoJson = toGeoJSON.gpx(gpx);
                    } else {
                        console.error('toGeoJSON library not available for GPX conversion');
                        return;
                    }
                } else {
                    // Assume GeoJSON
                    geoJson = JSON.parse(data);
                }
                
                // Check if this is a DrawingToolsExport format
                var isDrawingToolsExport = false;
                if (geoJson.type === 'DrawingToolsExport' && geoJson.features) {
                    isDrawingToolsExport = true;
                    // Convert DrawingToolsExport format to standard GeoJSON for processing
                    geoJson = {
                        type: 'FeatureCollection',
                        features: geoJson.features
                    };
                }
                
                // Get map instance
                var mapInstance = typeof window.map !== 'undefined' ? window.map : (typeof map !== 'undefined' ? map : null);
                if (!mapInstance) {
                    console.error('Map not available');
                    return;
                }
                
                // Style function for layers - uses styling from feature if present, otherwise defaults
                var styleFunction = function(feature) {
                    var featureStyle;
                    if (isKML) {
                        featureStyle = getStyleFromKMLFeature(feature);
                    } else {
                        featureStyle = getStyleFromFeature(feature);
                    }
                    
                    // Default to red with light grey outline if no styling found
                    var style = {
                        color: featureStyle.color || '#808080', // Mid grey outline by default
                        weight: featureStyle.weight || 2,
                        opacity: featureStyle.opacity !== undefined ? featureStyle.opacity : 1.0,
                        fillColor: featureStyle.fillColor || '#800080', // Purple fill by default
                        fillOpacity: featureStyle.fillOpacity !== undefined ? featureStyle.fillOpacity : 0.2
                    };
                    
                    // Add dashArray if present (for polylines)
                    if (featureStyle.dashArray) {
                        style.dashArray = featureStyle.dashArray;
                    }
                    
                    return style;
                };
                
                // Point to layer function - uses styling from feature if present
                var pointToLayer = function(feature, latlng) {
                    var featureStyle;
                    if (isKML) {
                        featureStyle = getStyleFromKMLFeature(feature);
                    } else {
                        featureStyle = getStyleFromFeature(feature);
                    }
                    
                    return L.circleMarker(latlng, {
                        radius: featureStyle.radius || 4, // Original size
                        fillColor: featureStyle.fillColor || '#800080', // Purple by default
                        color: featureStyle.color || '#808080', // Mid grey outline by default
                        weight: featureStyle.weight || 2,
                        opacity: 1.0, // Solid outline
                        fillOpacity: 1.0 // Solid fill
                    });
                };
                
                // On each feature - create popup with ALL properties (no filtering)
                var onEachFeature = function(feature, layer) {
                    var props = feature.properties || {};
                    var popupContent = '';
                    
                    // Build popup content with ALL properties - simple heading/value format
                    // Note: Leaflet popups handle scrolling, so no need for inner scrollable div
                    if (Object.keys(props).length > 0) {
                        popupContent = '<div style="max-width: 300px; font-size: 12px;">';
                        
                        // Add each property as heading on one line, value on next line
                        var first = true;
                        for (var key in props) {
                            if (props.hasOwnProperty(key)) {
                                if (!first) {
                                    popupContent += '<div style="margin-top: 8px;"></div>';
                                }
                                first = false;
                                
                                var value = props[key];
                                // Format value - handle numbers, strings, objects, etc.
                                if (value === null || value === undefined) {
                                    value = '';
                                } else if (typeof value === 'object') {
                                    // For objects, try to make them readable
                                    try {
                                        value = JSON.stringify(value, null, 2);
                                    } catch (e) {
                                        value = String(value);
                                    }
                                } else {
                                    value = String(value);
                                }
                                
                                // Heading on one line
                                popupContent += '<div style="font-weight: bold; color: #333; margin-bottom: 2px;">' + 
                                               escapeHtml(key) + ':</div>';
                                // Value on next line with wrapping
                                popupContent += '<div style="color: #666; word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word;">' + 
                                               escapeHtml(value) + '</div>';
                            }
                        }
                        
                        popupContent += '</div>';
                    } else {
                        popupContent = '<div>No properties available</div>';
                    }
                    
                    layer.bindPopup(popupContent);
                    
                    // Add to overlayMaps if it exists - use name or first property value
                    var name = props.name || props.Name || props.NAME || 
                              (Object.keys(props).length > 0 ? Object.values(props)[0] : null) ||
                              "Feature_" + Math.round(Math.random()*10000);
                    if (typeof overlayMaps !== 'undefined') {
                        overlayMaps[name] = layer;
                    }
                };
                
                // Helper function to escape HTML for popup content
                function escapeHtml(text) {
                    var div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }
                
                // Create GeoJSON layer
                var geoJsonLayer = L.geoJSON(geoJson, {
                    style: styleFunction,
                    pointToLayer: pointToLayer,
                    onEachFeature: onEachFeature
                });
                
                // Add to map
                geoJsonLayer.addTo(mapInstance);
                
                // Fit bounds
                if (geoJsonLayer.getBounds && geoJsonLayer.getBounds().isValid()) {
                    mapInstance.fitBounds(geoJsonLayer.getBounds());
                }
                
                // Add to layer switcher if available
                if (typeof layerswitcher !== 'undefined') {
                    layerswitcher.addOverlay(geoJsonLayer, fileName);
                }
                
                console.log('File loaded successfully: ' + fileName);
                
            } catch (error) {
                console.error('Error loading file:', error);
                alert('Error loading file: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            console.error('Error reading file');
            alert('Error reading file');
        };
        
        // Read file as text
        reader.readAsText(file);
    }
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files.length > 0) {
            for (var i = 0; i < e.target.files.length; i++) {
                loadFile(e.target.files[i]);
            }
            // Reset input
            e.target.value = '';
        }
    });
    
    // Expose function to trigger file input
    window.triggerFileLayerInput = function() {
        fileInput.click();
    };
    
    // Set up the sidebar button handler - must be done after sidebar initializes
    function setupSidebarButton() {
        var fileIconLi = document.getElementById('sidebar-file-icon-li');
        if (fileIconLi) {
            // Set _button property so sidebar library will call this instead of opening a pane
            // This must be set before sidebar processes the tab, or we need to set it after
            fileIconLi._button = function(e) {
                // Prevent default sidebar behavior
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                // Trigger file input directly
                fileInput.click();
            };
            console.log('File icon button handler set up on element:', fileIconLi);
            return true;
        }
        return false;
    }
    
    // Try multiple times to set up the button handler
    // Sidebar initialization happens in maphwt.js, so we need to wait for it
    function trySetup() {
        var attempts = 0;
        var maxAttempts = 10;
        
        function attempt() {
            attempts++;
            if (setupSidebarButton()) {
                console.log('File icon handler set up successfully on attempt', attempts);
            } else if (attempts < maxAttempts) {
                setTimeout(attempt, 200);
            } else {
                console.warn('Failed to set up file icon handler after', maxAttempts, 'attempts');
            }
        }
        
        // Start attempting after a short delay to let sidebar initialize
        setTimeout(attempt, 300);
    }
    
    // Start setup when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trySetup);
    } else {
        trySetup();
    }
    
    console.log('File layer loader initialized');
})();

