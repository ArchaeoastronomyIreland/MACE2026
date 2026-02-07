// GeoJSON Export/Import Script (Separate File)

// This script expects the main map script to have already initialized
// window.map, window.layersControl, window.bigMarker, window.scriptCOverlayGroups, and window.displayMessage

(function() {
    // Ensure this script runs only once if loaded separately
    if (window.MaceHWTExportImportInitialized) {
        console.warn("GeoJSON Export/Import script already initialized. Skipping re-execution.");
        return;
    }
    window.MaceHWTExportImportInitialized = true;

    document.addEventListener('DOMContentLoaded', () => {
        // Get references to elements and global variables from the main script
        const map = window.map; // Access the global map instance
        const observerMarker = window.bigMarker; // Access the global observer marker
        const scriptCOverlayGroups = window.scriptCOverlayGroups; // Access the global array of layers
        const layersControl = window.layersControl; // Access the global layers control
        const displayMessage = window.displayMessage; // Access the global display message utility

        const saveGeoJsonButton = document.getElementById('saveGeoJsonButton');
        const importGeoJsonInput = document.getElementById('importGeoJsonInput');
        const importGeoJsonButton = document.getElementById('importGeoJsonButton');
        const importStatusDiv = document.getElementById('importStatus'); // Assuming this div exists for status messages

        // --- GeoJSON Export Functionality ---
        if (saveGeoJsonButton) {
            saveGeoJsonButton.addEventListener('click', () => {
                if (!map) {
                    console.warn("Map not initialized. Cannot export GeoJSON.");
                    displayMessage('overallStatus', 'Error: Map not initialized. Calculate azimuths first.', 'error');
                    return;
                }

                const geoJsonFeatures = [];

                // Add the observer marker as a point feature
                if (observerMarker) {
                    const observerGeoJSON = observerMarker.toGeoJSON();
                    observerGeoJSON.properties = {
                        name: "Observer Location",
                        lat: observerMarker.getLatLng().lat.toFixed(6),
                        lon: observerMarker.getLatLng().lng.toFixed(6),
                        // Add styling properties for the observer marker
                        markerType: "circleMarker",
                        radius: observerMarker.options.radius,
                        color: observerMarker.options.color,
                        weight: observerMarker.options.weight,
                        opacity: observerMarker.options.opacity,
                        fillColor: observerMarker.options.fillColor,
                        fillOpacity: observerMarker.options.fillOpacity,
                        popupContent: observerMarker.getPopup()?.getContent() || ""
                    };
                    geoJsonFeatures.push(observerGeoJSON);
                }

                // Iterate through all generated overlay layer groups from the main script
                scriptCOverlayGroups.forEach(layerGroup => {
                    layerGroup.eachLayer(layer => {
                        if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.CircleMarker) {
                            const feature = layer.toGeoJSON();
                            // Extract and add styling properties
                            feature.properties = feature.properties || {}; // Ensure properties object exists

                            // Common styling properties for polylines, polygons, and circle markers
                            if (layer.options.color) feature.properties.color = layer.options.color;
                            if (layer.options.weight) feature.properties.weight = layer.options.weight;
                            if (layer.options.opacity) feature.properties.opacity = layer.options.opacity;
                            if (layer.options.dashArray) feature.properties.dashArray = layer.options.dashArray;

                            // Specific styling for filled layers (polygons, circle markers)
                            if (layer.options.fillColor) feature.properties.fillColor = layer.options.fillColor;
                            if (layer.options.fillOpacity) feature.properties.fillOpacity = layer.options.fillOpacity;

                            // Specific for circle markers
                            if (layer instanceof L.CircleMarker && layer.options.radius) {
                                feature.properties.markerType = "circleMarker";
                                feature.properties.radius = layer.options.radius;
                            } else if (layer instanceof L.Polygon) {
                                feature.properties.type = "polygon";
                            } else if (layer instanceof L.Polyline) {
                                feature.properties.type = "polyline";
                            }

                            // Add popup content if available
                            if (layer.getPopup()) {
                                feature.properties.popupContent = layer.getPopup().getContent();
                            }

                            // Add custom labels for polygons/markers if they exist (e.g., "WSR Upper Limb")
                            if (layer.options.label) { // Assuming a 'label' option might be set when creating these layers
                                feature.properties.label = layer.options.label;
                            } else if (layer.getPopup() && layer.getPopup()._content) {
                                // Attempt to parse label from popup content if not explicitly set
                                const popupContent = layer.getPopup()._content;
                                const match = popupContent.match(/<b>(.*?)<\/b>/);
                                if (match && match[1]) {
                                    feature.properties.label = match[1];
                                }
                            }
                            geoJsonFeatures.push(feature);
                        }
                    });
                });

                const geoJsonOutput = {
                    type: "FeatureCollection",
                    features: geoJsonFeatures
                };

                const geoJsonString = JSON.stringify(geoJsonOutput, null, 2); // Pretty print JSON
                const blob = new Blob([geoJsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = 'mace_overlays.geojson';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                displayMessage('overallStatus', 'Map overlays exported as GeoJSON!', 'success');
                console.log("GeoJSON Exported:", geoJsonOutput);
            });
        }


        // --- GeoJSON Import Functionality ---
        if (importGeoJsonButton) {
            importGeoJsonButton.addEventListener('click', () => {
                if (!map) {
                    displayMessage('importStatus', 'Error: Map not initialized. Please calculate azimuths first.', 'error');
                    return;
                }

                const file = importGeoJsonInput.files[0];
                if (!file) {
                    displayMessage('importStatus', 'Please select a GeoJSON file to import.', 'warn');
                    return;
                }

                displayMessage('importStatus', `Importing file: ${file.name}...`, 'status');

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const geoJsonData = JSON.parse(event.target.result);

                        if (!geoJsonData || geoJsonData.type !== "FeatureCollection" || !Array.isArray(geoJsonData.features)) {
                            throw new Error("Invalid GeoJSON structure. Expected a FeatureCollection.");
                        }

                        const importedLayerGroup = L.layerGroup();
                        let bounds = new L.LatLngBounds();

                        geoJsonData.features.forEach(feature => {
                            const properties = feature.properties || {};
                            const geometry = feature.geometry;

                            if (!geometry || !geometry.coordinates) {
                                console.warn("Skipping feature with missing geometry or coordinates:", feature);
                                return;
                            }

                            let layer;
                            const styleOptions = {
                                color: properties.color || '#3388ff', // Default blue
                                weight: properties.weight || 3,
                                opacity: properties.opacity || 0.8,
                                dashArray: properties.dashArray || '',
                                fillColor: properties.fillColor || '#3388ff', // Default blue
                                fillOpacity: properties.fillOpacity || 0.2
                            };

                            switch (geometry.type) {
                                case 'Point':
                                    const latLon = [geometry.coordinates[1], geometry.coordinates[0]];
                                    if (properties.markerType === "circleMarker") {
                                        layer = L.circleMarker(latLon, {
                                            radius: properties.radius || 6,
                                            fillColor: styleOptions.fillColor,
                                            color: styleOptions.color,
                                            weight: styleOptions.weight,
                                            opacity: styleOptions.opacity,
                                            fillOpacity: styleOptions.fillOpacity
                                        });
                                    } else {
                                        // Default to standard marker if not specified or unknown
                                        layer = L.marker(latLon);
                                    }
                                    break;
                                case 'LineString':
                                    const polylineCoords = geometry.coordinates.map(coord => [coord[1], coord[0]]);
                                    layer = L.polyline(polylineCoords, styleOptions);
                                    break;
                                case 'Polygon':
                                    const polygonCoords = geometry.coordinates.map(ring =>
                                        ring.map(coord => [coord[1], coord[0]])
                                    );
                                    layer = L.polygon(polygonCoords, styleOptions);
                                    break;
                                default:
                                    console.warn(`Unsupported GeoJSON geometry type: ${geometry.type}`);
                                    return;
                            }

                            if (layer) {
                                if (properties.popupContent) {
                                    layer.bindPopup(properties.popupContent);
                                } else if (properties.label) {
                                    layer.bindPopup(`<b>${properties.label}</b>`);
                                }
                                importedLayerGroup.addLayer(layer);
                                if (layer.getBounds) {
                                    bounds.extend(layer.getBounds());
                                } else if (layer.getLatLng) {
                                    bounds.extend(layer.getLatLng());
                                }
                            }
                        });

                        if (importedLayerGroup.getLayers().length > 0) {
                            const layerName = `Imported Layers (${new Date().toLocaleTimeString()})`;
                            layersControl.addOverlay(importedLayerGroup, layerName);
                            importedLayerGroup.addTo(map);
                            if (bounds.isValid()) {
                                map.fitBounds(bounds, { padding: [50, 50] });
                            }
                            displayMessage('importStatus', `Successfully imported "${file.name}". Added as "${layerName}".`, 'success');
                            console.log("Imported GeoJSON layers:", importedLayerGroup);
                        } else {
                            displayMessage('importStatus', 'No valid features found in the imported GeoJSON file.', 'warn');
                        }

                    } catch (error) {
                        displayMessage('importStatus', `Error importing GeoJSON: ${error.message}`, 'error');
                        console.error("Error importing GeoJSON:", error);
                    }
                };

                reader.onerror = () => {
                    displayMessage('importStatus', 'Error reading file.', 'error');
                    console.error("Error reading file:", reader.error);
                };

                reader.readAsText(file);
            });
        }
    });

})();