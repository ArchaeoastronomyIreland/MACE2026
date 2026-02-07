/**
 * Stellarium Image-Based Horizon Export
 * Exports hillshade panorama to Stellarium format with 2048x1024 PNG image
 * 
 * Dependencies:
 * - window.HC_profileData: Array of profile data points
 * - window.JSZip: JSZip library for ZIP file creation
 * - window.HC_gazetteerPoints: Array of gazetteer points (optional)
 */

(function() {
    'use strict';

    /**
     * Render hillshade panorama to canvas for Stellarium export
     * Creates 2048x1024 image with horizon centered at y=512
     * Sky area above horizon is transparent
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} w - Canvas width (2048)
     * @param {number} h - Canvas height (1024)
     * @param {Array} profileData - Profile data array
     * @param {number} horizonY - Y position of horizon line (512 for centered)
     * @param {number} pxPerDegY - Pixels per degree vertically
     */
    function renderStellariumHillshade(ctx, w, h, profileData, horizonY, pxPerDegY) {
        // Fill entire canvas with transparent background (for sky transparency)
        ctx.clearRect(0, 0, w, h);
        
        // Fill sky area above horizon with transparent (already clear, but explicit)
        // Fill area below horizon with sky blue as base (will be covered by terrain)
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, horizonY, w, h - horizonY);
        
        // CRITICAL: Match horizon.txt exactly - profileData is already sorted by azimuth starting at 0°
        // horizon.txt lists points in profileData order (profileData[0] has pt.x ≈ 0°, profileData[length-1] has pt.x ≈ 360°)
        // Therefore: Pixel x=0 MUST map to profileData[0] (azimuth 0° = North)
        // Map pixels directly to profileData indices based on proportional position
        // This ensures pixel 0 maps to azimuth 0° (North), matching horizon.txt
        
        // Render full 360-degree panorama
        for (let x = 0; x < w; x++) {
            // Map pixel x (0 to w-1) directly to profileData index (0 to profileData.length-1)
            // This ensures pixel 0 maps to profileData[0] (azimuth 0° = North)
            const dataIndex = Math.round((x / w) * profileData.length) % profileData.length;
            const pt = profileData[dataIndex];
            
            if (!pt) continue;
            
            // Draw hillshade segments if available
            if (pt.segments && Array.isArray(pt.segments)) {
                pt.segments.forEach(seg => {
                    if (!seg || typeof seg.top !== 'number' || typeof seg.bottom !== 'number') return;
                    
                    const yTop = horizonY - (seg.top * pxPerDegY);
                    const yBottom = horizonY - (seg.bottom * pxPerDegY);
                    
                    // Draw segment - clamp to canvas bounds
                    // Can be above or below horizon (0 degrees)
                    const drawTop = Math.max(0, Math.min(yTop, h));
                    const drawBottom = Math.max(0, Math.min(yBottom, h));
                    const drawHeight = Math.abs(drawBottom - drawTop);
                    
                    if (drawHeight > 0) {
                        ctx.fillStyle = seg.color || 'rgb(100,100,100)';
                        // Use 1.5 pixel width to overlap slightly (prevent moiré pattern)
                        ctx.fillRect(x, Math.min(drawTop, drawBottom), 1.5, drawHeight);
                    }
                });
            } else {
                // Fallback: draw single altitude line
                if (typeof pt.y === 'number' && !isNaN(pt.y)) {
                    // pt.y is altitude in degrees (0 = horizon, positive = above, negative = below)
                    const yPos = horizonY - (pt.y * pxPerDegY);
                    
                    // Draw from horizon down to this altitude (or to bottom if below horizon)
                    const drawTop = Math.max(0, Math.min(Math.min(yPos, horizonY), h));
                    const drawBottom = Math.max(0, Math.min(Math.max(yPos, horizonY), h));
                    const drawHeight = Math.max(1, Math.abs(drawBottom - drawTop));
                    ctx.fillStyle = 'rgb(100,100,100)';
                    ctx.fillRect(x, Math.min(drawTop, drawBottom), 1.5, drawHeight);
                }
            }
        }
        
        // Ground shimming: Use bottom pixel row of rendered terrain to fill down to canvas bottom
        // This matches the photographic horizon process where ground is extended downward
        // For each x column, find the lowest rendered terrain pixel and use its color to fill down
        
        // Get image data to read pixel colors
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixelData = imageData.data;
        
        // Find the lowest terrain pixel for each x column and fill down
        for (let x = 0; x < w; x++) {
            // Find lowest non-transparent pixel in this column (starting from horizon downward)
            let lowestY = h; // Start at bottom
            for (let y = Math.floor(horizonY); y < h; y++) {
                const idx = (y * w + x) * 4;
                const alpha = pixelData[idx + 3];
                // If pixel has content (alpha > 0), this is terrain
                if (alpha > 0) {
                    lowestY = y;
                }
            }
            
            // If we found terrain, use the bottom pixel color to fill down to canvas bottom
            if (lowestY < h - 1) {
                const srcIdx = (lowestY * w + x) * 4;
                const r = pixelData[srcIdx];
                const g = pixelData[srcIdx + 1];
                const b = pixelData[srcIdx + 2];
                const a = pixelData[srcIdx + 3];
                
                // Fill from lowest terrain pixel down to bottom
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
                ctx.fillRect(x, lowestY + 1, 1, h - lowestY - 1);
            }
        }
    }

    /**
     * Generate 2048x1024 PNG image from hillshade panorama for Stellarium
     * @param {Array} profileData - Profile data array
     * @returns {Promise<Blob>} - PNG image blob
     */
    function generateStellariumImage(profileData) {
        return new Promise((resolve, reject) => {
            try {
                const exportCanvas = document.createElement('canvas');
                const STELLARIUM_WIDTH = 2048;
                const STELLARIUM_HEIGHT = 1024;
                const STELLARIUM_CENTER_Y = 512; // Center of canvas (horizon line position)
                
                exportCanvas.width = STELLARIUM_WIDTH;
                exportCanvas.height = STELLARIUM_HEIGHT;
                
                const ctx = exportCanvas.getContext('2d', { 
                    willReadFrequently: false,
                    alpha: true
                });
                
                // Clear canvas (transparent background)
                ctx.clearRect(0, 0, STELLARIUM_WIDTH, STELLARIUM_HEIGHT);
                
                // CRITICAL: Horizon MUST be at center (y=512) for Stellarium spherical landscape format
                // This is a requirement - Stellarium expects the horizon to be vertically centered
                const horizonY = STELLARIUM_CENTER_Y; // 512 - FIXED position
                
                // Calculate vertical scaling for Stellarium equirectangular format
                // CRITICAL: For equirectangular projection, Stellarium expects:
                // - Image height (1024px) represents 180 degrees (full sphere: zenith to nadir)
                // - Therefore: pxPerDegY = 1024 / 180 = 5.69 pixels per degree
                // This is DIFFERENT from display panorama scale, but necessary for correct equirectangular rendering
                // Using display scale (~40 px/degree) causes massive Y-axis exaggeration
                // Using equirectangular scale (5.69 px/degree) ensures proper alignment with Stellarium's coordinate system
                const pxPerDegY = STELLARIUM_HEIGHT / 180; // ~5.69 pixels per degree (equirectangular format)
                
                console.log(`[STELLARIUM EXPORT] Canvas: ${STELLARIUM_WIDTH}x${STELLARIUM_HEIGHT}`);
                console.log(`[STELLARIUM EXPORT] pxPerDegY: ${pxPerDegY.toFixed(4)} pixels/degree (equirectangular: height/180)`);
                console.log(`[STELLARIUM EXPORT] Horizon Y: ${horizonY} (FIXED at center)`);
                console.log(`[STELLARIUM EXPORT] Note: Using equirectangular scale (${pxPerDegY.toFixed(2)} px/deg) not display scale (~40 px/deg)`);
                console.log(`[STELLARIUM EXPORT] This ensures proper alignment with Stellarium's coordinate system and horizon.txt`);
                
                // Render hillshade panorama - horizon at center (y=512)
                renderStellariumHillshade(ctx, STELLARIUM_WIDTH, STELLARIUM_HEIGHT, profileData, horizonY, pxPerDegY);
                
                // Convert canvas to PNG blob
                exportCanvas.toBlob(function(blob) {
                    if (!blob) {
                        reject(new Error('Failed to create PNG blob from canvas'));
                        return;
                    }
                    resolve(blob);
                }, 'image/png', 1.0);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Open export panel for hillshade Stellarium export
     * This function is called from the Export Stellarium button
     */
    window.HC_openStellariumExportModal = function(panoramaType) {
        console.log('[STELLARIUM EXPORT] HC_openStellariumExportModal called with:', panoramaType);
        
        try {
            // Store the panorama type for later use
            window.HC_currentStellariumExportType = panoramaType;
            
            // Minimize horizon results panel so map is visible - CRITICAL
            const resultsPanel = $('#hc-results-panel');
            console.log('[STELLARIUM EXPORT] Results panel found:', resultsPanel.length > 0);
            
            if (resultsPanel.length) {
                resultsPanel.removeClass('expanded');
                resultsPanel.addClass('minimized');
                resultsPanel.css('display', 'flex');
                $('#icon-toggle').attr('class', 'fa fa-window-maximize');
                console.log('[STELLARIUM EXPORT] Horizon results panel minimized');
            } else {
                console.error('[STELLARIUM EXPORT] Results panel not found!');
            }
            
            // Show export panel (single floating panel, not modal)
            const exportPanel = $('#hc-stellarium-export-panel');
            console.log('[STELLARIUM EXPORT] Export panel found:', exportPanel.length > 0);
            
            if (exportPanel.length) {
                exportPanel.css({
                    'display': 'block',
                    'z-index': '1002'
                }).show();
                console.log('[STELLARIUM EXPORT] Export panel shown');
            } else {
                console.error('[STELLARIUM EXPORT] Export panel not found!');
            }
            
            // Update button text based on gazetteer checkbox
            $('#hc-export-gazetteer').off('change').on('change', function() {
                $('#hc-btn-proceed-export').text($(this).is(':checked') ? "Start Gazetteer Picking" : "Save Zip");
            });
            $('#hc-btn-proceed-export').text($('#hc-export-gazetteer').is(':checked') ? "Start Gazetteer Picking" : "Save Zip");
            
            console.log('[STELLARIUM EXPORT] Function completed successfully');
        } catch (error) {
            console.error('[STELLARIUM EXPORT] Error in HC_openStellariumExportModal:', error);
            alert('Error opening export panel: ' + error.message);
        }
    };

    /**
     * Run hillshade Stellarium export (called after modal confirmation)
     */
    window.HC_runHillshadeStellariumExport = function() {
        // Get metadata from modal - access variables via window getters
        const marker = window.HC_marker;
        const cachedParams = window.HC_cachedParams;
        const gazetteerPoints = window.HC_gazetteerPoints;
        
        // Get author and append attribution
        let author = $('#hc-export-author').val() || "Unknown";
        author += " via MACE by Brian Doyle - Archaeoastronomy Ireland";
        
        // Get description
        const description = $('#hc-export-description').val() || "";
        
        const meta = {
            name: $('#hc-export-name').val() || "Horizon",
            author: author,
            description: description,
            lat: marker ? marker.getLatLng().lat : 0,
            lng: marker ? marker.getLatLng().lng : 0,
            elev: cachedParams ? (cachedParams.height || 0) : 0
        };

        // Call the export function
        if (window.HC_exportHillshadeStellarium) {
            window.HC_exportHillshadeStellarium(meta, gazetteerPoints);
        } else {
            alert("Stellarium export function not loaded.");
        }
    };

    /**
     * Export hillshade panorama to Stellarium format
     * Creates ZIP file with landscape.ini, horizon_image.png, horizon.txt, and optional gazetteer.txt
     * @param {Object} meta - Metadata object with name, author, lat, lng, elev
     * @param {Array} gazetteerPoints - Optional array of gazetteer points
     */
    window.HC_exportHillshadeStellarium = function(meta, gazetteerPoints) {
        if (!window.JSZip) {
            alert("JSZip library not found. Please ensure it is included.");
            return;
        }

        // Get profile data
        let profileData;
        try {
            profileData = window.HC_profileData;
            if (!Array.isArray(profileData) || profileData.length === 0) {
                alert('No horizon profile data available. Please run a horizon calculation first.');
                return;
            }
        } catch (e) {
            console.error('Error accessing HC_profileData:', e);
            alert('Error accessing profile data. Please run a horizon calculation first.');
            return;
        }

        // Show progress message
        console.log('Starting Stellarium image-based export...');

        // Generate image first
        generateStellariumImage(profileData)
            .then(function(imageBlob) {
                console.log('Image generated, creating ZIP...');
                
                const zip = new JSZip();
                const safeName = meta.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const folder = zip.folder(safeName);

                // 1. Add PNG image
                folder.file("horizon_image.png", imageBlob);

                // 2. Generate landscape.ini
                // Build description - use custom description if provided, otherwise use default
                let desc = meta.description;
                if (!desc || desc.trim() === "") {
                    desc = `Generated by Horizon Profiler at Lat: ${meta.lat.toFixed(5)}, Lng: ${meta.lng.toFixed(5)}, Elev: ${Math.round(meta.elev)}m`;
                }
                
                // Build INI content - include gazetteer reference if gazetteer points exist
                let iniContent = `[landscape]
name = ${meta.name}
type = spherical
author = ${meta.author}
description = ${desc}
maptex = horizon_image.png
polygonal_horizon_list = horizon.txt
polygonal_horizon_list_mode = azDeg_altDeg
horizon_line_color = 0.0, 0.99, 0.99
angle_rotatez = -90
`;
                
                // Add gazetteer reference if gazetteer points are provided
                // Stellarium requires format: gazetteer.<LANG>.utf8 (e.g., gazetteer.en.utf8)
                if (gazetteerPoints && gazetteerPoints.length > 0) {
                    iniContent += `gazetteer = gazetteer.en.utf8
`;
                }
                
                iniContent += `
[location]
planet = Earth
latitude = ${meta.lat}
longitude = ${meta.lng}
altitude = ${Math.round(meta.elev)}
`;
                folder.file("landscape.ini", iniContent);

                // 3. Generate horizon.txt (azimuth altitude pairs)
                let horizonStr = "";
                if (profileData && profileData.length > 0) {
                    profileData.forEach(pt => {
                        if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
                            horizonStr += `${pt.x.toFixed(4)} ${pt.y.toFixed(4)}\n`;
                        }
                    });
                }
                folder.file("horizon.txt", horizonStr);

                // 4. Generate gazetteer.en.utf8 if points provided
                // Stellarium requires filename format: gazetteer.<LANG>.utf8
                // Using English (en) as default language code
                // Stellarium format: Azimuth | Altitude | Degrees Towards Zenith | Azimuth Shift | Label
                if (gazetteerPoints && gazetteerPoints.length > 0) {
                    let gazStr = "";
                    gazetteerPoints.forEach(pt => {
                        if (pt && typeof pt.az === 'number' && typeof pt.alt === 'number' && pt.label) {
                            // Format: Azimuth | Altitude | Degrees Towards Zenith | Azimuth Shift | Label
                            // Use stored bump values or defaults
                            const bumpVertical = pt.bumpVertical !== undefined ? pt.bumpVertical : 4;
                            const bumpHorizontal = pt.bumpHorizontal !== undefined ? pt.bumpHorizontal : 0;
                            gazStr += `${pt.az.toFixed(4)} | ${pt.alt.toFixed(4)} | ${bumpVertical} | ${bumpHorizontal} | ${pt.label}\n`;
                        }
                    });
                    if (gazStr) {
                        // Use correct Stellarium filename format: gazetteer.en.utf8
                        // JSZip automatically handles UTF-8 encoding for text files
                        folder.file("gazetteer.en.utf8", gazStr);
                    }
                }

                // 5. Generate and download ZIP
                return zip.generateAsync({type: "blob"});
            })
            .then(function(zipBlob) {
                const a = document.createElement("a");
                const safeName = meta.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                a.href = URL.createObjectURL(zipBlob);
                a.download = `${safeName}_stellarium.zip`;
                a.style.display = "none";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(a.href), 100);
                console.log('Stellarium export complete!');
            })
            .catch(function(err) {
                console.error("Error generating Stellarium export:", err);
                alert("Failed to generate Stellarium export: " + err.message);
            });
    };

})();

