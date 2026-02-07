/**
 * Horizon Panorama Image Export
 * Handles exporting full 360-degree panorama images as PNG
 * 
 * Dependencies:
 * - window.HC_profileData: Array of profile data points
 * - window.HC_showRiseSetLocations: Boolean flag for showing rise/set locations
 * - window.HC_getRiseSetLocations: Function to get rise/set location data
 */

(function() {
    'use strict';

    /**
     * Draw overlays on panorama canvas (compass directions, rise/set locations)
     * Replicated from horizon.js for export functionality
     */
    function drawOverlaysForExport(ctx, w, h, fov, pxPerDegX, currentBearing, horizonY, pxPerDegY, currentProfileData, maxAltitude) {
        // Note: Compass direction markers (N, S, etc.) are not drawn in export as per user request
        
        // Draw rise/set location dots and labels if available
        // Always draw rise/set locations in export if they exist (ignore toggle state)
        if (typeof window.HC_getRiseSetLocations === 'function') {
            try {
                const riseSetLocations = window.HC_getRiseSetLocations();
                if (!riseSetLocations || riseSetLocations.length === 0) {
                    // No locations available - exit silently (this is normal if calculations haven't been run)
                    return;
                }
            
            // Filter to only show labels for "Center" events
            const centerLocations = riseSetLocations.filter(loc => 
                loc.label.toLowerCase().includes('center') && 
                !loc.label.toLowerCase().includes('upper') && 
                !loc.label.toLowerCase().includes('lower')
            );
            
            // Constants for sun/moon size
            const SOLAR_SEMIDIAMETER = 0.266; // degrees
            const LUNAR_SEMIDIAMETER = 0.272; // degrees
            const SOLAR_DIAMETER = SOLAR_SEMIDIAMETER * 2;
            const LUNAR_DIAMETER = LUNAR_SEMIDIAMETER * 2;
            
            // Determine if event is lunar from label
            const isLunarEvent = (label) => {
                const lowerLabel = label.toLowerCase();
                return lowerLabel.includes('lunar') || lowerLabel.includes('major') || 
                       lowerLabel.includes('minor') || lowerLabel.includes('nmlr') || 
                       lowerLabel.includes('smlr') || lowerLabel.includes('nmls') || 
                       lowerLabel.includes('smnls') || lowerLabel.includes('nmnlr') || 
                       lowerLabel.includes('smnlr') || lowerLabel.includes('nmnls') || 
                       lowerLabel.includes('smnls');
            };
            
            // Draw all locations as color-coded dots
            // For full 360-degree export, ALL locations are visible (no FOV filtering)
            riseSetLocations.forEach((loc, idx) => {
                // Ensure we have azimuth data
                if (loc.azimuth === undefined || isNaN(loc.azimuth)) {
                    return; // Skip locations without valid azimuth
                }
                
                // For full 360-degree export, map azimuth (0-360) directly to x position
                // x=0 corresponds to azimuth 0°, x=w corresponds to azimuth 360° (which equals 0°)
                const normalizedAzimuth = ((loc.azimuth % 360) + 360) % 360; // Ensure 0-360 range
                const x = (normalizedAzimuth / 360) * w;
                
                // Find the altitude at this azimuth from the profile data
                let altitude = 0;
                if (currentProfileData && currentProfileData.length > 0) {
                    const dataRes = 360 / currentProfileData.length;
                    const index = Math.round(loc.azimuth / dataRes) % currentProfileData.length;
                    if (currentProfileData[index]) {
                        altitude = currentProfileData[index].y || 0;
                    }
                }
                
                // Determine marker type from label
                const lowerLabel = loc.label.toLowerCase();
                const isLowerLimb = lowerLabel.includes('lower limb');
                const isUpperLimb = lowerLabel.includes('upper limb');
                const isCenter = lowerLabel.includes('center') && !isLowerLimb && !isUpperLimb;
                
                // Determine if this is a rise or set event
                const isRise = lowerLabel.includes('ssr') || lowerLabel.includes('wsr') || 
                               lowerLabel.includes(' er ') || lowerLabel.includes('er ') || 
                               lowerLabel.startsWith('er ') || lowerLabel.includes('ncqr') || 
                               lowerLabel.includes('scqr') || lowerLabel.includes('nmlr') || 
                               lowerLabel.includes('smlr') || lowerLabel.includes('nmnlr') || 
                               lowerLabel.includes('smnlr') || lowerLabel.includes('rise');
                const isSet = lowerLabel.includes('sss') || lowerLabel.includes('wss') || 
                              lowerLabel.includes(' es ') || lowerLabel.includes('es ') || 
                              lowerLabel.startsWith('es ') || lowerLabel.includes('ncqs') || 
                              lowerLabel.includes('scqs') || lowerLabel.includes('nmls') || 
                              lowerLabel.includes('smls') || lowerLabel.includes('nmnls') || 
                              lowerLabel.includes('smnls') || lowerLabel.includes('set');
                
                // Color coding based on event type
                let dotColor = '#FF0000'; // Default red
                if (isRise) {
                    if (isLowerLimb) dotColor = '#FF6B6B'; // Light red for lower limb rise
                    else if (isUpperLimb) dotColor = '#FFB84D'; // Orange for upper limb rise
                    else if (isCenter) dotColor = '#FFD700'; // Gold for center rise
                } else if (isSet) {
                    if (isLowerLimb) dotColor = '#4ECDC4'; // Teal for lower limb set
                    else if (isUpperLimb) dotColor = '#45B7D1'; // Blue for upper limb set
                    else if (isCenter) dotColor = '#3498DB'; // Dark blue for center set
                }
                
                // Calculate marker size based on sun/moon diameter
                // Use same constants and calculation as display (horizon.js line 2092-2093)
                const diameter = isLunarEvent(loc.label) ? LUNAR_DIAMETER : SOLAR_DIAMETER;
                // Convert angular diameter (degrees) to pixel radius
                // pxPerDegY is pixels per degree vertically (same as display uses)
                // For export, ensure markers are visible: minimum 3 pixels radius
                let markerRadius = (diameter * pxPerDegY) / 2;
                markerRadius = Math.max(3, markerRadius); // Minimum 3 pixels for export visibility
                
                // Calculate base y position at the horizon line
                const horizonYPos = horizonY - (altitude * pxPerDegY);
                
                // Position marker based on type and rise/set (same logic as original)
                let yPos;
                if (isRise) {
                    if (isUpperLimb) {
                        yPos = horizonYPos + markerRadius; // Center BELOW horizon (TOP touches horizon)
                    } else if (isCenter) {
                        yPos = horizonYPos; // Center on horizon
                    } else if (isLowerLimb) {
                        yPos = horizonYPos - markerRadius; // Center ABOVE horizon (BOTTOM touches horizon)
                    } else {
                        yPos = horizonYPos;
                    }
                } else if (isSet) {
                    if (isLowerLimb) {
                        yPos = horizonYPos - markerRadius; // Center ABOVE horizon (BOTTOM touches horizon)
                    } else if (isCenter) {
                        yPos = horizonYPos; // Center on horizon
                    } else if (isUpperLimb) {
                        yPos = horizonYPos + markerRadius; // Center BELOW horizon (TOP touches horizon)
                    } else {
                        yPos = horizonYPos;
                    }
                } else {
                    yPos = horizonYPos;
                }
                
                // Draw color-coded dot (same logic as display, but with higher opacity for export)
                ctx.beginPath();
                ctx.arc(x, yPos, markerRadius, 0, 2 * Math.PI);
                // Use color from location data (same as display - loc.color should always exist)
                let fillColor = loc.color;
                if (fillColor && fillColor.startsWith('#')) {
                    // Hex color format: #RRGGBB or #RGB
                    const hex = fillColor.replace('#', '');
                    const r = hex.length === 3 ? parseInt(hex[0] + hex[0], 16) : parseInt(hex.substring(0, 2), 16);
                    const g = hex.length === 3 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.substring(2, 4), 16);
                    const b = hex.length === 3 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.substring(4, 6), 16);
                    // Use higher opacity (0.7) for export visibility instead of display's 0.3
                    fillColor = `rgba(${r}, ${g}, ${b}, 0.7)`;
                    ctx.fillStyle = fillColor;
                } else {
                    // Fallback (shouldn't normally happen - loc.color should always be a hex color)
                    ctx.globalAlpha = 0.7;
                    ctx.fillStyle = fillColor || dotColor;
                }
                ctx.fill();
                ctx.globalAlpha = 1.0; // Reset alpha
                ctx.strokeStyle = '#000';
                ctx.lineWidth = Math.max(1, markerRadius / 3); // Proportional line width, minimum 1px
                ctx.stroke();
            });
            
            // Draw labels and lines for center events only
            centerLocations.forEach(loc => {
                // Ensure we have azimuth data
                if (loc.azimuth === undefined || isNaN(loc.azimuth)) {
                    return;
                }
                
                // Map azimuth (0-360) directly to x position for full 360 view
                const normalizedAzimuth = ((loc.azimuth % 360) + 360) % 360; // Ensure 0-360 range
                const x = (normalizedAzimuth / 360) * w;
                
                // Find the altitude at this azimuth
                let altitude = 0;
                if (currentProfileData && currentProfileData.length > 0) {
                    const dataRes = 360 / currentProfileData.length;
                    const index = Math.round(loc.azimuth / dataRes) % currentProfileData.length;
                    if (currentProfileData[index]) {
                        altitude = currentProfileData[index].y || 0;
                    }
                }
                
                const horizonYPos = horizonY - (altitude * pxPerDegY);
                const circleCenterY = horizonYPos; // Center markers are always on horizon
                
                // Calculate label position: above the highest point
                // Labels should be positioned 2 degrees above the highest terrain point
                // Then sky is 2 degrees above the labels
                // Label Y position = horizonY - (maxAltitude * pxPerDegY) - (2 * pxPerDegY)
                // This positions labels 2 degrees above the highest point, leaving 2 degrees of sky above labels
                const labelY = horizonY - (maxAltitude * pxPerDegY) - (2 * pxPerDegY);
                
                // Draw thin grey line from circle center to label position
                ctx.beginPath();
                ctx.moveTo(x, circleCenterY);
                ctx.lineTo(x, labelY);
                ctx.strokeStyle = 'rgba(128, 128, 128, 0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Use displayLabel if available, otherwise remove "Center" from label
                const displayText = loc.displayLabel || loc.label.replace(/\s*Center\s*/gi, '').trim();
                
                // Calculate label box width (simplified - use fixed width for now)
                const labelBoxWidth = 60;
                
                // Draw label box and text
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#000';
                ctx.fillRect(x - (labelBoxWidth / 2), labelY - 7, labelBoxWidth, 14);
                ctx.fillStyle = '#fff';
                ctx.fillText(displayText, x, labelY + 4);
            });
            } catch (e) {
                console.error('[EXPORT DEBUG] Error getting rise/set locations:', e);
            }
        } else {
            console.warn('[EXPORT DEBUG] window.HC_getRiseSetLocations is not a function');
        }
        
        // Draw horizon line at the calculated horizonY position
        ctx.beginPath();
        ctx.moveTo(0, horizonY);
        ctx.lineTo(w, horizonY);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * Export panorama canvas as PNG image - Full 360-degree view
     * @param {string} canvasId - ID of the canvas element type ('hc-panoCanvas' or 'hc-panoCanvasHillshade')
     * @param {string} filenamePrefix - Prefix for the exported filename
     */
    window.HC_exportPanoramaImage = function(canvasId, filenamePrefix) {
        // Get the original canvas only to reference height (width is calculated for full 360)
        const originalCanvas = document.getElementById(canvasId);
        if (!originalCanvas) {
            alert('Canvas not found. Please ensure the panorama is visible.');
            return;
        }
        
        // Verify we're not accidentally using the original canvas for export
        if (originalCanvas.width === 0 || originalCanvas.height === 0) {
            console.warn('Original canvas has zero dimensions, using default height');
        }

        // Force fresh access to profile data - access getter directly, don't cache
        // Access window.HC_profileData getter fresh each time to avoid any stale references
        let currentProfileData;
        try {
            // Force getter invocation to get absolute latest data
            currentProfileData = window.HC_profileData;
            // Verify it's an array and make a fresh copy to avoid any reference issues
            if (!Array.isArray(currentProfileData)) {
                currentProfileData = [];
            } else {
                // Make a fresh array copy (shallow copy of array, but that's fine for reading)
                currentProfileData = currentProfileData.slice(0);
            }
        } catch (e) {
            console.error('Error accessing HC_profileData:', e);
            alert('Error accessing profile data. Please run a horizon calculation first.');
            return;
        }
        
        if (!currentProfileData || currentProfileData.length === 0) {
            alert('No horizon profile data available. Please run a horizon calculation first.');
            return;
        }

        try {
            // Create a fresh canvas element for export (not from cache)
            const exportCanvas = document.createElement('canvas');
            
            // Set dimensions - use height from original canvas, width calculated for full 360-degree view
            // IMPORTANT: We do NOT use originalCanvas.width - that's only 90-degree FOV display width
            // Export width must be much wider (360 degrees vs 90 degrees display) for full panorama
            const originalHeight = originalCanvas.height || 400; // Fallback height
            const originalDisplayWidth = originalCanvas.width || 0; // Display width (usually ~90-degree FOV, NOT used)
            
            // Calculate width based on profile data resolution to preserve detail
            // Use profile data length as the base width to ensure each data point gets at least 1 pixel
            // This preserves all the detail from the profile calculation
            // Minimum width ensures good detail even for low-resolution profiles
            const profileDataLength = currentProfileData.length;
            const full360Width = Math.max(profileDataLength, 3600); // Minimum 3600px width for good detail
            
            // Calculate dynamic height based on maximum altitude in profile data
            // Need to include: highest point + 10 degrees for labels + 10 degrees for sky + ground below
            // Find maximum altitude from profile data
            let maxAltitude = 0;
            currentProfileData.forEach(pt => {
                if (pt && typeof pt.y === 'number' && !isNaN(pt.y)) {
                    maxAltitude = Math.max(maxAltitude, pt.y);
                }
                // Also check segments for hillshade (they contain top/bottom altitudes)
                if (pt && pt.segments && Array.isArray(pt.segments)) {
                    pt.segments.forEach(seg => {
                        if (seg && typeof seg.top === 'number' && !isNaN(seg.top)) {
                            maxAltitude = Math.max(maxAltitude, seg.top);
                        }
                    });
                }
            });
            
            // Calculate required height based on:
            // - 10 degrees: ground below horizon (for visual balance)
            // - maxAltitude: highest point above horizon
            // - 2 degrees: space for label placement above highest point
            // - 2 degrees: sky above labels
            const degreesBelowHorizon = 10; // ground below horizon
            const degreesAboveHorizon = maxAltitude + 2 + 2; // maxAltitude + labels (2°) + sky (2°)
            const totalDegrees = degreesBelowHorizon + degreesAboveHorizon;
            
            // Use same vertical scaling as display: pxPerDegY based on 10-degree reference
            // Display uses: pxPerDegY = h / 10, so we need to maintain same pixel-per-degree ratio
            // Use a reference height to calculate pxPerDegY, then calculate actual height needed
            const referenceHeight = originalCanvas.height || 400; // Use display height as reference
            const pxPerDegY = referenceHeight / 10; // pixels per degree (based on 10-degree display range)
            const dynamicHeight = Math.ceil(totalDegrees * pxPerDegY);
            
            console.log(`[EXPORT DEBUG] Profile data max altitude: ${maxAltitude.toFixed(2)} degrees`);
            console.log(`[EXPORT DEBUG] Required degrees: ${degreesAboveHorizon} above horizon + ${degreesBelowHorizon} below = ${totalDegrees} total`);
            console.log(`[EXPORT DEBUG] pxPerDegY: ${pxPerDegY.toFixed(2)} pixels/degree (based on reference height ${referenceHeight})`);
            console.log(`[EXPORT DEBUG] Dynamic height calculated: ${dynamicHeight} pixels`);
            console.log(`[EXPORT DEBUG] Original display canvas: ${originalDisplayWidth}x${originalCanvas.height || 400} (reference only)`);
            console.log(`[EXPORT DEBUG] Export canvas will be: ${full360Width}x${dynamicHeight} (full 360-degree panorama with dynamic height)`);
            
            // Set canvas dimensions (this clears any previous content)
            exportCanvas.width = full360Width;
            exportCanvas.height = dynamicHeight;
            
            // CACHE BUSTING: Get fresh 2D context with explicit settings
            const ctx = exportCanvas.getContext('2d', { 
                willReadFrequently: false,
                alpha: true
            });
            
            // CACHE BUSTING: Explicitly clear canvas and reset transform state
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            
            const w = exportCanvas.width;
            const h = exportCanvas.height;
            
            // CRITICAL: Verify canvas dimensions are correct before rendering
            if (w !== full360Width || h !== dynamicHeight) {
                console.error(`[EXPORT ERROR] Canvas dimensions mismatch! Expected ${full360Width}x${dynamicHeight}, got ${w}x${h}`);
            }
            
            console.log(`[EXPORT DEBUG] Actual canvas dimensions: width=${w}, height=${h}, profileDataLength=${profileDataLength}`);
            console.log(`[EXPORT DEBUG] Will render full 360-degree panorama from x=0 to x=${w} (${w} pixels wide)`);
            
            // Calculate rendering parameters for full 360-degree view
            const fov = 360; // Full 360-degree field of view for X axis (width)
            const bearing = 0; // Start from north (0 degrees)
            const pxPerDegX = w / fov; // X scaling: pixels per degree (360 degrees across full width)
            
            // Use the same pxPerDegY that was used to calculate dynamic height (already calculated above)
            // This ensures consistent scaling between height calculation and rendering
            // horizonY is positioned based on degrees below horizon (ground space)
            // Canvas coordinates: y=0 at top, y increases downward
            // We want: ground (bottom) -> horizon line -> terrain -> labels -> sky (top)
            // So horizonY should be positioned so there's degreesBelowHorizon worth of pixels below it
            // horizonY = h - (degreesBelowHorizon * pxPerDegY) positions horizon with ground below
            const horizonY = h - (degreesBelowHorizon * pxPerDegY);
            
            // Determine which rendering function to use based on canvas type
            const isHillshade = canvasId === 'hc-panoCanvasHillshade';
            
            // Render the base panorama (full 360 degrees)
            if (isHillshade) {
                // Render hillshade panorama
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, w, h);
                
                const dataRes = 360 / currentProfileData.length;
                
                // Render full 360-degree panorama: map each pixel x to azimuth 0-360
                // Display shows 90-degree slice - export shows FULL 360 degrees
                // For w pixels: x=0 maps to azimuth 0°, x=w-1 maps to azimuth ~360°
                for (let x = 0; x < w; x++) {
                    // Calculate azimuth for this pixel: map x (0 to w-1) to azimuth (0 to 360)
                    const azimuth = (x / w) * 360;
                    // Find corresponding profile data point
                    // Profile data: profile[i].x = i * (360 / steps), where steps = profile.length
                    const idx = Math.round(azimuth / dataRes) % currentProfileData.length;
                    const pt = currentProfileData[idx];
                    
                    // Draw using EXACT same logic as display (lines 1574-1589)
                    if (pt && pt.segments) {
                        // Draw visible segments (back-to-front rendering logic handled by calculator)
                        pt.segments.forEach(seg => {
                            const yTop = horizonY - (seg.top * pxPerDegY);
                            const yBottom = horizonY - (seg.bottom * pxPerDegY);
                            // Draw segment
                            ctx.fillStyle = seg.color || 'rgb(100,100,100)';
                            // Moiré Fix: Width 1.5 to overlap slightly (same as display line 1582)
                            ctx.fillRect(x, yTop, 1.5, Math.max(1, yBottom - yTop));
                        });
                    } else {
                        // Fallback for missing segments (same as display line 1586)
                        const yPos = horizonY - ((pt ? pt.y : 0) * pxPerDegY);
                        ctx.fillStyle = 'rgb(100,100,100)';
                        // Draw from calculated y position down to ground level
                        const groundBottom = horizonY + (10 * pxPerDegY); // 10 degrees of ground below horizon
                        ctx.fillRect(x, Math.min(yPos, horizonY), 1.5, Math.max(1, groundBottom - Math.min(yPos, horizonY)));
                    }
                }
            } else {
                // Render silhouette panorama
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, w, h);
                
                // Calculate ground bottom (10 degrees below horizon)
                const groundBottom = horizonY + (10 * pxPerDegY);
                
                // Gradient from horizon to ground bottom
                const grad = ctx.createLinearGradient(0, horizonY, 0, groundBottom);
                grad.addColorStop(0, '#556B2F');
                grad.addColorStop(1, '#8B4513');
                
                ctx.beginPath();
                // Start from bottom left (ground level)
                ctx.moveTo(0, groundBottom);
                
                const dataRes = 360 / currentProfileData.length;
                // Render full 360-degree panorama path
                // For smooth path rendering, use w+1 points (0 to w inclusive)
                // This ensures the path closes properly at 360° = 0°
                for (let x = 0; x <= w; x++) {
                    // Calculate azimuth: map x (0 to w) to azimuth (0 to 360)
                    // x=0 -> azimuth=0°, x=w -> azimuth=360° (which equals 0° for closing path)
                    const azimuth = (x / w) * 360;
                    // Normalize azimuth to 0-360 range
                    const normalizedAzimuth = azimuth >= 360 ? 0 : azimuth;
                    // Find corresponding profile data point
                    const idx = Math.round(normalizedAzimuth / dataRes) % currentProfileData.length;
                    const pt = currentProfileData[idx] || {y: 0};
                    ctx.lineTo(x, horizonY - (pt.y * pxPerDegY));
                }
                // Close path: draw to bottom right (ground level), then bottom left, then back to start
                ctx.lineTo(w, groundBottom);
                ctx.lineTo(0, groundBottom);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }
            
            // Draw overlays (rise/set locations and labels)
            // Pass maxAltitude so labels can be positioned correctly above the highest point
            drawOverlaysForExport(ctx, w, h, fov, pxPerDegX, bearing, horizonY, pxPerDegY, currentProfileData, maxAltitude);
            
            // Ensure all rendering is complete before exporting
            // Flush any pending operations
            ctx.save();
            ctx.restore();
            
            // CACHE BUSTING: Use toBlob() instead of toDataURL() to avoid browser caching
            // Create a unique timestamp to force fresh generation
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substring(2, 9);
            
                // Verify canvas has content before exporting
            console.log(`[EXPORT DEBUG] About to export canvas: ${w}x${h} pixels`);
            
            // Convert canvas to PNG blob (bypasses data URL caching)
            // This captures the ENTIRE canvas (all w pixels wide)
            exportCanvas.toBlob(function(blob) {
                if (!blob) {
                    console.error('Failed to create blob from canvas');
                    alert('Error: Failed to generate image. Please try again.');
                    return;
                }
                
                console.log(`[EXPORT DEBUG] Blob created: size=${blob.size} bytes, type=${blob.type}`);
                console.log(`[EXPORT DEBUG] Expected exported image dimensions: ${w}x${h} pixels`);
                
                // Create object URL from blob (fresh, not cached)
                const blobURL = URL.createObjectURL(blob);
                
                // Create download link with cache-busting timestamp
                const link = document.createElement('a');
                link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}-${timestamp}.png`;
                link.href = blobURL;
                
                // Force download with cache-busting attributes
                link.setAttribute('download', link.download);
                link.style.display = 'none';
                
                // Trigger download
                document.body.appendChild(link);
                link.click();
                
                // Clean up: Remove link and revoke blob URL after a delay
                setTimeout(() => {
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobURL);
                }, 100);
                
                console.log(`[EXPORT DEBUG] Exported full 360-degree panorama image: ${canvasId}, timestamp: ${timestamp}, randomId: ${randomId}`);
            }, 'image/png', 1.0);
        } catch (error) {
            console.error('Error exporting panorama image:', error);
            alert('Error exporting image: ' + error.message);
        }
    };

})();

