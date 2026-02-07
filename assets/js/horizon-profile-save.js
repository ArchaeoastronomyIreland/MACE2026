// ============================================================================
// Horizon Profile Save/Load Functions
// Handles saving and loading horizon profile data to/from GeoJSON
// ============================================================================

console.log('[horizon-profile-save.js] Script starting to load...');

(function() {
    'use strict';
    
    console.log('[horizon-profile-save.js] IIFE executing...');
    
    /**
     * Exports horizon profile to GeoJSON format
     */
    window.saveHorizonProfile = function() {
        if (!window.HC_profileData || window.HC_profileData.length === 0) {
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'No horizon profile to save. Please run horizon probe first.', 'warn');
            } else {
                console.warn('No horizon profile to save. Please run horizon probe first.');
            }
            return;
        }

        const features = [];
        
        // Add observer location if available
        if (window.HC_cachedParams && window.HC_cachedParams.center) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [window.HC_cachedParams.center.lng, window.HC_cachedParams.center.lat]
                },
                properties: {
                    name: 'Calculation Point (Observer Location)',
                    elevation: window.HC_cachedParams.height || 0,
                    featureType: 'observer'
                }
            });
        }
        
        // Add horizon profile as LineString
        const profileCoordinates = [];
        window.HC_profileData.forEach(point => {
            if (point && point.latlng) {
                profileCoordinates.push([point.latlng.lng, point.latlng.lat]);
            }
        });
        
        if (profileCoordinates.length >= 2) {
            // Close the polyline if not already closed
            const first = profileCoordinates[0];
            const last = profileCoordinates[profileCoordinates.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                profileCoordinates.push([first[0], first[1]]);
            }
            
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: profileCoordinates
                },
                properties: {
                    name: 'Horizon Profile',
                    featureType: 'horizonProfile',
                    pointCount: window.HC_profileData.length,
                    lineColor: '#808080',
                    weight: 2,
                    opacity: 0.7
                }
            });
        }
        
        // Add profile data points as metadata
        features.push({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: window.HC_cachedParams && window.HC_cachedParams.center ? 
                    [window.HC_cachedParams.center.lng, window.HC_cachedParams.center.lat] : 
                    [0, 0]
            },
            properties: {
                name: 'Horizon Profile Data',
                featureType: 'profileData',
                profilePoints: window.HC_profileData.map(pt => ({
                    x: pt.x || 0,
                    y: pt.y || 0,
                    lat: pt.latlng ? pt.latlng.lat : null,
                    lng: pt.latlng ? pt.latlng.lng : null
                }))
            }
        });
        
        // Create GeoJSON and download
        const geoJson = {
            type: 'FeatureCollection',
            features: features
        };
        
        const jsonString = JSON.stringify(geoJson, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `horizon-profile-${new Date().toISOString().split('T')[0]}.geojson`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log(`Exported horizon profile with ${window.HC_profileData.length} points to GeoJSON.`);
    };
    
    /**
     * Handles file selection for opening saved horizon profiles
     */
    window.handleSavedHorizonsFileSelect = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileName = file.name;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const geoJson = JSON.parse(e.target.result);
                restoreHorizonProfile(geoJson, fileName);
            } catch (error) {
                if (typeof window.displayMessage === 'function') {
                    window.displayMessage('overallStatus', 'Error reading GeoJSON file: ' + error.message, 'error');
                } else {
                    console.error('Error reading GeoJSON file: ' + error.message);
                }
                console.error('GeoJSON parse error:', error);
            }
        };
        reader.onerror = function() {
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
     * Restores horizon profile from GeoJSON and populates horizon results
     * CRITICAL: This must match HC_executeAnalysis flow exactly
     */
    function restoreHorizonProfile(geoJson, fileName) {
        if (!geoJson || geoJson.type !== 'FeatureCollection' || !Array.isArray(geoJson.features)) {
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'Invalid GeoJSON format. Expected FeatureCollection.', 'error');
            } else {
                console.error('Invalid GeoJSON format. Expected FeatureCollection.');
            }
            return;
        }
        
        // Clear all existing data before loading new profile
        const mapInstance = window.map;
        
        // Clear viewshed polyline
        if (window.HC_polyline) {
            mapInstance.removeLayer(window.HC_polyline);
            window.HC_polyline = null;
        }
        
        // Clear rise/set results
        if (typeof window.HC_clearRiseSetResults === 'function') {
            window.HC_clearRiseSetResults();
        }
        
        // Clear horizon data
        window.HC_horizonData = null;
        window.HC_locationData = null;
        
        // Find profile data feature
        let profileDataFeature = null;
        let observerFeature = null;
        let horizonLineFeature = null;
        
        geoJson.features.forEach(feature => {
            if (feature.properties && feature.properties.featureType === 'profileData') {
                profileDataFeature = feature;
            } else if (feature.properties && feature.properties.featureType === 'observer') {
                observerFeature = feature;
            } else if (feature.properties && feature.properties.featureType === 'horizonProfile') {
                horizonLineFeature = feature;
            }
        });
        
        if (!profileDataFeature || !profileDataFeature.properties.profilePoints) {
            if (typeof window.displayMessage === 'function') {
                window.displayMessage('overallStatus', 'No horizon profile data found in file.', 'error');
            } else {
                console.error('No horizon profile data found in file.');
            }
            return;
        }
        
        // Restore profile data
        const profilePoints = profileDataFeature.properties.profilePoints;
        const restoredProfileData = profilePoints.map(pt => ({
            x: pt.x || 0,
            y: pt.y || 0,
            latlng: (pt.lat !== null && pt.lng !== null) ? L.latLng(pt.lat, pt.lng) : null
        }));
        
        // CRITICAL: Set profile data using setter - this sets the internal HC_profileData variable
        // HC_renderPanorama uses HC_profileData (internal) directly, not window.HC_profileData
        if (typeof window.HC_setProfileData === 'function') {
            window.HC_setProfileData(restoredProfileData);
        } else {
            console.error('HC_setProfileData function not available. Cannot restore profile data.');
            return;
        }
        
        // Restore observer location if available
        if (observerFeature && observerFeature.geometry && observerFeature.geometry.type === 'Point') {
            const coords = observerFeature.geometry.coordinates;
            const observerLatLng = L.latLng(coords[1], coords[0]);
            const observerHeight = observerFeature.properties.elevation || 0;
            
            if (typeof window.HC_setCachedParams === 'function') {
                window.HC_setCachedParams({
                    center: observerLatLng,
                    height: observerHeight
                });
            }
        }
        
        // Draw viewshed polyline on map if horizon line feature exists
        if (mapInstance && horizonLineFeature && horizonLineFeature.geometry && horizonLineFeature.geometry.type === 'LineString') {
            const coords = horizonLineFeature.geometry.coordinates;
            const latlngs = coords.map(coord => L.latLng(coord[1], coord[0]));
            
            if (window.HC_polyline) {
                mapInstance.removeLayer(window.HC_polyline);
                window.HC_polyline = null;
            }
            
            window.HC_polyline = L.polyline(latlngs, {
                color: '#808080',
                weight: 2,
                opacity: 0.7,
                smoothFactor: 1
            });
            mapInstance.addLayer(window.HC_polyline);
        }
        
        // Hide resolution controls and save buttons
        $('#hc-results-panel .panel-body > .row:first').hide();
        $('#profile-resolution-buttons').hide();
        $('#riseset-resolution-buttons').hide();
        $('#btn-save-horizon-profile').hide();
        $('#btn-save-rise-set').hide();
        
        // Show panel first (matching HC_executeAnalysis line 1071)
        $('#hc-results-panel').css('display', 'flex').removeClass('minimized').addClass('expanded');
        $('#btn-view-horizon-results').show();
        
        // Update panel title with filename
        const fileNameDisplay = fileName || 'Loaded Horizon Profile';
        const panelTitle = $('#hc-results-panel .panel-heading h4.panel-title');
        if (panelTitle.length > 0) {
            panelTitle.html(`<i class="fa fa-area-chart"></i>&nbsp;Horizon Results - <span style="font-size: 0.75em; color: #888888;">${fileNameDisplay}</span>`);
        }
        
        // CRITICAL: Force layout calculation before rendering
        // HC_drawPano checks wrapper.clientWidth/Height - if 0, it silently returns
        // We need to ensure the DOM has calculated dimensions before rendering
        // Force a reflow by reading offsetHeight
        const panel = document.getElementById('hc-results-panel');
        if (panel) {
            void panel.offsetHeight; // Force reflow
        }
        
        // Set checkboxes and show rows BEFORE setTimeout to ensure they're visible
        $('#chk-show-chart').prop('checked', true);
        $('#chk-show-silhouette').prop('checked', true);
        $('#chk-show-hillshade').prop('checked', false);
        $('#row-horizon-chart').show();
        $('#row-visual-horizon-silhouette').show();
        $('#row-visual-horizon-hillshade').hide();
        
        // Force another reflow after showing rows
        const chartRow = document.getElementById('row-horizon-chart');
        const silhouetteRow = document.getElementById('row-visual-horizon-silhouette');
        if (chartRow) void chartRow.offsetHeight;
        if (silhouetteRow) void silhouetteRow.offsetHeight;
        
        // CRITICAL: Match HC_executeAnalysis flow exactly - everything inside setTimeout
        // This matches the async flow after HC_calculateViewshed completes
        setTimeout(() => {
            // CRITICAL: Force chart container reflow before rendering chart
            // Chart.js needs the canvas container to have dimensions
            const chartCanvas = document.getElementById('hc-horizonChart');
            if (chartCanvas && chartCanvas.parentElement) {
                void chartCanvas.parentElement.offsetHeight; // Force reflow
            }
            
            // CRITICAL: Render chart first (matching line 1153 in HC_executeAnalysis)
            // HC_renderChart is now exposed as window.HC_renderChart (see horizon.js line ~2696)
            // and expects the data array directly
            if (typeof window.HC_renderChart === 'function') {
                window.HC_renderChart(restoredProfileData);
                // Ensure CSV button is visible
                if (typeof window.HC_ensureCSVButton === 'function') {
                    window.HC_ensureCSVButton();
                }
            } else {
                console.error('HC_renderChart is not available as window.HC_renderChart. Cannot render chart.');
            }
            
            // CRITICAL: Set panorama bearing to 0 (matching line 1155)
            if (typeof window.HC_panoBearing !== 'undefined') {
                window.HC_panoBearing = 0;
            }
            
            // Checkboxes and visibility already set above before setTimeout
            
            // CRITICAL: Force layout recalculation right before rendering panorama
            // HC_drawPano checks wrapper.clientWidth/Height - if 0, it silently returns
            // Reading offsetHeight forces browser to calculate dimensions immediately
            const panoCanvas = document.getElementById('hc-panoCanvas');
            if (panoCanvas && panoCanvas.parentElement) {
                void panoCanvas.parentElement.offsetHeight; // Force reflow to calculate dimensions
            }
            
            // CRITICAL: Render panorama with requestAnimationFrame (matching lines 1184-1185)
            // HC_renderPanorama is now exposed as window.HC_renderPanorama (see horizon.js line ~2697)
            // It uses HC_profileData (internal) which was set via HC_setProfileData
            if (typeof window.HC_renderPanorama === 'function') {
                requestAnimationFrame(() => {
                    if (typeof window.HC_renderPanorama === 'function') {
                        window.HC_renderPanorama();
                    }
                });
            } else {
                console.error('HC_renderPanorama is not available as window.HC_renderPanorama. Cannot render panorama.');
            }
        }, 100);
        
        if (typeof window.displayMessage === 'function') {
            window.displayMessage('overallStatus', `Successfully loaded horizon profile with ${restoredProfileData.length} points.`, 'success');
        }
    }
    
    console.log('[horizon-profile-save.js] IIFE completed. Functions defined:');
    console.log('  - window.saveHorizonProfile:', typeof window.saveHorizonProfile);
    console.log('  - window.handleSavedHorizonsFileSelect:', typeof window.handleSavedHorizonsFileSelect);
})();

// Verify functions are exposed (for debugging)
console.log('[horizon-profile-save.js] Post-IIFE verification:');
console.log('  - window.saveHorizonProfile:', typeof window.saveHorizonProfile, window.saveHorizonProfile);
console.log('  - window.handleSavedHorizonsFileSelect:', typeof window.handleSavedHorizonsFileSelect, window.handleSavedHorizonsFileSelect);

if (typeof window.saveHorizonProfile !== 'function') {
    console.error('ERROR: window.saveHorizonProfile was not properly defined in horizon-profile-save.js');
}
if (typeof window.handleSavedHorizonsFileSelect !== 'function') {
    console.error('ERROR: window.handleSavedHorizonsFileSelect was not properly defined in horizon-profile-save.js');
}

console.log('[horizon-profile-save.js] Script loading complete.');
