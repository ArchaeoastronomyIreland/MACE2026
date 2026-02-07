// Start Main IIFE to encapsulate the entire combined script and prevent global scope conflicts
(function() {
    // The top-level initialization guard has been removed.
    
    const HWT_HORIZONE_SRC = "K52"; // Specific source ID from horiZONE.html example

    // --- Console Output Override ---
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };

    console.log = function(...args) {
        originalConsole.log(...args);
    };
    console.warn = function(...args) {
        originalConsole.warn(...args);
    };
    console.error = function(...args) {
        originalConsole.error(...args);
    };

    // Expose displayMessage and clearResultsDisplay globally
    window.displayMessage = function(elementId, message, type = 'status') {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `status-message ${type}-message`; 
        }
        originalConsole.log(`Display Message [${type}] for ${elementId || 'N/A'}: ${message}`);
    };

    // --- Leaflet Map and Layer Variables ---
    let map = null;
    let layersControl = null;
    let observerMarker = null; 

    // Array to hold all LayerGroups created by Script C
    window.scriptCOverlayGroups = [];

    window.clearResultsDisplay = function() { 
        window.scriptCOverlayGroups.forEach(layerGroup => {
            if (window.map && window.map.hasLayer(layerGroup)) {
                window.map.removeLayer(layerGroup);
            }
            if (window.layersControl && layerGroup.layerNameForControl) {
                window.layersControl.removeLayer(layerGroup);
            }
        });
        window.scriptCOverlayGroups = [];
        console.log("All Script C overlay layers cleared from map and layers control.");
    };

    // --- Astronomical Constants ---
    const SOLAR_REFRACTION = 0.583; 
    const SOLAR_SEMIDIAMETER = 0.25; 
    const LUNAR_REFRACTION = -0.57; 
    const LUNAR_SEMIDIAMETER = 0.27; 
    const POLYGON_COLORS = ['#FFA500', '#FFFF00', '#008000', '#00008B', '#FF0000']; 

    function toRadians(deg) { return deg * Math.PI / 180; }
    function toDegrees(rad) { return rad * 180 / Math.PI; }

    window.normalizeAzimuth = function(az) {
        return (az % 360 + 360) % 360;
    };

    function getBearingBetweenLatLngs(p1, p2) {
        if (typeof LatLon === 'undefined') {
            console.error("LatLon library not available for bearing calculation.");
            return NaN;
        }
        const ll1 = new LatLon(p1.lat, p1.lng);
        const ll2 = new LatLon(p2.lat, p2.lng);
        return ll1.bearingTo(ll2);
    }

    function generateOrthodromePoints(lat1, lon1, lat2OrBearing, lon2OrDistanceKm, numPoints = 25, bearing = undefined, distanceKm = undefined) {
        const points = [];
        points.push([lat1, lon1]);

        let endLat, endLon;
        let totalDistanceRad;

        const R = 6371; 
        if (bearing !== undefined && distanceKm !== undefined) { 
            const brngRad = toRadians(bearing);
            const latRad1 = toRadians(lat1);
            const lonRad1 = toRadians(lon1);

            totalDistanceRad = distanceKm / R;

            const latRad2 = Math.asin(Math.sin(latRad1) * Math.cos(totalDistanceRad) + Math.cos(latRad1) * Math.sin(totalDistanceRad) * Math.cos(brngRad));
            const lonRad2 = lonRad1 + Math.atan2(Math.sin(brngRad) * Math.sin(totalDistanceRad) * Math.cos(latRad1), Math.cos(totalDistanceRad) - Math.sin(latRad1) * Math.sin(latRad2));

            endLat = toDegrees(latRad2);
            endLon = toDegrees(lonRad2);
        } else { 
            endLat = lat2OrBearing;
            endLon = lon2OrDistanceKm;

            const latRad1 = toRadians(lat1);
            const lonRad1 = toRadians(lon1);
            const latRad2 = toRadians(endLat);
            const lonRad2 = toRadians(endLon);

            const deltaLat = latRad2 - latRad1;
            const deltaLon = lonRad2 - lonRad1;
            const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(latRad1) * Math.cos(latRad2) *
                Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
            totalDistanceRad = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        if (totalDistanceRad < 1e-6) { 
            points.push([endLat, endLon]);
            return points;
        }

        for (let i = 1; i < numPoints; i++) {
            const f = i / numPoints; 
            const A = Math.sin((1 - f) * totalDistanceRad) / Math.sin(totalDistanceRad);
            const B = Math.sin(f * totalDistanceRad) / Math.sin(totalDistanceRad);

            const x = A * Math.cos(toRadians(lat1)) * Math.cos(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.cos(toRadians(endLon));
            const y = A * Math.cos(toRadians(lat1)) * Math.sin(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.sin(toRadians(lon1));
            const z = A * Math.sin(toRadians(lat1)) + B * Math.sin(toRadians(endLat));

            const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
            const lon = Math.atan2(y, x);

            points.push([toDegrees(lat), toDegrees(lon)]);
        }
        points.push([endLat, endLon]); 
        return points;
    }

    function getInterpolatedHorizonLatLon(azimuth, horizonData) {
        if (!horizonData || horizonData.length === 0) return null;

        let targetAzimuthNormalized = window.normalizeAzimuth(azimuth);
        let p1 = null;
        let p2 = null;

        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }
        extendedHorizonData.sort((a, b) => a.azimuth - b.azimuth);

        for (let i = 0; i < extendedHorizonData.length - 1; i++) {
            const currentPoint = extendedHorizonData[i];
            const nextPoint = extendedHorizonData[i + 1];
            if (targetAzimuthNormalized >= currentPoint.azimuth && targetAzimuthNormalized <= nextPoint.azimuth) {
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

            const isAzimuthDifferenceZero = (p2_az_for_interp === p1_az_for_interp);
            const isP1Invalid = isNaN(p1.horizonLat) || isNaN(p1.horizonLon);
            const isP2Invalid = isNaN(p2.horizonLat) || isNaN(p2.horizonLon);

            if (isAzimuthDifferenceZero || isP1Invalid || isP2Invalid) {
                const distToP1 = Math.abs(targetAzimuthNormalized - p1_az_for_interp);
                const distToP2 = Math.abs(targetAzimuthNormalized - p2_az_for_interp);
                let chosenPoint = null;
                if (!isP1Invalid && !isP2Invalid) chosenPoint = (distToP1 <= distToP2) ? p1 : p2;
                else if (!isP1Invalid) chosenPoint = p1;
                else if (!isP2Invalid) chosenPoint = p2;

                if (chosenPoint) return { lat: chosenPoint.horizonLat, lon: chosenPoint.horizonLon, azimuth: azimuth };
                return null;
            }

            const ratio = (targetAz_for_ratio - p1_az_for_interp) / (p2_az_for_interp - p1_az_for_interp);
            const interpolatedLat = p1.horizonLat + ratio * (p2.horizonLat - p1.horizonLat);
            const interpolatedLon = p1.horizonLon + ratio * (p2.horizonLon - p1.horizonLon);
            return { lat: interpolatedLat, lon: interpolatedLon, azimuth: azimuth };
        }
        return null;
    }

    function getInterpolatedHorizonAltitude(azimuth, horizonData) {
        if (!horizonData || horizonData.length === 0) return null;

        let targetAzimuthNormalized = window.normalizeAzimuth(azimuth);
        let p1 = null;
        let p2 = null;

        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }
        extendedHorizonData.sort((a, b) => a.azimuth - b.azimuth);

        for (let i = 0; i < extendedHorizonData.length - 1; i++) {
            const currentPoint = extendedHorizonData[i];
            const nextPoint = extendedHorizonData[i + 1];
            if (targetAzimuthNormalized >= currentPoint.azimuth && targetAzimuthNormalized <= nextPoint.azimuth) {
                p1 = currentPoint;
                p2 = nextPoint;
                break;
            }
        }

        if (p1 && p2) {
            let p1_az_for_interp = p1.azimuth;
            let p2_az_for_interp = p2.azimuth;
            if (p1_az_for_interp > p2_az_for_interp) p2_az_for_interp += 360;

            let targetAz_for_ratio = targetAzimuthNormalized;
            if (targetAz_for_ratio < p1_az_for_interp && p1_az_for_interp > (p2_az_for_interp - 360)) targetAz_for_ratio += 360;

            const isAzimuthDifferenceZero = (p2_az_for_interp === p1_az_for_interp);
            const isP1AltitudeInvalid = isNaN(p1.altitude);
            const isP2AltitudeInvalid = isNaN(p2.altitude);

            if (isAzimuthDifferenceZero || isP1AltitudeInvalid || isP2AltitudeInvalid) {
                const distToP1 = Math.abs(targetAzimuthNormalized - p1_az_for_interp);
                const distToP2 = Math.abs(targetAzimuthNormalized - p2_az_for_interp);
                let chosenPoint = null;
                if (!isP1AltitudeInvalid && !isP2AltitudeInvalid) chosenPoint = (distToP1 <= distToP2) ? p1 : p2;
                else if (!isP1AltitudeInvalid) chosenPoint = p1;
                else if (!isP2AltitudeInvalid) chosenPoint = p2;

                if (chosenPoint) return chosenPoint.altitude;
                return null; 
            }

            const ratio = (targetAz_for_ratio - p1_az_for_interp) / (p2_az_for_interp - p1_az_for_interp);
            const interpolatedAltitude = p1.altitude + ratio * (p2.altitude - p1.altitude);
            return interpolatedAltitude;
        }
        return null;
    }

    /**
     * Draws the viewshed horizon as a polygon using provided lat/lon values.
     * UPDATED: Now includes interactive click event to show details and add to Stellarium Gazetteer.
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
            }
        });

        if (polygonPoints.length >= 2) {
            console.log(`Viewshed terrain horizon polygon created with ${polygonPoints.length} points.`);
            const poly = L.polygon(polygonPoints, {
                color: '#808080', 
                weight: 2,
                opacity: 0.7,
                fillColor: '#808080', 
                fillOpacity: 0.1, 
                smoothFactor: 1
            });

            // --- INTERACTIVE HORIZON: Click Handler ---
            poly.on('click', function(e) {
                // Find nearest vertex on the horizon line to the click point
                let closest = null;
                let minDst = Infinity;
                
                horizonData.forEach(p => {
                    if (!isNaN(p.horizonLat) && !isNaN(p.horizonLon)) {
                        const d = L.latLng(p.horizonLat, p.horizonLon).distanceTo(e.latlng);
                        if(d < minDst) { minDst = d; closest = p; }
                    }
                });

                if(closest) {
                    const az = parseFloat(closest.azimuth).toFixed(3);
                    const alt = parseFloat(closest.altitude).toFixed(3);
                    
                    // Calculate distance from observer to this horizon point (in km)
                    let distText = "N/A";
                    if(window.map && window.bigMarker) {
                        const obsLL = window.bigMarker.getLatLng();
                        const ptLL = L.latLng(closest.horizonLat, closest.horizonLon);
                        const dstMeters = obsLL.distanceTo(ptLL);
                        distText = (dstMeters / 1000).toFixed(2) + " km";
                    }

                    // Create popup content
                    const content = document.createElement('div');
                    content.innerHTML = `
                        <div class="text-center">
                            <strong>Horizon Point</strong><br>
                            Az: ${az}° | Alt: ${alt}°<br>
                            Dist: ${distText}<br>
                            <button class="btn btn-xs btn-primary mt-2" id="btnAddPopupPoint">Add to Gazetteer</button>
                        </div>
                    `;
                    
                    const popup = L.popup()
                        .setLatLng(e.latlng)
                        .setContent(content)
                        .openOn(window.map);

                    // Bind button event after DOM insertion (safe timeout)
                    setTimeout(() => {
                        const btn = document.getElementById('btnAddPopupPoint');
                        if(btn) {
                            btn.onclick = function() {
                                if(window.addGazetteerPoint) {
                                    window.addGazetteerPoint(`Horizon ${az}°`, closest.azimuth, closest.altitude);
                                    // Use displayMessage for consistency
                                    window.displayMessage('overallStatus', `Point at ${az}° added to Gazetteer`, 'success');
                                    popup.close();
                                } else {
                                    alert("Stellarium Utility not loaded.");
                                }
                            };
                        }
                    }, 100);
                }
            });
            // --- END INTERACTIVE HORIZON ---

            return poly;
        } else {
            console.warn("Not enough valid geographical horizon points to draw a polygon.");
            return null;
        }
    }

    /**
     * Draws an individual circle marker on the map for a calculated point.
     * UPDATED: Hooks into window.maceStellariumData to save calculated points for export.
     */
    function drawIndividualPointMarker(point, label, lineColor, fillColor, radius = 6, fillOpacity = 1.0, weight = 2) {
        if (!map || !point || isNaN(point.lat) || isNaN(point.lon) || isNaN(point.azimuth)) {
            console.warn(`Cannot draw marker for "${label}": Invalid point data.`);
            return null;
        }

        const marker = L.circleMarker([point.lat, point.lon], {
            radius: radius,
            fillColor: fillColor,
            color: lineColor, 
            weight: weight,
            opacity: 1,
            fillOpacity: fillOpacity
        });
        marker.bindPopup(`<b>${label}</b><br>Azimuth: ${point.azimuth.toFixed(3)}°<br>Lat: ${point.lat.toFixed(6)}<br>Lon: ${point.lon.toFixed(6)}`);
        
        // --- HOOK: Capture Calculated Crossing Point for Stellarium ---
        if (window.maceStellariumData && label.indexOf("Orthodrome") === -1 && label.indexOf("Observer") === -1) {
            // Determine altitude for the gazetteer. 
            // 'point' usually has 'azimuth' but 'altitude' might be implicit or calculated.
            // We search the horizon data for the altitude at this azimuth.
            let alt = 0; 
            if(window.maceStellariumData.horizonPoints && window.maceStellariumData.horizonPoints.length > 0) {
                 // Use simple find or use the interpolation function if accessible.
                 // For robustness, we will reuse the interpolation function defined in this scope.
                 const foundAlt = getInterpolatedHorizonAltitude(point.azimuth, window.maceStellariumData.horizonPoints.map(p => ({
                     azimuth: p.az, altitude: p.alt
                 })));
                 if(foundAlt !== null) alt = foundAlt;
            }
            
            window.maceStellariumData.crossingPoints.push({
                label: label,
                az: point.azimuth.toFixed(5),
                alt: alt.toFixed(5), 
                vShift: 10, 
                hShift: 0
            });
        }
        // --- END HOOK ---

        console.log(`Marker for ${label} created (not yet added to map directly).`);
        return marker;
    }

    function getTurfCoordinates(leafletLatLngs, label) {
        const turfCoords = [];
        const actualLatLngs = (leafletLatLngs.length === 1 && Array.isArray(leafletLatLngs[0]) && typeof leafletLatLngs[0][0] === 'object' && 'lat' in leafletLatLngs[0][0]) ? leafletLatLngs[0] : leafletLatLngs;

        for (let i = 0; i < actualLatLngs.length; i++) {
            const ll = actualLatLngs[i];
            const lng = ll ? ll.lng : undefined;
            const lat = ll ? ll.lat : undefined;
            turfCoords.push([lng, lat]);
        }
        return turfCoords;
    }

    function reformatAndLogRawLatLngsForTurf(rawDataArray, label) {
        const reformattedCoords = [];
        const actualLatLngObjects = (rawDataArray.length === 1 && Array.isArray(rawDataArray[0]) && typeof rawDataArray[0][0] === 'object' && 'lat' in rawDataArray[0][0]) ? rawDataArray[0] : rawDataArray;

        for (let i = 0; i < actualLatLngObjects.length; i++) {
            const ll = actualLatLngObjects[i]; 
            const lng = ll ? ll.lng : undefined;
            const lat = ll ? ll.lat : undefined;
            reformattedCoords.push([lng, lat]);
        }
        return reformattedCoords;
    }

    function calculateSunPosition(observerLatDeg, declinationDeg, hourAngleDeg) {
        if (isNaN(observerLatDeg) || isNaN(declinationDeg) || isNaN(hourAngleDeg)) {
            return null;
        }

        const latRad = toRadians(observerLatDeg);
        const decRad = toRadians(declinationDeg);
        const haRad = toRadians(hourAngleDeg);

        let sinAltitude = Math.sin(decRad) * Math.sin(latRad) +
            Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);

        sinAltitude = Math.max(-1, Math.min(1, sinAltitude));

        let altitudeRad = Math.asin(sinAltitude); 

        const sinAz = -Math.sin(haRad) * Math.cos(decRad);
        const cosAz = Math.sin(decRad) * Math.cos(latRad) - Math.cos(decRad) * Math.sin(latRad) * Math.cos(haRad);

        let azimuthRad = Math.atan2(sinAz, cosAz);

        if (isNaN(azimuthRad)) {
            return {
                altitude: toDegrees(altitudeRad),
                azimuth: NaN 
            };
        }

        azimuthRad = (azimuthRad + 2 * Math.PI) % (2 * Math.PI); 

        const result = {
            altitude: toDegrees(altitudeRad),
            azimuth: toDegrees(azimuthRad)
        };

        return result;
    }

    window.findActualAzimuthForTargetApparentAltitude = async function( 
        horizonData,
        targetLimb,
        scenarioName,
        observerLat,
        observerLon,
        isSunriseLike,
        declinationDeg, 
        observerElevationMeters, 
        isLunarEvent = false, 
        isCrossQuarterEvent = false 
    ) {
        const TOLERANCE_ALTITUDE = 0.001; 
        const HA_SEARCH_RESOLUTION = 0.1; 
        const MAX_BISECTION_ITERATIONS = 100; 

        let REFRACTION;
        if (isLunarEvent) {
            REFRACTION = LUNAR_REFRACTION;
        } else {
            REFRACTION = SOLAR_REFRACTION;
        }

        const SEMIDIAMETER = isLunarEvent ? LUNAR_SEMIDIAMETER : SOLAR_SEMIDIAMETER;

        function setScenarioStatus(message, type = 'status') {
            originalConsole.log(`Display Message [${type}]: ${message}`); 
        }
        setScenarioStatus(`Calculating ${scenarioName}...`, 'status');

        if (isNaN(declinationDeg)) {
            setScenarioStatus(`${scenarioName}: Error: Invalid declination.`, 'error');
            return null;
        }

        if (!horizonData || horizonData.length === 0) {
            setScenarioStatus(`${scenarioName}: Error: Empty horizon data.`, 'error');
            return null;
        }

        let bestBracket = null; 
        let minHaDiff = Infinity; 

        for (let ha = -180; ha <= 180; ha += HA_SEARCH_RESOLUTION) {
            const sunPos = calculateSunPosition(observerLat, declinationDeg, ha);
            if (!sunPos || isNaN(sunPos.azimuth)) {
                continue;
            }

            const celestialApparentCenterAltitude = sunPos.altitude + REFRACTION; 

            let terrainTrueAltitude = getInterpolatedHorizonAltitude(sunPos.azimuth, horizonData); 
            if (terrainTrueAltitude === null) {
                continue;
            }

            const terrainComparisonAltitude = terrainTrueAltitude; 

            let limbAdjustmentValue = 0;
            if (targetLimb === 'UL') {
                limbAdjustmentValue = SEMIDIAMETER;
            } else if (targetLimb === 'LL') {
                limbAdjustmentValue = -SEMIDIAMETER;
            }

            const currentDifference = (celestialApparentCenterAltitude - terrainComparisonAltitude) + limbAdjustmentValue;
            
            if (ha === -180) { 
            } else {
                const prevHa = ha - HA_SEARCH_RESOLUTION;
                const prevSunPos = calculateSunPosition(observerLat, declinationDeg, prevHa);
                if (!prevSunPos || isNaN(prevSunPos.azimuth)) {
                    continue; 
                }

                const prevCelestialApparentCenterAltitude = prevSunPos.altitude + REFRACTION; 
                const prevTerrainTrueAltitude = getInterpolatedHorizonAltitude(prevSunPos.azimuth, horizonData);
                if (prevTerrainTrueAltitude === null) {
                    continue; 
                }
                const prevTerrainComparisonAltitude = prevTerrainTrueAltitude; 
                const prevDifference = (prevCelestialApparentCenterAltitude - prevTerrainComparisonAltitude) + limbAdjustmentValue; 
                
                const hasCrossed = (prevDifference < 0 && currentDifference >= 0 && isSunriseLike) ||
                                   (prevDifference > 0 && currentDifference <= 0 && !isSunriseLike);

                if (hasCrossed) {
                    if (isSunriseLike) {
                        if (ha < minHaDiff) { 
                            minHaDiff = ha;
                            bestBracket = [prevHa, ha];
                        }
                    } else { 
                        if (ha > minHaDiff || minHaDiff === Infinity) { 
                            minHaDiff = ha;
                            bestBracket = [prevHa, ha];
                        }
                    }
                }
            }
        }

        if (!bestBracket) {
            originalConsole.error(`Bracketing Search for ${scenarioName}: No crossing bracket found.`);
            return null;
        }

        let lowHA = bestBracket[0];
        let highHA = bestBracket[1];
        let finalHA = null;

        for (let i = 0; i < MAX_BISECTION_ITERATIONS; i++) {
            const midHA = (lowHA + highHA) / 2;
            const midCelestialPos = calculateSunPosition(observerLat, declinationDeg, midHA);

            if (!midCelestialPos || isNaN(midCelestialPos.azimuth)) {
                break;
            }

            const midCelestialApparentCenterAltitude = midCelestialPos.altitude + REFRACTION; 

            let midTerrainTrueAlt = getInterpolatedHorizonAltitude(midCelestialPos.azimuth, horizonData);
            if (midTerrainTrueAlt === null) {
                break;
            }

            const midTerrainComparisonAlt = midTerrainTrueAlt; 

            let limbAdjustmentValue = 0;
            if (targetLimb === 'UL') {
                limbAdjustmentValue = SEMIDIAMETER; 
            } else if (targetLimb === 'LL') {
                limbAdjustmentValue = -SEMIDIAMETER; 
            }

            const currentDifference = (midCelestialApparentCenterAltitude - midTerrainComparisonAlt) + limbAdjustmentValue;

            if (Math.abs(currentDifference) < TOLERANCE_ALTITUDE) {
                finalHA = midHA;
                break; 
            }

            if (isSunriseLike) {
                if (currentDifference < 0) { 
                    lowHA = midHA;
                } else { 
                    highHA = midHA;
                }
            } else { 
                if (currentDifference > 0) { 
                    lowHA = midHA;
                } else { 
                    highHA = midHA;
                }
            }
        }

        if (finalHA === null) {
            finalHA = (lowHA + highHA) / 2;
        }

        const finalCelestialPos = calculateSunPosition(observerLat, declinationDeg, finalHA);
        if (finalCelestialPos && !isNaN(finalCelestialPos.azimuth)) {
            const finalPointLatLon = getInterpolatedHorizonLatLon(finalCelestialPos.azimuth, horizonData);
            if (finalPointLatLon && !isNaN(finalPointLatLon.lat) && !isNaN(finalPointLatLon.lon)) {
                setScenarioStatus(`${scenarioName}: Actual Azimuth calculated.`, 'success');
                return {
                    azimuth: finalPointLatLon.azimuth, 
                    lat: finalPointLatLon.lat,
                    lon: finalPointLatLon.lon,
                    hourAngle: finalHA
                };
            } else {
                return null;
            }
        } else {
            return null;
        }
    };

    function findOrthodromeViewshedIntersection(observerLatLng, orthodromeCoordsTurf, viewshedCoordsTurf) {
        if (typeof turf === 'undefined') {
            console.error("Turf.js library not loaded.");
            return null;
        }

        const validOrthodromeCoords = orthodromeCoordsTurf.filter(coords =>
            typeof coords[0] === 'number' && !isNaN(coords[0]) &&
            typeof coords[1] === 'number' && !isNaN(coords[1])
        );
        const validViewshedCoords = viewshedCoordsTurf.filter(coords =>
            typeof coords[0] === 'number' && !isNaN(coords[0]) &&
            typeof coords[1] === 'number' && !isNaN(coords[1])
        );

        if (validOrthodromeCoords.length < 2 || validViewshedCoords.length < 2) {
            return null;
        }

        const turfOrthodrome = turf.lineString(validOrthodromeCoords);
        const turfViewshed = turf.lineString(validViewshedCoords);

        const intersections = turf.lineIntersect(turfOrthodrome, turfViewshed);

        if (intersections.features.length > 0) {
            const intersectionCoords = intersections.features[0].geometry.coordinates;
            const intersectionLat = intersectionCoords[1];
            const intersectionLon = intersectionCoords[0];
            const intersectionLatLng = L.latLng(intersectionLat, intersectionLon);
            const actualIntersectionAzimuth = getBearingBetweenLatLngs(observerLatLng, intersectionLatLng);

            return {
                lat: intersectionLat,
                lon: intersectionLon,
                azimuth: actualIntersectionAzimuth
            };
        }

        return null; 
    }

    async function processOrthodromeIntersection(zeroHorizonAzimuth, locationData, viewshedPolygon, scenarioName, globalZeroHorizonLayerGroup) {
        let intersectionPoint = null;

        if (!isNaN(zeroHorizonAzimuth) && locationData && typeof LatLon !== 'undefined' && typeof L.geodesic !== 'undefined') {
            const observerLat = locationData.latitude;
            const observerLon = locationData.longitude;
            const lineDistanceKm = 200; 

            const startPointLatLon = new LatLon(observerLat, observerLon);
            const endPointLatLon = startPointLatLon.destinationPoint(lineDistanceKm * 1000, zeroHorizonAzimuth);

            let orthodromeLatLngsForGeodesic = [
                L.latLng(observerLat, observerLon),
                L.latLng(endPointLatLon.lat, endPointLatLon.lon)
            ];

            let tempOrthodromeLine = L.geodesic(orthodromeLatLngsForGeodesic, {
                steps: 100,
                color: '#f97316', 
                weight: 2,
                opacity: 0.7,
                dashArray: '5, 5'
            });

            const reformattedOrthodromeCoords = reformatAndLogRawLatLngsForTurf(tempOrthodromeLine.getLatLngs(), `Geodesic`);

            if (viewshedPolygon && typeof turf !== 'undefined') {
                const viewshedActualLatLngs = viewshedPolygon.getLatLngs();
                const viewshedLineCoords = viewshedActualLatLngs.flat(); 
                const filteredViewshedCoordsTurf = getTurfCoordinates(viewshedLineCoords, `Viewshed Horizon`);
                const observerLatLng = L.latLng(locationData.latitude, locationData.longitude);

                intersectionPoint = findOrthodromeViewshedIntersection(observerLatLng, reformattedOrthodromeCoords, filteredViewshedCoordsTurf);

                if (intersectionPoint) {
                    let intersectionMarker = drawIndividualPointMarker(intersectionPoint, `${scenarioName} Orthodrome Intersection`, '#000000', '#FFFFFF', 2.5, 1);
                    if (intersectionMarker) {
                        globalZeroHorizonLayerGroup.addLayer(intersectionMarker); 
                    }
                }
            } 
        } 
        return intersectionPoint;
    }

    async function fetchLocationData(hwtId) {
        const apiUrl = `https://www.heywhatsthat.com/bin/result.json?id=${hwtId}`;

        window.displayMessage('locationStatus', `Fetching location data for ID: ${hwtId}...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await response.text();

            if (!response.ok) throw new Error(response.status);

            const json = JSON.parse(text);
            const lat = parseFloat(json?.lat);
            const lon = parseFloat(json?.lon);
            const elev_amsl = parseFloat(json?.elev_amsl);

            if (!isNaN(lat) && !isNaN(lon) && !isNaN(elev_amsl)) {
                window.displayMessage('locationStatus', 'Location data fetched successfully.', 'success-message');
                return { latitude: lat, longitude: lon, elevation_amsl: elev_amsl };
            }
            throw new Error("Missing or invalid 'lat', 'lon', or 'elev_amsl'");

        } catch (error) {
            window.displayMessage('locationStatus', 'Error fetching location data.', 'error-message');
            console.error("Error fetching location data:", error);
            return null;
        }
    }

    async function fetchHorizonDataHoriZONE(hwtId) {
        const apiUrl = `https://www.heywhatsthat.com/api/horizon.csv?id=${hwtId}&resolution=.125&src=${HWT_HORIZONE_SRC}&keep=1`;

        window.displayMessage('viewshedStatus', `Fetching viewshed data for ID: ${hwtId}...`, 'status-message');
        try {
            const response = await fetch(apiUrl);
            const text = await response.text();

            if (!response.ok) throw new Error(response.status);

            const lines = text.trim().split('\n');
            const horizonData = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') || line === '') continue;

                const parts = line.split(',').map(s => s.trim());
                if (parts.length >= 6) {
                    const azimuth = parseFloat(parts[0]); 
                    const altitude = parseFloat(parts[2]); 
                    const horizonLat = parseFloat(parts[4]); 
                    const horizonLon = parseFloat(parts[5]); 

                    if (!isNaN(azimuth) && !isNaN(altitude) && !isNaN(horizonLat) && !isNaN(horizonLon)) {
                        horizonData.push({ azimuth, altitude, horizonLat, horizonLon });
                    } 
                }
            }

            if (horizonData.length === 0) {
                throw new Error("No valid azimuth-altitude-lat-lon pairs.");
            }

            horizonData.sort((a, b) => a.azimuth - b.azimuth);
            
            // --- HOOK: Store Horizon Data for Stellarium Export ---
            if(window.maceStellariumData) {
                // Store mapped data: {az, alt, lat, lon}
                window.maceStellariumData.horizonPoints = horizonData.map(p => ({
                    az: p.azimuth, 
                    alt: p.altitude,
                    lat: p.horizonLat,
                    lon: p.horizonLon
                }));
            }
            // --- END HOOK ---

            window.displayMessage('viewshedStatus', 'Viewshed data fetched successfully.', 'success-message');
            return horizonData;

        } catch (error) {
            window.displayMessage('viewshedStatus', 'Error fetching viewshed data.', 'error-message');
            console.error("Error fetching viewshed data:", error);
            return null;
        }
    }

    function deduplicateHorizonData(horizonData) {
        if (!horizonData || !Array.isArray(horizonData) || horizonData.length === 0) return [];

        const seenLocations = new Set(); 
        const uniqueData = [];            

        for (const point of horizonData) {
            if (point && typeof point.horizonLat === 'number' && !isNaN(point.horizonLat) &&
                typeof point.horizonLon === 'number' && !isNaN(point.horizonLon)) {

                const key = `${point.horizonLat.toFixed(6)},${point.horizonLon.toFixed(6)}`;

                if (!seenLocations.has(key)) {
                    seenLocations.add(key);
                    uniqueData.push(point);
                }
            }
        }
        return uniqueData;
    }

    // --- Event Listener for Form Submission ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Assign global map and layersControl
        map = window.map;
        layersControl = window.layersControl;
        observerMarker = window.bigMarker; 

        // Specific selector for HWT form calculate button to avoid conflicts
        // LOOK FOR NEW BUTTON ID
        const hwtCalcBtn = document.getElementById('hwt-calculate-btn');
        const hwtIdentifierInput = document.getElementById('hwtIdentifierInput');
        const loadingSpinner = document.getElementById('loadingSpinner');

        if(hwtCalcBtn) {
            // Remove old listeners
            const newBtn = hwtCalcBtn.cloneNode(true);
            hwtCalcBtn.parentNode.replaceChild(newBtn, hwtCalcBtn);
            
            newBtn.addEventListener('click', async (e) => {
                e.preventDefault(); 

                window.clearResultsDisplay(); 
                
                // --- HOOK: Reset Stellarium Data ---
                if(window.maceStellariumData) {
                    window.maceStellariumData.gazetteer = [];
                    window.maceStellariumData.crossingPoints = [];
                    window.maceStellariumData.horizonPoints = [];
                    window.maceStellariumData.location = null;
                }
                // --- END HOOK ---

                window.displayMessage('overallStatus', 'Starting terrain-adjusted azimuth calculation...', 'status');
                if (loadingSpinner) loadingSpinner.classList.remove('hidden');

                const hwtId = hwtIdentifierInput.value.trim();

                if (!hwtId) {
                    window.displayMessage('overallStatus', 'Error: Please enter a HeyWhatsThat Identifier.', 'error');
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    return; 
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
                
                // --- HOOK: Store Location for Stellarium ---
                if(window.maceStellariumData) {
                    window.maceStellariumData.location = {
                        lat: locationData.latitude,
                        lon: locationData.longitude,
                        elev: locationData.elevation_amsl,
                        name: hwtId
                    };
                }
                // --- END HOOK ---

                if (map) {
                    map.setView([locationData.latitude, locationData.longitude], map.getZoom());
                    document.getElementById('latbox').value = locationData.latitude.toFixed(6); 
                    document.getElementById('lngbox').value = locationData.longitude.toFixed(6); 
                } 

                // --- Fetch Viewshed Data ---
                horizonData = await fetchHorizonDataHoriZONE(hwtId);
                if (!horizonData) {
                    window.displayMessage('overallStatus', 'Calculation failed: Could not fetch viewshed data.', 'error');
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    return;
                }

                horizonData = deduplicateHorizonData(horizonData);

                window.displayMessage('overallStatus', "Calculating actual azimuths...", 'status');

                // --- Viewshed Horizon Polygon ---
                const viewshedPolygon = drawViewshedHorizonLine(horizonData); 
                if (viewshedPolygon) {
                    let viewshedHorizonPolygonGroup = L.layerGroup();
                    viewshedHorizonPolygonGroup.addLayer(viewshedPolygon);
                    viewshedHorizonPolygonGroup.layerNameForControl = "Viewshed Horizon"; 
                    window.map.addLayer(viewshedHorizonPolygonGroup);
                    window.layersControl.addOverlay(viewshedHorizonPolygonGroup, viewshedHorizonPolygonGroup.layerNameForControl);
                    window.scriptCOverlayGroups.push(viewshedHorizonPolygonGroup);
                } else {
                    window.displayMessage('viewshedStatus', 'Warning: Viewshed horizon polygon could not be drawn.', 'warn');
                }

                // --- Read Mapped Azimuth Values from Script A's Global Variables ---
                let wsrZeroHorizonAzimuth = window.solsticeaziwinrise;
                let wssZeroHorizonAzimuth = window.solsticeaziwinset;
                let ssrZeroHorizonAzimuth = window.solsticeazisumrise;
                let sssZeroHorizonAzimuth = window.solsticeazisumset;

                let ncqrZeroHorizonAzimuth = window.crossquarterazisumrise; 
                let scqrZeroHorizonAzimuth = window.crossquarteraziwinrise; 
                let ncqsZeroHorizonAzimuth = window.crossquarterazisumset; 
                let scqsZeroHorizonAzimuth = window.crossquarteraziwinset; 

                let nmlrZeroHorizonAzimuth = window.majorazisumrise; 
                let nmlsZeroHorizonAzimuth = window.majorazisumset; 
                let smlrZeroHorizonAzimuth = window.majoraziwinrise; 
                let smnlsZeroHorizonAzimuth_major = window.majoraziwinset; 

                let nmnlrZeroHorizonAzimuth = window.minorazisumrise; 
                let smnlrZeroHorizonAzimuth = window.minoraziwinrise; 
                let nmnlsZeroHorizonAzimuth = window.minorazisumset; 
                let smnlsZeroHorizonAzimuth_minor = window.minoraziwinset; 

                let erZeroHorizonAzimuth = window.equinoxazisumrise;
                let esZeroHorizonAzimuth = window.equinoxazisumset;

                // --- Get Declination Values from Script A's Global Variables ---
                const declinationDegSummerSolstice = window.declinationSummerSolstice;
                const declinationDegWinterSolstice = window.declinationWinterSolstice;
                const declinationDegEquinox = window.declinationEquinox;
                const declinationDegCrossQuarterNorth = window.declinationCrossQuarterNorth;
                const declinationDegCrossQuarterSouth = window.declinationCrossQuarterSouth;
                const declinationDegMajorLunarNorth = window.declinationMajorLunarNorth;
                const declinationDegMajorLunarSouth = window.declinationMajorLunarSouth;
                const declinationDegMinorLunarNorth = window.declinationMinorLunarNorth;
                const declinationDegMinorLunarSouth = window.declinationMinorLunarSouth;

                // Basic validation
                if (isNaN(declinationDegSummerSolstice)) {
                    window.displayMessage('overallStatus', 'Error: Declination data missing. Check Script A.', 'error');
                    if (loadingSpinner) loadingSpinner.classList.add('hidden');
                    return;
                }

                // --- Initialize Layer Groups ---
                let solsticesLayerGroup = L.layerGroup(); solsticesLayerGroup.layerNameForControl = "Solstices";
                let equinoxesLayerGroup = L.layerGroup(); equinoxesLayerGroup.layerNameForControl = "Equinoxes";
                let crossQuartersLayerGroup = L.layerGroup(); crossQuartersLayerGroup.layerNameForControl = "Cross-Quarters";
                let majorLunarLayerGroup = L.layerGroup(); majorLunarLayerGroup.layerNameForControl = "Major Lunar Standstills";
                let minorLunarLayerGroup = L.layerGroup(); minorLunarLayerGroup.layerNameForControl = "Minor Lunar Standstills";
                let zeroHorizonIntersectionsLayerGroup = L.layerGroup(); zeroHorizonIntersectionsLayerGroup.layerNameForControl = "0 Horizon Intersections";

                [solsticesLayerGroup, equinoxesLayerGroup, crossQuartersLayerGroup, majorLunarLayerGroup, minorLunarLayerGroup, zeroHorizonIntersectionsLayerGroup].forEach(g => {
                    window.map.addLayer(g);
                    window.layersControl.addOverlay(g, g.layerNameForControl);
                    window.scriptCOverlayGroups.push(g);
                });

                // --- Observer Marker ---
                const observerPointForMarker = { lat: locationData.latitude, lon: locationData.longitude, azimuth: 0 };
                let observerLocationMarker = drawIndividualPointMarker(observerPointForMarker, "Observer Location", '#000000', '#FFFFFF', 5, 1);
                if (observerLocationMarker) zeroHorizonIntersectionsLayerGroup.addLayer(observerLocationMarker);

                // --- HELPER for Processing Events ---
                async function processEvent(zeroAz, typeLabel, labelPrefix, dec, isLunar, isCQ, layerGroup, colorIndex) {
                    if(isNaN(zeroAz)) return;
                    
                    // Guess if rise or set based on Azimuth (0-180 = Rise usually)
                    const azNorm = window.normalizeAzimuth(zeroAz);
                    const isSunriseLike = (azNorm >= 0 && azNorm <= 180);

                    // Orthodrome visual
                    await processOrthodromeIntersection(zeroAz, locationData, viewshedPolygon, labelPrefix, zeroHorizonIntersectionsLayerGroup);

                    const limbs = ['UL', 'Center', 'LL'];
                    for(let limb of limbs) {
                        let point = await window.findActualAzimuthForTargetApparentAltitude(
                            horizonData, limb, `${labelPrefix} ${limb}`, locationData.latitude, locationData.longitude, isSunriseLike, dec, locationData.elevation_amsl, isLunar, isCQ
                        );
                        if(point) {
                            let m = drawIndividualPointMarker(point, `${labelPrefix} ${limb}`, POLYGON_COLORS[colorIndex], POLYGON_COLORS[colorIndex], 2.5, 1);
                            if(m) layerGroup.addLayer(m);
                        } else {
                            anyCalculationFailed = true;
                        }
                    }
                }

                // --- Execution of Events ---
                // Solstices (Color 0)
                await processEvent(ssrZeroHorizonAzimuth, "SSR", "SSR", declinationDegSummerSolstice, false, false, solsticesLayerGroup, 0);
                await processEvent(wsrZeroHorizonAzimuth, "WSR", "WSR", declinationDegWinterSolstice, false, false, solsticesLayerGroup, 0);
                await processEvent(sssZeroHorizonAzimuth, "SSS", "SSS", declinationDegSummerSolstice, false, false, solsticesLayerGroup, 0);
                await processEvent(wssZeroHorizonAzimuth, "WSS", "WSS", declinationDegWinterSolstice, false, false, solsticesLayerGroup, 0);

                // Equinoxes (Color 1)
                await processEvent(erZeroHorizonAzimuth, "ER", "ER", declinationDegEquinox, false, false, equinoxesLayerGroup, 1);
                await processEvent(esZeroHorizonAzimuth, "ES", "ES", declinationDegEquinox, false, false, equinoxesLayerGroup, 1);

                // Cross Quarters (Color 2)
                await processEvent(ncqrZeroHorizonAzimuth, "NCQR", "NCQR", declinationDegCrossQuarterNorth, false, true, crossQuartersLayerGroup, 2);
                await processEvent(scqrZeroHorizonAzimuth, "SCQR", "SCQR", declinationDegCrossQuarterSouth, false, true, crossQuartersLayerGroup, 2);
                await processEvent(ncqsZeroHorizonAzimuth, "NCQS", "NCQS", declinationDegCrossQuarterNorth, false, true, crossQuartersLayerGroup, 2);
                await processEvent(scqsZeroHorizonAzimuth, "SCQS", "SCQS", declinationDegCrossQuarterSouth, false, true, crossQuartersLayerGroup, 2);

                // Major Lunar (Color 3)
                await processEvent(nmlrZeroHorizonAzimuth, "NMLR", "NMLR", declinationDegMajorLunarNorth, true, false, majorLunarLayerGroup, 3);
                await processEvent(smlrZeroHorizonAzimuth, "SMLR", "SMLR", declinationDegMajorLunarSouth, true, false, majorLunarLayerGroup, 3);
                await processEvent(nmlsZeroHorizonAzimuth, "NMLS", "NMLS", declinationDegMajorLunarNorth, true, false, majorLunarLayerGroup, 3);
                await processEvent(smnlsZeroHorizonAzimuth_major, "SMNLS", "SMNLS", declinationDegMajorLunarSouth, true, false, majorLunarLayerGroup, 3);

                // Minor Lunar (Color 4)
                await processEvent(nmnlrZeroHorizonAzimuth, "NMNLR", "NMNLR", declinationDegMinorLunarNorth, true, false, minorLunarLayerGroup, 4);
                await processEvent(smnlrZeroHorizonAzimuth, "SMNLR", "SMNLR", declinationDegMinorLunarSouth, true, false, minorLunarLayerGroup, 4);
                await processEvent(nmnlsZeroHorizonAzimuth, "NMNLS", "NMNLS", declinationDegMinorLunarNorth, true, false, minorLunarLayerGroup, 4);
                await processEvent(smnlsZeroHorizonAzimuth_minor, "SMNLS_Minor", "SMNLS_Minor", declinationDegMinorLunarSouth, true, false, minorLunarLayerGroup, 4);


                // Adjust map bounds
                let bounds = new L.LatLngBounds();
                window.scriptCOverlayGroups.forEach(layerGroup => {
                    if (window.map.hasLayer(layerGroup)) {
                        layerGroup.eachLayer(function(subLayer) {
                            if (subLayer.getLatLngs) { 
                                try { bounds.extend(subLayer.getBounds()); } catch (e) {}
                            } else if (subLayer.getLatLng) { 
                                try { bounds.extend(subLayer.getLatLng()); } catch (e) {}
                            }
                        });
                    }
                });

                if (bounds.isValid()) {
                    window.map.fitBounds(bounds, { padding: [50, 50] });
                }

                if (!anyCalculationFailed) {
                    window.displayMessage('overallStatus', 'All calculations complete.', 'success');
                } else {
                    window.displayMessage('overallStatus', 'Calculations finished with issues.', 'warn');
                }

                // --- HOOK: Trigger Stellarium Modal (Moved outside success check) ---
                const stelCheck = document.getElementById('createStellariumHorizon');
                if(stelCheck && stelCheck.checked) {
                    if(typeof window.openStellariumModal === 'function') {
                        // Small delay to let UI update
                        setTimeout(() => window.openStellariumModal(), 500);
                    } else {
                        console.error("Stellarium Utility script is not loaded.");
                    }
                }
                // --- END HOOK ---

                if (loadingSpinner) loadingSpinner.classList.add('hidden');
            });
        }
    });

})();