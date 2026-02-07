// Start IIFE to encapsulate the script and prevent global scope conflicts
(function() {
    // Guard to prevent multiple executions if the script is re-injected by the environment
    if (window.MaceHWTCalculatorInitialized) {
        console.warn("MACE HWT Calculator script already initialized. Skipping re-execution.");
        return; // This return is now safely within the IIFE's function scope
    }
    window.MaceHWTCalculatorInitialized = true; // Mark as initialized

    const HWT_HORIZONE_SRC = "K52"; // Specific source ID from horiZONE.html example

    // --- Console Output Override ---
    const originalConsole = { ...console
    };

    function appendToConsole(message, type = 'log') {
        originalConsole.log(...(Array.isArray(message) ? message : [message]));
    }

    console.log = function(...args) {
        originalConsole.log(...args);
        appendToConsole(args.join(' '), 'log');
    };
    console.warn = function(...args) {
        originalConsole.warn(...args);
        appendToConsole('WARNING: ' + args.join(' '), 'warn');
    };
    console.error = function(...args) {
        originalConsole.error(...args);
        appendToConsole('ERROR: ' + args.join(' '), 'error');
    };

    // --- Utility function for displaying messages ---
    function displayMessage(elementId, message, type = 'status') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `status-message ${type}-message`; // Apply Tailwind classes for styling
        }
        originalConsole.log(`Display Message [${type}] for ${elementId}: ${message}`);
    }

    // Global layer variables for Script 3's overlays
    let viewshedHorizonLineLayer = null; // This will hold the L.Polyline for the viewshed
    let hwtObserverMarker = null; // This will hold the L.CircleMarker for the HWT observer location
    let ssrOrthodromeLine = null; // For the SSR orthodromic line
    let ssrOrthodromeEndPointMarker = null; // For the marker at the end of the orthodromic line
    let ssr0HorizonMarker = null; // Specific marker for the SSR 0-Horizon point
    let ssrIntersectionMarker = null; // New: Marker for the intersection point

    // Re-declared allGeneratedOverlayLayers as it's needed for layer management
    let allGeneratedOverlayLayers = [];

    /**
     * Clears all dynamically added overlay layers from the map that were created by this script.
     * It relies on the global `map` and `layersControl` instances from Script 2.
     */
    function clearResultsDisplay() {
        const map = window.map; // Get map instance from global scope (set by Script 2)
        const layersControl = window.layersControl; // Get layersControl from global scope (set by Script 2)

        if (!map || !layersControl) {
            console.warn("Map or Layers Control not available for clearing results.");
            return;
        }

        // List of all layer groups/layers managed by this script
        const layersToRemove = [
            viewshedHorizonLineLayer,
            hwtObserverMarker,
            ssrOrthodromeLine, // Added for clearing
            ssrOrthodromeEndPointMarker, // Added for clearing
            ssr0HorizonMarker, // Added for clearing
            ssrIntersectionMarker // New: Added for clearing
        ];

        layersToRemove.forEach(layer => {
            if (layer) {
                if (map.hasLayer(layer)) {
                    map.removeLayer(layer);
                }
            }
        });

        // Reset references to null
        viewshedHorizonLineLayer = null;
        hwtObserverMarker = null;
        ssrOrthodromeLine = null;
        ssrOrthodromeEndPointMarker = null;
        ssr0HorizonMarker = null; // Reset
        ssrIntersectionMarker = null; // New: Reset

        // allGeneratedOverlayLayers is no longer used, so no need to clear it here.
        // It's populated dynamically within runHWTCalculations
        allGeneratedOverlayLayers = []; // Clear the array for the next run
    }

    /**
     * Draws the viewshed horizon as a polyline using provided lat/lon values.
     * @param {Array<Object>} horizonData - Array of {azimuth, altitude, horizonLat, horizonLon} objects.
     * @returns {L.Polyline|null} The created Leaflet Polyline object, or null if invalid data.
     */
    function drawViewshedHorizonLine(horizonData) {
        if (!horizonData || horizonData.length === 0) return null;

        const polylinePoints = [];
        horizonData.forEach(point => {
            if (!isNaN(point.horizonLat) && !isNaN(point.horizonLon)) {
                // Push [latitude, longitude] array directly for L.polyline
                polylinePoints.push([point.horizonLat, point.horizonLon]);
            } else {
                console.warn("Skipping point due to invalid horizonLat/Lon values for Azimuth: " + point.azimuth);
            }
        });

        if (polylinePoints.length >= 2) {
            // Close the polyline by adding the first point again at the end, if not already closed
            const firstPoint = polylinePoints[0]; // This is now a [lat, lng] array
            const lastPoint = polylinePoints[polylinePoints.length - 1]; // This is now a [lat, lng] array
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) { // Compare array elements
                polylinePoints.push(firstPoint);
            }
            console.log(`Viewshed terrain horizon polyline created with ${polylinePoints.length} points.`);
            return L.polyline(polylinePoints, {
                color: '#4299e1', // Blue color for the viewshed horizon line
                weight: 2,
                opacity: 0.7,
                smoothFactor: 1
            });
        } else {
            console.warn("Not enough valid geographical horizon points to draw a polyline.");
            return null;
        }
    }

    /**
     * Draws an individual circle marker on the map for a calculated point.
     * @param {object} point - Object with lat, lon, azimuth properties.
     * @param {string} label - Label for the popup.
     * @param {string} color - The color for the marker (e.g., 'red', 'blue', 'orange').
     * @returns {L.CircleMarker|null} The created Leaflet CircleMarker object, or null if invalid point data.
     */
    function drawIndividualPointMarker(point, label, color = 'orange') {
        const map = window.map; // Get map instance from global scope

        if (!map || !point || isNaN(point.lat) || isNaN(point.lon) || isNaN(point.azimuth)) {
            console.warn(`Cannot draw marker for ${label}: Invalid point data.`);
            return null;
        }

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: 6,
            fillColor: color, // Use provided color
            color: color, // Use provided color for outline
            weight: 2,
            opacity: 1,
            fillOpacity: 0.25 // 25% fill
        });
        marker.bindPopup(`<b>${label}</b><br>Azimuth: ${point.azimuth.toFixed(3)}°<br>Lat: ${point.lat.toFixed(6)}<br>Lon: ${point.lon.toFixed(6)}`);
        console.log(`Marker for ${label} created (not yet added to map directly).`);
        return marker;
    }

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
     * Calculates the bearing from one LatLng point to another using LatLon library.
     * @param {L.LatLng} p1 - Start point.
     * @param {L.LatLng} p2 - End point.
     * @returns {number} Bearing in degrees.
     */
    function getBearingBetweenLatLngs(p1, p2) {
        if (typeof LatLon === 'undefined') {
            console.error("LatLon library not available for bearing calculation.");
            return NaN;
        }
        const ll1 = LatLon(p1.lat, p1.lng);
        const ll2 = LatLon(p2.lat, p2.lng);
        return ll1.bearingTo(ll2);
    }

    /**
     * Prepares Leaflet LatLngs for Turf.js by filtering invalid coordinates and converting to [lng, lat] format.
     * Also logs the resulting array to the console.
     * @param {Array<L.LatLng>} leafletLatLngs - Array of Leaflet LatLng objects.
     * @param {string} label - A label for console output (e.g., "Orthodrome", "Viewshed").
     * @returns {Array<Array<number>>} An array of [longitude, latitude] pairs, suitable for Turf.js.
     */
    function getTurfCoordinates(leafletLatLngs, label) {
        const turfCoords = leafletLatLngs
            .map(ll => [ll.lng, ll.lat])
            .filter(coords => {
                const isValid = !isNaN(coords[0]) && !isNaN(coords[1]);
                if (!isValid) {
                    console.warn(`  Filtering out invalid ${label} coordinate: [${coords[0]}, ${coords[1]}]`);
                }
                return isValid;
            });
        console.log(`${label} coordinates passed to Turf.js:`, turfCoords);
        return turfCoords;
    }


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

        // The coordinates are already filtered and formatted [lng, lat] by getTurfCoordinates
        // No need for further mapping or filtering here.
        const turfOrthodrome = turf.lineString(orthodromeCoordsTurf);
        const turfViewshed = turf.lineString(viewshedCoordsTurf);

        // Find intersections
        const intersections = turf.lineIntersect(turfOrthodrome, turfViewshed);

        if (intersections.features.length > 0) {
            // Pick the first intersection point (closest to the start of the orthodrome)
            const intersectionCoords = intersections.features[0].geometry.coordinates;
            const intersectionLatLng = L.latLng(intersectionCoords[1], intersectionCoords[0]); // Convert back to Leaflet LatLng [lat, lng]

            const actualIntersectionAzimuth = getBearingBetweenLatLngs(observerLatLng, intersectionLatLng);
            console.log("Turf.js Intersection found at Lat: " + intersectionLatLng.lat.toFixed(6) + ", Lon: " + intersectionLatLng.lng.toFixed(6) + ", Azimuth: " + actualIntersectionAzimuth.toFixed(3) + "°");
            return {
                lat: intersectionLatLng.lat,
                lon: intersectionLatLng.lon,
                azimuth: actualIntersectionAzimuth
            };
        }

        return null; // No intersection found
    }


    /**
     * Fetches location data (lat, lon, elev_amsl) for a specific ID from heywhatsthat.com's result.json.
     * @param {string} hwtId - The HeyWhatsThat identifier.
     * @returns {Promise<{latitude: number, longitude: number, elevation_amsl: number}|null>} Parsed location info.
     */
    async function fetchLocationData(hwtId) {
        const apiUrl = `https://www.heywhatsthat.com/bin/result.json?id=${hwtId}`;

        displayMessage('locationStatus', `Fetching location data for ID: ${hwtId} from /bin/result.json...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${text.substring(0, 100)}...`);
            }

            const json = JSON.parse(text);

            const lat = parseFloat(json ?.lat);
            const lon = parseFloat(json ?.lon);
            const elev_amsl = parseFloat(json ?.elev_amsl);

            if (!isNaN(lat) && !isNaN(lon) && !isNaN(elev_amsl)) {
                displayMessage('locationStatus', 'Location data fetched successfully.', 'success-message');
                return {
                    latitude: lat,
                    longitude: lon,
                    elevation_amsl: elev_amsl
                };
            }
            throw new Error("Missing or invalid 'lat', 'lon', or 'elev_amsl' in JSON response.");

        } catch (error) {
            displayMessage('locationStatus', 'Error fetching location data.', 'error-message');
            displayMessage('locationError', `Error: ${error.message}`, 'error-error');
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

        displayMessage('viewshedStatus', `Fetching viewshed data for ID: ${hwtId} from /api/horizon.csv (horiZONE method)...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${text.substring(0, 100)}...`);
            }

            const lines = text.trim().split('\n');
            const horizonData = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') || line === '') continue;

                const parts = line.split(',').map(s => s.trim());
                // Corrected parsing based on the provided header:
                // "bin bottom",azimuth,altitude,"distance (m)",latitude,longitude,"elevation (m amsl)"
                if (parts.length >= 6) {
                    const azimuth = parseFloat(parts[1]); // Correct: Azimuth is at index 1
                    const altitude = parseFloat(parts[2]); // Correct: Altitude is at index 2
                    const horizonLat = parseFloat(parts[4]); // Latitude is at index 4
                    const horizonLon = parseFloat(parts[5]); // Longitude is at index 5

                    if (!isNaN(azimuth) && !isNaN(altitude) && !isNaN(horizonLat) && !isNaN(horizonLon)) {
                        horizonData.push({
                            azimuth,
                            altitude,
                            horizonLat,
                            horizonLon
                        });
                    } else {
                        console.warn(`Skipping line ${i} due to invalid number parsing (az:${parts[1]}, alt:${parts[2]}, lat:${parts[4]}, lon:${parts[5]}): ${line}`);
                    }
                } else {
                    console.warn(`Skipping line ${i} due to insufficient columns (${parts.length} < 6): ${line}`);
                }
            }

            if (horizonData.length === 0) {
                throw new Error("No valid azimuth-altitude-lat-lon pairs parsed from horizon.csv. Response might be malformed or empty data.");
            }

            horizonData.sort((a, b) => a.azimuth - b.azimuth);
            displayMessage('viewshedStatus', 'Viewshed data fetched successfully.', 'success-message');
            return horizonData;

        } catch (error) {
            displayMessage('viewshedStatus', 'Error fetching viewshed data.', 'error-message');
            displayMessage('viewshedError', `Error: ${error.message}`, 'error-error');
            console.error("Error fetching viewshed data:", error);
            return null;
        }
    }

    // Expose the main calculation function globally so Script 2 can call it
    window.runHWTCalculations = async function() {
        // Added console.log to confirm function execution
        console.log("runHWTCalculations function started.");

        // --- Turf.js Integration Test ---
        if (typeof turf !== 'undefined') {
            const point1 = turf.point([-7.5, 53.5]);
            const buffered = turf.buffer(point1, 1, {units: 'kilometers'});
            console.log("Turf.js test: Buffered point coordinates: " + buffered.geometry.coordinates);
        } else {
            console.warn("Turf.js is not loaded. Skipping Turf.js test.");
        }
        // --- End Turf.js Integration Test ---


        const map = window.map; // Get map instance from global scope (set by Script 2)
        const layersControl = window.layersControl; // Get layersControl from global scope (set by Script 2)

        if (!map || !layersControl) {
            console.error("Map or Layers Control not initialized by Script 2. Cannot run HWT calculations.");
            displayMessage('overallStatus', 'Error: Map not initialized. Check Script 2.', 'error');
            return;
        }

        const hwtIdentifierInput = document.getElementById('hwtIdentifierInput');
        const loadingSpinner = document.getElementById('loadingSpinner');

        clearResultsDisplay(); // Clear previous results from this script
        displayMessage('overallStatus', 'Starting calculation...', 'status');
        loadingSpinner.classList.remove('hidden');

        const hwtId = hwtIdentifierInput.value.trim();
        if (!hwtId) {
            displayMessage('overallStatus', 'Error: Please enter a HeyWhatsThat Identifier.', 'error');
            loadingSpinner.classList.add('hidden');
            return;
        }

        let locationData = null;
        let horizonData = null;

        // --- Fetch Location Data ---
        locationData = await fetchLocationData(hwtId);
        if (!locationData) {
            displayMessage('overallStatus', 'Calculation failed: Could not fetch location data.', 'error');
            loadingSpinner.classList.add('hidden');
            return;
        }

        // DO NOT hijack Script 2's bigMarker.
        // The bigMarker is managed by Script 2 and the user.
        // We only update the map view to center on the HWT location.
        const newHWTLatLng = L.latLng(locationData.latitude, locationData.longitude);
        map.setView(newHWTLatLng, map.getZoom() < 10 ? 10 : map.getZoom()); // Zoom in if too far out

        // Create and add Script 3's own observer marker for the HWT location
        if (hwtObserverMarker) {
            hwtObserverMarker.setLatLng(newHWTLatLng);
        } else {
            hwtObserverMarker = L.circleMarker(newHWTLatLng, {
                radius: 6,
                fillColor: 'transparent',
                color: 'black',
                weight: 2,
                opacity: 1,
                fillOpacity: 0
            });
        }
        hwtObserverMarker.bindPopup(`<b>HWT Observer Location</b><br>Lat: ${locationData.latitude.toFixed(4)}, Lon: ${locationData.longitude.toFixed(4)}<br>Elevation: ${locationData.elevation_amsl.toFixed(1)}m`).openPopup();
        map.addLayer(hwtObserverMarker);
        layersControl.addOverlay(hwtObserverMarker, "HWT Observer");
        allGeneratedOverlayLayers.push(hwtObserverMarker); // Add to the list for export


        // --- Fetch Viewshed Data ---
        horizonData = await fetchHorizonDataHoriZONE(hwtId);
        if (!horizonData) {
            displayMessage('overallStatus', 'Calculation failed: Could not fetch viewshed data.', 'error');
            loadingSpinner.classList.add('hidden');
            return;
        }

        // --- Draw Viewshed Horizon ---
        viewshedHorizonLineLayer = drawViewshedHorizonLine(horizonData); // This returns a polyline
        if (viewshedHorizonLineLayer) {
            map.addLayer(viewshedHorizonLineLayer); // Add the polyline directly to map
            layersControl.addOverlay(viewshedHorizonLineLayer, "Viewshed Horizon"); // Add to layers control
            allGeneratedOverlayLayers.push(viewshedHorizonLineLayer); // Add to the list for export
        }

        // --- Draw Orthodromic Line and End Point Marker for 200km ---
        let baseAzimuthSSR = parseFloat(document.getElementById("solsticeazisumrise")?.value || NaN);

        if (!isNaN(baseAzimuthSSR) && locationData && typeof LatLon !== 'undefined' && typeof L.geodesic !== 'undefined') {
            const observerLat = locationData.latitude;
            const observerLon = locationData.longitude;
            const lineDistanceKm = 200; // Fixed distance for the orthodromic line

            // Create LatLon object for the observer's location
            const startPointLatLon = LatLon(observerLat, observerLon);

            // Calculate the end point using LatLon.destinationPoint
            const endPointLatLon = startPointLatLon.destinationPoint(lineDistanceKm * 1000, baseAzimuthSSR); // distance in meters

            // Validate endPointLatLon before creating the geodesic line
            if (isNaN(endPointLatLon.lat) || isNaN(endPointLatLon.lon)) {
                console.warn("Calculated orthodrome end point is invalid (NaN). Skipping orthodrome line and marker creation.");
                displayMessage('overallStatus', 'Warning: Orthodrome end point calculation failed. Check azimuth input.', 'warn');
            } else {
                // L.geodesic requires an array of L.LatLng objects
                const orthodromeLatLngs = [
                    L.latLng(observerLat, observerLon),
                    L.latLng(endPointLatLon.lat, endPointLatLon.lon)
                ];

                // Attempt to create geodesic line
                ssrOrthodromeLine = L.geodesic(orthodromeLatLngs, {
                    color: 'purple', // Color for the orthodromic line
                    weight: 2,
                    opacity: 0.8,
                    steps: 50, // L.geodesic's own way to add intermediate points for smoothness
                    dashArray: '3, 5' // Dashed line
                });

                // --- NEW LOGGING: Raw orthodrome LatLngs from L.geodesic ---
                const rawOrthodromeLatLngs = ssrOrthodromeLine.getLatLngs();
                console.log("Raw Orthodrome LatLngs from L.geodesic (before any filtering):", rawOrthodromeLatLngs);
                // --- END NEW LOGGING ---

                // Check if the geodesic line generated valid points. If not, create a simple straight line.
                const geodesicPoints = rawOrthodromeLatLngs.filter(ll => !isNaN(ll.lat) && !isNaN(ll.lng));

                if (geodesicPoints.length < 2) {
                    console.warn("L.geodesic produced insufficient valid points. Falling back to simple straight line for orthodrome.");
                    // Create a simple L.polyline with just the start and end points
                    ssrOrthodromeLine = L.polyline(orthodromeLatLngs, { // Use the original two valid points
                        color: 'purple',
                        weight: 2,
                        opacity: 0.8,
                        dashArray: '3, 5'
                    });
                }

                map.addLayer(ssrOrthodromeLine);
                layersControl.addOverlay(ssrOrthodromeLine, `SSR Orthodrome (${lineDistanceKm}km)`);
                allGeneratedOverlayLayers.push(ssrOrthodromeLine);

                // Place a marker at the end of the orthodromic line
                ssrOrthodromeEndPointMarker = L.circleMarker(L.latLng(endPointLatLon.lat, endPointLatLon.lon), {
                    radius: 5,
                    fillColor: 'purple',
                    color: 'purple',
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 1
                });
                ssrOrthodromeEndPointMarker.bindPopup(`<b>SSR Orthodrome End Point</b><br>Azimuth: ${baseAzimuthSSR.toFixed(3)}°<br>Distance: ${lineDistanceKm}km<br>Lat: ${endPointLatLon.lat.toFixed(6)}<br>Lon: ${endPointLatLon.lon.toFixed(6)}`);
                map.addLayer(ssrOrthodromeEndPointMarker);
                layersControl.addOverlay(ssrOrthodromeEndPointMarker, `SSR Orthodrome End Marker`);
                allGeneratedOverlayLayers.push(ssrOrthodromeEndPointMarker);

                console.log(`SSR Orthodromic line drawn for ${lineDistanceKm}km at azimuth ${baseAzimuthSSR.toFixed(3)}°`);
            }
        } else {
            console.warn("Cannot draw SSR Orthodromic line: base azimuth or location data invalid, or LatLon/L.geodesic not available.");
        }

        // --- Find and Draw Intersection Point ---
        // Ensure both lines are valid and have at least 2 points before attempting intersection
        if (viewshedHorizonLineLayer && ssrOrthodromeLine && locationData) {
            // Get raw LatLngs and pass them to the new function for formatting and logging
            const orthodromeActualLatLngs = ssrOrthodromeLine.getLatLngs();
            const filteredOrthodromeCoordsTurf = getTurfCoordinates(orthodromeActualLatLngs, "Orthodrome");

            const viewshedActualLatLngs = viewshedHorizonLineLayer.getLatLngs();
            const filteredViewshedCoordsTurf = getTurfCoordinates(viewshedActualLatLngs, "Viewshed Horizon");

            if (filteredOrthodromeCoordsTurf.length < 2) {
                console.warn("SSR Orthodrome line (after filtering) does not have enough valid points for intersection calculation. Skipping intersection.");
                displayMessage('overallStatus', 'Warning: SSR Orthodrome line invalid for intersection.', 'warn');
            } else if (filteredViewshedCoordsTurf.length < 2) {
                console.warn("Viewshed Horizon line (after filtering) does not have enough valid points for intersection calculation. Skipping intersection.");
                displayMessage('overallStatus', 'Warning: Viewshed Horizon line invalid for intersection.', 'warn');
            } else {
                const observerLatLng = L.latLng(locationData.latitude, locationData.longitude);
                // Pass the already filtered and formatted arrays directly to the intersection function
                const intersectionPoint = findOrthodromeViewshedIntersection(observerLatLng, filteredOrthodromeCoordsTurf, filteredViewshedCoordsTurf);

                if (intersectionPoint) {
                    ssrIntersectionMarker = drawIndividualPointMarker(intersectionPoint, "SSR/Viewshed Intersection", 'red');
                    if (ssrIntersectionMarker) {
                        map.addLayer(ssrIntersectionMarker);
                        layersControl.addOverlay(ssrIntersectionMarker, "SSR/Viewshed Intersection");
                        allGeneratedOverlayLayers.push(ssrIntersectionMarker);
                        console.log("Intersection marker added to map.");
                    }
                } else {
                    console.warn("No intersection found between SSR Orthodrome and Viewshed Horizon, or orthodrome/viewshed data invalid for intersection calculation.");
                }
            }
        } else {
            console.warn("Cannot find intersection: Viewshed Horizon or SSR Orthodrome line not available, or location data missing.");
        }


        // Adjust map bounds to encompass all drawn elements
        let bounds = new L.LatLngBounds();
        map.eachLayer(function(layer) {
            // Only extend bounds for relevant layers that are currently visible
            if (layer instanceof L.LayerGroup) { // Check if it's a layer group
                if (map.hasLayer(layer)) { // Only include if the group is active on the map
                    layer.eachLayer(function(subLayer) { // Iterate through sub-layers of the group
                        if (subLayer.getLatLngs) { // For polygons/polylines
                            bounds.extend(subLayer.getBounds());
                        } else if (subLayer.getLatLng) { // For markers
                            bounds.extend(subLayer.getLatLng());
                        }
                    });
                }
            } else if (layer instanceof L.Polyline || layer instanceof L.Marker || layer instanceof L.CircleMarker || layer instanceof L.Polygon) {
                if (map.hasLayer(layer)) { // Check if individual layer is active
                    if (layer.getLatLngs) {
                        bounds.extend(layer.getBounds());
                    } else if (layer.getLatLng) {
                        bounds.extend(layer.getLatLng());
                    }
                }
            }
        });
        if (bounds.isValid()) {
            map.fitBounds(bounds, {
                padding: [50, 50]
            });
        }

        displayMessage('overallStatus', 'HWT Viewshed, Observer Marker, Orthodrome, and Intersection displayed.', 'success');
        loadingSpinner.classList.add('hidden');
    };


    // --- Event Listener for Form Submission ---
    document.addEventListener('DOMContentLoaded', async () => {
        const form = document.getElementById('azimuthForm');
        // Removed saveGeoJsonButton, importGeoJsonInput, importGeoJsonButton, importStatusDiv
        // as import/export functionality is removed.

        // The loadingSpinner is already referenced in runHWTCalculations

        // Initial map setup is handled by Script 2's DOMContentLoaded.
        // We just need to make sure our form submission triggers our calculations.

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            window.runHWTCalculations(); // Call the globally exposed function
        });
    });
})(); // End of IIFE