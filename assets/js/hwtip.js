// ============================================================================
// REMARKS SECTION: Calculation Methodology and Inputs
// ============================================================================
/**
 * REMARKS: Rise/Set Location Calculations for Northmost and Southmost Events
 * 
 * INPUTS USED:
 * ------------
 * 1. Observer Location:
 *    - observerLat (φ): Observer's latitude in degrees
 *    - observerLon (λ): Observer's longitude in degrees
 *    - observerElevationMeters (E): Observer's elevation above mean sea level (AMSL) in meters
 *      REQUIRED: Used to calculate Dip of the Horizon (D = 0.0293 × √E)
 * 
 * 2. Horizon Data:
 *    - horizonData: Array of {azimuth, altitude, horizonLat, horizonLon} objects
 *      - azimuth: Azimuth in degrees (0-360, from North, clockwise)
 *      - altitude (h_terrain): Geometric terrain altitude in degrees (geometric horizon = 0°)
 *      - horizonLat, horizonLon: Geographic coordinates of horizon points
 *    - CRITICAL: Horizon data MUST be sorted by azimuth before calculations
 *    - Terrain altitude is adjusted for dip: h_visible_terrain = h_terrain - D
 * 
 * 3. Celestial Body Parameters:
 *    - declinationDeg (δ): Declination in degrees
 *      - Northmost events: Positive declination (e.g., +23.44° for summer solstice)
 *      - Southmost events: Negative declination (e.g., -23.44° for winter solstice)
 *    - bodyType: 'SOLAR' or 'LUNAR' (determined by isLunarEvent flag)
 *    - targetLimb: 'UL' (Upper Limb), 'Center', or 'LL' (Lower Limb)
 *    - isLunarEvent: Boolean flag for lunar vs solar events (determines refraction, parallax, semidiameter)
 *    - isCrossQuarterEvent: Boolean flag for cross-quarter events (not used in current implementation)
 * 
 * 4. Zero-Horizon Azimuths:
 *    - Read from window variables set by omphalopsychicsingle.js (not form fields)
 *    - Used for orthodrome intersection calculations
 *    - Examples: window.solsticeazisumrise, window.solsticeaziwinset, etc.
 *    - Prefers _geo variants if available, falls back to standard window variables
 * 
 * FORMULAS USED:
 * --------------
 * 
 * 1. Spherical Astronomy - Celestial Body Position:
 *    Altitude (h):
 *      sin(h) = sin(δ)sin(φ) + cos(δ)cos(φ)cos(HA)
 *      where: δ = declination, φ = observer latitude, HA = hour angle
 * 
 *    Azimuth (A):
 *      sin(A) = -sin(HA)cos(δ) / cos(h)
 *      cos(A) = (sin(δ) - sin(h)sin(φ)) / (cos(h)cos(φ))
 *      A = atan2(sin(A), cos(A))
 *      (Normalized to 0-360° from North, clockwise)
 * 
 * 2. Atmospheric Refraction (R):
 *    - Using Sæmundsson's formula: R (arcminutes) = 1.02 × cot(h + 10.3/(h + 5.11))
 *    - where h is the true (geometric) altitude in degrees
 *    - Refraction is calculated dynamically based on geometric altitude (more accurate than constant)
 *    - Refraction lifts celestial bodies, making them appear higher than geometric position
 *    - Applied to celestial body's geometric altitude when comparing to terrain
 *    - NOTE: omphalopsychicsingle.js calculates geometric zero-horizon azimuths (no refraction)
 *      for the "ready reckoner" map display. hwtip.js applies refraction for terrain-adjusted calculations.
 * 
 * 3. Lunar Parallax (P):
 *    - Solar parallax: P_sun = 0.0° (negligible)
 *    - Lunar parallax: P_moon = 0.95° (average horizontal parallax)
 *    - Parallax lowers the Moon's apparent position due to observer's position on Earth's surface
 * 
 * 4. Semidiameter (S) - Limb Adjustment:
 *    - Solar: SOLAR_SEMIDIAMETER = 0.266° (average)
 *    - Lunar: LUNAR_SEMIDIAMETER = 0.272° (average)
 *    - Upper Limb (UL): S = +SEMIDIAMETER
 *    - Lower Limb (LL): S = -SEMIDIAMETER
 *    - Center: S = 0
 * 
 * 5. Dip of the Horizon (D):
 *    - Formula: D = 0.0293 × √E (where E is elevation in meters, D is in degrees)
 *    - Higher observers see a lower horizon
 *    - Applied to terrain altitude: h_visible_terrain = h_terrain - D
 * 
 * 6. Apparent Altitude Calculation:
 *    - h_app = h_geo + R - P + S
 *    - where: h_geo = geometric altitude, R = refraction, P = parallax, S = semidiameter adjustment
 *    - Refraction is applied here for terrain-adjusted calculations
 * 
 * 7. Terrain Comparison:
 *    - Celestial body apparent altitude: h_app = h_geo + R - P + S
 *    - vs. Visible terrain altitude: h_visible_terrain = h_terrain - D
 *    - Difference = h_app - h_visible_terrain
 *    - When difference = 0, the specified limb is at the visible horizon
 * 
 * 8. Hour Angle Search:
 *    - Coarse bracketing: Search HA from -180° to +180° in 0.1° steps
 *    - Find crossing bracket where difference changes sign
 *    - Fine bisection: Refine within bracket to 0.001° tolerance
 *    - For rises: Find earliest (smallest) HA where crossing occurs
 *    - For sets: Find latest (largest) HA where crossing occurs
 * 
 * 9. Azimuth Interpolation:
 *    - Final azimuth calculated from spherical trigonometry (no corrections)
 *    - Interpolate horizon lat/lon at calculated azimuth
 *    - No azimuthal shift applied (removed as scientifically inaccurate)
 * 
 * KEY DIFFERENCES: NORTHMOST vs SOUTHMOST
 * ----------------------------------------
 * 
 * 1. Declination Sign:
 *    - Northmost: Positive declination (declinationDeg > 0)
 *    - Southmost: Negative declination (declinationDeg < 0)
 * 
 * 2. Calculation Process (Same for Both):
 *    - Both northmost and southmost use identical calculation methodology
 *    - No azimuthal shift applied to any events (removed as scientifically inaccurate)
 *    - finalAzimuth = calculated azimuth from spherical trigonometry (no corrections)
 *    - All physical corrections (refraction, parallax, dip, semidiameter) applied to altitude only
 * 
 * 3. Zero-Horizon Azimuth Sources:
 *    - Northmost: Use "sum" variants (e.g., window.solsticeazisumrise, window.majorazisumrise)
 *    - Southmost: Use "win" variants (e.g., window.solsticeaziwinrise, window.majoraziwinrise)
 *    - These are read from window variables (set by omphalopsychicsingle.js) and represent the azimuth 
 *      where the celestial body would be at the geometric horizon (0°) if terrain were flat
 *    - Code prefers _geo variants if available (e.g., window.solsticeazisumrise_geo), 
 *      falls back to standard window variables
 * 
 * 4. Calculation Process (Same for Both):
 *    a. Read zero-horizon azimuth from window variable (set by omphalopsychicsingle.js)
 *    b. Calculate orthodrome intersection point (if applicable)
 *    c. For each limb (UL, Center, LL):
 *       - Calculate dip of horizon: D = 0.0293 × √E
 *       - Search hour angle space to find where limb touches visible horizon
 *       - Use bracketing and bisection to find precise hour angle
 *       - Calculate final celestial position (altitude, azimuth)
 *       - Calculate apparent altitude: h_app = h_geo + R - P + S
 *       - Compare with visible terrain: h_visible_terrain = h_terrain - D
 *       - Interpolate horizon lat/lon at calculated azimuth (no shift)
 *       - Place marker at interpolated location
 * 
 * REMOVED HEURISTICS (Scientifically Inaccurate):
 * ------------------------------------------------
 * 
 * 1. Azimuthal Shift for Southern Events (REMOVED):
 *    - Previous implementation applied a 0.51° azimuthal shift to southern events
 *    - This has been removed as there is no physical basis for such a shift
 *    - All events (northmost and southmost) now use the calculated azimuth directly
 * 
 * 2. Refraction Application (CORRECTED):
 *    - Refraction IS applied in hwtip.js for terrain-adjusted calculations
 *    - omphalopsychicsingle.js calculates geometric zero-horizon azimuths (no refraction) for map display
 *    - hwtip.js receives these geometric azimuths and applies refraction when comparing to actual terrain
 *    - This allows hwtip.js to correctly account for refraction when finding rise/set points on terrain
 * 
 * 3. Dip of Horizon (NOW IMPLEMENTED):
 *    - Previously not applied to terrain altitude
 *    - Now correctly calculated: D = 0.0293 × √E
 *    - Applied to terrain: h_visible_terrain = h_terrain - D
 *    - This accounts for the observer's elevation above sea level
 * 
 * 4. Unified Calculation Methodology:
 *    - All events (northmost, southmost, solar, lunar) use identical calculation logic
 *    - Only differences are in physical constants (refraction, parallax, semidiameter)
 *    - No special cases or heuristics based on declination sign
 * 
 */
// ============================================================================
// CRITICAL: Define HC_runHWTIPCalculations FIRST - before any other code
// This function MUST be available immediately when the script loads
// ============================================================================
window.HC_runHWTIPCalculations = async function(horizonData, locationData) {
    if (!horizonData || horizonData.length === 0) {
        throw new Error("No horizon data provided");
    }
    if (!locationData || !locationData.latitude || !locationData.longitude) {
        throw new Error("Invalid location data");
    }

    // Ensure map is available
    const mapInstance = window.map;
    if (!mapInstance) {
        throw new Error("Map not available");
    }

    let anyCalculationFailed = false;

    // Deduplicate horizon data (same as form submission)
    // Note: deduplicateHorizonData is defined later inside IIFE, so we'll call it when available
    let processedHorizonData = horizonData;
    if (typeof window.deduplicateHorizonData === 'function') {
        processedHorizonData = window.deduplicateHorizonData(horizonData);
    } else if (typeof deduplicateHorizonData === 'function') {
        processedHorizonData = deduplicateHorizonData(horizonData);
    }
    
    // CRITICAL: Ensure horizon data is sorted by azimuth (azi alt ordered) before calculations
    // This matches the old file behavior - horizon data must be sorted by azimuth
    if (processedHorizonData && Array.isArray(processedHorizonData) && processedHorizonData.length > 0) {
        processedHorizonData.sort((a, b) => a.azimuth - b.azimuth);
    }

    // Call the shared calculation function (same one used by form submission)
    // This function will handle the viewshed polygon and all calculations
    if (typeof window.HC_executeRiseSetCalculations === 'function') {
        await window.HC_executeRiseSetCalculations(processedHorizonData, locationData, anyCalculationFailed, null);
    } else {
        throw new Error("HC_executeRiseSetCalculations not yet available. Please wait for script to fully load.");
    }
};

// Debug: Verify function was defined (only log in debug mode)
if (window.DEBUG_HWTIP) {
    console.log("hwtip.js: window.HC_runHWTIPCalculations defined. Type:", typeof window.HC_runHWTIPCalculations);
}

// Start Main IIFE to encapsulate the entire combined script and prevent global scope conflicts
(function() {
    // The top-level initialization guard (window.MaceHWTCalculatorInitialized) has been removed.
    // This ensures the script runs fully upon each execution/load, as per your instruction.

    const HWT_HORIZONE_SRC = "K52"; // Specific source ID from horiZONE.html example

    // --- Console Output Override ---
    // Capture original console methods to allow direct console logging for debugging,
    // while also providing a global displayMessage function for UI updates.
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };

    // Re-assign console.log/warn/error to use the global displayMessage if needed for consistency
    // Fully re-enable original console logging for direct calls for debugging.
    console.log = function(...args) {
        originalConsole.log(...args);
    };
    console.warn = function(...args) {
        originalConsole.warn(...args);
    };
    console.error = function(...args) {
        originalConsole.error(...args);
    };

    // Expose displayMessage and clearResultsDisplay globally for the new export/import script
    /**
     * Displays a message in a specified HTML element and logs it to the console.
     * @param {string} elementId - The ID of the HTML element to update.
     * @param {string} message - The message to display.
     * @param {string} [type='status'] - The type of message ('status', 'success', 'error', 'warn').
     */
    window.displayMessage = function(elementId, message, type = 'status') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `status-message ${type}-message`; // Apply Tailwind classes for styling
        }
        // Log to original console for debugging purposes, but only for explicit displayMessage calls
        originalConsole.log(`Display Message [${type}] for ${elementId || 'N/A'}: ${message}`);
    };


    // --- Leaflet Map and Layer Variables (now referencing global objects from Script B) ---
    // These variables will be assigned from window.map and window.layersControl
    // when the DOM is ready and Script B has initialized them.
    let map = null;
    let layersControl = null;
    let observerMarker = null; // This will now be Script B's own L.CircleMarker (window.bigMarker)

    // Array to hold all LayerGroups created by Script C for easy clearing and GeoJSON export
    // Expose scriptCOverlayGroups globally for the new export/import script
    window.scriptCOverlayGroups = [];
    
    // Store references to center markers for quick view zoom functionality
    window.centerMarkers = {};

    /**
     * Clears all dynamically added overlay layers from the map that were generated by this script (Script C).
     * This function now specifically targets layer groups managed by Script C.
     * Exposed globally for external access (e.g., from a clear button).
     */
    window.clearResultsDisplay = function() { // Made global
        // Iterate over layer groups created by window.scriptCOverlayGroups and remove them
        window.scriptCOverlayGroups.forEach(layerGroup => {
            if (window.map && window.map.hasLayer(layerGroup)) {
                window.map.removeLayer(layerGroup);
            }
            // Remove from layers control if it was added there
            if (window.layersControl && layerGroup.layerNameForControl) {
                window.layersControl.removeLayer(layerGroup);
            }
        });
        // Clear the array of Script C's layer groups
        window.scriptCOverlayGroups = [];
        // Clear center markers references
        window.centerMarkers = {};
        // Hide quick view section
        const quickViewSection = document.getElementById('hc-quick-view-section');
        if (quickViewSection) {
            quickViewSection.style.display = 'none';
        }
        console.log("All Script C overlay layers cleared from map and layers control.");
    };

    /**
     * Zooms to a center marker by its key
     * @param {string} markerKey - The key for the marker (e.g., 'SSR', 'ER', 'NMLR')
     */
    window.zoomToCenterMarker = function(markerKey) {
        const marker = window.centerMarkers[markerKey];
        const mapInstance = window.map || map;
        
        if (!marker || !mapInstance) {
            console.warn(`Marker ${markerKey} not found or map not available.`);
            return;
        }
        
        const latlng = marker.getLatLng();
        const targetZoom = 14; // Fixed zoom level for all buttons
        
        // Use setView to properly center the map on the marker location
        // setView centers the map at the specified location
        mapInstance.setView(latlng, targetZoom, {
            animate: true,
            duration: 0.5
        });
        
        // Small delay to ensure map has centered before opening popup
        setTimeout(() => {
            // Open popup to show marker details
            marker.openPopup();
        }, 600);
    };
    
    /**
     * Populates the Quick View sidebar section with zoom buttons and activates the tab
     */
    window.createQuickViewSidebar = function() {
        try {
            // Get the panel body where buttons should be placed
            const panelBody = document.querySelector('#lobipanel-quickview .panel-body');
            if (!panelBody) {
                console.error('Quick View panel body not found');
                return;
            }
            
            // Save the Info/Help section if it exists
            const helpLink = panelBody.querySelector('.panel-help-link');
            const helpContent = panelBody.querySelector('.panel-help-content');
            let helpLinkHTML = '';
            let helpContentHTML = '';
            if (helpLink) {
                helpLinkHTML = helpLink.outerHTML;
            }
            if (helpContent) {
                helpContentHTML = helpContent.outerHTML;
            }
            
            // Clear any existing buttons
            panelBody.innerHTML = '';
            
            // Restore Info/Help section if it existed
            if (helpLinkHTML) {
                panelBody.innerHTML = helpLinkHTML + (helpContentHTML || '');
            }
            
            // Create and add buttons
            const buttonsHTML = `
                        <!-- Row 1: 4 buttons -->
                        <div style="margin-bottom: 8px; text-align: center;">
                            <button id="btn-zoom-nmls" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NMLS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #6666FF; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NMLS</button>
                            <button id="btn-zoom-sss" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SSS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFC966; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SSS</button>
                            <button id="btn-zoom-nmnls" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NMNLS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FF6666; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NMNLS</button>
                            <button id="btn-zoom-ncqs" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NCQS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #66CC66; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NCQS</button>
                        </div>
                        <!-- Row 2: 4 buttons -->
                        <div style="margin-bottom: 8px; text-align: center;">
                            <button id="btn-zoom-ncqr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NCQR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #66CC66; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NCQR</button>
                            <button id="btn-zoom-nmnlr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NMNLR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FF6666; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NMNLR</button>
                            <button id="btn-zoom-ssr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SSR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFC966; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SSR</button>
                            <button id="btn-zoom-nmlr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('NMLR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #6666FF; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>NMLR</button>
                        </div>
                        <!-- Row 3: 2 buttons (centered) -->
                        <div style="margin-bottom: 8px; text-align: center;">
                            <button id="btn-zoom-es" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('ES');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFFF99; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>ES</button>
                            <button id="btn-zoom-er" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('ER');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFFF99; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>ER</button>
                        </div>
                        <!-- Row 4: 4 buttons -->
                        <div style="margin-bottom: 8px; text-align: center;">
                            <button id="btn-zoom-smls" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SMLS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #6666FF; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SMLS</button>
                            <button id="btn-zoom-wss" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('WSS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFC966; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>WSS</button>
                            <button id="btn-zoom-smnls" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SMNLS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FF6666; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SMNLS</button>
                            <button id="btn-zoom-scqs" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SCQS');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #66CC66; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SCQS</button>
                        </div>
                        <!-- Row 5: 4 buttons -->
                        <div style="margin-bottom: 8px; text-align: center;">
                            <button id="btn-zoom-scqr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SCQR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #66CC66; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SCQR</button>
                            <button id="btn-zoom-smnlr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SMNLR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FF6666; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SMNLR</button>
                            <button id="btn-zoom-wsr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('WSR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #FFC966; color: #333; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>WSR</button>
                            <button id="btn-zoom-smlr" class="btn btn-xs" onclick="if(typeof window.zoomToCenterMarker === 'function') window.zoomToCenterMarker('SMLR');" style="display: inline-block; width: auto; min-width: 60px; padding: 4px 8px; margin: 2px; background-color: #6666FF; color: white; border: 1px solid #D3D3D3; border-radius: 4px; box-shadow: none;" disabled>SMLR</button>
                        </div>
            `;
            // Append buttons to existing content (preserving Info/Help)
            if (helpLinkHTML) {
                panelBody.innerHTML = helpLinkHTML + (helpContentHTML || '') + buttonsHTML;
            } else {
                panelBody.innerHTML = buttonsHTML;
            }
            
            // Activate the sidebar tab (remove inactive styling)
            const quickViewTab = document.getElementById('quickview-tab');
            if (quickViewTab) {
                quickViewTab.style.opacity = '1';
                quickViewTab.style.pointerEvents = 'auto';
            }
            
        } catch (error) {
            console.error('Error populating Quick View sidebar:', error);
        }
    };

    // --- Astronomical Constants (Corrected) ---
    // NOTE: Refraction IS applied here for terrain-adjusted calculations
    // omphalopsychicsingle.js calculates geometric zero-horizon azimuths (no refraction)
    // for the "ready reckoner" map display. For hwtip.js terrain-adjusted calculations,
    // we need to apply refraction when comparing celestial body position to actual terrain.

    // Atmospheric Refraction - lifts celestial bodies, making them appear higher
    // Using Sæmundsson's formula: R (arcminutes) = 1.02 × cot(h + 10.3/(h + 5.11))
    // where h is the true (geometric) altitude in degrees
    // This is more accurate than a constant, especially away from the horizon
    function calculateRefraction(geometricAltitudeDeg) {
        // Handle edge cases for very low altitudes
        if (geometricAltitudeDeg < -0.5) {
            geometricAltitudeDeg = -0.5; // Clamp to prevent extreme values
        }
        
        // Sæmundsson's formula: R = 1.02 × cot(h + 10.3/(h + 5.11))
        // where h is in degrees
        const h = geometricAltitudeDeg;
        const term = h + (10.3 / (h + 5.11));
        const termRad = term * Math.PI / 180; // Convert to radians
        const cotValue = 1.0 / Math.tan(termRad); // cot(x) = 1/tan(x)
        const refractionArcminutes = 1.02 * cotValue;
        const refractionDegrees = refractionArcminutes / 60.0; // Convert arcminutes to degrees
        
        return refractionDegrees;
    }

    // Lunar parallax - Moon appears lower due to observer's position on Earth's surface
    const LUNAR_PARALLAX = 0.95; // Average lunar horizontal parallax (degrees)
    const SOLAR_PARALLAX = 0.0; // Solar parallax is negligible (degrees)

    // Semidiameters - angular radius of celestial bodies
    const SOLAR_SEMIDIAMETER = 0.266; // Average solar semidiameter (degrees)
    const LUNAR_SEMIDIAMETER = 0.272; // Average lunar semidiameter (degrees)

    const EARTH_RADIUS_METERS = 6371000; // Earth's mean radius in meters (Still needed for other geodesic calcs if any)

    // Array of colors for future polygons (retained as per instruction)
    // Updated based on user's specific requests for marker fill colors
    const POLYGON_COLORS = ['#FFA500', '#FFFF00', '#008000', '#00008B', '#FF0000']; // Solstices (Orange), Equinoxes (Yellow), Cross-Quarters (Green), Major Lunar (Dark Blue), Minor Lunar (Red)

    /**
     * Converts degrees to radians.
     * @param {number} deg - Degrees.
     * @returns {number} Radians.
     */
    function toRadians(deg) {
        return deg * Math.PI / 180;
    }

    /**
     * Converts radians to degrees.
     * @param {number} rad - Radians.
     * @returns {number} Degrees.
     */
    function toDegrees(rad) {
        return rad * 180 / Math.PI;
    }

    /**
     * Normalizes an azimuth to be within the 0-360 degree range.
     * Exposed globally to resolve potential ReferenceError if used by other scripts.
     * @param {number} az - Azimuth in degrees.
     * @returns {number} Normalized azimuth in degrees (0-360).
     */
    window.normalizeAzimuth = function(az) {
        return (az % 360 + 360) % 360;
    };

    /**
     * Calculates the bearing from one LatLng point to another using LatLon library.
     * @param {L.LatLng} p1 - Start point (Leaflet LatLng object).
     * @param {L.LatLng} p2 - End point (Leaflet LatLng object).
     * @returns {number} Bearing in degrees (0-360), or NaN if LatLon library is not available.
     */
    function getBearingBetweenLatLngs(p1, p2) {
        if (typeof LatLon === 'undefined') {
            console.error("LatLon library not available for bearing calculation. Please ensure 'geodesy.js' is loaded.");
            return NaN;
        }
        // LatLon library expects (latitude, longitude)
        const ll1 = new LatLon(p1.lat, p1.lng);
        const ll2 = new LatLon(p2.lat, p2.lng);
        return ll1.bearingTo(ll2);
    }

    /**
     * Generates points for an orthodrome (great circle path) between a start point and an end point.
     * Overloaded to work from two points or from a start point, bearing, and distance.
     * Based on standard geodesic formulas (similar to Chris Veness's methods).
     * @param {number} lat1 - Start Latitude.
     * @param {number} lon1 - Start Longitude.
     * @param {number} lat2OrBearing - End Latitude OR Bearing in degrees.
     * @param {number} lon2OrDistanceKm - End Longitude OR Distance in kilometers.
     * @param {number} [numPoints=25] - Number of intermediate points to generate for smoothness.
     * @param {number} [bearing=undefined] - Bearing (if using start/bearing/distance overload).
     * @param {number} [distanceKm=undefined] - Distance (if using start/bearing/distance overload).
     * @returns {Array<[number, number]>} An array of [lat, lon] pairs for the orthodrome.
     */
    function generateOrthodromePoints(lat1, lon1, lat2OrBearing, lon2OrDistanceKm, numPoints = 25, bearing = undefined, distanceKm = undefined) {
        const points = [];
        points.push([lat1, lon1]);

        let endLat, endLon;
        let totalDistanceRad;

        const R = 6371; // Earth's radius in kilometers
        if (bearing !== undefined && distanceKm !== undefined) { // From start point, bearing, distance
            const brngRad = toRadians(bearing);
            const latRad1 = toRadians(lat1);
            const lonRad1 = toRadians(lon1);

            totalDistanceRad = distanceKm / R;

            const latRad2 = Math.asin(Math.sin(latRad1) * Math.cos(totalDistanceRad) + Math.cos(latRad1) * Math.sin(totalDistanceRad) * Math.cos(brngRad));
            const lonRad2 = lonRad1 + Math.atan2(Math.sin(brngRad) * Math.sin(totalDistanceRad) * Math.cos(latRad1), Math.cos(totalDistanceRad) - Math.sin(latRad1) * Math.sin(latRad2));

            endLat = toDegrees(latRad2);
            endLon = toDegrees(lonRad2);
        } else { // From two points
            endLat = lat2OrBearing;
            endLon = lon2OrDistanceKm;

            const latRad1 = toRadians(lat1);
            const lonRad1 = toRadians(lon1);
            const latRad2 = toRadians(endLat);
            const lonRad2 = toRadians(endLon);

            // Calculate angular distance for two points (Haversine-like for angular distance)
            const deltaLat = latRad2 - latRad1;
            const deltaLon = lonRad2 - lonRad1;
            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(latRad1) * Math.cos(latRad2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
            totalDistanceRad = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        if (totalDistanceRad < 1e-6) { // Points are very close or identical
            points.push([endLat, endLon]);
            return points;
        }

        for (let i = 1; i < numPoints; i++) {
            const f = i / numPoints; // Fraction along the path
            const A = Math.sin((1 - f) * totalDistanceRad) / Math.sin(totalDistanceRad);
            const B = Math.sin(f * totalDistanceRad) / Math.sin(totalDistanceRad);

            // Spherical interpolation for intermediate points
            const x = A * Math.cos(toRadians(lat1)) * Math.cos(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.cos(toRadians(endLon));
            const y = A * Math.cos(toRadians(lat1)) * Math.sin(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.sin(toRadians(lon1));
            const z = A * Math.sin(toRadians(lat1)) + B * Math.sin(toRadians(endLat));

            const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
            const lon = Math.atan2(y, x);

            points.push([toDegrees(lat), toDegrees(lon)]);
        }
        points.push([endLat, endLon]); // Ensure the exact endpoint is included
        return points;
    }

    /**
     * Interpolates horizon Lat/Lon for a given azimuth.
     * Finds the two horizon data points that bracket the target azimuth and performs linear interpolation.
     * @param {number} azimuth - The azimuth to interpolate for (0-360 degrees).
     * @param {Array<Object>} horizonData - The full horizon data, expected to be sorted by azimuth.
     * @returns {{lat: number, lon: number, azimuth: number}|null} Interpolated lat/lon with original azimuth, or null if cannot interpolate.
     */
    function getInterpolatedHorizonLatLon(azimuth, horizonData) {
        if (!horizonData || horizonData.length === 0) {
            return null;
        }

        let targetAzimuthNormalized = window.normalizeAzimuth(azimuth);
        let p1 = null;
        let p2 = null;

        // To handle wrap-around, create an extended version of horizonData
        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }
        // Ensure extended data is sorted by azimuth
        extendedHorizonData.sort((a, b) => a.azimuth - b.azimuth);

        // Find the two horizon data points that bracket the target azimuth
        for (let i = 0; i < extendedHorizonData.length - 1; i++) {
            const currentPoint = extendedHorizonData[i];
            const nextPoint = extendedHorizonData[i + 1];

            let az1 = currentPoint.azimuth;
            let az2 = nextPoint.azimuth;

            if (targetAzimuthNormalized >= az1 && targetAzimuthNormalized <= az2) {
                p1 = currentPoint;
                p2 = nextPoint;
                break;
            }
        }

        if (p1 && p2) {
            let p1_az_for_interp = p1.azimuth;
            let p2_az_for_interp = p2.azimuth;

            // Adjust p2_az_for_interp if it's a wrap-around to ensure correct ratio calculation
            if (p1_az_for_interp > p2_az_for_interp) {
                p2_az_for_interp += 360;
            }

            let targetAz_for_ratio = targetAzimuthNormalized;
            // Adjust targetAz_for_ratio if it's a wrap-around to fit within the p1_az_for_interp to p2_az_for_interp range
            if (targetAz_for_ratio < p1_az_for_interp && p1_az_for_interp > (p2_az_for_interp - 360)) {
                targetAz_for_ratio += 360;
            }

            // --- Robustness: Check for problematic interpolation conditions or NaN values in source points ---
            const isAzimuthDifferenceZero = (p2_az_for_interp === p1_az_for_interp);
            const isP1Invalid = isNaN(p1.horizonLat) || isNaN(p1.horizonLon);
            const isP2Invalid = isNaN(p2.horizonLat) || isNaN(p2.horizonLon);

            if (isAzimuthDifferenceZero || isP1Invalid || isP2Invalid) {
                // Fallback to nearest neighbor if linear interpolation is problematic or data is invalid
                const distToP1 = Math.abs(targetAzimuthNormalized - p1_az_for_interp);
                const distToP2 = Math.abs(targetAzimuthNormalized - p2_az_for_interp);

                let chosenPoint = null;
                if (!isP1Invalid && !isP2Invalid) {
                    // Both are valid, pick the closer one
                    chosenPoint = (distToP1 <= distToP2) ? p1 : p2;
                } else if (!isP1Invalid) {
                    chosenPoint = p1; // Only p1 is valid
                } else if (!isP2Invalid) {
                    chosenPoint = p2; // Only p2 is valid
                }

                if (chosenPoint) {
                    console.warn(`getInterpolatedHorizonLatLon: Linear interpolation problematic (azimuth diff zero or NaN in source). Falling back to nearest neighbor (Azimuth: ${chosenPoint.azimuth.toFixed(3)}°).`);
                    return { lat: chosenPoint.horizonLat, lon: chosenPoint.horizonLon, azimuth: azimuth };
                } else {
                    console.error(`getInterpolatedHorizonLatLon: Cannot interpolate or find nearest valid point for azimuth ${azimuth.toFixed(3)}°. Both source points invalid.`);
                    return null; // Both source points are invalid
                }
            }
            // --- End Robustness ---

            const ratio = (targetAz_for_ratio - p1_az_for_interp) / (p2_az_for_interp - p1_az_for_interp);

            const interpolatedLat = p1.horizonLat + ratio * (p2.horizonLat - p1.horizonLat);
            const interpolatedLon = p1.horizonLon + ratio * (p2.horizonLon - p1.horizonLon);
            return { lat: interpolatedLat, lon: interpolatedLon, azimuth: azimuth };
        }
        return null;
    }

    /**
     * Interpolates and returns the altitude of the horizon for a given azimuth.
     * This function is crucial for the iterative search logic.
     * @param {number} azimuth - The azimuth to interpolate for (0-360 degrees).
     * @param {Array<Object>} horizonData - The full horizon data, expected to be sorted by azimuth.
     * @returns {number|null} The interpolated altitude, or null if cannot interpolate.
     */
    function getInterpolatedHorizonAltitude(azimuth, horizonData) {
        if (!horizonData || horizonData.length === 0) {
            return null;
        }

        let targetAzimuthNormalized = window.normalizeAzimuth(azimuth);
        let p1 = null;
        let p2 = null;

        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }
        // Ensure extended data is sorted by azimuth
        extendedHorizonData.sort((a, b) => a.azimuth - b.azimuth);


        // Find the two horizon data points that bracket the target azimuth
        for (let i = 0; i < extendedHorizonData.length - 1; i++) {
            const currentPoint = extendedHorizonData[i];
            const nextPoint = extendedHorizonData[i + 1];

            let az1 = currentPoint.azimuth;
            let az2 = nextPoint.azimuth;

            if (targetAzimuthNormalized >= az1 && targetAzimuthNormalized <= az2) {
                p1 = currentPoint;
                p2 = nextPoint;
                break;
            }
        }

        if (p1 && p2) {
            let p1_az_for_interp = p1.azimuth;
            let p2_az_for_interp = p2.azimuth;

            if (p1_az_for_interp > p2_az_for_interp) {
                p2_az_for_interp += 360;
            }

            let targetAz_for_ratio = targetAzimuthNormalized;
            if (targetAz_for_ratio < p1_az_for_interp && p1_az_for_interp > (p2_az_for_interp - 360)) {
                targetAz_for_ratio += 360;
            }

            // --- Robustness: Check for problematic interpolation conditions or NaN values in source points ---
            const isAzimuthDifferenceZero = (p2_az_for_interp === p1_az_for_interp);
            const isP1AltitudeInvalid = isNaN(p1.altitude);
            const isP2AltitudeInvalid = isNaN(p2.altitude);

            if (isAzimuthDifferenceZero || isP1AltitudeInvalid || isP2AltitudeInvalid) {
                // Fallback to nearest neighbor if linear interpolation is problematic or data is invalid
                const distToP1 = Math.abs(targetAzimuthNormalized - p1_az_for_interp);
                const distToP2 = Math.abs(targetAzimuthNormalized - p2_az_for_interp);

                let chosenPoint = null;
                if (!isP1AltitudeInvalid && !isP2AltitudeInvalid) {
                    // Both are valid, pick the closer one
                    chosenPoint = (distToP1 <= distToP2) ? p1 : p2;
                } else if (!isP1AltitudeInvalid) {
                    chosenPoint = p1; // Only p1 is valid
                } else if (!isP2Invalid) {
                    chosenPoint = p2; // Only p2 is valid
                }

                if (chosenPoint) {
                    console.warn(`getInterpolatedHorizonAltitude: Linear interpolation problematic (azimuth diff zero or NaN in source). Falling back to nearest neighbor (Azimuth: ${chosenPoint.azimuth.toFixed(3)}°).`);
                    return chosenPoint.altitude;
                } else {
                    console.error(`getInterpolatedHorizonAltitude: Cannot interpolate or find nearest valid point for azimuth ${azimuth.toFixed(3)}°. Both source points invalid.`);
                    return null; // Both source points are invalid
                }
            }
            // --- End Robustness ---

            const ratio = (targetAz_for_ratio - p1_az_for_interp) / (p2_az_for_interp - p1_az_for_interp);
            const interpolatedAltitude = p1.altitude + ratio * (p2.altitude - p1.altitude);
            return interpolatedAltitude;
        }
        return null;
    }

    /**
     * Collects horizon data points that lie azimuthally between two given azimuths,
     * always traversing in a *clockwise (increasing azimuth)* direction, handling 0/360 wrap-around.
     * The points are returned sorted by increasing azimuth.
     * @param {number} startAz - The starting azimuth of the segment (exclusive).
     * @param {number} endAz - The ending azimuth of the segment (exclusive).
     * @param {Array<Object>} horizonData - The full sorted horizon data.
     * @returns {Array<[number, number]>} An array of [lat, lon] pairs for points within the range, ordered by increasing azimuth.
     */
    function getIntermediateHorizonPoints(startAz, endAz, horizonData) {
        const points = [];
        if (!horizonData || horizonData.length === 0) {
            return points;
        }

        // Normalize start and end to be within 0-360 for initial range comparison
        const nStart = window.normalizeAzimuth(startAz);
        let nEnd = window.normalizeAzimuth(endAz);

        // If the intended clockwise range crosses 0/360 (e.g., from 350 to 10), adjust nEnd to be > nStart
        if (nStart > nEnd) {
            nEnd += 360;
        }

        // Create an extended version of horizonData with azimuths adjusted to cover the full 0-720 range
        // This simplifies range checking for wrapped segments.
        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }

        // Sort the extended data to ensure iteration is always in increasing azimuth order
        extendedHorizonData.sort((a, b) => a.azimuth - b.azimuth);

        // Iterate through the extended, sorted data
        for (const point of extendedHorizonData) {
            const currentAz = point.azimuth;

            // Include points strictly between start and end (exclusive of endpoints)
            // Use a small tolerance for floating-point comparisons
            if (currentAz > nStart + 0.0001 && currentAz < nEnd - 0.0001) {
                if (!isNaN(point.horizonLat) && !isNaN(point.horizonLon)) {
                    points.push([point.horizonLat, point.horizonLon]);
                }
            }
        }
        return points;
    }

    /**
     * Draws the viewshed horizon as a polygon using provided lat/lon values.
     * @param {Array<Object>} horizonData - Array of {azimuth, altitude, horizonLat, horizonLon} objects.
     * @returns {L.Polygon|null} The created Leaflet Polygon object, or null if invalid data.
     */
    function drawViewshedHorizonLine(horizonData) {
        if (!horizonData || horizonData.length === 0) {
            console.warn("No horizon data provided to draw viewshed polygon.");
            return null;
        }

        const polygonPoints = [];
        horizonData.forEach(point => {
            if (!isNaN(point.horizonLat) && !isNaN(point.horizonLon)) {
                polygonPoints.push([point.horizonLat, point.horizonLon]);
            } else {
                console.warn(`Skipping point (Azimuth: ${point.azimuth}) due to invalid horizonLat/Lon values. This point will not be part of the drawn viewshed polygon.`);
            }
        });

        if (polygonPoints.length >= 2) {
            // L.polygon automatically closes the polygon if the first and last points are not identical.
            // No need to manually add the first point again.
            console.log(`Viewshed terrain horizon polygon created with ${polygonPoints.length} points.`);
            return L.polygon(polygonPoints, {
                color: '#808080', // Mid grey line color
                weight: 2,
                opacity: 0.7,
                fillColor: '#F5F5F5', // Very light grey fill color
                fillOpacity: 0.1, // 10% fill opacity
                smoothFactor: 1
            });
        } else {
            console.warn("Not enough valid geographical horizon points to draw a polygon.");
            return null;
        }
    }

    /**
     * Draws an individual circle marker on the map for a calculated point.
     * @param {object} point - Object with lat, lon, azimuth properties.
     * @param {string} label - Label for the popup.
     * @param {string} lineColor - The color for the marker's outline.
     * @param {string} fillColor - The color for the marker's fill.
     * @param {number} [radius=6] - Radius of the marker.
     * @param {number} [fillOpacity=1.0] - Fill opacity of the marker.
     * @param {number} [weight=2] - Stroke weight of the marker.
     * @returns {L.CircleMarker|null} The created Leaflet CircleMarker object, or null if invalid point data.
     */
    window.drawIndividualPointMarker = function(point, label, lineColor, fillColor, radius = 6, fillOpacity = 1.0, weight = 2) {
        const mapInstance = window.map || map; // Use window.map if available, fallback to local map
        if (!mapInstance || !point || isNaN(point.lat) || isNaN(point.lon) || isNaN(point.azimuth)) {
            console.warn(`Cannot draw marker for "${label}": Invalid point data (Lat: ${point?.lat}, Lon: ${point?.lon}, Az: ${point?.azimuth}).`);
            return null;
        }

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: radius,
            fillColor: fillColor,
            color: lineColor, // Line color
            weight: weight,
            opacity: 1,
            fillOpacity: fillOpacity
        });
        marker.bindPopup(`<b>${label}</b><br>Azimuth: ${point.azimuth.toFixed(3)}°<br>Lat: ${point.lat.toFixed(6)}<br>Lon: ${point.lon.toFixed(6)}`);
        console.log(`Marker for ${label} created (not yet added to map directly).`);
        return marker;
    }

    /**
     * Prepares Leaflet LatLngs for Turf.js by converting to [lng, lat] format.
     * This function performs NO filtering, as per user's strict instruction.
     * Also logs the resulting array to the console.
     * @param {Array<L.LatLng|Array<L.LatLng>>} leafletLatLngs - Array of Leaflet LatLng objects, potentially nested.
     * @param {string} label - A label for console output (e.g., "Orthodrome", "Viewshed").
     * @returns {Array<Array<number>>} An array of [longitude, latitude] pairs, suitable for Turf.js.
     */
    function getTurfCoordinates(leafletLatLngs, label) {
        const turfCoords = [];
        // Determine if the input is a nested array (e.g., from L.geodesic.getLatLngs() which can return [[LatLng, ...]])
        const actualLatLngs = (leafletLatLngs.length === 1 && Array.isArray(leafletLatLngs[0]) && typeof leafletLatLngs[0][0] === 'object' && 'lat' in leafletLatLngs[0][0]) ? leafletLatLngs[0] : leafletLatLngs;

        for (let i = 0; i < actualLatLngs.length; i++) {
            const ll = actualLatLngs[i];
            // Directly grab lat and lng. If they are undefined, they will remain undefined.
            const lng = ll ? ll.lng : undefined;
            const lat = ll ? ll.lat : undefined;
            turfCoords.push([lng, lat]);
        }
        return turfCoords;
    }

    /**
     * Rewritten function: Reformats raw Leaflet LatLng objects (potentially nested array of objects)
     * into an array of [longitude, latitude] pairs for Turf.js.
     * This function performs NO filtering, as per user's strict instruction, and uses direct property access.
     * It logs the reformatted array to the console.
     * @param {Array<any>} rawDataArray - The raw data array, expected to contain LatLng objects, potentially nested.
     * @param {string} label - A label for console output.
     * @returns {Array<Array<number>>} The reformatted array of [longitude, latitude] pairs.
     */
    function reformatAndLogRawLatLngsForTurf(rawDataArray, label) {
        const reformattedCoords = [];

        // Check if the rawDataArray is a single array containing LatLng objects, or a nested array.
        // L.geodesic.getLatLngs() can return an array of arrays if it's a multi-part line.
        // For simplicity, we assume it's either a flat array of LatLngs or a single nested array of LatLngs.
        const actualLatLngObjects = (rawDataArray.length === 1 && Array.isArray(rawDataArray[0]) && typeof rawDataArray[0][0] === 'object' && 'lat' in rawDataArray[0][0]) ? rawDataArray[0] : rawDataArray;

        for (let i = 0; i < actualLatLngObjects.length; i++) {
            const ll = actualLatLngObjects[i]; // This is an individual LatLng object

            // Directly grab lat and lng properties. If ll is null/undefined or its properties are,
            // they will remain undefined, as per "no filtering".
            const lng = ll ? ll.lng : undefined;
            const lat = ll ? ll.lat : undefined;

            reformattedCoords.push([lng, lat]);
        }
        return reformattedCoords;
    }

    /**
     * Calculates the Sun's celestial altitude and azimuth for a given observer location, declination, and hour angle.
     * Formulas based on spherical astronomy.
     * @param {number} observerLatDeg - Observer's Latitude in Degrees.
     * @param {number} declinationDeg - Sun's Declination in Degrees.
     * @param {number} hourAngleDeg - Hour Angle in Degrees (0 at local meridian, increases westward).
     * @returns {{altitude: number, azimuth: number}|null} Object with altitude and azimuth in degrees, or null if invalid input.
     */
    function calculateSunPosition(observerLatDeg, declinationDeg, hourAngleDeg) {
        if (isNaN(observerLatDeg) || isNaN(declinationDeg) || isNaN(hourAngleDeg)) {
            console.error("Invalid input to calculateSunPosition: NaN detected. Inputs: Lat:", observerLatDeg, "Dec:", declinationDeg, "HA:", hourAngleDeg);
            return null;
        }

        const latRad = toRadians(observerLatDeg);
        const decRad = toRadians(declinationDeg);
        const haRad = toRadians(hourAngleDeg);

        // Calculate Altitude (h)
        // sin(h) = sin(dec)sin(lat) + cos(dec)cos(lat)cos(HA)
        let sinAltitude = Math.sin(decRad) * Math.sin(latRad) +
            Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);

        // --- Clamping sinAltitude to [-1, 1] to prevent NaN from Math.asin due to floating point errors ---
        sinAltitude = Math.max(-1, Math.min(1, sinAltitude));

        let altitudeRad = Math.asin(sinAltitude); // Altitude in radians

        // Calculate Azimuth (A)
        // sin(A) = -sin(HA)cos(dec) / cos(h)
        // cos(A) = (sin(dec) - sin(h)sin(lat)) / (cos(h)cos(lat))
        // Use atan2 for correct quadrant
        const sinAz = -Math.sin(haRad) * Math.cos(decRad);
        const cosAz = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad);

        let azimuthRad = Math.atan2(sinAz, cosAz);

        // If azimuth is NaN (e.g., due to sinAz and cosAz both being 0, which happens at zenith/nadir), handle it explicitly
        if (isNaN(azimuthRad)) {
            console.warn(`calculateSunPosition: Azimuth calculation resulted in NaN (sinAz: ${sinAz}, cosAz: ${cosAz}). Returning NaN for azimuth.`);
            return {
                altitude: toDegrees(altitudeRad),
                azimuth: NaN // Return NaN for azimuth, but don't return null for the whole object
            };
        }

        azimuthRad = (azimuthRad + 2 * Math.PI) % (2 * Math.PI); // Normalize to 0 to 2PI (from North, clockwise)

        const result = {
            altitude: toDegrees(altitudeRad),
            azimuth: toDegrees(azimuthRad)
        };

        return result;
    }


    /**
     * Finds the true rise/set azimuth by locating the point on the viewshed horizon
     * whose apparent altitude matches the celestial body's target apparent altitude.
     * This function now uses a robust bracketing and bisection search.
     * Exposed globally to resolve potential ReferenceError.
     * @param {Array<Object>} horizonData - An array of {azimuth, altitude, horizonLat, horizonLon} objects.
     * @param {string} targetLimb - 'UL', 'Center', or 'LL' to specify which part of the Sun.
     * @param {string} scenarioName - A descriptive name for the current calculation scenario (e.g., "Upper Limb").
     * @param {number} observerLat - The observer's latitude.
     * @param {number} observerLon - The observer's longitude.
     * @param {boolean} isSunriseLike - True if it's a sunrise-like event (azimuth increasing), false for sunset-like (azimuth decreasing).
     * @param {number} declinationDeg - The Sun's declination in degrees.
     * @param {number} observerElevationMeters - The observer's elevation above sea level in meters (currently not used for horizon adjustment per instructions).
     * @param {boolean} [isLunarEvent=false] - True if this is a lunar event, to use lunar-specific constants.
     * @param {boolean} [isCrossQuarterEvent=false] - True if this is a cross-quarter event (not currently used).
     * @returns {{azimuth: number|null, lat: number|null, lon: number: number|null, hourAngle: number}|null} The calculated azimuth, Lat/Lon, and hour angle, or null if no matching point found.
     */
    window.findActualAzimuthForTargetApparentAltitude = async function( // Exposed globally
        horizonData,
        targetLimb, // 'UL', 'Center', 'LL'
        scenarioName,
        observerLat,
        observerLon,
        isSunriseLike,
        declinationDeg, // New: Declination in degrees
        observerElevationMeters, // Observer's elevation in meters (not used for horizon adjustment)
        isLunarEvent = false, // NEW PARAMETER
        isCrossQuarterEvent = false // NEW PARAMETER
    ) {
        const TOLERANCE_ALTITUDE = 0.001; // degrees, for matching altitude
        const HA_SEARCH_RESOLUTION = 0.1; // degrees, for initial bracketing search
        const HA_SEARCH_RANGE_DEGREES = 360; // Search across a full 360 degrees of HA (e.g., -180 to +180)
        const MAX_BISECTION_ITERATIONS = 100; // Max iterations for bisection method

        // Select appropriate constants based on event type
        // NOTE: Refraction IS applied here for terrain-adjusted calculations using Sæmundsson's formula
        // Refraction is calculated dynamically based on geometric altitude (not a constant)
        const PARALLAX = isLunarEvent ? LUNAR_PARALLAX : SOLAR_PARALLAX; // Lunar: 0.95°, Solar: 0.0°
        const SEMIDIAMETER = isLunarEvent ? LUNAR_SEMIDIAMETER : SOLAR_SEMIDIAMETER;

        function setScenarioStatus(message, type = 'status') {
            originalConsole.log(`Display Message [${type}]: ${message}`); // Use originalConsole.log for these status messages
        }
        setScenarioStatus(`Calculating ${scenarioName}...`, 'status');
        // Removed detailed console logs for scenario details and bracketing search steps as requested.
        // originalConsole.log(`--- ${scenarioName} Details ---`);
        // originalConsole.log(`Target Limb: ${targetLimb}`);
        // originalConsole.log(`Observer Lat: ${observerLat.toFixed(6)}, Lon: ${observerLon.toFixed(6)}, Elev: ${observerElevationMeters.toFixed(2)}m`);
        // originalConsole.log(`Is Sunrise Like: ${isSunriseLike}, Declination: ${declinationDeg.toFixed(3)}°`);
        // originalConsole.log(`Using PARALLAX: ${PARALLAX.toFixed(4)}°, SEMIDIAMETER: ${SEMIDIAMETER.toFixed(4)}° (Is Lunar: ${isLunarEvent}, Is CrossQuarter: ${isCrossQuarterEvent})`);


        if (isNaN(declinationDeg)) {
            originalConsole.error(`ERROR: Invalid input for ${scenarioName}: declination is NaN.`);
            setScenarioStatus(`${scenarioName}: Error: Invalid declination.`, 'error');
            return null;
        }

        if (!horizonData || horizonData.length === 0) {
            originalConsole.error(`findActualAzimuthForTargetApparentAltitude (${scenarioName}): Empty horizonData received.`);
            setScenarioStatus(`${scenarioName}: Error: Empty horizon data.`, 'error');
            return null;
        }

        let bestBracket = null; // [lowHA, highHA]
        let minHaDiff = Infinity; // To find the earliest (for rise) or latest (for set) crossing

        // originalConsole.log(`--- Bracketing Search for ${scenarioName} ---`); // Removed as requested

        // Utility function to yield control to browser, allowing UI updates
        const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));
        
        // Calculate yield interval: yield every ~100 iterations to keep UI responsive
        const totalIterations = Math.ceil((180 - (-180)) / HA_SEARCH_RESOLUTION);
        const YIELD_INTERVAL = Math.max(50, Math.floor(totalIterations / 20)); // Yield ~20 times during search
        let iterationCount = 0;

        // Iterate across the full 360 degrees of hour angle to find a crossing
        for (let ha = -180; ha <= 180; ha += HA_SEARCH_RESOLUTION) {
            iterationCount++;
            const sunPos = calculateSunPosition(observerLat, declinationDeg, ha);
            if (!sunPos || isNaN(sunPos.azimuth)) {
                continue;
            }

            // Calculate the celestial body's apparent center altitude
            // h_app = h_geo + R - P + S
            // where: R = refraction (lifts body, calculated using Sæmundsson's formula), P = parallax (lowers body), S = semidiameter adjustment
            // For this bracketing search, we calculate the center (S = 0), then add limb adjustment separately
            const refraction = calculateRefraction(sunPos.altitude); // Calculate refraction based on geometric altitude
            const celestialApparentCenterAltitude = sunPos.altitude + refraction - PARALLAX; // R - P for center

            let terrainTrueAltitude = getInterpolatedHorizonAltitude(sunPos.azimuth, horizonData); // Geometric terrain altitude from HWT
            let terrainAzimuth = sunPos.azimuth; // Terrain Azimuth is the same as celestial body's azimuth for interpolation
            if (terrainTrueAltitude === null) {
                continue;
            }

            // IMPORTANT: Use terrain altitude directly (no dip adjustment)
            // The viewshed calculation gives geometric altitudes which are correct for comparison
            const terrainComparisonAltitude = terrainTrueAltitude; // Use geometric terrain altitude for comparison

            let limbAdjustmentValue = 0;
            if (targetLimb === 'UL') {
                // For Upper Limb at horizon, the center must be BELOW the terrain horizon.
                // So, the difference (Celestial_Center - Terrain) needs to be positive by SEMIDIAMETER to mean UL is at horizon.
                limbAdjustmentValue = SEMIDIAMETER;
            } else if (targetLimb === 'LL') {
                // For Lower Limb at horizon, the center must be ABOVE the terrain horizon.
                // So, the difference (Celestial_Center - Terrain) needs to be negative by SEMIDIAMETER to mean LL is at horizon.
                limbAdjustmentValue = -SEMIDIAMETER;
            }
            // If targetLimb is 'Center', limbAdjustmentValue remains 0.


            // The difference we want to drive to zero is:
            // (Celestial body's apparent center altitude - Terrain's true altitude) + limbAdjustmentValue
            const currentDifference = (celestialApparentCenterAltitude - terrainComparisonAltitude) + limbAdjustmentValue;
            const isCelestialAboveTerrain = currentDifference >= 0; // True if limb is at or above terrain

            // Removed detailed coarse search output as requested.
            // originalConsole.log(`  Coarse Search HA: ${ha.toFixed(3)}°, Body Az: ${sunPos.azimuth.toFixed(3)}°, Body Apparent Center Alt: ${celestialApparentCenterAltitude.toFixed(3)}°, Terrain True Alt: ${terrainTrueAltitude.toFixed(3)}°, Limb Adj: ${limbAdjustmentValue.toFixed(3)}°, Calculated Diff: ${currentDifference.toFixed(3)}°, Above Terrain: ${isCelestialAboveTerrain}`);


            // To check for a sign change, we need a previous point.
            // We'll store the previous valid point's difference.
            if (ha === -180) { // Initialize for the very first step
                // No actual comparison can be made yet.
            } else {
                // Get the previous point's data (HA - HA_SEARCH_RESOLUTION)
                const prevHa = ha - HA_SEARCH_RESOLUTION;
                const prevSunPos = calculateSunPosition(observerLat, declinationDeg, prevHa);
                if (!prevSunPos || isNaN(prevSunPos.azimuth)) {
                    continue; // Skip if previous celestial body position is invalid
                }

                const prevRefraction = calculateRefraction(prevSunPos.altitude); // Calculate refraction based on geometric altitude
                const prevCelestialApparentCenterAltitude = prevSunPos.altitude + prevRefraction - PARALLAX; // R - P for center
                const prevTerrainTrueAltitude = getInterpolatedHorizonAltitude(prevSunPos.azimuth, horizonData);
                if (prevTerrainTrueAltitude === null) {
                    continue; // Skip if previous terrain altitude is invalid
                }
                const prevTerrainComparisonAltitude = prevTerrainTrueAltitude; // Use geometric terrain altitude
                const prevDifference = (prevCelestialApparentCenterAltitude - prevTerrainComparisonAltitude) + limbAdjustmentValue; // Use same limb adjustment as current
                const wasCelestialAboveTerrain = prevDifference >= 0;

                // Check for a sign change (crossing)
                // For rise: was below terrain (prevDiff < 0) AND now at/above terrain (currDiff >= 0)
                // For set: was at/above terrain (prevDiff > 0) AND now below terrain (currDiff <= 0)
                const hasCrossed = (prevDifference < 0 && currentDifference >= 0 && isSunriseLike) ||
                                   (prevDifference > 0 && currentDifference <= 0 && !isSunriseLike);

                if (hasCrossed) {
                    // We found a crossing bracket [prevHa, ha]
                    // For rise, we want the earliest one (smallest HA).
                    // For set, we want the latest one (largest HA).
                    if (isSunriseLike) {
                        // For rise, we want the earliest HA where it crosses (smallest HA)
                        // This is how we "look backward" to find the very first unblocked state.
                        if (ha < minHaDiff) { // If this is an earlier crossing than any found so far
                            minHaDiff = ha;
                            bestBracket = [prevHa, ha];
                            // originalConsole.log(`  Found potential rise bracket (earliest so far): [${prevHa.toFixed(3)}°, ${ha.toFixed(3)}°]`); // Removed as requested
                        }
                    } else { // Sunset-like
                        // For set, we want the latest HA where it crosses (largest HA)
                        if (ha > minHaDiff || minHaDiff === Infinity) { // Update if larger, or if it's the first one found
                            minHaDiff = ha;
                            bestBracket = [prevHa, ha];
                            // originalConsole.log(`  Found potential set bracket (latest so far): [${prevHa.toFixed(3)}°, ${ha.toFixed(3)}°]`); // Removed as requested
                        }
                    }
                }
            }
            
            // Yield control periodically to allow UI updates
            if (iterationCount % YIELD_INTERVAL === 0) {
                await yieldToBrowser();
            }
        }

        if (!bestBracket) {
            originalConsole.error(`Bracketing Search for ${scenarioName}: No crossing bracket found in the full HA range.`);
            // Check if it's always blocked or always clear
            const testHA = isSunriseLike ? -90 : 90; // Test HA in appropriate quadrant
            const testCelestialPos = calculateSunPosition(observerLat, declinationDeg, testHA);
            if (!testCelestialPos || isNaN(testCelestialPos.azimuth)) {
                setScenarioStatus(`${scenarioName}: Failed initial celestial body position check.`, 'error');
                return null;
            }

            const testRefraction = calculateRefraction(testCelestialPos.altitude); // Calculate refraction based on geometric altitude
            const testCelestialApparentCenterAltitude = testCelestialPos.altitude + testRefraction - PARALLAX; // R - P for center
            let testLimbAdjustmentValue = 0;
            if (targetLimb === 'UL') {
                testLimbAdjustmentValue = SEMIDIAMETER; // Use selected semidiameter
            } else if (targetLimb === 'LL') {
                testLimbAdjustmentValue = -SEMIDIAMETER; // Use selected semidiameter
            }
            const testTerrainTrueAlt = getInterpolatedHorizonAltitude(testCelestialPos.azimuth, horizonData);

            if (testTerrainTrueAlt !== null) {
                const testTerrainComparisonAlt = testTerrainTrueAlt; // Use geometric terrain altitude
                const testDifference = (testCelestialApparentCenterAltitude - testTerrainComparisonAlt) + testLimbAdjustmentValue;
                if (isSunriseLike && testDifference < -TOLERANCE_ALTITUDE) { // Celestial body is clearly below terrain
                    setScenarioStatus(`${scenarioName}: Object appears to be always BLOCKED by terrain. No rise event detected.`, 'error');
                } else if (!isSunriseLike && testDifference > TOLERANCE_ALTITUDE) { // Celestial body is clearly above terrain
                    setScenarioStatus(`${scenarioName}: Object appears to be always CLEAR of terrain. No set event detected.`, 'warn');
                } else {
                    setScenarioStatus(`${scenarioName}: No clear crossing detected in search range.`, 'warn');
                }
            } else {
                setScenarioStatus(`${scenarioName}: Could not interpolate terrain altitude for state check.`, 'error');
            }
            return null;
        }

        // originalConsole.log(`Bracketing Search for ${scenarioName}: Best bracket found: [${bestBracket[0].toFixed(3)}°, ${bestBracket[1].toFixed(3)}°]`); // Removed as requested

        // --- Step 2: Perform fine-grained bisection search within the bestBracket ---
        let lowHA = bestBracket[0];
        let highHA = bestBracket[1];
        let finalHA = null;

        for (let i = 0; i < MAX_BISECTION_ITERATIONS; i++) {
            const midHA = (lowHA + highHA) / 2;
            const midCelestialPos = calculateSunPosition(observerLat, declinationDeg, midHA);

            if (!midCelestialPos || isNaN(midCelestialPos.azimuth)) {
                originalConsole.warn(`${scenarioName}: Bisection search failed to calculate celestial body position (azimuth is NaN) at ${midHA.toFixed(3)}°. Breaking.`);
                break;
            }

            const midRefraction = calculateRefraction(midCelestialPos.altitude); // Calculate refraction based on geometric altitude
            const midCelestialApparentCenterAltitude = midCelestialPos.altitude + midRefraction - PARALLAX; // R - P for center

            let midTerrainTrueAlt = getInterpolatedHorizonAltitude(midCelestialPos.azimuth, horizonData);
            let midTerrainAzimuth = midCelestialPos.azimuth; // Terrain Azimuth is the same as celestial body's azimuth for interpolation
            if (midTerrainTrueAlt === null) {
                originalConsole.warn(`${scenarioName}: Bisection search failed to interpolate terrain at ${midCelestialPos.azimuth.toFixed(3)}°. Breaking.`);
                break;
            }

            // Calculate visible terrain altitude: h_visible_terrain = h_terrain - D
            const midTerrainComparisonAlt = midTerrainTrueAlt; // Use geometric terrain altitude for comparison

            let limbAdjustmentValue = 0;
            if (targetLimb === 'UL') {
                limbAdjustmentValue = SEMIDIAMETER; // Use selected semidiameter
            } else if (targetLimb === 'LL') {
                limbAdjustmentValue = -SEMIDIAMETER; // Use selected semidiameter
            }

            const currentDifference = (midCelestialApparentCenterAltitude - midTerrainComparisonAlt) + limbAdjustmentValue;

            // Removed detailed bisection search output as requested.
            // originalConsole.log(`  Bisection Step ${i}: HA: ${midHA.toFixed(3)}°, Body Az: ${midCelestialPos.azimuth.toFixed(3)}°, Body Apparent Center Alt: ${midCelestialApparentCenterAltitude.toFixed(3)}°, Terrain True Alt: ${midTerrainTrueAlt.toFixed(3)}°, Limb Adj: ${limbAdjustmentValue.toFixed(3)}°, Calculated Diff: ${currentDifference.toFixed(3)}°`);


            if (Math.abs(currentDifference) < TOLERANCE_ALTITUDE) {
                finalHA = midHA;
                break; // Converged
            }

            if (isSunriseLike) {
                if (currentDifference < 0) { // Celestial body's limb is still below terrain, need to increase HA (move right on graph)
                    lowHA = midHA;
                } else { // Celestial body's limb is above terrain, need to decrease HA (move left on graph)
                    highHA = midHA;
                }
            } else { // Sunset-like
                if (currentDifference > 0) { // Celestial body's limb is still above terrain, need to increase HA (move right on graph)
                    lowHA = midHA;
                } else { // Celestial body's limb is below terrain, need to decrease HA (move left on graph)
                    highHA = midHA;
                }
            }
        }

        if (finalHA === null) {
            // If bisection didn't converge, use the midpoint of the final bracket
            finalHA = (lowHA + highHA) / 2;
            originalConsole.warn(`${scenarioName}: Bisection did not fully converge. Using midpoint of final bracket: ${finalHA.toFixed(3)}°.`);
        }

        const finalCelestialPos = calculateSunPosition(observerLat, declinationDeg, finalHA);
        if (finalCelestialPos && !isNaN(finalCelestialPos.azimuth)) {
            // No azimuthal shift - use calculated azimuth directly
            const finalAzimuth = finalCelestialPos.azimuth;
            
            // Get lat/lon for the calculated azimuth
            const finalPointLatLon = getInterpolatedHorizonLatLon(finalAzimuth, horizonData);
            if (finalPointLatLon && !isNaN(finalPointLatLon.lat) && !isNaN(finalPointLatLon.lon)) {
                setScenarioStatus(`${scenarioName}: Actual Azimuth calculated.`, 'success');
                // originalConsole.log(`Calculated ${scenarioName} Result: Azimuth: ${finalAzimuth.toFixed(3)}°, Lat: ${finalPointLatLon.lat.toFixed(6)}, Lon: ${finalPointLatLon.lon.toFixed(6)}, HA: ${finalHA.toFixed(3)}°`); // Removed as requested
                return {
                    azimuth: finalAzimuth, // Use calculated azimuth (no shift)
                    lat: finalPointLatLon.lat, // Lat/lon from calculated azimuth
                    lon: finalPointLatLon.lon, // Lat/lon from calculated azimuth
                    hourAngle: finalHA
                };
            } else {
                originalConsole.warn(`${scenarioName}: Could not interpolate final horizon Lat/Lon for calculated azimuth ${finalCelestialPos.azimuth.toFixed(3)}° (Lat/Lon might be NaN). Returning null.`);
                return null;
            }
        } else {
            originalConsole.warn(`${scenarioName}: Failed to calculate final celestial body position for hour angle ${finalHA.toFixed(3)}° (azimuth might be NaN). Returning null.`);
            return null;
        }
    };


    /**
     * Finds the intersection point on the viewshed horizon for a given orthodromic line using Turf.js.
     * @param {L.LatLng} observerLatLng - The observer's location.
     * @param {Array<Array<number>>} orthodromeCoordsTurf - Array of [longitude, latitude] for the orthodromic line.
     * @param {Array<Array<number>>} viewshedCoordsTurf - Array of [longitude, latitude] for the viewshed horizon.
     * @returns {{lat: number, lon: number, azimuth: number}|null} The intersection point, or null if not found.
     */
    function findOrthodromeViewshedIntersection(observerLatLng, orthodromeCoordsTurf, viewshedCoordsTurf) {
        if (typeof turf === 'undefined') {
            console.error("Turf.js library not loaded. Cannot perform line intersection.");
            return null;
        }

        // --- Filter out invalid coordinates before passing to turf.lineString ---
        const validOrthodromeCoords = orthodromeCoordsTurf.filter(coords =>
            typeof coords[0] === 'number' && !isNaN(coords[0]) &&
            typeof coords[1] === 'number' && !isNaN(coords[1])
        );
        const validViewshedCoords = viewshedCoordsTurf.filter(coords =>
            typeof coords[0] === 'number' && !isNaN(coords[0]) &&
            typeof coords[1] === 'number' && !isNaN(coords[1])
        );

        // Check if there are enough valid coordinates after filtering
        if (validOrthodromeCoords.length < 2 || validViewshedCoords.length < 2) {
            console.warn("Insufficient valid coordinates after filtering for Turf.js intersection. Skipping intersection.");
            return null;
        }

        // The coordinates are now guaranteed to be valid numbers for turf.lineString
        const turfOrthodrome = turf.lineString(validOrthodromeCoords);
        const turfViewshed = turf.lineString(validViewshedCoords);

        // Find intersections
        const intersections = turf.lineIntersect(turfOrthodrome, turfViewshed);

        if (intersections.features.length > 0) {
            // Pick the first intersection point (closest to the start of the orthodrome)
            const intersectionCoords = intersections.features[0].geometry.coordinates;

            const intersectionLat = intersectionCoords[1];
            const intersectionLon = intersectionCoords[0];

            const intersectionLatLng = L.latLng(intersectionLat, intersectionLon);

            const actualIntersectionAzimuth = getBearingBetweenLatLngs(observerLatLng, intersectionLatLng);
            
            // CRITICAL: Log intersection details for debugging
            console.log("Turf intersection found:", {
                turfCoords: intersectionCoords,
                lat: intersectionLat,
                lon: intersectionLon,
                calculatedAzimuth: actualIntersectionAzimuth,
                observerLat: observerLatLng.lat,
                observerLon: observerLatLng.lng
            });

            return {
                lat: intersectionLat,
                lon: intersectionLon,
                azimuth: actualIntersectionAzimuth
            };
        }

        return null; // No intersection found
    }

    /**
     * Helper function to process orthodrome intersection for a given state.
     * It draws the orthodrome and its intersection with the viewshed horizon on the map.
     * @param {number} zeroHorizonAzimuth - The 0-horizon azimuth for this state (initial guess for orthodrome direction).
     * @param {object} locationData - Observer's location data ({latitude, longitude, elevation_amsl}).
     * @param {L.Polygon} viewshedPolygon - The viewshed polygon.
     * @param {string} scenarioName - Name of the scenario (e.g., "SSR").
     * @param {L.LayerGroup} globalZeroHorizonLayerGroup - The global layer group to add intersection markers to.
     * @returns {{azimuth: number, lat: number, lon: number}|null} The intersection point, or null.
     */
    async function processOrthodromeIntersection(zeroHorizonAzimuth, locationData, viewshedPolygon, scenarioName, globalZeroHorizonLayerGroup) {
        // Note: globalZeroHorizonLayerGroup parameter is kept for backward compatibility but is no longer used
        // Orthodrome intersection markers are NOT added to the map
        let orthodromeLatLngsForGeodesic = [];
        let intersectionPoint = null;

        if (!isNaN(zeroHorizonAzimuth) && locationData && typeof LatLon !== 'undefined' && typeof L.geodesic !== 'undefined') {
            const observerLat = locationData.latitude;
            const observerLon = locationData.longitude;
            const lineDistanceKm = 200; // Sufficient distance to cross most horizons

            const startPointLatLon = new LatLon(observerLat, observerLon);
            const endPointLatLon = startPointLatLon.destinationPoint(lineDistanceKm * 1000, zeroHorizonAzimuth);

            if (isNaN(endPointLatLon.lat) || isNaN(endPointLatLon.lon)) {
                console.warn(`Calculated orthodrome end point for ${scenarioName} is invalid (NaN).`);
                orthodromeLatLngsForGeodesic = [L.latLng(observerLat, observerLon), L.latLng(NaN, NaN)];
            } else {
                orthodromeLatLngsForGeodesic = [
                    L.latLng(observerLat, observerLon),
                    L.latLng(endPointLatLon.lat, endPointLatLon.lon)
                ];
            }

            // Create the orthodrome line but DO NOT add it to a layer group here
            let tempOrthodromeLine = L.geodesic(orthodromeLatLngsForGeodesic, {
                steps: 100,
                color: '#f97316', // Orange-500 for orthodrome line
                weight: 2,
                opacity: 0.7,
                dashArray: '5, 5'
            });

            const reformattedOrthodromeCoords = reformatAndLogRawLatLngsForTurf(tempOrthodromeLine.getLatLngs(), `Geodesic Orthodrome Attempt for ${scenarioName}`);

            if (viewshedPolygon && typeof turf !== 'undefined') {
                // For intersection with a polygon, we need its outer ring (which is what getLatLngs() returns for a simple polygon)
                const viewshedActualLatLngs = viewshedPolygon.getLatLngs();
                // If it's a multi-polygon, getLatLngs() returns an array of arrays. We need to flatten it for turf.lineString.
                const viewshedLineCoords = viewshedActualLatLngs.flat(); // Flatten if nested
                // CRITICAL: Log first few viewshed coordinates to verify they match horizonData order
                if (viewshedLineCoords && viewshedLineCoords.length > 0) {
                    console.log(`${scenarioName}: First 3 viewshed polygon coordinates:`, viewshedLineCoords.slice(0, 3).map(ll => ({
                        lat: ll?.lat,
                        lng: ll?.lng
                    })));
                }
                const filteredViewshedCoordsTurf = getTurfCoordinates(viewshedLineCoords, `Viewshed Horizon for ${scenarioName}`);
                // CRITICAL: Log first few Turf coordinates to verify conversion
                if (filteredViewshedCoordsTurf && filteredViewshedCoordsTurf.length > 0) {
                    console.log(`${scenarioName}: First 3 Turf viewshed coordinates [lng, lat]:`, filteredViewshedCoordsTurf.slice(0, 3));
                }
                const observerLatLng = L.latLng(locationData.latitude, locationData.longitude);
                console.log(`${scenarioName}: Observer location:`, { lat: locationData.latitude, lng: locationData.longitude, elev: locationData.elevation_amsl });

                intersectionPoint = findOrthodromeViewshedIntersection(observerLatLng, reformattedOrthodromeCoords, filteredViewshedCoordsTurf);

                if (intersectionPoint) {
                    console.log(`${scenarioName}: Intersection point found:`, {
                        lat: intersectionPoint.lat,
                        lon: intersectionPoint.lon,
                        azimuth: intersectionPoint.azimuth,
                        zeroHorizonAzimuth: zeroHorizonAzimuth
                    });
                    // Orthodrome intersection markers are NOT added to the map - they are only used for calculations
                } else {
                    console.warn(`No intersection found between ${scenarioName} Orthodrome and Viewshed Horizon, or data invalid.`);
                }
            } else {
                console.warn(`Cannot find intersection for ${scenarioName}: Viewshed Horizon line not available, or Turf.js not loaded.`);
            }
        } else {
            console.warn(`Cannot process Orthodrome data for ${scenarioName}: base azimuth or location data invalid, or LatLon/L.geodesic not available.`);
        }
        return intersectionPoint;
    }


    /**
     * Fetches location data (lat, lon, elev_amsl) for a specific ID from heywhatsthat.com's result.json.
     * @param {string} hwtId - The HeyWhatsThat identifier.
     * @returns {Promise<{latitude: number, longitude: number, elevation_amsl: number}|null>} Parsed location info.
     */
    async function fetchLocationData(hwtId) {
        const apiUrl = `https://www.heywhatsthat.com/bin/result.json?id=${hwtId}`;

        window.displayMessage('locationStatus', `Fetching location data for ID: ${hwtId} from /bin/result.json...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${text.substring(0, 100)}...`);
            }

            const json = JSON.parse(text);

            const lat = parseFloat(json?.lat);
            const lon = parseFloat(json?.lon);
            const elev_amsl = parseFloat(json?.elev_amsl);

            if (!isNaN(lat) && !isNaN(lon) && !isNaN(elev_amsl)) {
                window.displayMessage('locationStatus', 'Location data fetched successfully.', 'success-message');
                return { latitude: lat, longitude: lon, elevation_amsl: elev_amsl };
            }
            throw new Error("Missing or invalid 'lat', 'lon', or 'elev_amsl' in JSON response.");

        } catch (error) {
            window.displayMessage('locationStatus', 'Error fetching location data.', 'error-message');
            window.displayMessage('locationError', `Error: ${error.message}`, 'error-error');
            console.error("Error fetching location data:", error);
            return null;
        }
    }

    /**
     * Fetches and parses viewshed data from heywhatsthat.com's horizon.csv API.
     * @param {string} hwtId - The HeyWhatsThat identifier.
     * @returns {Promise<Array<Object>>} A promise resolving to an array of {azimuth, altitude, horizonLat?, horizonLon?} objects.
     */
    async function fetchHorizonDataHoriZONE(hwtId) {
        const apiUrl = `https://www.heywhatsthat.com/api/horizon.csv?id=${hwtId}&resolution=.125&src=${HWT_HORIZONE_SRC}&keep=1`;

        window.displayMessage('viewshedStatus', `Fetching viewshed data for ID: ${hwtId} from /bin/horizon.csv (horiZONE method)...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${text.substring(0, 100)}...`);
            }

            const lines = text.trim().split('\n');
            const horizonData = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') || line === '') continue;

                const parts = line.split(',').map(s => s.trim());
                // Expecting: "bin bottom",azimuth,altitude,"distance (m)",latitude,longitude,"elevation (m amsl)"
                if (parts.length >= 6) {
                    const azimuth = parseFloat(parts[0]); // Azimuth from "bin bottom"
                    const altitude = parseFloat(parts[2]); // Altitude from "altitude" column
                    const horizonLat = parseFloat(parts[4]); // Latitude is in parts[4]
                    const horizonLon = parseFloat(parts[5]); // Longitude is in parts[5]

                    if (!isNaN(azimuth) && !isNaN(altitude) && !isNaN(horizonLat) && !isNaN(horizonLon)) {
                        horizonData.push({ azimuth, altitude, horizonLat, horizonLon });
                    } else {
                        console.warn(`Skipping line ${i} due to invalid number parsing (az:${parts[0]}, alt:${parts[2]}, lat:${parts[4]}, lon:${parts[5]}): ${line}`);
                    }
                } else {
                    console.warn(`Skipping line ${i} due to insufficient columns (${parts.length} < 6): ${line}`);
                }
            }

            if (horizonData.length === 0) {
                throw new Error("No valid azimuth-altitude-lat-lon pairs parsed from horizon.csv. Response might be malformed or empty data.");
            }

            horizonData.sort((a, b) => a.azimuth - b.azimuth);
            window.displayMessage('viewshedStatus', 'Viewshed data fetched successfully.', 'success-message');
            return horizonData;

        } catch (error) {
            window.displayMessage('viewshedStatus', 'Error fetching viewshed data.', 'error-message');
            window.displayMessage('viewshedError', `Error: ${error.message}`, 'error-error');
            console.error("Error fetching viewshed data:", error);
            return null;
        }
    }

    /**
     * Deduplicates an array of horizon data objects based on unique latitude and longitude pairs.
     * It keeps the first occurrence of a unique lat/lon pair.
     *
     * @param {Array<Object>} horizonData - An array of objects, where each object is expected
     * to have 'horizonLat' and 'horizonLon' properties.
     * @returns {Array<Object>} A new array containing only unique horizon data points based on lat/lon.
     */
    function deduplicateHorizonData(horizonData) {
        if (!horizonData || !Array.isArray(horizonData) || horizonData.length === 0) {
            console.warn("deduplicateHorizonData: Input is not a valid array or is empty. Returning empty array.");
            return [];
        }

        const seenLocations = new Set(); // To store unique "lat,lon" strings
        const uniqueData = [];            // To store the deduplicated objects

        for (const point of horizonData) {
            // Ensure point and its properties exist and are numbers before processing
            if (point && typeof point.horizonLat === 'number' && !isNaN(point.horizonLat) &&
                typeof point.horizonLon === 'number' && !isNaN(point.horizonLon)) {

                // Create a unique string key for the latitude and longitude
                // Using a fixed number of decimal places for consistency and to avoid floating-point comparison issues
                const key = `${point.horizonLat.toFixed(6)},${point.horizonLon.toFixed(6)}`;

                if (!seenLocations.has(key)) {
                    seenLocations.add(key);
                    uniqueData.push(point);
                }
            } else {
                console.warn("deduplicateHorizonData: Skipping invalid point (missing/non-numeric lat/lon):", point);
            }
        }

        console.log(`Deduplication complete. Original size: ${horizonData.length}, Unique size: ${uniqueData.length}`);
        return uniqueData;
    }

    // Note: window.HC_runHWTIPCalculations is now defined at the top of the IIFE (after console setup)
    // to ensure it's available even if there are errors later in the script

    // --- Event Listener for Form Submission ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Assign global map and layersControl from Script B once DOM is ready
        map = window.map;
        layersControl = window.layersControl;
        observerMarker = window.bigMarker; // Script B's draggable marker

        const form = document.getElementById('azimuthForm');
        const hwtIdentifierInput = document.getElementById('hwtIdentifierInput');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // Only attach form listener if form exists (for integration with other pages)
        if (!form) {
            // Silently skip if form doesn't exist (expected in some page configurations)
            if (window.DEBUG_HWTIP) {
                console.log("hwtip.js: No azimuthForm found. Skipping form event listener. Form-based calculations disabled.");
            }
            return;
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission behavior (page reload)

            window.clearResultsDisplay(); // Use global clearResultsDisplay
            window.displayMessage('overallStatus', 'Starting terrain-adjusted azimuth calculation...', 'status');
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');

            const hwtId = hwtIdentifierInput.value.trim();

            if (!hwtId) {
                window.displayMessage('overallStatus', 'Error: Please enter a HeyWhatsThat Identifier.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return; // Exit early if hwtId is empty
            }

            let locationData = null;
            let horizonData = null;
            let anyCalculationFailed = false;

            // --- Fetch Location Data ---
            locationData = await fetchLocationData(hwtId);
            if (!locationData) {
                window.displayMessage('overallStatus', 'Calculation failed: Could not fetch location data.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // Update Script B's map and marker with fetched location data
            // This is for visual consistency, not for calculation input in Script C.
            if (map && observerMarker) {
                map.setView([locationData.latitude, locationData.longitude], map.getZoom());
                // observerMarker.setLatLng([locationData.latitude, locationData.longitude]); // This is now handled by our new marker
                document.getElementById('latbox').value = locationData.latitude.toFixed(6); // Format for display
                document.getElementById('lngbox').value = locationData.longitude.toFixed(6); // Format for display
                // observerMarker.bindPopup(`<b>Observer Location</b><br>Lat: ${locationData.latitude.toFixed(4)}, Lon: ${locationData.longitude.toFixed(4)}`).openPopup(); // Handled by our new marker
            } else {
                console.error("Leaflet map or observer marker not available from Script B. Ensure Script B is loaded and initializes 'window.map' and 'window.bigMarker'.");
                window.displayMessage('overallStatus', 'Error: Map components not ready. Ensure map script is loaded.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // --- Fetch Viewshed Data ---
            horizonData = await fetchHorizonDataHoriZONE(hwtId);
            if (!horizonData) {
                window.displayMessage('overallStatus', 'Calculation failed: Could not fetch viewshed data.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // --- Deduplicate horizon data ---
            horizonData = deduplicateHorizonData(horizonData);

            // CRITICAL: Ensure horizon data is sorted by azimuth (azi alt ordered) before calculations
            // This matches the old file behavior - horizon data must be sorted by azimuth
            if (horizonData && Array.isArray(horizonData) && horizonData.length > 0) {
                horizonData.sort((a, b) => a.azimuth - b.azimuth);
            }

            // Call the shared calculation function
            await window.HC_executeRiseSetCalculations(horizonData, locationData, anyCalculationFailed, loadingSpinner);
        });
    });

    // Replace the forward declaration with the actual implementation
    window.HC_executeRiseSetCalculations = async function(horizonData, locationData, anyCalculationFailed, loadingSpinner) {
            // Utility function to yield control to browser, allowing UI updates
            const yieldToBrowser = (ms = 10) => new Promise(resolve => setTimeout(resolve, ms));
            
            // Disable the save button when calculations start (if horizon-loadsave.js is loaded)
            if (typeof window.saveRiseSetLocations === 'function') {
                const saveButton = document.getElementById('btn-save-rise-set');
                if (saveButton) {
                    saveButton.disabled = true;
                }
            }
            
            // Clear center markers when starting new calculations
            window.centerMarkers = {};
            
            // Deactivate Quick View sidebar tab and clear buttons
            const quickViewTab = document.getElementById('quickview-tab');
            if (quickViewTab) {
                quickViewTab.style.opacity = '0.3';
                quickViewTab.style.pointerEvents = 'none';
            }
            const panelBody = document.querySelector('#lobipanel-quickview .panel-body');
            if (panelBody) {
                // Save the Info/Help section if it exists
                const helpLink = panelBody.querySelector('.panel-help-link');
                const helpContent = panelBody.querySelector('.panel-help-content');
                let helpLinkHTML = '';
                let helpContentHTML = '';
                if (helpLink) {
                    helpLinkHTML = helpLink.outerHTML;
                }
                if (helpContent) {
                    helpContentHTML = helpContent.outerHTML;
                }
                // Clear content but preserve Info/Help structure
                if (helpLinkHTML) {
                    panelBody.innerHTML = helpLinkHTML + (helpContentHTML || '');
                } else {
                    panelBody.innerHTML = '';
                }
            }

            window.displayMessage('overallStatus', "Calculating actual azimuths...", 'status');

            // --- CRITICAL: Ensure horizon data is sorted by azimuth (azi alt ordered) ---
            // This is essential for correct polygon creation and all calculations
            if (horizonData && Array.isArray(horizonData) && horizonData.length > 0) {
                horizonData.sort((a, b) => a.azimuth - b.azimuth);
            }

            // --- Viewshed Horizon Polygon ---
            // Changed from drawViewshedHorizonLine to drawViewshedHorizonPolygon
            // CRITICAL: Log first few horizon data points to verify structure matches CSV format
            if (horizonData && horizonData.length > 0) {
                console.log("First 3 horizon data points:", horizonData.slice(0, 3).map(p => ({
                    azimuth: p.azimuth,
                    altitude: p.altitude,
                    horizonLat: p.horizonLat,
                    horizonLon: p.horizonLon
                })));
            }
            const viewshedPolygon = drawViewshedHorizonLine(horizonData); // Function name remains drawViewshedHorizonLine but now returns L.Polygon
            if (viewshedPolygon) {
                let viewshedHorizonPolygonGroup = L.layerGroup();
                viewshedHorizonPolygonGroup.addLayer(viewshedPolygon);
                viewshedHorizonPolygonGroup.layerNameForControl = "Viewshed Horizon"; // Name for layers control
                const mapInstance = window.map || map;
                if (mapInstance) {
                    mapInstance.addLayer(viewshedHorizonPolygonGroup);
                }
                if (window.layersControl) {
                window.layersControl.addOverlay(viewshedHorizonPolygonGroup, viewshedHorizonPolygonGroup.layerNameForControl);
                }
                if (!window.scriptCOverlayGroups) window.scriptCOverlayGroups = [];
                window.scriptCOverlayGroups.push(viewshedHorizonPolygonGroup);
            } else {
                console.warn("Viewshed horizon polygon could not be drawn. Calculations might be affected.");
                window.displayMessage('viewshedStatus', 'Warning: Viewshed horizon polygon could not be drawn.', 'warn');
            }

            // --- Read Geometric Zero-Horizon Azimuth Values from Script A's Global Variables ---
            // These are calculated at geometric horizon (0°) with NO refraction, parallax, or semidiameter
            // We use the _geo variants which are pure spherical trigonometry calculations
            // Solstices
            let wsrZeroHorizonAzimuth = window.solsticeaziwinrise_geo || window.solsticeaziwinrise; // Fallback to original if _geo not available
            let wssZeroHorizonAzimuth = window.solsticeaziwinset_geo || window.solsticeaziwinset;
            let ssrZeroHorizonAzimuth = window.solsticeazisumrise_geo || window.solsticeazisumrise;
            let sssZeroHorizonAzimuth = window.solsticeazisumset_geo || window.solsticeazisumset;

            // Cross-Quarters (Updated to reflect Northmost/Southmost)
            let ncqrZeroHorizonAzimuth = window.crossquarterazisumrise_geo || window.crossquarterazisumrise; // Northmost Cross Quarter Rise
            let scqrZeroHorizonAzimuth = window.crossquarteraziwinrise_geo || window.crossquarteraziwinrise; // Southmost Cross Quarter Rise
            let ncqsZeroHorizonAzimuth = window.crossquarterazisumset_geo || window.crossquarterazisumset; // Northmost Cross Quarter Set
            let scqsZeroHorizonAzimuth = window.crossquarteraziwinset_geo || window.crossquarteraziwinset; // Southmost Cross Quarter Set

            // Major Lunar Standstills (Updated to reflect Northmost/Southmost)
            let nmlrZeroHorizonAzimuth = window.majorazisumrise_geo || window.majorazisumrise; // Northmost Major Lunar Rise
            let nmlsZeroHorizonAzimuth = window.majorazisumset_geo || window.majorazisumset; // Northmost Major Lunar Set
            let smlrZeroHorizonAzimuth = window.majoraziwinrise_geo || window.majoraziwinrise; // Southmost Major Lunar Rise
            let smlsZeroHorizonAzimuth = window.majoraziwinset_geo || window.majoraziwinset; // Southmost Major Lunar Set

            // Minor Lunar Standstills (Updated to reflect Northmost/Southmost and correct azimuth source)
            let nmnlrZeroHorizonAzimuth = window.minorazisumrise_geo || window.minorazisumrise; // Northmost Minor Lunar Rise
            let smnlrZeroHorizonAzimuth = window.minoraziwinrise_geo || window.minoraziwinrise; // Southmost Minor Lunar Rise
            let nmnlsZeroHorizonAzimuth = window.minorazisumset_geo || window.minorazisumset; // Northmost Minor Lunar Set
            let smnlsZeroHorizonAzimuth = window.minoraziwinset_geo || window.minoraziwinset; // Southmost Minor Lunar Set

            // Equinoxes (No seasonal distinction, simply rise/set)
            let erZeroHorizonAzimuth = window.equinoxazisumrise_geo || window.equinoxazisumrise;
            let esZeroHorizonAzimuth = window.equinoxazisumset_geo || window.equinoxazisumset;

            // --- Get Geometric Declination Values from Script A's Global Variables ---
            // Use the _geo variants which are pure geometric declination values (no corrections)
            // These are for terrain-adjusted calculations in hwtip.js
            const declinationDegSummerSolstice = window.declinationSummerSolstice_geo || window.declinationSummerSolstice;
            const declinationDegWinterSolstice = window.declinationWinterSolstice_geo || window.declinationWinterSolstice;
            const declinationDegEquinox = window.declinationEquinox_geo || window.declinationEquinox;
            const declinationDegCrossQuarterNorth = window.declinationCrossQuarterNorth_geo || window.declinationCrossQuarterNorth;
            const declinationDegCrossQuarterSouth = window.declinationCrossQuarterSouth_geo || window.declinationCrossQuarterSouth;
            const declinationDegMajorLunarNorth = window.declinationMajorLunarNorth_geo || window.declinationMajorLunarNorth;
            const declinationDegMajorLunarSouth = window.declinationMajorLunarSouth_geo || window.declinationMajorLunarSouth;
            const declinationDegMinorLunarNorth = window.declinationMinorLunarNorth_geo || window.declinationMinorLunarNorth;
            const declinationDegMinorLunarSouth = window.declinationMinorLunarSouth_geo || window.declinationMinorLunarSouth;

            // Updated NaN checks for new declination variables
            if (isNaN(declinationDegSummerSolstice)) {
                console.error("ERROR: Declination value for Summer Solstice (window.declinationSummerSolstice) is not a valid number. Please ensure Script A correctly sets it.");
                window.displayMessage('overallStatus', 'Error: Summer Solstice Declination data missing or invalid. Check Script A.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }
            if (isNaN(declinationDegWinterSolstice)) { console.warn("Warning: Winter Solstice Declination value is NaN."); }
            if (isNaN(declinationDegEquinox)) { console.warn("Warning: Equinox Declination value is NaN."); }
            if (isNaN(declinationDegCrossQuarterNorth)) { console.warn("Warning: North Cross Quarter Declination value is NaN."); }
            if (isNaN(declinationDegCrossQuarterSouth)) { console.warn("Warning: South Cross Quarter Declination value is NaN."); }
            if (isNaN(declinationDegMajorLunarNorth)) { console.warn("Warning: North Major Lunar Declination value is NaN."); }
            if (isNaN(declinationDegMajorLunarSouth)) { console.warn("Warning: South Major Lunar Declination value is NaN."); }
            if (isNaN(declinationDegMinorLunarNorth)) { console.warn("Warning: North Minor Lunar Declination value is NaN."); }
            if (isNaN(declinationDegMinorLunarSouth)) { console.warn("Warning: South Minor Lunar Declination value is NaN."); }


            // Get map instance
            const mapInstance = window.map || map;
            if (!mapInstance) {
                throw new Error("Map not available");
            }

            // --- Initialize a single layer group for all Solar-Lunar Rise/Set markers ---
            let solarLunarRiseSetGroup = L.layerGroup();
            solarLunarRiseSetGroup.layerNameForControl = "Solar-Lunar Rise/Set"; // Name for layers control
            mapInstance.addLayer(solarLunarRiseSetGroup); // Add to map immediately for visibility
            if (window.layersControl) {
            window.layersControl.addOverlay(solarLunarRiseSetGroup, solarLunarRiseSetGroup.layerNameForControl);
            }
            if (!window.scriptCOverlayGroups) window.scriptCOverlayGroups = [];
            window.scriptCOverlayGroups.push(solarLunarRiseSetGroup); // Add to Script C's managed layers

            // Create references to the combined group for backward compatibility in code
            let solsticesLayerGroup = solarLunarRiseSetGroup;
            let equinoxesLayerGroup = solarLunarRiseSetGroup;
            let crossQuartersLayerGroup = solarLunarRiseSetGroup;
            let majorLunarLayerGroup = solarLunarRiseSetGroup;
            let minorLunarLayerGroup = solarLunarRiseSetGroup;


            // --- Process Summer Solstice Rise (SSR) Upper Limb ---
            // isSunriseLikeSSR is determined based on the geometric horizon azimuth, which is generally correct for rise/set direction.
            const isSunriseLikeSSR = (window.normalizeAzimuth(ssrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(ssrZeroHorizonAzimuth) <= 180);

            let actualPointUL_SSR = null; // Declare with let and initialize to null
            actualPointUL_SSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SSR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSR, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            await yieldToBrowser(); // Allow UI update

            if (actualPointUL_SSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let ulMarker = drawIndividualPointMarker(actualPointUL_SSR, "SSR Upper Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (ulMarker) {
                    solsticesLayerGroup.addLayer(ulMarker);
                    console.log("SSR Upper Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSR Upper Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSR Upper Limb calculation failed.");
            }

            // --- Process Orthodrome Intersection for SSR (Visual only, not for initial guess of UL) ---
            // This call remains to draw the orange line and its intersection with the viewshed based on the geometric horizon.
            // Orthodrome intersection markers are styled within processOrthodromeIntersection
            const ssrIntersectionPoint = await processOrthodromeIntersection(ssrZeroHorizonAzimuth, locationData, viewshedPolygon, "SSR", null);

            // --- Process Summer Solstice Rise (SSR) Center ---
            let actualPointCenter_SSR = null; // Declare with let and initialize to null
            actualPointCenter_SSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SSR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSR, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            await yieldToBrowser(); // Allow UI update

            if (actualPointCenter_SSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let centerMarker = drawIndividualPointMarker(actualPointCenter_SSR, "SSR Center", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (centerMarker) {
                    solsticesLayerGroup.addLayer(centerMarker);
                    window.centerMarkers['SSR'] = centerMarker; // Store for quick view
                    console.log("SSR Center marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSR Center marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSR Center calculation failed.");
            }

            // --- Process Summer Solstice Rise (SSR) Lower Limb ---
            let actualPointLL_SSR = null; // Declare with let and initialize to null
            actualPointLL_SSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SSR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSR, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            await yieldToBrowser(); // Allow UI update

            if (actualPointLL_SSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let llMarker = drawIndividualPointMarker(actualPointLL_SSR, "SSR Lower Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (llMarker) {
                    solsticesLayerGroup.addLayer(llMarker);
                    console.log("SSR Lower Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSR Lower Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSR Lower Limb calculation failed.");
            }
            
            await yieldToBrowser(20); // Allow UI update after completing SSR event

            // --- Process Orthodrome Intersection for WSR (Visual only) ---
            const wsrIntersectionPoint = await processOrthodromeIntersection(wsrZeroHorizonAzimuth, locationData, viewshedPolygon, "WSR", null);

            // --- Process Winter Solstice Rise (WSR) Upper Limb ---
            const isSunriseLikeWSR = (window.normalizeAzimuth(wsrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(wsrZeroHorizonAzimuth) <= 180);
            let actualPointUL_WSR = null; // Declare with let and initialize to null
            actualPointUL_WSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "WSR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSR, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointUL_WSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let ulMarkerWSR = drawIndividualPointMarker(actualPointUL_WSR, "WSR Upper Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (ulMarkerWSR) {
                    solsticesLayerGroup.addLayer(ulMarkerWSR);
                    console.log("WSR Upper Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSR Upper Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSR Upper Limb calculation failed.");
            }

            // --- Process Winter Solstice Rise (WSR) Center ---
            let actualPointCenter_WSR = null; // Declare with let and initialize to null
            actualPointCenter_WSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "WSR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSR, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointCenter_WSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let centerMarkerWSR = drawIndividualPointMarker(actualPointCenter_WSR, "WSR Center", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (centerMarkerWSR) {
                    solsticesLayerGroup.addLayer(centerMarkerWSR);
                    window.centerMarkers['WSR'] = centerMarkerWSR; // Store for quick view
                    console.log("WSR Center marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSR Center marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSR Center calculation failed.");
            }

            // --- Process Winter Solstice Rise (WSR) Lower Limb ---
            let actualPointLL_WSR = null; // Declare with let and initialize to null
            actualPointLL_WSR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "WSR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSR, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointLL_WSR) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let llMarkerWSR = drawIndividualPointMarker(actualPointLL_WSR, "WSR Lower Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (llMarkerWSR) {
                    solsticesLayerGroup.addLayer(llMarkerWSR);
                    console.log("WSR Lower Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSR Lower Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSR Lower Limb calculation failed.");
            }
            
            await yieldToBrowser(20); // Allow UI update after completing WSR event

            // --- Process Orthodrome Intersection for SSS (Visual only) ---
            const sssIntersectionPoint = await processOrthodromeIntersection(sssZeroHorizonAzimuth, locationData, viewshedPolygon, "SSS", null);

            // --- Process Summer Solstice Set (SSS) Upper Limb ---
            const isSunriseLikeSSS = (window.normalizeAzimuth(sssZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(sssZeroHorizonAzimuth) <= 180); // Should be false for set
            let actualPointUL_SSS = null; // Declare with let and initialize to null
            actualPointUL_SSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SSS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSS, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointUL_SSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let ulMarkerSSS = drawIndividualPointMarker(actualPointUL_SSS, "SSS Upper Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (ulMarkerSSS) {
                    solsticesLayerGroup.addLayer(ulMarkerSSS);
                    console.log("SSS Upper Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSS Upper Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSS Upper Limb calculation failed.");
            }

            // --- Process Summer Solstice Set (SSS) Center ---
            let actualPointCenter_SSS = null; // Declare with let and initialize to null
            actualPointCenter_SSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SSS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSS, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointCenter_SSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let centerMarkerSSS = drawIndividualPointMarker(actualPointCenter_SSS, "SSS Center", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (centerMarkerSSS) {
                    solsticesLayerGroup.addLayer(centerMarkerSSS);
                    window.centerMarkers['SSS'] = centerMarkerSSS; // Store for quick view
                    console.log("SSS Center marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSS Center marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSS Center calculation failed.");
            }

            // --- Process Summer Solstice Set (SSS) Lower Limb ---
            let actualPointLL_SSS = null; // Declare with let and initialize to null
            actualPointLL_SSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SSS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSSS, declinationDegSummerSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointLL_SSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let llMarkerSSS = drawIndividualPointMarker(actualPointLL_SSS, "SSS Lower Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (llMarkerSSS) {
                    solsticesLayerGroup.addLayer(llMarkerSSS);
                    console.log("SSS Lower Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw SSS Lower Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("SSS Lower Limb calculation failed.");
            }
            
            await yieldToBrowser(20); // Allow UI update after completing SSS event

            // --- Process Orthodrome Intersection for WSS (Visual only) ---
            const wssIntersectionPoint = await processOrthodromeIntersection(wssZeroHorizonAzimuth, locationData, viewshedPolygon, "WSS", null);

            // --- Process Winter Solstice Set (WSS) Upper Limb ---
            const isSunriseLikeWSS = (window.normalizeAzimuth(wssZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(wssZeroHorizonAzimuth) <= 180); // Should be false for set
            let actualPointUL_WSS = null; // Declare with let and initialize to null
            actualPointUL_WSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "WSS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSS, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointUL_WSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let ulMarkerWSS = drawIndividualPointMarker(actualPointUL_WSS, "WSS Upper Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (ulMarkerWSS) {
                    solsticesLayerGroup.addLayer(ulMarkerWSS);
                    console.log("WSS Upper Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSS Upper Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSS Upper Limb calculation failed.");
            }

            // --- Process Winter Solstice Set (WSS) Center ---
            let actualPointCenter_WSS = null; // Declare with let and initialize to null
            actualPointCenter_WSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "WSS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSS, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointCenter_WSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let centerMarkerWSS = drawIndividualPointMarker(actualPointCenter_WSS, "WSS Center", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (centerMarkerWSS) {
                    solsticesLayerGroup.addLayer(centerMarkerWSS);
                    window.centerMarkers['WSS'] = centerMarkerWSS; // Store for quick view
                    console.log("WSS Center marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSS Center marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSS Center calculation failed.");
            }

            // --- Process Winter Solstice Set (WSS) Lower Limb ---
            let actualPointLL_WSS = null; // Declare with let and initialize to null
            actualPointLL_WSS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "WSS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeWSS, declinationDegWinterSolstice, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );

            if (actualPointLL_WSS) {
                // Solstice markers: 50% current size (radius 2.5), Fill Orange
                let llMarkerWSS = drawIndividualPointMarker(actualPointLL_WSS, "WSS Lower Limb", '#000000', POLYGON_COLORS[0], 2.5, 1);
                if (llMarkerWSS) {
                    solsticesLayerGroup.addLayer(llMarkerWSS);
                    console.log("WSS Lower Limb marker added to Solstices layer group.");
                } else {
                    anyCalculationFailed = true;
                    console.error("Failed to draw WSS Lower Limb marker.");
                }
            } else {
                anyCalculationFailed = true;
                console.error("WSS Lower Limb calculation failed.");
            }
            
            await yieldToBrowser(20); // Allow UI update after completing WSS event

            // --- Process Equinox Rise (ER) ---
            const isSunriseLikeER = (window.normalizeAzimuth(erZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(erZeroHorizonAzimuth) <= 180);
            const erIntersectionPoint = await processOrthodromeIntersection(erZeroHorizonAzimuth, locationData, viewshedPolygon, "ER", null);

            let actualPointUL_ER = null; // Declare with let and initialize to null
            actualPointUL_ER = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "ER Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeER, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointUL_ER) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let ulMarkerER = drawIndividualPointMarker(actualPointUL_ER, "ER Upper Limb", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (ulMarkerER) { equinoxesLayerGroup.addLayer(ulMarkerER); } else { anyCalculationFailed = true; console.error("Failed to draw ER Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("ER Upper Limb calculation failed."); }

            let actualPointCenter_ER = null; // Declare with let and initialize to null
            actualPointCenter_ER = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "ER Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeER, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointCenter_ER) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let centerMarkerER = drawIndividualPointMarker(actualPointCenter_ER, "ER Center", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (centerMarkerER) { 
                    equinoxesLayerGroup.addLayer(centerMarkerER); 
                    window.centerMarkers['ER'] = centerMarkerER; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw ER Center marker."); }
            } else { anyCalculationFailed = true; console.error("ER Center calculation failed."); }

            let actualPointLL_ER = null; // Declare with let and initialize to null
            actualPointLL_ER = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "ER Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeER, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointLL_ER) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let llMarkerER = drawIndividualPointMarker(actualPointLL_ER, "ER Lower Limb", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (llMarkerER) { equinoxesLayerGroup.addLayer(llMarkerER); } else { anyCalculationFailed = true; console.error("Failed to draw ER Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("ER Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing ER event

            // --- Process Equinox Set (ES) ---
            const isSunriseLikeES = (window.normalizeAzimuth(esZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(esZeroHorizonAzimuth) <= 180); // Should be false for set
            const esIntersectionPoint = await processOrthodromeIntersection(esZeroHorizonAzimuth, locationData, viewshedPolygon, "ES", null);

            let actualPointUL_ES = null; // Declare with let and initialize to null
            actualPointUL_ES = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "ES Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeES, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointUL_ES) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let ulMarkerES = drawIndividualPointMarker(actualPointUL_ES, "ES Upper Limb", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (ulMarkerES) { equinoxesLayerGroup.addLayer(ulMarkerES); } else { anyCalculationFailed = true; console.error("Failed to draw ES Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("ES Upper Limb calculation failed."); }

            let actualPointCenter_ES = null; // Declare with let and initialize to null
            actualPointCenter_ES = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "ES Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeES, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointCenter_ES) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let centerMarkerES = drawIndividualPointMarker(actualPointCenter_ES, "ES Center", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (centerMarkerES) { 
                    equinoxesLayerGroup.addLayer(centerMarkerES); 
                    window.centerMarkers['ES'] = centerMarkerES; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw ES Center marker."); }
            } else { anyCalculationFailed = true; console.error("ES Center calculation failed."); }

            let actualPointLL_ES = null; // Declare with let and initialize to null
            actualPointLL_ES = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "ES Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeES, declinationDegEquinox, locationData.elevation_amsl, false, false // Not lunar, Not cross-quarter
            );
            if (actualPointLL_ES) {
                // Equinox markers: 50% current size (radius 2.5), Fill Yellow
                let llMarkerES = drawIndividualPointMarker(actualPointLL_ES, "ES Lower Limb", '#000000', POLYGON_COLORS[1], 2.5, 1);
                if (llMarkerES) { equinoxesLayerGroup.addLayer(llMarkerES); } else { anyCalculationFailed = true; console.error("Failed to draw ES Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("ES Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing ES event

            // --- Process Northmost Cross Quarter Rise (NCQR) ---
            const isSunriseLikeNCQR = (window.normalizeAzimuth(ncqrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(ncqrZeroHorizonAzimuth) <= 180);
            const ncqrIntersectionPoint = await processOrthodromeIntersection(ncqrZeroHorizonAzimuth, locationData, viewshedPolygon, "NCQR", null);

            let actualPointUL_NCQR = null; // Declare with let and initialize to null
            actualPointUL_NCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NCQR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQR, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointUL_NCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let ulMarkerNCQR = drawIndividualPointMarker(actualPointUL_NCQR, "NCQR Upper Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (ulMarkerNCQR) { crossQuartersLayerGroup.addLayer(ulMarkerNCQR); } else { anyCalculationFailed = true; console.error("Failed to draw NCQR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NCQR Upper Limb calculation failed."); }

            let actualPointCenter_NCQR = null; // Declare with let and initialize to null
            actualPointCenter_NCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NCQR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQR, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointCenter_NCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let centerMarkerNCQR = drawIndividualPointMarker(actualPointCenter_NCQR, "NCQR Center", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (centerMarkerNCQR) { 
                    crossQuartersLayerGroup.addLayer(centerMarkerNCQR); 
                    window.centerMarkers['NCQR'] = centerMarkerNCQR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NCQR Center marker."); }
            } else { anyCalculationFailed = true; console.error("NCQR Center calculation failed."); }

            let actualPointLL_NCQR = null; // Declare with let and initialize to null
            actualPointLL_NCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NCQR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQR, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointLL_NCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let llMarkerNCQR = drawIndividualPointMarker(actualPointLL_NCQR, "NCQR Lower Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (llMarkerNCQR) { crossQuartersLayerGroup.addLayer(llMarkerNCQR); } else { anyCalculationFailed = true; console.error("Failed to draw NCQR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NCQR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NCQR event

            // --- Process Southmost Cross Quarter Rise (SCQR) ---
            const isSunriseLikeSCQR = (window.normalizeAzimuth(scqrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(scqrZeroHorizonAzimuth) <= 180);
            const scqrIntersectionPoint = await processOrthodromeIntersection(scqrZeroHorizonAzimuth, locationData, viewshedPolygon, "SCQR", null);

            let actualPointUL_SCQR = null; // Declare with let and initialize to null
            actualPointUL_SCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SCQR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQR, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointUL_SCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let ulMarkerSCQR = drawIndividualPointMarker(actualPointUL_SCQR, "SCQR Upper Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (ulMarkerSCQR) { crossQuartersLayerGroup.addLayer(ulMarkerSCQR); } else { anyCalculationFailed = true; console.error("Failed to draw SCQR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SCQR Upper Limb calculation failed."); }

            let actualPointCenter_SCQR = null; // Declare with let and initialize to null
            actualPointCenter_SCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SCQR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQR, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointCenter_SCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let centerMarkerSCQR = drawIndividualPointMarker(actualPointCenter_SCQR, "SCQR Center", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (centerMarkerSCQR) { 
                    crossQuartersLayerGroup.addLayer(centerMarkerSCQR); 
                    window.centerMarkers['SCQR'] = centerMarkerSCQR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SCQR Center marker."); }
            } else { anyCalculationFailed = true; console.error("SCQR Center calculation failed."); }

            let actualPointLL_SCQR = null; // Declare with let and initialize to null
            actualPointLL_SCQR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SCQR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQR, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointLL_SCQR) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let llMarkerSCQR = drawIndividualPointMarker(actualPointLL_SCQR, "SCQR Lower Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (llMarkerSCQR) { crossQuartersLayerGroup.addLayer(llMarkerSCQR); } else { anyCalculationFailed = true; console.error("Failed to draw SCQR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SCQR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SCQR event

            // --- Process Northmost Cross Quarter Set (NCQS) ---
            const isSunriseLikeNCQS = (window.normalizeAzimuth(ncqsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(ncqsZeroHorizonAzimuth) <= 180); // Should be false for set
            const ncqsIntersectionPoint = await processOrthodromeIntersection(ncqsZeroHorizonAzimuth, locationData, viewshedPolygon, "NCQS", null);

            let actualPointUL_NCQS = null; // Declare with let and initialize to null
            actualPointUL_NCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NCQS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQS, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointUL_NCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let ulMarkerNCQS = drawIndividualPointMarker(actualPointUL_NCQS, "NCQS Upper Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (ulMarkerNCQS) { crossQuartersLayerGroup.addLayer(ulMarkerNCQS); } else { anyCalculationFailed = true; console.error("Failed to draw NCQS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NCQS Upper Limb calculation failed."); }

            let actualPointCenter_NCQS = null; // Declare with let and initialize to null
            actualPointCenter_NCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NCQS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQS, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointCenter_NCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let centerMarkerNCQS = drawIndividualPointMarker(actualPointCenter_NCQS, "NCQS Center", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (centerMarkerNCQS) { 
                    crossQuartersLayerGroup.addLayer(centerMarkerNCQS); 
                    window.centerMarkers['NCQS'] = centerMarkerNCQS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NCQS Center marker."); }
            } else { anyCalculationFailed = true; console.error("NCQS Center calculation failed."); }

            let actualPointLL_NCQS = null; // Declare with let and initialize to null
            actualPointLL_NCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NCQS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNCQS, declinationDegCrossQuarterNorth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointLL_NCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let llMarkerNCQS = drawIndividualPointMarker(actualPointLL_NCQS, "NCQS Lower Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (llMarkerNCQS) { crossQuartersLayerGroup.addLayer(llMarkerNCQS); } else { anyCalculationFailed = true; console.error("Failed to draw NCQS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NCQS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NCQS event

            // --- Process Southmost Cross Quarter Set (SCQS) ---
            const isSunriseLikeSCQS = (window.normalizeAzimuth(scqsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(scqsZeroHorizonAzimuth) <= 180); // Should be false for set
            const scqsIntersectionPoint = await processOrthodromeIntersection(scqsZeroHorizonAzimuth, locationData, viewshedPolygon, "SCQS", null);

            let actualPointUL_SCQS = null; // Declare with let and initialize to null
            actualPointUL_SCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SCQS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQS, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointUL_SCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let ulMarkerSCQS = drawIndividualPointMarker(actualPointUL_SCQS, "SCQS Upper Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (ulMarkerSCQS) { crossQuartersLayerGroup.addLayer(ulMarkerSCQS); } else { anyCalculationFailed = true; console.error("Failed to draw SCQS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SCQS Upper Limb calculation failed."); }

            let actualPointCenter_SCQS = null; // Declare with let and initialize to null
            actualPointCenter_SCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SCQS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQS, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointCenter_SCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let centerMarkerSCQS = drawIndividualPointMarker(actualPointCenter_SCQS, "SCQS Center", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (centerMarkerSCQS) { 
                    crossQuartersLayerGroup.addLayer(centerMarkerSCQS); 
                    window.centerMarkers['SCQS'] = centerMarkerSCQS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SCQS Center marker."); }
            } else { anyCalculationFailed = true; console.error("SCQS Center calculation failed."); }

            let actualPointLL_SCQS = null; // Declare with let and initialize to null
            actualPointLL_SCQS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SCQS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSCQS, declinationDegCrossQuarterSouth, locationData.elevation_amsl, false, true // Not lunar, IS cross-quarter
            );
            if (actualPointLL_SCQS) {
                // Cross Quarters markers: 50% current size (radius 2.5), Fill Green
                let llMarkerSCQS = drawIndividualPointMarker(actualPointLL_SCQS, "SCQS Lower Limb", '#000000', POLYGON_COLORS[2], 2.5, 1);
                if (llMarkerSCQS) { crossQuartersLayerGroup.addLayer(llMarkerSCQS); } else { anyCalculationFailed = true; console.error("Failed to draw SCQS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SCQS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SCQS event

            // --- Process Northmost Major Lunar Rise (NMLR) ---
            const isSunriseLikeNMLR = (window.normalizeAzimuth(nmlrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(nmlrZeroHorizonAzimuth) <= 180);
            const nmlrIntersectionPoint = await processOrthodromeIntersection(nmlrZeroHorizonAzimuth, locationData, viewshedPolygon, "NMLR", null);

            let actualPointUL_NMLR = null; // Declare with let and initialize to null
            actualPointUL_NMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NMLR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLR, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_NMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let ulMarkerNMLR = drawIndividualPointMarker(actualPointUL_NMLR, "NMLR Upper Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (ulMarkerNMLR) { majorLunarLayerGroup.addLayer(ulMarkerNMLR); } else { anyCalculationFailed = true; console.error("Failed to draw NMLR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMLR Upper Limb calculation failed."); }

            let actualPointCenter_NMLR = null; // Declare with let and initialize to null
            actualPointCenter_NMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NMLR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLR, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_NMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let centerMarkerNMLR = drawIndividualPointMarker(actualPointCenter_NMLR, "NMLR Center", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (centerMarkerNMLR) { 
                    majorLunarLayerGroup.addLayer(centerMarkerNMLR); 
                    window.centerMarkers['NMLR'] = centerMarkerNMLR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NMLR Center marker."); }
            } else { anyCalculationFailed = true; console.error("NMLR Center calculation failed."); }

            let actualPointLL_NMLR = null; // Declare with let and initialize to null
            actualPointLL_NMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NMLR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLR, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_NMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let llMarkerNMLR = drawIndividualPointMarker(actualPointLL_NMLR, "NMLR Lower Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (llMarkerNMLR) { majorLunarLayerGroup.addLayer(llMarkerNMLR); } else { anyCalculationFailed = true; console.error("Failed to draw NMLR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMLR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NMLR event

            // --- Process Southmost Major Lunar Rise (SMLR) ---
            const isSunriseLikeSMLR = (window.normalizeAzimuth(smlrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(smlrZeroHorizonAzimuth) <= 180);
            const smlrIntersectionPoint = await processOrthodromeIntersection(smlrZeroHorizonAzimuth, locationData, viewshedPolygon, "SMLR", null);

            let actualPointUL_SMLR = null; // Declare with let and initialize to null
            actualPointUL_SMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SMLR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLR, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_SMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let ulMarkerSMLR = drawIndividualPointMarker(actualPointUL_SMLR, "SMLR Upper Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (ulMarkerSMLR) { majorLunarLayerGroup.addLayer(ulMarkerSMLR); } else { anyCalculationFailed = true; console.error("Failed to draw SMLR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMLR Upper Limb calculation failed."); }

            let actualPointCenter_SMLR = null; // Declare with let and initialize to null
            actualPointCenter_SMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SMLR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLR, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_SMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let centerMarkerSMLR = drawIndividualPointMarker(actualPointCenter_SMLR, "SMLR Center", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (centerMarkerSMLR) { 
                    majorLunarLayerGroup.addLayer(centerMarkerSMLR); 
                    window.centerMarkers['SMLR'] = centerMarkerSMLR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SMLR Center marker."); }
            } else { anyCalculationFailed = true; console.error("SMLR Center calculation failed."); }

            let actualPointLL_SMLR = null; // Declare with let and initialize to null
            actualPointLL_SMLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SMLR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLR, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_SMLR) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let llMarkerSMLR = drawIndividualPointMarker(actualPointLL_SMLR, "SMLR Lower Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (llMarkerSMLR) { majorLunarLayerGroup.addLayer(llMarkerSMLR); } else { anyCalculationFailed = true; console.error("Failed to draw SMLR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMLR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SMLR event

            // --- Process Northmost Major Lunar Set (NMLS) ---
            const isSunriseLikeNMLS = (window.normalizeAzimuth(nmlsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(nmlsZeroHorizonAzimuth) <= 180); // Should be false for set
            const nmlsIntersectionPoint = await processOrthodromeIntersection(nmlsZeroHorizonAzimuth, locationData, viewshedPolygon, "NMLS", null);

            let actualPointUL_NMLS = null; // Declare with let and initialize to null
            actualPointUL_NMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NMLS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLS, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_NMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let ulMarkerNMLS = drawIndividualPointMarker(actualPointUL_NMLS, "NMLS Upper Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (ulMarkerNMLS) { majorLunarLayerGroup.addLayer(ulMarkerNMLS); } else { anyCalculationFailed = true; console.error("Failed to draw NMLS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMLS Upper Limb calculation failed."); }

            let actualPointCenter_NMLS = null; // Declare with let and initialize to null
            actualPointCenter_NMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NMLS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLS, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_NMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let centerMarkerNMLS = drawIndividualPointMarker(actualPointCenter_NMLS, "NMLS Center", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (centerMarkerNMLS) { 
                    majorLunarLayerGroup.addLayer(centerMarkerNMLS); 
                    window.centerMarkers['NMLS'] = centerMarkerNMLS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NMLS Center marker."); }
            } else { anyCalculationFailed = true; console.error("NMLS Center calculation failed."); }

            let actualPointLL_NMLS = null; // Declare with let and initialize to null
            actualPointLL_NMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NMLS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMLS, declinationDegMajorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_NMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let llMarkerNMLS = drawIndividualPointMarker(actualPointLL_NMLS, "NMLS Lower Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (llMarkerNMLS) { majorLunarLayerGroup.addLayer(llMarkerNMLS); } else { anyCalculationFailed = true; console.error("Failed to draw NMLS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMLS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NMLS event

            // --- Process Southmost Major Lunar Set (SMLS) ---
            const isSunriseLikeSMLS = (window.normalizeAzimuth(smlsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(smlsZeroHorizonAzimuth) <= 180); // Should be false for set
            const smlsIntersectionPoint = await processOrthodromeIntersection(smlsZeroHorizonAzimuth, locationData, viewshedPolygon, "SMLS", null);

            let actualPointUL_SMLS = null;
            actualPointUL_SMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SMLS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLS, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_SMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let ulMarkerSMLS = drawIndividualPointMarker(actualPointUL_SMLS, "SMLS Upper Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (ulMarkerSMLS) { majorLunarLayerGroup.addLayer(ulMarkerSMLS); } else { anyCalculationFailed = true; console.error("Failed to draw SMLS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMLS Upper Limb calculation failed."); }

            let actualPointCenter_SMLS = null;
            actualPointCenter_SMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SMLS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLS, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_SMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let centerMarkerSMLS = drawIndividualPointMarker(actualPointCenter_SMLS, "SMLS Center", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (centerMarkerSMLS) { 
                    majorLunarLayerGroup.addLayer(centerMarkerSMLS); 
                    window.centerMarkers['SMLS'] = centerMarkerSMLS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SMLS Center marker."); }
            } else { anyCalculationFailed = true; console.error("SMLS Center calculation failed."); }

            let actualPointLL_SMLS = null;
            actualPointLL_SMLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SMLS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMLS, declinationDegMajorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_SMLS) {
                // Major Standstill markers: 50% current size (radius 2.5), Fill Dark Blue
                let llMarkerSMLS = drawIndividualPointMarker(actualPointLL_SMLS, "SMLS Lower Limb", '#000000', POLYGON_COLORS[3], 2.5, 1);
                if (llMarkerSMLS) { majorLunarLayerGroup.addLayer(llMarkerSMLS); } else { anyCalculationFailed = true; console.error("Failed to draw SMLS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMLS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SMLS event

            // --- Process Northmost Minor Lunar Rise (NMNLR) ---
            const isSunriseLikeNMNLR = (window.normalizeAzimuth(nmnlrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(nmnlrZeroHorizonAzimuth) <= 180);
            const nmnlrIntersectionPoint = await processOrthodromeIntersection(nmnlrZeroHorizonAzimuth, locationData, viewshedPolygon, "NMNLR", null);

            let actualPointUL_NMNLR = null; // Declare with let and initialize to null
            actualPointUL_NMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NMNLR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLR, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_NMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let ulMarkerNMNLR = drawIndividualPointMarker(actualPointUL_NMNLR, "NMNLR Upper Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (ulMarkerNMNLR) { minorLunarLayerGroup.addLayer(ulMarkerNMNLR); } else { anyCalculationFailed = true; console.error("Failed to draw NMNLR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLR Upper Limb calculation failed."); }

            let actualPointCenter_NMNLR = null; // Declare with let and initialize to null
            actualPointCenter_NMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NMNLR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLR, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_NMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let centerMarkerNMNLR = drawIndividualPointMarker(actualPointCenter_NMNLR, "NMNLR Center", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (centerMarkerNMNLR) { 
                    minorLunarLayerGroup.addLayer(centerMarkerNMNLR); 
                    window.centerMarkers['NMNLR'] = centerMarkerNMNLR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NMNLR Center marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLR Center calculation failed."); }

            let actualPointLL_NMNLR = null; // Declare with let and initialize to null
            actualPointLL_NMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NMNLR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLR, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_NMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let llMarkerNMNLR = drawIndividualPointMarker(actualPointLL_NMNLR, "NMNLR Lower Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (llMarkerNMNLR) { minorLunarLayerGroup.addLayer(llMarkerNMNLR); } else { anyCalculationFailed = true; console.error("Failed to draw NMNLR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NMNLR event

            // --- Process Southmost Minor Lunar Rise (SMNLR) ---
            const isSunriseLikeSMNLR = (window.normalizeAzimuth(smnlrZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(smnlrZeroHorizonAzimuth) <= 180);
            const smnlrIntersectionPoint = await processOrthodromeIntersection(smnlrZeroHorizonAzimuth, locationData, viewshedPolygon, "SMNLR", null);

            let actualPointUL_SMNLR = null; // Declare with let and initialize to null
            actualPointUL_SMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SMNLR Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLR, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_SMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let ulMarkerSMNLR = drawIndividualPointMarker(actualPointUL_SMNLR, "SMNLR Upper Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (ulMarkerSMNLR) { minorLunarLayerGroup.addLayer(ulMarkerSMNLR); } else { anyCalculationFailed = true; console.error("Failed to draw SMNLR Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLR Upper Limb calculation failed."); }

            let actualPointCenter_SMNLR = null; // Declare with let and initialize to null
            actualPointCenter_SMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SMNLR Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLR, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_SMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let centerMarkerSMNLR = drawIndividualPointMarker(actualPointCenter_SMNLR, "SMNLR Center", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (centerMarkerSMNLR) { 
                    minorLunarLayerGroup.addLayer(centerMarkerSMNLR); 
                    window.centerMarkers['SMNLR'] = centerMarkerSMNLR; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SMNLR Center marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLR Center calculation failed."); }

            let actualPointLL_SMNLR = null; // Declare with let and initialize to null
            actualPointLL_SMNLR = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SMNLR Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLR, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_SMNLR) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let llMarkerSMNLR = drawIndividualPointMarker(actualPointLL_SMNLR, "SMNLR Lower Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (llMarkerSMNLR) { minorLunarLayerGroup.addLayer(llMarkerSMNLR); } else { anyCalculationFailed = true; console.error("Failed to draw SMNLR Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLR Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SMNLR event

            // --- Process Northmost Minor Lunar Set (NMNLS) ---
            const isSunriseLikeNMNLS = (window.normalizeAzimuth(nmnlsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(nmnlsZeroHorizonAzimuth) <= 180); // Should be false for set
            const nmnlsIntersectionPoint = await processOrthodromeIntersection(nmnlsZeroHorizonAzimuth, locationData, viewshedPolygon, "NMNLS", null);

            let actualPointUL_NMNLS = null; // Declare with let and initialize to null
            actualPointUL_NMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "NMNLS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLS, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_NMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let ulMarkerNMNLS = drawIndividualPointMarker(actualPointUL_NMNLS, "NMNLS Upper Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (ulMarkerNMNLS) { minorLunarLayerGroup.addLayer(ulMarkerNMNLS); } else { anyCalculationFailed = true; console.error("Failed to draw NMNLS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLS Upper Limb calculation failed."); }

            let actualPointCenter_NMNLS = null; // Declare with let and initialize to null
            actualPointCenter_NMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "NMNLS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLS, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_NMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let centerMarkerNMNLS = drawIndividualPointMarker(actualPointCenter_NMNLS, "NMNLS Center", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (centerMarkerNMNLS) { 
                    minorLunarLayerGroup.addLayer(centerMarkerNMNLS); 
                    window.centerMarkers['NMNLS'] = centerMarkerNMNLS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw NMNLS Center marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLS Center calculation failed."); }

            let actualPointLL_NMNLS = null; // Declare with let and initialize to null
            actualPointLL_NMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "NMNLS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeNMNLS, declinationDegMinorLunarNorth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_NMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let llMarkerNMNLS = drawIndividualPointMarker(actualPointLL_NMNLS, "NMNLS Lower Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (llMarkerNMNLS) { minorLunarLayerGroup.addLayer(llMarkerNMNLS); } else { anyCalculationFailed = true; console.error("Failed to draw NMNLS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("NMNLS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing NMNLS event

            // --- Process Southmost Minor Lunar Set (SMNLS) ---
            const isSunriseLikeSMNLS = (window.normalizeAzimuth(smnlsZeroHorizonAzimuth) >= 0 && window.normalizeAzimuth(smnlsZeroHorizonAzimuth) <= 180); // Should be false for set
            const smnlsIntersectionPoint = await processOrthodromeIntersection(smnlsZeroHorizonAzimuth, locationData, viewshedPolygon, "SMNLS", null);

            let actualPointUL_SMNLS = null;
            actualPointUL_SMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'UL', "SMNLS Upper Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLS, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointUL_SMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let ulMarkerSMNLS = drawIndividualPointMarker(actualPointUL_SMNLS, "SMNLS Upper Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (ulMarkerSMNLS) { minorLunarLayerGroup.addLayer(ulMarkerSMNLS); } else { anyCalculationFailed = true; console.error("Failed to draw SMNLS Upper Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLS Upper Limb calculation failed."); }

            let actualPointCenter_SMNLS = null;
            actualPointCenter_SMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'Center', "SMNLS Center at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLS, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointCenter_SMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let centerMarkerSMNLS = drawIndividualPointMarker(actualPointCenter_SMNLS, "SMNLS Center", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (centerMarkerSMNLS) { 
                    minorLunarLayerGroup.addLayer(centerMarkerSMNLS); 
                    window.centerMarkers['SMNLS'] = centerMarkerSMNLS; // Store for quick view
                } else { anyCalculationFailed = true; console.error("Failed to draw SMNLS Center marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLS Center calculation failed."); }

            let actualPointLL_SMNLS = null;
            actualPointLL_SMNLS = await window.findActualAzimuthForTargetApparentAltitude(
                horizonData, 'LL', "SMNLS Lower Limb at Horizon", locationData.latitude, locationData.longitude, isSunriseLikeSMNLS, declinationDegMinorLunarSouth, locationData.elevation_amsl, true, false // IS LUNAR, Not cross-quarter
            );
            if (actualPointLL_SMNLS) {
                // Minor Standstill markers: 50% current size (radius 2.5), Fill Red
                let llMarkerSMNLS = drawIndividualPointMarker(actualPointLL_SMNLS, "SMNLS Lower Limb", '#000000', POLYGON_COLORS[4], 2.5, 1);
                if (llMarkerSMNLS) { minorLunarLayerGroup.addLayer(llMarkerSMNLS); } else { anyCalculationFailed = true; console.error("Failed to draw SMNLS Lower Limb marker."); }
            } else { anyCalculationFailed = true; console.error("SMNLS Lower Limb calculation failed."); }
            
            await yieldToBrowser(20); // Allow UI update after completing SMNLS event

            // Adjust map bounds to encompass all drawn elements
            let bounds = new L.LatLngBounds();
            window.scriptCOverlayGroups.forEach(layerGroup => {
                if (window.map.hasLayer(layerGroup)) {
                    layerGroup.eachLayer(function(subLayer) {
                        if (subLayer.getLatLngs) { // For polylines/polygons
                            try {
                                bounds.extend(subLayer.getBounds());
                            } catch (e) {
                                console.warn("Error getting bounds for subLayer (polyline/polygon), skipping:", e);
                            }
                        } else if (subLayer.getLatLng) { // For markers
                            try {
                                bounds.extend(subLayer.getLatLng());
                            } catch (e) {
                                console.warn("Error getting LatLng for subLayer (marker), skipping:", e);
                            }
                        }
                    });
                }
            });

            if (bounds.isValid()) {
                const mapInstance = window.map || map;
                if (mapInstance) {
                    mapInstance.fitBounds(bounds, { padding: [50, 50] });
                }
            } else {
                console.warn("Calculated bounds are invalid. Cannot fit map to bounds.");
            }

            if (!anyCalculationFailed) {
                window.displayMessage('overallStatus', 'All Solstice, Equinox, Cross-Quarter, and Lunar Standstill calculations complete.', 'success');
            } else {
                window.displayMessage('overallStatus', 'Calculations finished with issues. Check console for more info.', 'warn');
            }
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            
            // Enable the save button after calculations complete (if horizon-loadsave.js is loaded)
            if (typeof window.saveRiseSetLocations === 'function') {
                const saveButton = document.getElementById('btn-save-rise-set');
                if (saveButton) {
                    saveButton.disabled = false;
                }
            }
            
            // Check for rise/set locations and show buttons (if horizon.js is loaded)
            if (typeof window.HC_checkRiseSetLocations === 'function') {
                setTimeout(() => {
                    window.HC_checkRiseSetLocations();
                    // Re-render chart if it exists to show dots
                    if (typeof window.HC_profileData !== 'undefined' && window.HC_profileData && window.HC_profileData.length > 0 && typeof window.HC_chartInstance !== 'undefined' && window.HC_chartInstance) {
                        if (typeof window.HC_renderChart === 'function') {
                            window.HC_renderChart(window.HC_profileData);
                        }
                    }
                }, 500);
            }
            
            // Create and show Quick View sidebar section with lobipanel after calculations complete
            if (typeof window.createQuickViewSidebar === 'function') {
                window.createQuickViewSidebar();
                
                // Enable buttons for markers that exist
                // Map marker keys to button IDs (some button IDs differ from marker keys)
                const markerButtonMap = {
                    'NMLS': 'btn-zoom-nmls',
                    'SSS': 'btn-zoom-sss',
                    'NMNLS': 'btn-zoom-nmnls',
                    'NCQS': 'btn-zoom-ncqs',
                    'NCQR': 'btn-zoom-ncqr',
                    'NMNLR': 'btn-zoom-nmnlr',
                    'SSR': 'btn-zoom-ssr',
                    'NMLR': 'btn-zoom-nmlr',
                    'ES': 'btn-zoom-es',
                    'ER': 'btn-zoom-er',
                    'SMLS': 'btn-zoom-smls',
                    'SMNLS': 'btn-zoom-smnls', // Minor lunar
                    'WSS': 'btn-zoom-wss',
                    'SCQS': 'btn-zoom-scqs',
                    'SCQR': 'btn-zoom-scqr',
                    'SMNLR': 'btn-zoom-smnlr',
                    'WSR': 'btn-zoom-wsr',
                    'SMLR': 'btn-zoom-smlr'
                };
                
                // Wait a moment for DOM to be ready, then enable buttons
                setTimeout(() => {
                    Object.keys(markerButtonMap).forEach(key => {
                        const buttonId = markerButtonMap[key];
                        const button = document.getElementById(buttonId);
                        if (button) {
                            if (window.centerMarkers[key]) {
                                button.disabled = false;
                            } else {
                                button.disabled = true;
                            }
                        }
                    });
                }, 100);
            }
        };

})();