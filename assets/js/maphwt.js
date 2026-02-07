var startLat = '53.4902668'

var startLng = '-7.56256669'

/* Basemap Layers */

var NationalMonuments = L.esri
   .featureLayer({
      url: "https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/ArcGIS/rest/services/SMROpenData/FeatureServer/0",
      minZoom: 13,
      style: function(feature) {
         return {
            fillColor: '#F22E87'
         };
      }
   })

var NationalMonumentsNI = L.esri
   .featureLayer({
      url: "https://services3.arcgis.com/sae2uhr3iZOENSDH/arcgis/rest/services/ni_sites_monuments/FeatureServer/0",
      minZoom: 13,
      style: function(feature) {
         return {
            fillColor: '#F22E87'
         };
      }
   })

var Stadia_Satellite = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});


var cartoLight = L.tileLayer(
   "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
      maxZoom: 28,
      useCache: true,
      crossOrigin: true,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'

   });
   
var osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 28,       // Allow zooming past the tile limit
        maxNativeZoom: 19, // Tiles only exist up to 19, so we scale them after this
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });   


var Esri_WorldImagery = L.tileLayer(
   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 28,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
   });

var Esri_WorldImagery_Clarity = L.tileLayer(
   'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxNativeZoom:18,
	  maxZoom: 28,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
   });

var googleSat = L.tileLayer(
   'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 28,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
   });

var bigIcon = new L.icon({
   iconUrl: "assets/img/omphalos.svg",
   iconSize: [20, 20],
   iconAnchor: [10, 10],
   popupAnchor: [0, -25]
});


var topoUrl = L.tileLayer(
   'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {});

var BING_KEY =
   'AmPQVvaKSid_g48EnFJjbYUOyWPlkQh1QGJlsFFZnw1EnJioQ5kvSiv2w7SUaJ9B'
   
  



// Custom tile layer for client-side hillshade visualization from Terrarium elevation data
var TerrariumHillshade = L.TileLayer.extend({
   initialize: function(url, options) {
      L.TileLayer.prototype.initialize.call(this, url, options);
      this._lightAzimuth = options.lightAzimuth || 315; // Light direction in degrees (NW)
      this._lightAltitude = options.lightAltitude || 45; // Light angle above horizon in degrees
   },

   createTile: function(coords, done) {
      const tile = document.createElement('canvas');
      tile.width = tile.height = this.options.tileSize || 256;
      const ctx = tile.getContext('2d');
      
      const img = new Image();
      img.crossOrigin = this.options.crossOrigin || 'anonymous';
      
      img.onload = () => {
         // Draw the elevation tile to canvas
         ctx.drawImage(img, 0, 0);
         
         // Get image data
         const imageData = ctx.getImageData(0, 0, 256, 256);
         const data = imageData.data;
         
         // Decode elevation from RGB (Terrarium format)
         const elevation = new Float32Array(256 * 256);
         for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            elevation[j] = (data[i] * 256 + data[i + 1] + data[i + 2] / 256) - 32768;
         }
         
         // Calculate pixel size in meters based on zoom level
         // Convert tile coordinates to approximate latitude for better accuracy
         const n = Math.pow(2, coords.z);
         const latRad = Math.PI * (1 - 2 * coords.y / n);
         const metersPerPixel = (40075016.686 * Math.cos(latRad)) / (256 * n);
         
         // Calculate hillshade
         const hillshade = this._calculateHillshade(elevation, 256, metersPerPixel);
         
         // Calculate colored terrain with sea detection
         const coloredTerrain = this._calculateColoredTerrain(elevation, 256);
         
         // Render colored terrain with hillshade overlay
         for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            const color = coloredTerrain[j];
            const shade = hillshade[j] / 255; // Normalize to 0-1
            
            // Apply hillshade as overlay (multiply blend)
            data[i] = Math.round(color.r * shade);     // R
            data[i + 1] = Math.round(color.g * shade); // G
            data[i + 2] = Math.round(color.b * shade); // B
            data[i + 3] = 255;   // A
         }
         
         ctx.putImageData(imageData, 0, 0);
         done(null, tile);
      };
      
      img.onerror = () => {
         done(new Error('Failed to load tile'), tile);
      };
      
      img.src = this.getTileUrl(coords);
      return tile;
   },

   _calculateHillshade: function(elevation, size, pixelSize) {
      const hillshade = new Uint8Array(size * size);
      const lightAzimuthRad = (this._lightAzimuth - 90) * Math.PI / 180;
      const lightAltitudeRad = this._lightAltitude * Math.PI / 180;
      
      // Light direction vector
      const dxLight = Math.cos(lightAzimuthRad) * Math.cos(lightAltitudeRad);
      const dyLight = Math.sin(lightAzimuthRad) * Math.cos(lightAltitudeRad);
      const dzLight = Math.sin(lightAltitudeRad);
      
      for (let y = 1; y < size - 1; y++) {
         for (let x = 1; x < size - 1; x++) {
            const idx = y * size + x;
            
            // Calculate gradient using neighboring pixels
            const dzdx = ((elevation[(y) * size + (x + 1)] - elevation[(y) * size + (x - 1)]) / (2 * pixelSize));
            const dzdy = ((elevation[(y - 1) * size + (x)] - elevation[(y + 1) * size + (x)]) / (2 * pixelSize));
            
            // Normal vector
            const dx = -dzdx;
            const dy = -dzdy;
            const dz = 1;
            const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Normalize
            const nx = dx / len;
            const ny = dy / len;
            const nz = dz / len;
            
            // Calculate dot product (illumination)
            let illumination = nx * dxLight + ny * dyLight + nz * dzLight;
            
            // Clamp to 0-1 range
            illumination = Math.max(0, Math.min(1, illumination));
            
            // Convert to grayscale (0-255)
            // Apply some contrast enhancement
            illumination = Math.pow(illumination, 0.7); // Gamma correction
            hillshade[idx] = Math.round(illumination * 255);
         }
      }
      
      // Fill edges
      for (let y = 0; y < size; y++) {
         for (let x = 0; x < size; x++) {
            if (y === 0 || y === size - 1 || x === 0 || x === size - 1) {
               const idx = y * size + x;
               const nearY = Math.max(1, Math.min(size - 2, y));
               const nearX = Math.max(1, Math.min(size - 2, x));
               hillshade[idx] = hillshade[nearY * size + nearX];
            }
         }
      }
      
      return hillshade;
   },

   _calculateColoredTerrain: function(elevation, size) {
      const colors = new Array(size * size);
      const seaLevel = 0; // Sea level threshold in meters
      
      // Elevation-based color ramp (similar to terrain visualization)
      // Colors: Deep blue (sea) -> Light blue (shallow) -> Green (lowlands) -> Brown (hills) -> Gray (mountains) -> White (peaks)
      
      for (let i = 0; i < elevation.length; i++) {
         const elev = elevation[i];
         let r, g, b;
         
         // Sea detection and coloring
         if (elev <= seaLevel) {
            // Water: deep blue to light blue based on depth
            const depth = Math.abs(elev);
            if (depth > 200) {
               // Deep water - dark blue
               r = 20;
               g = 50;
               b = 120;
            } else if (depth > 50) {
               // Medium depth - medium blue
               r = 40;
               g = 100;
               b = 180;
            } else {
               // Shallow water - light blue
               r = 100;
               g = 150;
               b = 220;
            }
         } else if (elev < 100) {
            // Lowlands: green shades
            const t = elev / 100;
            r = Math.round(34 + t * 30);
            g = Math.round(139 + t * 50);
            b = Math.round(34 + t * 20);
         } else if (elev < 500) {
            // Hills: green to brown transition
            const t = (elev - 100) / 400;
            r = Math.round(64 + t * 60);
            g = Math.round(189 + t * (-40));
            b = Math.round(34 + t * 20);
         } else if (elev < 1500) {
            // Mountains: brown to gray
            const t = (elev - 500) / 1000;
            r = Math.round(124 + t * 60);
            g = Math.round(149 + t * 40);
            b = Math.round(54 + t * 50);
         } else if (elev < 3000) {
            // High mountains: gray
            const t = (elev - 1500) / 1500;
            r = Math.round(184 + t * 30);
            g = Math.round(189 + t * 30);
            b = Math.round(104 + t * 50);
         } else {
            // Peaks: white/gray
            const t = Math.min(1, (elev - 3000) / 2000);
            r = Math.round(214 + t * 41);
            g = Math.round(219 + t * 36);
            b = Math.round(154 + t * 101);
         }
         
         colors[i] = { r, g, b };
      }
      
      return colors;
   }
});

var terrariumElevation = new TerrariumHillshade(
   'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png', {
      maxZoom: 15,
      crossOrigin: true,
      attribution: 'Elevation data &copy; Mapzen Terrarium format | Hillshade visualization',
      lightAzimuth: 315, // Light from NW
      lightAltitude: 45  // 45 degrees above horizon
   });

var baseLayers = {

   "OSM": osmLayer,
   "OSM Street": cartoLight,
   "ESRI Aerial": Esri_WorldImagery,
   "ESRI Clarity": Esri_WorldImagery_Clarity,
   "Stadia Aerial": Stadia_Satellite,   
   "Google Aerial": googleSat,
   "OSM Topographic": topoUrl,
   "Terrarium Elevation": terrariumElevation,

};



// Create the map

var map = L.map('map', { // div id holding map
   preferCanvas: true, // Use Canvas renderer for vector layers instead of SVG
   layers: [cartoLight], // default map - OSM Street
   worldCopyJump: true, // move markers if scrolling horizontally across new map
   minZoom: 1, // minimum zoom level, skip level 0
   zoomControl: false,
   zoomSnap: 0,
   boxZoom: true // Enable native Shift+drag zoom box

}).setView([startLat, startLng],
7); // center map at starting position, zoom level 7

// Store map in window for global access
window.map = map;

// Ensure boxZoom is enabled for native Shift+drag zoom functionality
// boxZoom hooks are added automatically when boxZoom: true is set in map options

var zoomHome = L.Control.zoomHome();
                zoomHome.addTo(map);



//map.addControl(new L.Control.Zoomslider());

// Create Big Marker and place in center of map
var center = map.getCenter();
var bigMarker = new L.marker(center, {
   icon: bigIcon,
   draggable: true
}).addTo(map);

// catch end of drag of big marker and reset map
bigMarker.on('dragend', function() {
   var point = bigMarker.getLatLng();
   // handle marker crossing dateline
   if (point.lng < -180) {
      point.lng += 360;
   }
   if (point.lng > 180) {
      point.lng -= 360;
   }
   $('#latbox').val(point.lat);
   $('#lngbox').val(point.lng);
   latlongChanged();
});





















function readTextBox(inputId, numchars, intgr, pad, min, max, def) {
   var number = document.getElementById(inputId).value.substring(0, numchars)
   if (intgr) {
      number = Math.floor(parseFloat(number))
   }
   else { // float
      number = parseFloat(number)
   }
   if (number < min) {
      number = min
   }
   else if (number > max) {
      number = max
   }
   else if (number.toString() == "NaN") {
      number = def
   }
   if ((pad) && (intgr)) {
      document.getElementById(inputId).value = zeroPad(number, 2)
   }
   else {
      document.getElementById(inputId).value = number
   }
   return number
}

/* Orthodrome Layers */

var div_circle = L.divIcon({
   className: 'circle'
})

const svgIconString = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="#808080" stroke-width="1" fill="none"/>
        <circle cx="12" cy="12" r="3" fill="#2c157d"/>
    </svg>`;
    const iconUrl = 'data:image/svg+xml;base64,' + btoa(svgIconString);

    // Reverted size to 24x24 and anchor to 12x12
    var MarkerAIcon = L.icon({ iconUrl: iconUrl, iconSize: [24, 24], iconAnchor: [12, 12] });
    var MarkerBIcon = L.icon({ iconUrl: iconUrl, iconSize: [24, 24], iconAnchor: [12, 12] });

    // 3. Define Layers


// -- The Measurement Layer --
    var orthodrome = L.layerGroup();
    var markerA, markerB, geodesic, tempLine; 

    // 5. THE CORE LOGIC
    orthodrome.on('add', function() {
        orthodrome.clearLayers();
        spawnMarkersInView();
    });

    function spawnMarkersInView() {
        var bounds = map.getBounds();
        var centerLat = bounds.getCenter().lat;
        var west = bounds.getWest();
        var east = bounds.getEast();
        var lngSpan = east - west;

        // 10% in from left and right
        var lngA = west + (lngSpan * 0.10);
        var lngB = east - (lngSpan * 0.10);

        var LocationA = new L.LatLng(centerLat, lngA);
        var LocationB = new L.LatLng(centerLat, lngB);

        // Create Markers
        markerA = L.marker(LocationA, { draggable: true, icon: MarkerAIcon }).addTo(orthodrome);
        
        markerB = L.marker(LocationB, { draggable: true, icon: MarkerBIcon })
            .addTo(orthodrome)
            .bindPopup("Drag me", { 
                closeOnClick: false, 
                autoClose: false     
            });

        markerB.openPopup();

        // Temporary line for dragging
        tempLine = L.polyline([], {
            weight: 1.8,
            color: '#2c157d',
            opacity: 0.6,
            dashArray: '5, 10'
        });

        // Initialize Geodesic Line
        try {
            geodesic = L.geodesic([
                [markerA.getLatLng(), markerB.getLatLng()]
            ], {
                weight: 1.8,
                opacity: 1,
                color: '#2c157d',
                wrap: false
            }).addTo(orthodrome);
            
            setupInteraction();
            updateGeodesicStats();
        } catch (e) {
            console.error("Geodesic library not ready", e);
        }
    }

    function setupInteraction() {
        // PERFORMANCE FIX:
        // 1. Hide heavy line during drag.
        // 2. STOP calculating math stats during drag (the real fix for the lag).
        
        function onDragStart() {
            if (geodesic) geodesic.removeFrom(orthodrome);
            tempLine.setLatLngs([markerA.getLatLng(), markerB.getLatLng()]);
            tempLine.addTo(orthodrome);
            
            // Optional: Give visual feedback that stats are paused
            // markerB.setPopupContent("Calculating..."); 
        }

        function onDrag() {
            // ONLY update the visual line. NO MATH here.
            tempLine.setLatLngs([markerA.getLatLng(), markerB.getLatLng()]);
        }

        function onDragEnd() {
            tempLine.remove();
            
            // Now drag is finished, do the heavy lifting ONCE.
            if (geodesic) {
                geodesic.setLatLngs([markerA.getLatLng(), markerB.getLatLng()]);
                geodesic.addTo(orthodrome);
            }
            updateGeodesicStats(); // Calculate numbers now
        }

        markerA.on('dragstart', onDragStart);
        markerA.on('drag', onDrag);
        markerA.on('dragend', onDragEnd);

        markerB.on('dragstart', onDragStart);
        markerB.on('drag', onDrag);
        markerB.on('dragend', onDragEnd);
    }

    function updateGeodesicStats() {
        if (!geodesic || !geodesic.geom) return;

        let vector = geodesic.geom.geodesic.inverse(markerA.getLatLng(), markerB.getLatLng());

        // Distance Logic
        let totalDistance;
        if (vector.distance !== undefined) {
            const d = vector.distance; 
            if (d >= 1000) totalDistance = (d / 1000).toFixed(2) + ' km';
            else if (d >= 1) totalDistance = d.toFixed(2) + ' m';
            else totalDistance = (d * 100).toFixed(0) + ' cm';
        } else {
            totalDistance = 'invalid';
        }

        // Bearing Logic
        let initB = (vector.initialBearing < 0) ? vector.initialBearing + 360 : vector.initialBearing;
        let finalB = (vector.finalBearing < 0) ? vector.finalBearing + 360 : vector.finalBearing;

        // Persistent Popup Content Update
        const content = `<b>Segment</b><br>
             Distance: ${totalDistance}<br>
             Initial Bearing: ${initB.toFixed(2)}°<br>
             Final Bearing: ${finalB.toFixed(2)}°`;
             
        markerB.setPopupContent(content);
        
        if (!markerB.isPopupOpen()) {
            markerB.openPopup();
        }
    }





/* Lat Long Graticule */



var overlayMaps = {
   "National Monuments ROI": NationalMonuments,
   "National Monuments NI": NationalMonumentsNI,
   "Measurements": orthodrome,
   

};

// Add the map layer switching control
var layerswitcher = L.control.layers(baseLayers, overlayMaps).addTo(map);
window.layersControl = layerswitcher;

/*----------------------------------------------------------------*/

// Remove the sunrise, sunset, azimuth lines from map
function clearLines() {
   if (solsticeazisumriseline) {
      map.removeLayer(solsticeazisumriseline);
   }
   if (solsticeazisumsetline) {
      map.removeLayer(solsticeazisumsetline);
   }
   if (solsticeaziwinriseline) {
      map.removeLayer(solsticeaziwinriseline);
   }
   if (solsticeaziwinsetline) {
      map.removeLayer(solsticeaziwinsetline);
   }
   if (equinoxazisumriseline) {
      map.removeLayer(equinoxazisumriseline);
   }
   if (equinoxazisumsetline) {
      map.removeLayer(equinoxazisumsetline);
   }
   if (crossquarterazisumriseline) {
      map.removeLayer(crossquarterazisumriseline);
   }
   if (crossquarterazisumsetline) {
      map.removeLayer(crossquarterazisumsetline);
   }
   if (crossquarteraziwinriseline) {
      map.removeLayer(crossquarteraziwinriseline);
   }
   if (crossquarteraziwinsetline) {
      map.removeLayer(crossquarteraziwinsetline);
   }
   if (majorazisumriseline) {
      map.removeLayer(majorazisumriseline);
   }
   if (majorazisumsetline) {
      map.removeLayer(majorazisumsetline);
   }
   if (majoraziwinriseline) {
      map.removeLayer(majoraziwinriseline);
   }
   if (majoraziwinsetline) {
      map.removeLayer(majoraziwinsetline);
   }
   if (minorazisumriseline) {
      map.removeLayer(minorazisumriseline);
   }
   if (minorazisumsetline) {
      map.removeLayer(minorazisumsetline);
   }
   if (minoraziwinriseline) {
      map.removeLayer(minoraziwinriseline);
   }
   if (minoraziwinsetline) {
      map.removeLayer(minoraziwinsetline);
   }
   if (northaziline) {
      map.removeLayer(northaziline);
   }
   if (southaziline) {
      map.removeLayer(southaziline);
   }

}

var solsticeazisumriseline;
var solsticeazisumsetline;
var solsticeaziwinriseline;
var solsticeaziwinsetline;
var equinoxazisumriseline;
var equinoxazisumsetline;
var crossquarterazisumriseline;
var crossquarterazisumsetline;
var crossquarteraziwinriseline;
var crossquarteraziwinsetline;
var majorazisumriseline;
var majorazisumsetline;
var majoraziwinriseline;
var majoraziwinsetline;
var minorazisumriseline;
var minorazisumsetline;
var minoraziwinriseline;
var minoraziwinsetline;
var northaziline;
var southaziline;

function calculate() {

   var lat = parseFloat(document.getElementById("latbox").value.substring(0, 9))
   var lng = parseFloat(document.getElementById("lngbox").value.substring(0,
      10))

   solsticeazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   solsticeazisumriselng = L.latLng(parseFloat(solstice1lat), parseFloat(
      solstice1long));
   solsticeazisumriseline = L.geodesic(
      [
         [solsticeazisumriselat, solsticeazisumriselng]
      ], {
         color: "#ffb74d",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   solsticeazisumsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   solsticeazisumsetlng = L.latLng(parseFloat(solstice2lat), parseFloat(
      solstice2long));
   solsticeazisumsetline = L.geodesic(
      [
         [solsticeazisumsetlat, solsticeazisumsetlng]
      ], {
         color: "#ffb74d",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   solsticeaziwinriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   solsticeaziwinriselng = L.latLng(parseFloat(solstice3lat), parseFloat(
      solstice3long));
   solsticeaziwinriseline = L.geodesic(
      [
         [solsticeaziwinriselat, solsticeaziwinriselng]
      ], {
         color: "#ffb74d",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   solsticeaziwinsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   solsticeaziwinsetlng = L.latLng(parseFloat(solstice4lat), parseFloat(
      solstice4long));
   solsticeaziwinsetline = L.geodesic(
      [
         [solsticeaziwinsetlat, solsticeaziwinsetlng]
      ], {
         color: "#ffb74d",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   equinoxazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   equinoxazisumriselng = L.latLng(parseFloat(equinox1lat), parseFloat(
      equinox1long));
   equinoxazisumriseline = L.geodesic(
      [
         [equinoxazisumriselat, equinoxazisumriselng]
      ], {
         color: "#ffeb3b",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   equinoxazisumsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   equinoxazisumsetlng = L.latLng(parseFloat(equinox2lat), parseFloat(
      equinox2long));
   equinoxazisumsetline = L.geodesic(
      [
         [equinoxazisumsetlat, equinoxazisumsetlng]
      ], {
         color: "#ffeb3b",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   crossquarterazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   crossquarterazisumriselng = L.latLng(parseFloat(crossquarter1lat),
      parseFloat(crossquarter1long));
   crossquarterazisumriseline = L.geodesic(
      [
         [crossquarterazisumriselat, crossquarterazisumriselng]
      ], {
         color: "#5cb85c",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   crossquarterazisumsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   crossquarterazisumsetlng = L.latLng(parseFloat(crossquarter2lat), parseFloat(
      crossquarter2long));
   crossquarterazisumsetline = L.geodesic(
      [
         [crossquarterazisumsetlat, crossquarterazisumsetlng]
      ], {
         color: "#5cb85c",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   crossquarteraziwinriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   crossquarteraziwinriselng = L.latLng(parseFloat(crossquarter3lat),
      parseFloat(crossquarter3long));
   crossquarteraziwinriseline = L.geodesic(
      [
         [crossquarteraziwinriselat, crossquarteraziwinriselng]
      ], {
         color: "#5cb85c",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   crossquarteraziwinsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   crossquarteraziwinsetlng = L.latLng(parseFloat(crossquarter4lat), parseFloat(
      crossquarter4long));
   crossquarteraziwinsetline = L.geodesic(
      [
         [crossquarteraziwinsetlat, crossquarteraziwinsetlng]
      ], {
         color: "#5cb85c",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   majorazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   majorazisumriselng = L.latLng(parseFloat(major1lat), parseFloat(major1long));
   majorazisumriseline = L.geodesic(
      [
         [majorazisumriselat, majorazisumriselng]
      ], {
         color: "#0099CC",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   majorazisumsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   majorazisumsetlng = L.latLng(parseFloat(major2lat), parseFloat(major2long));
   majorazisumsetline = L.geodesic(
      [
         [majorazisumsetlat, majorazisumsetlng]
      ], {
         color: "#0099CC",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   majoraziwinriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   majoraziwinriselng = L.latLng(parseFloat(major3lat), parseFloat(major3long));
   majoraziwinriseline = L.geodesic(
      [
         [majoraziwinriselat, majoraziwinriselng]
      ], {
         color: "#0099CC",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   majoraziwinsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   majoraziwinsetlng = L.latLng(parseFloat(major4lat), parseFloat(major4long));
   majoraziwinsetline = L.geodesic(
      [
         [majoraziwinsetlat, majoraziwinsetlng]
      ], {
         color: "#0099CC",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   minorazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   minorazisumriselng = L.latLng(parseFloat(minor1lat), parseFloat(minor1long));
   minorazisumriseline = L.geodesic(
      [
         [minorazisumriselat, minorazisumriselng]
      ], {
         color: "#ff4444",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   minorazisumsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   minorazisumsetlng = L.latLng(parseFloat(minor2lat), parseFloat(minor2long));
   minorazisumsetline = L.geodesic(
      [
         [minorazisumsetlat, minorazisumsetlng]
      ], {
         color: "#ff4444",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   minoraziwinriselat = L.latLng(parseFloat(lat), parseFloat(lng));
   minoraziwinriselng = L.latLng(parseFloat(minor3lat), parseFloat(minor3long));
   minoraziwinriseline = L.geodesic(
      [
         [minoraziwinriselat, minoraziwinriselng]
      ], {
         color: "#ff4444",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   minoraziwinsetlat = L.latLng(parseFloat(lat), parseFloat(lng));
   minoraziwinsetlng = L.latLng(parseFloat(minor4lat), parseFloat(minor4long));
   minoraziwinsetline = L.geodesic(
      [
         [minoraziwinsetlat, minoraziwinsetlng]
      ], {
         color: "#ff4444",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   northazilat = L.latLng(parseFloat(lat), parseFloat(lng));
   northazilng = L.latLng(parseFloat(northlat), parseFloat(northlong));
   northaziline = L.geodesic(
      [
         [northazilat, northazilng]
      ], {
         color: "#e1bee7",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

   southazilat = L.latLng(parseFloat(lat), parseFloat(lng));
   southazilng = L.latLng(parseFloat(southlat), parseFloat(southlong));
   southaziline = L.geodesic(
      [
         [southazilat, southazilng]
      ], {
         color: "#e1bee7",
         opacity: 0.7,
         steps: 50,
         weight: 2,
         dashArray: "5 5",
      }).addTo(map);

}

/*----------------------------------------------------------------*/
// Get new location, move big marker to it, recalculate 
function latlongChanged() {
   var newlat = readTextBox("latbox", 9, 0, 0, -89.9, 89.9, 0)
   var newlng = readTextBox("lngbox", 10, 0, 0, -180.0, 180.0, 0)

   newcenter = L.latLng(parseFloat(newlat), parseFloat(newlng));

   map.setView(newcenter);
   bigMarker.setLatLng(newcenter);
   clearLines();

   // Also update horizon probe section lat/lon fields
   if ($('#hc-test-lat').length && $('#hc-test-lng').length) {
      $('#hc-test-lat').val(parseFloat(newlat).toFixed(6));
      $('#hc-test-lng').val(parseFloat(newlng).toFixed(6));
   }

   compute();
   calculate();
   
   

   console.log(solstice1lat);

}











/*----------------------------------------------------------------*/
// Show National Monuments Layer Details

NationalMonuments.bindPopup(function(layer) {
   return L.Util.template(

      "<p><strong>Monument Type:</strong> {MONUMENT_CLASS}</p><p><strong>SMR:</strong> {SMRS}</p><p><strong>Name:</strong> {TOWNLAND}</p><p><strong>LAT/LON:</strong> {LATITUDE}, {LONGITUDE}</p><p><small>{WEB_NOTES}</small></p>",
      layer.feature.properties
   );
});

//  add Fullscreen to an existing map:
map.addControl(new L.Control.Fullscreen());

// Hide/show navbar when entering/exiting fullscreen
function toggleNavbarOnFullscreen(isFullscreen) {
    var navbar = document.querySelector('.navbar');
    if (navbar) {
        if (isFullscreen) {
            navbar.style.display = 'none';
        } else {
            navbar.style.display = '';
        }
    }
}

// Listen for fullscreen changes
map.on('fullscreenchange', function() {
    toggleNavbarOnFullscreen(map.isFullscreen());
});

// Also listen to document fullscreen events (for native fullscreen API)
var fullscreenChangeEvents = ['fullscreenchange', 'mozfullscreenchange', 'webkitfullscreenchange', 'MSFullscreenChange'];
fullscreenChangeEvents.forEach(function(eventName) {
    document.addEventListener(eventName, function() {
        var isFullscreen = !!(document.fullscreenElement || document.mozFullScreenElement || 
                             document.webkitFullscreenElement || document.msFullscreenElement);
        toggleNavbarOnFullscreen(isFullscreen);
    });
});

/*----------------------------------------------------------------*/
// Show National Monuments NI Layer Details

NationalMonumentsNI.bindPopup(function(layer) {
   return L.Util.template(

      '<p><a href="https://apps.communities-ni.gov.uk/NISMR-public/Details.aspx?MonID={MONID}">Link to NISMR entry</a></p><p><strong>Edited Type:</strong> {Edited_Typ}</p><p><strong>SMR:</strong> {SMRNo}</p><p><strong>Name:</strong> {Townland_s}</p><p><strong>Grid Reference:</strong> {Grid_Refer}</p><p><strong>General Type:</strong> {General_Ty}</p><p><strong>General Period:</strong> {General_Pe}</p>',
      layer.feature.properties
   );
});

function setModalMaxHeight(element) {
         this.$element     = $(element);  
         this.$content     = this.$element.find('.modal-content');
         var borderWidth   = this.$content.outerHeight() - this.$content.innerHeight();
         var dialogMargin  = $(window).width() < 768 ? 20 : 60;
         var contentHeight = $(window).height() - (dialogMargin + borderWidth);
         var headerHeight  = this.$element.find('.modal-header').outerHeight() || 0;
         var footerHeight  = this.$element.find('.modal-footer').outerHeight() || 0;
         var maxHeight     = contentHeight - (headerHeight + footerHeight);
         this.$content.css({
            'overflow': 'hidden'
         });
         this.$element
          .find('.modal-body').css({
            'max-height': maxHeight,
            'overflow-y': 'auto'
         });
         }
         $('.modal').on('show.bs.modal', function() {
         $(this).show();
         setModalMaxHeight(this);
         });
         $(window).resize(function() {
         if ($('.modal.in').length != 0) {
          setModalMaxHeight($('.modal.in'));
         }
         });
         
         $("#featureModal").draggable({
              handle: ".modal-header"
          });  
       
         var sidebar = L.control.sidebar({ container: 'sidebar', autopan: true })
                     .addTo(map);
         
         // File icon handler is now set up in fileopen.js - no need to do it here
     
         $(function(){
             $('#lobipanel-multiple').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
             $('#lobipanel-multiple1').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
             $('#lobipanel-multiple3').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
    
         $(function(){
            $('#lobipanel-multiple4').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
           $('#lobipanel-multiple6').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
           $('#lobipanel-multiple7').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
             $('#lobipanel-multiple8').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
             $('#lobipanel-quickview').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
           $('#lobipanel-multiple9').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
          $('#lobipanel-multiple11').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
          $('#lobipanel-multiple14').find('.panel').lobiPanel({
                 state: 'collapsed',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
     
         $(function(){
          $('#lobipanel-multiple19').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
          $('#lobipanel-multiple20').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
             $('#lobipanel-multiple21').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
      
         $(function(){
             $('#lobipanel-multiple22').find('.panel').lobiPanel({
                 state: 'open',
         sortable: true,
         reload: false,
         close: false,
         editTitle: false
             });
         });
       
         $(document).ready(function(){
             $('[rel=tooltip]').tooltip({ trigger: "hover" });
             
             // Initialize Drawing Tools after all scripts are loaded
             function initDrawingTools() {
                 if (typeof window.DrawingToolsApp === 'undefined') {
                     console.warn('DrawingToolsApp not yet loaded, retrying...');
                     setTimeout(initDrawingTools, 500);
                     return;
                 }
                 if (!window.map) {
                     console.warn('Map not yet available, retrying...');
                     setTimeout(initDrawingTools, 500);
                     return;
                 }
                 try {
                     window.DrawingToolsApp.init(window.map);
                     console.log('Drawing Tools initialized successfully');
                 } catch (error) {
                     console.error('Error initializing Drawing Tools:', error);
                 }
             }
             
             // Start initialization after a short delay to ensure all scripts are loaded
             setTimeout(initDrawingTools, 1500);
         });
         
      function copyToClipboard(element) {
         var $temp = $("<input>");
           $("body").append($temp);
           $temp.val($(element).text()).select();
           document.execCommand("copy");
           $temp.remove();
         }
         
               
    
         $('#clickhere').click(function() {
            downloadeverything();
         });
         
         function downloadeverything() {
            function downloadInnerHtml(filename, elId, mimeType) {
               var elHtml = $('#' + elId).text();
               var link = document.createElement('a');
               mimeType = mimeType || 'text/plain';
               link.setAttribute('download', filename);
               link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
               link.click();
            }
            var fileName = 'maceoutput.geojson';
            downloadInnerHtml(fileName, 'geojson', 'text/html');
         }