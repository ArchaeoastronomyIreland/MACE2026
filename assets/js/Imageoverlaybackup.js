// Global storage for overlaid images and pending georeference data
const overlaidImagesData = {};
const pendingGeorefData = {};

// Override the default L.ExportAction's addHooks to trigger file download (not new window)
// This MUST be run AFTER leaflet.distortableimage.js and html2canvas.js have loaded.
// This block is placed outside $(document).ready to ensure it's available when L.ExportAction is defined,
// but its internal logic will rely on DOM elements and map objects being ready.
if (typeof L.ExportAction !== 'undefined' && typeof html2canvas !== 'undefined') {
    L.ExportAction.prototype.addHooks = function () {
        const statusMessage = document.getElementById('status-message');
        const overlayFileName = this._overlay._originalFileName; // Get original filename from custom prop
        const context = this; // Capture 'this' context for nested callbacks

        statusMessage.textContent = `Exporting image '${overlayFileName}'... please wait.`;
        statusMessage.classList.remove('text-danger', 'text-success');
        statusMessage.classList.add('text-muted');

        // Use html2canvas to render the distorted image's DOM element to a canvas
        const overlayImageElement = this._overlay.getElement(); // Get the actual <img> DOM element

        if (overlayImageElement) {
            html2canvas(overlayImageElement, {
                backgroundColor: null, // Transparent background for PNG
                useCORS: true,
                allowTaint: true,
                scale: 1, // You can increase scale for higher resolution export if needed (e.g., 2 for 2x resolution)
            }).then(function(canvas) { // Use 'function' to properly bind 'this'
                // 1. Get Image Data (Blob)
                canvas.toBlob(function(imageBlob) { // canvas.toBlob callback
                    if (!imageBlob) {
                        throw new Error("Failed to get image blob from canvas.");
                    }

                    // 2. Prepare JSON Data
                    // Fix (for export only): Use getBounds() to retrieve axis-aligned corners for JSON output
                    const bounds = context._overlay.getBounds();
                    const northWest = bounds.getNorthWest();
                    const northEast = bounds.getNorthEast();
                    const southEast = bounds.getSouthEast();
                    const southWest = bounds.getSouthWest();
                    // Order them consistently for JSON (e.g., NW, NE, SE, SW)
                    const corners = [northWest, northEast, southEast, southWest];
                    const opacity = context._overlay.options.opacity !== undefined ? context._overlay.options.opacity : 1.0;
                    const geoData = {
                        originalFileName: overlayFileName,
                        corners: corners.map(c => ({ lat: c.lat, lng: c.lng })), // Convert LatLng objects to plain objects
                        opacity: opacity,
                        crs: "EPSG:4326" // Assuming WGS84, Leaflet's default
                    };
                    const jsonString = JSON.stringify(geoData, null, 2); // Pretty print JSON
                    const jsonBlob = new Blob([jsonString], { type: 'application/json' });

                    // 3. Create Zip File
                    const zip = new JSZip();
                    const baseName = overlayFileName.split('.').slice(0, -1).join('.'); // Get base name without extension
                    zip.file(overlayFileName, imageBlob); // Use originalFileName for the image file
                    zip.file(`${baseName}.json`, jsonBlob); // JSON filename matches image base name
                    zip.generateAsync({ type: "blob" })
                        .then(function(content) {
                            // 4. Trigger Download of Zip
                            const zipA = document.createElement('a');
                            zipA.href = URL.createObjectURL(content);
                            zipA.download = `${baseName}_georeferenced.zip`;
                            document.body.appendChild(zipA);
                            zipA.click();
                            document.body.removeChild(zipA);
                            URL.revokeObjectURL(zipA.href); // Clean up object URL

                            statusMessage.textContent = `Image and georeference data for '${overlayFileName}' exported as zip successfully.`;
                            statusMessage.classList.remove('text-muted', 'text-danger');
                            statusMessage.classList.add('text-success');
                        })
                        .catch(error => {
                            console.error("Error generating zip file:", error);
                            statusMessage.textContent = `Zip export failed: ${error.message}`;
                            statusMessage.classList.remove('text-muted', 'text-success');
                            statusMessage.classList.add('text-danger');
                        });
                }.bind(context), 'image/png'); // Corrected: Bind 'context' for toBlob callback
            }).catch(error => { // Bind 'this' to access _overlay within html2canvas.then callback
                console.error("Error during image export (html2canvas):", error);
                statusMessage.textContent = `Export failed: ${error.message}`;
                statusMessage.classList.remove('text-muted', 'text-success');
                statusMessage.classList.add('text-danger');
            });
        } else {
            statusMessage.textContent = 'Error: Image element not found for export. Please select an image.';
            statusMessage.classList.remove('text-success');
            statusMessage.classList.add('text-danger');
        }
    };
}


// Ensure this script runs after the map script has initialized 'map' and 'layerswitcher'
$(document).ready(function() {
    // Check if Leaflet and DistortableImageOverlay are loaded
    if (typeof L === 'undefined' || typeof L.DistortableImageOverlay === 'undefined') {
        let errorMessage = 'Error: Leaflet library or Leaflet.DistortableImage plugin not loaded. ';
        errorMessage += 'Please ensure all necessary Leaflet JS and plugin scripts are included in your HTML before this script.';
        document.getElementById('status-message').textContent = errorMessage;
        document.getElementById('status-message').classList.add('text-danger');
        return; // Exit if dependencies are not met
    }

    // Check if map and layerswitcher from the map script are available
    if (typeof map === 'undefined' || typeof layerswitcher === 'undefined') {
        let errorMessage = 'Error: Map or Layer Switcher from the primary map script not found. ';
        errorMessage += 'Please ensure the map script is loaded and initialized before this image script.';
        document.getElementById('status-message').textContent = errorMessage;
        document.getElementById('status-message').classList.add('text-danger');
        return; // Exit if core map objects are not available
    }

    // Add the OSM layer to the existing layerswitcher
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    layerswitcher.addBaseLayer(osmLayer, "OpenStreetMap (Image Script)"); // Added to existing control

    // --- Event listeners for Leaflet's layer control changes ---
    map.on('overlayremove', function(e) {
        // Check if it's one of OUR layers
        const originalFileName = e.layer._originalFileName;
        if (originalFileName && overlaidImagesData[originalFileName]) {
            const data = overlaidImagesData[originalFileName];
            if (data.type === 'distortable') { // Only save state for distortable images
                data.lastKnownState = e.layer.getCorners();
            } else if (data.type === 'imageOverlay') {
                // For standard L.imageOverlay, if it was draggable/editable, we'd save its current bounds.
                // For now, it's non-interactive so its bounds don't change after initial placement.
                // data.lastKnownState = e.layer.getBounds(); // Example if bounds needed saving
            }
            let currentOpacity = 1.0;
            if (e.layer.options && typeof e.layer.options.opacity !== 'undefined') {
                currentOpacity = e.layer.options.opacity;
            } else if (typeof e.layer.getOpacity === 'function') {
                currentOpacity = e.layer.getOpacity();
            }
            data.lastKnownOpacity = currentOpacity;
            data.currentLayerRef = null; // Mark as not on map
            console.log(`Overlay '${data.layerControlDisplayName}' removed via control. Current state and opacity saved.`);
        }
    });

    map.on('overlayadd', function(e) {
        const originalFileName = e.layer._originalFileName;
        if (originalFileName && overlaidImagesData[originalFileName]) {
            const storedData = overlaidImagesData[originalFileName];

            // Clean up existing layer reference from map and control if present
            if (storedData.currentLayerRef && map.hasLayer(storedData.currentLayerRef)) {
                map.removeLayer(storedData.currentLayerRef);
            }
            try {
                if (layerswitcher._layers) {
                    for (let i in layerswitcher._layers) {
                        if (layerswitcher._layers[i].layer === e.layer) {
                            layerswitcher.removeLayer(e.layer);
                            break;
                        }
                    }
                    if (storedData.currentLayerRef) {
                        for (let i in layerswitcher._layers) {
                            if (layerswitcher._layers[i].layer === storedData.currentLayerRef) {
                                layerswitcher.removeLayer(storedData.currentLayerRef);
                                break;
                            }
                        }
                    }
                }
            } catch (error) {
                console.warn("Failed to remove old layer reference from layerswitcher during overlayadd:", error);
            }

            let newLayer;
            if (storedData.type === 'distortable') {
                newLayer = new L.DistortableImageOverlay(storedData.dataUrl, {
                    corners: storedData.lastKnownState, // Use saved corners for distortable
                    opacity: storedData.lastKnownOpacity,
                    interactive: true,
                    actions: [
                        L.BorderAction, L.DeleteAction, L.DistortAction, L.DragAction,
                        L.FreeRotateAction, L.LockAction, L.OpacityAction, L.RotateAction,
                        L.ScaleAction, L.RestoreAction, L.StackAction, L.ExportAction,
                    ]
                });
                // Ensure export method is attached
                if (typeof newLayer.export !== 'function') {
                    newLayer.export = function() {
                        return new Promise((resolve, reject) => {
                            if (this.getElement()) {
                                html2canvas(this.getElement(), {
                                    backgroundColor: null, useCORS: true, allowTaint: true, scale: 1,
                                }).then(resolve).catch(reject);
                            } else {
                                reject(new Error("Image element not found on overlay for html2canvas export."));
                            }
                        });
                    };
                }
            } else if (storedData.type === 'imageOverlay') {
                newLayer = L.imageOverlay(storedData.dataUrl, storedData.lastKnownState, { // Use saved bounds for imageOverlay
                    opacity: storedData.lastKnownOpacity,
                    interactive: false // Standard image overlays are not interactive for distortable controls
                });
                // No export method for standard image overlays via the toolbar
            } else {
                console.error(`Unknown layer type in storedData for ${originalFileName}: ${storedData.type}`);
                return; // Skip adding if type is unknown
            }

            newLayer._originalFileName = originalFileName; // Attach original filename

            newLayer.addTo(map);
            layerswitcher.addOverlay(newLayer, storedData.layerControlDisplayName);
            storedData.currentLayerRef = newLayer; // Update reference to the new layer instance
            console.log(`Overlay '${storedData.layerControlDisplayName}' re-added and re-rendered with new instance.`);
        }
    });
    // --- END Event listeners ---

    setupDragAndDrop();
    setupEventListeners();
    // Removed call to updateImageList() as it's no longer needed
});

/**
 * Adds an entry for the overlaid image to the table in the control panel.
 * This function has been removed as per user request.
 */
// function addImageToList(originalFileName, elementId) { ... }

/**
 * Removes a specific image overlay from the map and its entry from the list.
 * This function has been removed as per user request.
 */
// function destroyOverlay(originalFileName) { ... }

/**
 * Removes all image overlays from the map and clears the list.
 * This function is retained as per user request, with table-related DOM manipulation removed.
 */
function destroyAllOverlays() {
    if (Object.keys(overlaidImagesData).length === 0) {
        document.getElementById('status-message').textContent = 'No images to remove.';
        document.getElementById('status-message').classList.remove('text-success');
        document.getElementById('status-message').classList.add('text-danger');
        return;
    }

    // Iterate over a copy of keys as we're modifying the object
    const fileNames = Object.keys(overlaidImagesData);
    for (const originalFileName of fileNames) {
        const data = overlaidImagesData[originalFileName];
        const layerToRemove = data.currentLayerRef;

        if (layerToRemove) {
            // Try to remove from layerswitcher first
            try {
                layerswitcher.removeLayer(layerToRemove);
            }
            catch (e) {
                console.warn(`Could not remove layer from layerswitcher (destroy all) for ${originalFileName}:`, e);
            }

            // Then remove from map if it's still there
            if (map.hasLayer(layerToRemove)) {
                map.removeLayer(layerToRemove);
            }
        }
        // Removed: document.getElementById(data.elementId)?.remove(); // This removed the table row
        delete overlaidImagesData[originalFileName]; // Remove completely from our data store
    }

    // Removed: document.getElementById('image-table-body').innerHTML = ''; // This cleared the table
    console.log('All images removed.');
    document.getElementById('status-message').textContent = 'All images removed successfully.';
    document.getElementById('status-message').classList.remove('text-danger');
    document.getElementById('status-message').classList.add('text-success');
    // Removed call to updateImageList() as it's no longer present
}

/**
 * Toggles the visibility of the "No images currently overlaid." message.
 * This function has been removed as per user request.
 */
// function updateImageList() { ... }

/**
 * Sets up drag and drop functionality for the file upload area.
 */
function setupDragAndDrop() {
    const dragArea = document.getElementById('drag-area');
    // FIX: Allow JSON files to be accepted in file input
    const fileInput = document.getElementById('file-input');
    fileInput.setAttribute('accept', 'image/*,.json, .zip'); // Allow images, JSON, and ZIP

    // Handle click to open file dialog
    dragArea.addEventListener('click', () => fileInput.click());

    // Handle file selection via input
    fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
    });

    // Prevent default drag behaviors to allow drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragArea.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drag area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dragArea.addEventListener(eventName, () => dragArea.classList.add('highlight'), false);
    });

    // Remove highlight when item leaves drag area or is dropped
    ['dragleave', 'drop'].forEach(eventName => {
        dragArea.addEventListener(eventName, () => dragArea.classList.remove('highlight'), false);
    });

    // Handle dropped files
    dragArea.addEventListener('drop', (event) => {
        const dt = event.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

/**
 * Sets up event listeners for the URL upload button and the "Destroy All" button.
 */
function setupEventListeners() {
    document.getElementById('upload-url-btn').addEventListener('click', handleUrlUpload);
    document.getElementById('destroy-all-btn').addEventListener('click', destroyAllOverlays);
}

/**
 * Processes files (from drag-and-drop or file input) and adds them as image overlays.
 * Calls to addImageToList have been removed.
 * @param {FileList} files - The FileList object containing selected image files.
 */
function handleFiles(files) {
    if (!files || files.length === 0) {
        return;
    }

    const statusMessage = document.getElementById('status-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Reset and show progress bar
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    progressContainer.classList.remove('d-none');

    statusMessage.textContent = 'Processing files...';
    statusMessage.classList.remove('text-danger', 'text-success');
    statusMessage.classList.add('text-muted');

    let filesProcessedTotal = 0; // Tracks total files successfully processed or failed
    let filesFailedCount = 0;
    const totalFilesToProcess = files.length;

    const imageFiles = [];
    const jsonFiles = [];
    const zipFiles = [];

    // Separate files by type
    Array.from(files).forEach(file => {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
            jsonFiles.push(file);
        } else if (file.type.startsWith('image/')) {
            imageFiles.push(file);
        } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
            zipFiles.push(file);
        }
        else {
            console.warn(`Skipping unsupported file type: ${file.name}`);
            filesFailedCount++;
            filesProcessedTotal++; // Count as processed (failed) for overall progress
        }
    });

    // Process Zip files first
    const processZipFiles = () => {
        return new Promise(resolve => {
            if (zipFiles.length === 0) {
                resolve();
                return;
            }

            let processedZipCount = 0;
            zipFiles.forEach(zipFile => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    JSZip.loadAsync(e.target.result).then(function (zip) {
                        let zipImage = null;
                        let zipJson = null;

                        zip.forEach(function (relativePath, file) {
                            if (file.dir) return; // Skip directories
                            if (relativePath.endsWith('.png') || relativePath.endsWith('.jpg') || relativePath.endsWith('.jpeg') || relativePath.endsWith('.gif')) {
                                zipImage = file;
                            } else if (relativePath.endsWith('.json')) {
                                zipJson = file;
                            }
                        });

                        if (zipImage && zipJson) {
                            Promise.all([
                                zipImage.async("base64"),
                                zipJson.async("text")
                            ]).then(results => {
                                const imageDataBase64 = results[0];
                                const jsonText = results[1];

                                const imageFileName = zipImage.name.split('/').pop(); // Get just the filename
                                const dataUrl = `data:image/${imageFileName.split('.').pop()};base64,${imageDataBase64}`;

                                try {
                                    const georefData = JSON.parse(jsonText);
                                    // Ensure the JSON's originalFileName matches the image being loaded from zip
                                    if (georefData.originalFileName === imageFileName) {
                                        // Create a standard L.imageOverlay for zip-extracted images
                                        const corners = georefData.corners.map(c => L.latLng(c.lat, c.lng));
                                        // Derive bounds from the provided 4 corners for L.imageOverlay
                                        const lats = corners.map(c => c.lat);
                                        const lngs = corners.map(c => c.lng);
                                        const minLat = Math.min(...lats);
                                        const maxLat = Math.max(...lats);
                                        const minLng = Math.min(...lngs);
                                        const maxLng = Math.max(...lngs);
                                        const bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);

                                        const initialOpacity = georefData.opacity !== undefined ? georefData.opacity : 1.0;

                                        const imageOverlay = L.imageOverlay(dataUrl, bounds, {
                                            opacity: initialOpacity,
                                            interactive: false // Standard image overlays are not interactive for distortable controls
                                        });

                                        // Attach originalFileName for management
                                        imageOverlay._originalFileName = imageFileName;

                                        const elementId = `image-row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                                        const uniqueInstanceId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
                                        const layerControlDisplayName = `${imageFileName} (Rectangular - ${uniqueInstanceId.substring(0, 5)})`;

                                        overlaidImagesData[imageFileName] = {
                                            dataUrl: dataUrl,
                                            type: 'imageOverlay', // Explicitly set type
                                            lastKnownState: bounds, // Store bounds for imageOverlay
                                            lastKnownOpacity: initialOpacity,
                                            elementId: elementId,
                                            currentLayerRef: imageOverlay, // Reference to the L.imageOverlay
                                            layerControlDisplayName: layerControlDisplayName
                                        };

                                        imageOverlay.addTo(map);
                                        layerswitcher.addOverlay(imageOverlay, layerControlDisplayName);
                                        // Removed: addImageToList(imageFileName, elementId);

                                        statusMessage.textContent = `Placed rectangular image '${imageFileName}' from zip.`;
                                        statusMessage.classList.remove('text-danger', 'text-muted');
                                        statusMessage.classList.add('text-success');

                                    } else {
                                        console.warn(`Filename mismatch in zip: JSON originalFileName '${georefData.originalFileName}' vs Image file '${imageFileName}' in '${zipFile.name}'`);
                                        filesFailedCount++;
                                        statusMessage.textContent = `Warning: Filename mismatch in zip for ${imageFileName}.`;
                                        statusMessage.classList.remove('text-muted', 'text-success');
                                        statusMessage.classList.add('text-danger');
                                    }
                                } catch (jsonParseError) {
                                    console.error(`Error parsing JSON from zip for ${zipJson.name}:`, jsonParseError);
                                    filesFailedCount++;
                                    statusMessage.textContent = `Error: Invalid JSON in zip for ${zipJson.name}.`;
                                    statusMessage.classList.remove('text-muted', 'text-success');
                                    statusMessage.classList.add('text-danger');
                                }
                            }).catch(error => {
                                console.error(`Error reading files from zip ${zipFile.name}:`, error);
                                filesFailedCount++;
                                statusMessage.textContent = `Error: Could not read files from zip ${zipFile.name}.`;
                                statusMessage.classList.remove('text-muted', 'text-success');
                                statusMessage.classList.add('text-danger');
                            }).finally(() => {
                                filesProcessedTotal++; // Count zip file as processed regardless of success/failure for progress bar
                                processedZipCount++;
                                if (processedZipCount === zipFiles.length) {
                                    resolve();
                                }
                            });
                        } else {
                            console.warn(`Zip file '${zipFile.name}' does not contain both an image and a JSON.`);
                            filesFailedCount++;
                            filesProcessedTotal++; // Count zip file as processed (failed)
                            processedZipCount++;
                            if (processedZipCount === zipFiles.length) {
                                resolve();
                            }
                            statusMessage.textContent = `Warning: Zip ${zipFile.name} missing image/JSON.`;
                            statusMessage.classList.remove('text-muted', 'text-success');
                            statusMessage.classList.add('text-danger');
                        }
                    }).catch(function (error) {
                        console.error(`Error loading zip file ${zipFile.name}:`, error);
                        filesFailedCount++;
                        filesProcessedTotal++; // Count zip file as processed (failed)
                        processedZipCount++;
                        if (processedZipCount === zipFiles.length) {
                            resolve();
                        }
                        statusMessage.textContent = `Error: Could not load zip ${zipFile.name}.`;
                        statusMessage.classList.remove('text-muted', 'text-success');
                        statusMessage.classList.add('text-danger');
                    });
                };
                reader.onerror = (e) => {
                    console.error(`Error reading zip file ${zipFile.name}:`, e);
                    filesFailedCount++;
                    filesProcessedTotal++; // Count zip file as processed (failed)
                    processedZipCount++;
                    if (processedZipCount === zipFiles.length) {
                        resolve();
                    }
                    statusMessage.textContent = `Error: Could not read zip ${zipFile.name}.`;
                    statusMessage.classList.remove('text-muted', 'text-success');
                    statusMessage.classList.add('text-danger');
                };
                reader.readAsArrayBuffer(zipFile); // Read zip as ArrayBuffer
            });
        });
    };

    // Start by processing zip files, then standalone JSONs, then standalone images
    processZipFiles().then(() => {
        return new Promise(resolve => {
            if (jsonFiles.length === 0) {
                resolve();
                return;
            }

            let processedJsonCount = 0;
            jsonFiles.forEach(jsonFile => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const georefData = JSON.parse(e.target.result);
                        if (georefData.originalFileName && georefData.corners && georefData.opacity !== undefined) {
                            pendingGeorefData[georefData.originalFileName] = {
                                corners: georefData.corners.map(c => L.latLng(c.lat, c.lng)), // Convert back to L.LatLng
                                opacity: georefData.opacity
                            };
                            console.log(`Loaded georef data for: ${georefData.originalFileName} from JSON: ${jsonFile.name}`);
                            statusMessage.textContent = `Loaded georef data for ${georefData.originalFileName}...`;
                        } else {
                            console.warn(`Invalid georef JSON format for ${jsonFile.name}`);
                            filesFailedCount++;
                            statusMessage.textContent = `Error: Invalid JSON format for ${jsonFile.name}`;
                            statusMessage.classList.remove('text-muted', 'text-success');
                            statusMessage.classList.add('text-danger');
                        }
                    } catch (jsonError) {
                        console.error(`Error parsing JSON file ${jsonFile.name}:`, jsonError);
                        filesFailedCount++;
                        statusMessage.textContent = `Error: Could not parse JSON for ${jsonFile.name}`;
                        statusMessage.classList.remove('text-muted', 'text-success');
                        statusMessage.classList.add('text-danger');
                    } finally {
                        processedJsonCount++;
                        if (processedJsonCount === jsonFiles.length) {
                            resolve();
                        }
                    }
                };
                reader.onerror = (e) => {
                    console.error(`Error reading JSON file ${jsonFile.name}:`, e);
                    filesFailedCount++;
                    statusMessage.textContent = `Error: Could not read JSON for ${jsonFile.name}`;
                    statusMessage.classList.remove('text-muted', 'text-success');
                    statusMessage.classList.add('text-danger');
                    processedJsonCount++;
                    if (processedJsonCount === jsonFiles.length) {
                        resolve();
                    }
                };
                reader.readAsText(jsonFile);
            });
        });
    }).then(() => {
        let currentImageIndex = 0;
        const totalImages = imageFiles.length;

        const processNextImage = () => {
            if (currentImageIndex < totalImages) {
                const imageFile = imageFiles[currentImageIndex];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const originalFileName = imageFile.name;
                    const georef = pendingGeorefData[originalFileName]; // Check for matching JSON data
                    addImageOverlay(e.target.result, originalFileName, georef);

                    if (georef) {
                        delete pendingGeorefData[originalFileName]; // Remove consumed JSON data
                        statusMessage.textContent = `Placed image '${originalFileName}' using georef data.`;
                    } else {
                        statusMessage.textContent = `Placed image '${originalFileName}' (no georef found).`;
                    }
                    statusMessage.classList.remove('text-danger', 'text-success');
                    statusMessage.classList.add('text-muted');

                    filesProcessedTotal++;
                    updateProgressDisplay();
                    currentImageIndex++;
                    processNextImage();
                };
                reader.onerror = (e) => {
                    console.error(`Error reading image file ${imageFile.name}:`, e);
                    filesFailedCount++;
                    filesProcessedTotal++;
                    statusMessage.textContent = `Error: Failed to read image ${imageFile.name}.`;
                    statusMessage.classList.remove('text-muted', 'text-success');
                    statusMessage.classList.add('text-danger');
                    updateProgressDisplay();
                    currentImageIndex++;
                    processNextImage();
                };
                reader.readAsDataURL(imageFile);
            } else {
                // All images processed.
                // Check for any leftover JSONs that didn't find a match.
                for (const fileName in pendingGeorefData) {
                    console.warn(`Georeference JSON for '${fileName}' loaded, but no matching image file was processed.`);
                    filesFailedCount++; // Consider unmatched JSONs as failures for final status
                }
                updateProgressDisplay(true); // Final update for the progress bar and status message
            }
        };

        processNextImage(); // Start processing images
    });

    function updateProgressDisplay(final = false) {
        const completed = filesProcessedTotal;
        // If no files to process, percentage should be 0, not NaN or Infinity
        const percentage = totalFilesToProcess > 0 ? Math.round((completed / totalFilesToProcess) * 100) : 0;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;

        if (final) {
            if (filesFailedCount > 0) {
                statusMessage.textContent = `Finished processing. ${totalFilesToProcess - filesFailedCount} succeeded, ${filesFailedCount} failed.`;
                statusMessage.classList.remove('text-muted', 'text-success');
                statusMessage.classList.add('text-danger');
            } else {
                statusMessage.textContent = `All ${totalFilesToProcess} files processed successfully.`;
                statusMessage.classList.remove('text-muted', 'text-danger');
                statusMessage.classList.add('text-success');
            }
            setTimeout(() => progressContainer.classList.add('d-none'), 1000);
        } else if (filesProcessedTotal < totalFilesToProcess) {
            // Update generic processing message while still working, remove specific image name as it can be null
            statusMessage.textContent = `Processing files... (${completed}/${totalFilesToProcess})`;
        }

        if (filesFailedCount > 0) {
            progressBar.style.backgroundColor = '#dc3545'; // Red for failures
        } else if (completed === totalFilesToProcess && filesFailedCount === 0) {
            progressBar.style.backgroundColor = '#198754'; // Green for success
        } else {
            progressBar.style.backgroundColor = '#0d6efd'; // Blue for in-progress
        }
    }
}

/**
 * Handles image upload from a URL. Fetches the image and converts it to a data URL.
 * Calls to addImageToList have been removed.
 */
async function handleUrlUpload() {
    const imageUrlInput = document.getElementById('image-url-input');
    const url = imageUrlInput.value.trim();
    const statusMessage = document.getElementById('status-message');
    const progressContainer = document.getElementById('progress-container');

    progressContainer.classList.add('d-none');

    if (!url) {
        statusMessage.textContent = 'Please enter a valid image URL.';
        statusMessage.classList.remove('text-muted', 'text-success');
        statusMessage.classList.add('text-danger');
        return;
    }

    statusMessage.textContent = 'Uploading image from URL...';
    statusMessage.classList.remove('text-danger', 'text-success');
    statusMessage.classList.add('text-muted');

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();

        if (!blob.type.startsWith('image/')) {
            throw new Error('The provided URL does not point to an image file.');
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const fileName = url.substring(url.lastIndexOf('/') + 1).split('?')[0].split('#')[0] || `url_image_${Date.now()}.png`;
            addImageOverlay(e.target.result, fileName, null); // No georef data from URL upload
            statusMessage.textContent = `Image from URL "${fileName}" uploaded successfully.`;
            statusMessage.classList.remove('text-muted', 'text-danger');
            statusMessage.classList.add('text-success');
            imageUrlInput.value = '';
        };
        reader.onerror = (e) => {
            console.error('Error converting URL image to data URL:', e);
            statusMessage.textContent = 'Error processing image from URL. Could not convert to data URL.';
            statusMessage.classList.remove('text-muted', 'text-success');
            statusMessage.classList.add('text-danger');
        };
        reader.readAsDataURL(blob);

    } catch (error) {
        console.error('Error fetching image from URL:', error);
        statusMessage.textContent = `Failed to fetch image from URL: ${error.message}`;
        statusMessage.classList.remove('text-muted', 'text-success');
        statusMessage.classList.add('text-danger');
    }
}

/**
 * Adds an image as a Leaflet image overlay to the map.
 * If an image with the same name exists, it replaces it.
 * Calls to addImageToList have been removed.
 * @param {string} dataUrl - The data URL of the image.
 * @param {string} originalFileName - The original name of the image file.
 * @param {object|null} georefData - Optional object containing {corners: L.LatLng[], opacity: number} for placement.
 */
function addImageOverlay(dataUrl, originalFileName, georefData) {
    const img = new Image();
    img.onload = () => {
        // If an image with the same originalFileName already exists, remove it first to replace
        if (overlaidImagesData[originalFileName]) {
            const existingData = overlaidImagesData[originalFileName];
            // Attempt to remove from layerswitcher first
            if (existingData.currentLayerRef) {
                try {
                    layerswitcher.removeLayer(existingData.currentLayerRef);
                } catch (e) {
                    console.warn("Could not remove old layer from layerswitcher during addImageOverlay (pre-replacement):", e);
                }
                // Then remove from map if it's still there
                if (map.hasLayer(existingData.currentLayerRef)) {
                    map.removeLayer(existingData.currentLayerRef);
                }
            }
            // Removed: document.getElementById(existingData.elementId)?.remove();
            delete overlaidImagesData[originalFileName];
            console.log(`Overwriting existing image: ${originalFileName}`);
        }

        let bounds;
        let initialOpacity = 1.0;

        if (georefData && georefData.corners && georefData.corners.length === 4) {
            // Use corners from georefData for placement
            const lats = georefData.corners.map(c => c.lat);
            const lngs = georefData.corners.map(c => c.lng);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            bounds = L.latLngBounds([minLat, minLng], [maxLat, maxLng]);

            initialOpacity = georefData.opacity !== undefined ? georefData.opacity : 1.0;
            console.log(`Placing '${originalFileName}' using georeferenced corners from JSON.`);
        } else {
            // Fallback to current map center based on image aspect ratio
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const mapCenter = map.getCenter();
            const mapPixelSize = map.getSize();
            const targetDimension = Math.min(mapPixelSize.x, mapPixelSize.y) * 0.3;

            let targetImagePixelWidth;
            let targetImagePixelHeight;

            if (aspectRatio >= 1) {
                targetImagePixelWidth = targetDimension;
                targetImagePixelHeight = targetDimension / aspectRatio;
            } else {
                targetImagePixelHeight = targetDimension;
                targetImagePixelWidth = targetDimension * aspectRatio;
            }

            const centerPixel = map.latLngToContainerPoint(mapCenter);
            const topLeftPixel = L.point(
                centerPixel.x - targetImagePixelWidth / 2,
                centerPixel.y - targetImagePixelHeight / 2
            );
            const bottomRightPixel = L.point(
                centerPixel.x + targetImagePixelWidth / 2,
                centerPixel.y + targetImagePixelHeight / 2
            );

            const northWest = map.containerPointToLatLng(topLeftPixel);
            const southEast = map.containerPointToLatLng(bottomRightPixel);
            bounds = L.latLngBounds(northWest, southEast);
            console.log(`Placing '${originalFileName}' using default map center fallback.`);
        }

        const initialOverlayOptions = {
            bounds: bounds,
            opacity: initialOpacity,
            interactive: true,
            actions: [
                L.BorderAction,
                L.DeleteAction,
                L.DistortAction,
                L.DragAction,
                L.FreeRotateAction,
                L.LockAction,
                L.OpacityAction,
                L.RotateAction,
                L.ScaleAction,
                L.RestoreAction,
                L.StackAction,
                L.ExportAction,
            ]
        };
        // If georefData was provided, specifically set the 'corners' option for DistortableImage
        // This is crucial for its distortion to be correctly applied from JSON.
        if (georefData && georefData.corners && georefData.corners.length === 4) {
            initialOverlayOptions.corners = georefData.corners;
        }

        const initialOverlay = new L.DistortableImageOverlay(dataUrl, initialOverlayOptions);

        // Attach the originalFileName to the layer instance for robust identification
        initialOverlay._originalFileName = originalFileName;
        // Ensure the `export` method is present on this new instance
        if (typeof initialOverlay.export !== 'function') {
            // Define a custom export method if the library didn't provide it
            initialOverlay.export = function() {
                return new Promise((resolve, reject) => {
                    if (this.getElement()) { // Ensure image element is in DOM
                        html2canvas(this.getElement(), {
                            backgroundColor: null,
                            useCORS: true,
                            allowTaint: true,
                            scale: 1, // Default scale
                        }).then(resolve).catch(reject);
                    } else {
                        reject(new Error("Image element not found on overlay for html2canvas export."));
                    }
                });
            };
        }
        const elementId = `image-row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const uniqueInstanceId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        const layerControlDisplayName = `${originalFileName} (${uniqueInstanceId.substring(0, 5)})`;

        overlaidImagesData[originalFileName] = {
            dataUrl: dataUrl,
            type: 'distortable', // Explicitly set type
            lastKnownState: initialOverlay.getCorners(),
            lastKnownOpacity: initialOverlay.options.opacity,
            elementId: elementId,
            currentLayerRef: initialOverlay,
            layerControlDisplayName: layerControlDisplayName
        };
        initialOverlay.addTo(map);
        layerswitcher.addOverlay(initialOverlay, layerControlDisplayName);
        // Removed: addImageToList(originalFileName, elementId);
    };
    img.onerror = () => {
        console.error(`Failed to load image: ${originalFileName}. It might be corrupted or URL is invalid.`);
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = `Failed to load image: ${originalFileName}. Check console for details.`;
        statusMessage.classList.remove('text-success', 'text-muted');
        statusMessage.classList.add('text-danger');

        // For a failed image load, we still create a placeholder entry for consistency,
        // but the overlay itself might not render or be interactive.
        const mapCenter = map.getCenter();
        const fallbackBounds = [
            [mapCenter.lat - 0.02, mapCenter.lng - 0.02],
            [mapCenter.lat + 0.02, mapCenter.lng + 0.02]
        ];

        const initialOverlayOptions = {
            bounds: fallbackBounds,
            opacity: 1.0,
            interactive: true,
            actions: [
                L.BorderAction,
                L.DeleteAction,
                L.DistortAction,
                L.DragAction,
                L.FreeRotateAction,
                L.LockAction,
                L.OpacityAction,
                L.RotateAction,
                L.ScaleAction,
                L.RestoreAction,
                L.StackAction,
                L.ExportAction,
            ]
        };
        // If georefData was available even for a failed image load, still try to set corners
        if (georefData && georefData.corners && georefData.corners.length === 4) {
            initialOverlayOptions.corners = georefData.corners;
        }
        const initialOverlay = new L.DistortableImageOverlay(dataUrl, initialOverlayOptions);
        initialOverlay._originalFileName = originalFileName;

        // Ensure the `export` method is present on this instance for fallback too
        if (typeof initialOverlay.export !== 'function') {
            initialOverlay.export = function() {
                return new Promise((resolve, reject) => {
                    if (this.getElement()) { // Ensure image element is in DOM
                        html2canvas(this.getElement(), {
                            backgroundColor: null,
                            useCORS: true,
                            allowTaint: true,
                            scale: 1, // Default scale
                        }).then(resolve).catch(reject);
                    } else {
                        reject(new Error("Image element not found on overlay for html2canvas export."));
                    }
                });
            };
        }
        const elementId = `image-row-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const uniqueInstanceId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        const layerControlDisplayName = `${originalFileName} (Broken - ${uniqueInstanceId.substring(0, 5)})`; // Indicate broken
        overlaidImagesData[originalFileName] = {
            dataUrl: dataUrl,
            type: 'distortable', // Explicitly set type
            lastKnownState: initialOverlay.getCorners(),
            lastKnownOpacity: initialOverlay.options.opacity,
            elementId: elementId,
            currentLayerRef: initialOverlay,
            layerControlDisplayName: layerControlDisplayName
        };
        initialOverlay.addTo(map);
        layerswitcher.addOverlay(initialOverlay, layerControlDisplayName);
        // Removed: addImageToList(originalFileName, elementId);
    };
    img.src = dataUrl;
}