var startLat = '53.4869'

var startLng = '-7.5655'

/* Basemap Layers */

var NationalMonuments = L.esri
   .featureLayer({
      url: "https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/ArcGIS/rest/services/SMROpenData/FeatureServer/3",
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

var cartoLight = L.tileLayer(
   "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
      maxZoom: 28,
      useCache: true,
      crossOrigin: true,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'

   });

var Esri_WorldImagery = L.tileLayer(
   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 28,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
   });

var Esri_WorldImagery_Clarity = L.tileLayer(
   'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 38,
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

/* Tangram terrain */
var terrain = new L.featureGroup();
var Tangramlayer = Tangram.leafletLayer({
   scene: 'data:application/octet-stream;base64,c291cmNlczoKICAgIG5leHR6ZW46CiAgICAgICAgdHlwZTogTVZUCiAgICAgICAgdXJsOiBodHRwczovL3RpbGUubmV4dHplbi5vcmcvdGlsZXplbi92ZWN0b3IvdjEvMjU2L2FsbC97en0ve3h9L3t5fS5tdnQKICAgICAgICB1cmxfcGFyYW1zOgogICAgICAgICAgICBhcGlfa2V5OiB5VW1pTllFMlI1MjlRd2Y4QWhmTGNBCiAgICAgICAgbWF4X3pvb206IDgKICAgICAgICByYXN0ZXJzOiBbbm9ybWFsc10KICAgIG5vcm1hbHM6CiAgICAgICAgdHlwZTogUmFzdGVyCiAgICAgICAgdXJsOiBodHRwczovL3RpbGUubmV4dHplbi5vcmcvdGlsZXplbi90ZXJyYWluL3YxLzI1Ni9ub3JtYWwve3p9L3t4fS97eX0ucG5nCiAgICAgICAgdXJsX3BhcmFtczoKICAgICAgICAgICAgYXBpX2tleTogeVVtaU5ZRTJSNTI5UXdmOEFoZkxjQQogICAgICAgIG1heF96b29tOiAxNQoKc3R5bGVzOgogICAgdGVycmFpbi1lbnZtYXA6CiAgICAgICAgYmFzZTogcmFzdGVyCiAgICAgICAgcmFzdGVyOiBub3JtYWwKICAgICAgICBsaWdodGluZzogZmFsc2UKICAgICAgICBzaGFkZXJzOgogICAgICAgICAgICB1bmlmb3JtczoKICAgICAgICAgICAgICAgIHVfc2NhbGU6IC4xNQogICAgICAgICAgICAgICAgdV9lbnZtYXA6IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS90YW5ncmFtcy90ZXJyYWluLWRlbW9zL21hc3Rlci9pbWcvaW1ob2Y1LmpwZwogICAgICAgICAgICBibG9ja3M6CiAgICAgICAgICAgICAgICBnbG9iYWw6IHwKICAgICAgICAgICAgICAgICAgICAvLyBTaW1wbGlmaWVkIHZpZXctaW5kZXBlbmRlbnQgZW52aXJvbm1lbnQgbWFwCiAgICAgICAgICAgICAgICAgICAgdmVjNCBhcHBseUVudm1hcCAoaW4gc2FtcGxlcjJEIF90ZXgsIGluIHZlYzMgX25vcm1hbCkgewogICAgICAgICAgICAgICAgICAgICAgICB2ZWMyIHV2ID0gMC41ICogX25vcm1hbC54eSArIDAuNTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUyRChfdGV4LCB1dik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY29sb3I6IHwKICAgICAgICAgICAgICAgICAgICBub3JtYWwueiAqPSB1X3NjYWxlOwogICAgICAgICAgICAgICAgICAgIG5vcm1hbCA9IG5vcm1hbGl6ZShub3JtYWwpOwogICAgICAgICAgICAgICAgICAgIGNvbG9yID0gYXBwbHlFbnZtYXAodV9lbnZtYXAsIG5vcm1hbCk7CiAgICBkb3RzOgogICAgICAgIGJhc2U6IGxpbmVzCiAgICAgICAgZGFzaDogWzEsIDJdCiAgICBmYWRlbGluZXM6CiAgICAgICAgYmFzZTogbGluZXMKICAgICAgICBibGVuZDogbXVsdGlwbHkKICAgIGZhZGV0ZXh0OgogICAgICAgIGJhc2U6IHRleHQKICAgICAgICBibGVuZDogb3ZlcmxheQogICAgZmFkZXBvbHlzOgogICAgICAgIGJhc2U6IHJhc3RlcgogICAgICAgIG1peDogdGVycmFpbi1lbnZtYXAKICAgICAgICBzaGFkZXJzOgogICAgICAgICAgICBibG9ja3M6CiAgICAgICAgICAgICAgICBjb2xvcjogfAogICAgICAgICAgICAgICAgICAgIGNvbG9yICo9IHZlYzQoMS4yKTsKbGF5ZXJzOgogICAgdGVycmFpbjoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbm9ybWFscywgbGF5ZXI6IF9kZWZhdWx0IH0KICAgICAgICBkcmF3OgogICAgICAgICAgICB0ZXJyYWluLWVudm1hcDoKICAgICAgICAgICAgICAgIG9yZGVyOiAwCgogICAgcGxhY2VzOgogICAgICAgIGRhdGE6IHsgc291cmNlOiBuZXh0emVuIH0KICAgICAgICBmaWx0ZXI6IAogICAgICAgICAgICBraW5kOiBbY2l0eV0KICAgICAgICBkcmF3OgogICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICBmaWxsOiB3aGl0ZQogICAgICAgICAgICAgICAgICAgIHNpemU6IDEwcHgKICAgICAgICAgICAgICAgICAgICBzdHJva2U6IHsgY29sb3I6ICcjNDQ0Jywgd2lkdGg6IDRweH0KICAgIGJvdW5kYXJpZXM6CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4gfQogICAgICAgIGRyYXc6CiAgICAgICAgICAgIGRvdHM6CiAgICAgICAgICAgICAgICBjb2xvcjogWy43NSwgLjc1LCAuNzVdCiAgICAgICAgICAgICAgICB3aWR0aDogMXB4CiAgICB3YXRlcjoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbmV4dHplbiB9CiAgICAgICAgbGluZXM6CiAgICAgICAgICAgIGZpbHRlcjoge2JvdW5kYXJ5OiB0cnVlfQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgbGluZXM6CiAgICAgICAgICAgICAgICAgICAgb3JkZXI6IDUKICAgICAgICAgICAgICAgICAgICBjb2xvcjogbGlnaHRibHVlCiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IC4zcHgKICAgIHdhdGVyLXRlcnJhaW46CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4sIGxheWVyOiB3YXRlciB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZXBvbHlzOgogICAgICAgICAgICAgICAgb3JkZXI6IDQKCiAgICByb2FkczoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbmV4dHplbiB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZWxpbmVzOgogICAgICAgICAgICAgICAgb3JkZXI6IDMKICAgICAgICAgICAgICAgIGNvbG9yOiBbWzEwLCBbLjksIC45LCAuOV1dLCBbMTgsIHdoaXRlXV0KICAgICAgICAgICAgICAgIHdpZHRoOiBbWzEzLCAxLjVweF0sIFsxNSwgNV1dCiAgICAgICAgbGFiZWxzOgogICAgICAgICAgICBmaWx0ZXI6IHskem9vbToge21pbjogMTB9fQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgZmFkZXRleHQ6CiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiAxMHB4CiAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMTBweAogICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHk6IEx1Y2lkYSBHcmFuZGUKICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogZnVuY3Rpb24oKSB7cmV0dXJuIFsxLCAxLCAxLCAkem9vbS8xNS5dO30KICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOgogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGZ1bmN0aW9uKCkge3JldHVybiBbMCwgMCwgMCwgJHpvb20vMTUuXTt9CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMXB4CiAgICBwbGFjZXM6CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4gfQogICAgICAgIGZpbHRlcjogeyBub3Q6IHsga2luZDogW25laWdoYm91cmhvb2RdIH0gfQogICAgICAgIGNvdW50cmllczoKICAgICAgICAgICAgZmlsdGVyOiB7IGtpbmQ6IGNvdW50cnkgfQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgdGV4dDoKICAgICAgICAgICAgICAgICAgICBmb250OgogICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHVwcGVyY2FzZQogICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAxMHB4CiAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseTogTHVjaWRhIEdyYW5kZQogICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiB3aGl0ZQogICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2sKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAycHgKICAgICAgICBjaXRpZXM6CiAgICAgICAgICAgIGZpbHRlcjogeyBub3Q6IHsga2luZDogW2NvdW50cnksIHN0YXRlXSB9IH0KICAgICAgICAgICAgYWxzbzoKICAgICAgICAgICAgICAgIGZpbHRlcjoKICAgICAgICAgICAgICAgICAgICBhbnk6CiAgICAgICAgICAgICAgICAgICAgICAgIC0gJHpvb206IHsgbWluOiA2LCBtYXg6IDggfQogICAgICAgICAgICAgICAgICAgICAgICAtIHsgbGFiZWxyYW5rOiB7bWluOiA1fSwgJHpvb206IHsgbWF4OiA2IH19CiAgICAgICAgICAgICAgICAgICAgICAgIC0geyBwb3B1bGF0aW9uOiB7IG1pbjogMTAwMDAwIH0gLCAkem9vbToge21pbjogOCB9IH0KICAgICAgICAgICAgICAgICAgICAgICAgLSB7IHBvcHVsYXRpb246IHsgbWluOiA1MDAwMCB9ICwgJHpvb206IHttaW46IDEyIH0gfQogICAgICAgICAgICAgICAgZHJhdzoKICAgICAgICAgICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogZmFsc2UKICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDEwcHgKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseTogTHVjaWRhIEdyYW5kZQogICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogd2hpdGUKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZToKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2sKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMnB4CiAgICAgICAgc3RhdGVzOgogICAgICAgICAgICBmaWx0ZXI6CiAgICAgICAgICAgICAgICAtIGtpbmQ6IHN0YXRlCiAgICAgICAgICAgICAgICAgICR6b29tOiB7IG1pbjogNiB9CiAgICAgICAgICAgIGRyYXc6CiAgICAgICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiAzCiAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB1cHBlcmNhc2UKICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMTBweAogICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHk6IEx1Y2lkYSBHcmFuZGUKICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogd2hpdGUKICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOgogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGJsYWNrCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMnB4CiAgICBidWlsZGluZ3M6CiAgICAgICAgZGF0YToge3NvdXJjZTogbmV4dHplbiB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZWxpbmVzOgogICAgICAgICAgICAgICAgb3JkZXI6IDEwCiAgICAgICAgICAgICAgICBjb2xvcjogWy45NSwgLjk1LCAuOTVdCiAgICAgICAgICAgICAgICB3aWR0aDogMnB4'
});

Tangramlayer.addTo(terrain);

var topoUrl = L.tileLayer(
   'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {});

var BING_KEY =
   'AmPQVvaKSid_g48EnFJjbYUOyWPlkQh1QGJlsFFZnw1EnJioQ5kvSiv2w7SUaJ9B'
   
  

var bingLayer = L.tileLayer.bing(BING_KEY)

var baseLayers = {

   "OSM Street": cartoLight,
   "ESRI Aerial": Esri_WorldImagery,
   "ESRI Clarity": Esri_WorldImagery_Clarity,
   "Google Aerial": googleSat,
   "Bing Aerial": bingLayer,
   "OSM Topographic": topoUrl,
   "Hillshade": terrain,

};

var ImageOverlayJpg = L.layerGroup();
var ImageOverlaySvg = L.layerGroup();
var ImageOverlayPng = L.layerGroup();

// Create the map

var map = L.map('map', { // div id holding map
   layers: [cartoLight], // default map
   worldCopyJump: true, // move markers if scrolling horizontally across new map
   minZoom: 1, // minimum zoom level, skip level 0
   zoomControl: false,
   zoomSnap: 0,

}).setView([startLat, startLng],
7); // center map at starting position, zoom level 7

var zoomHome = L.Control.zoomHome();
                zoomHome.addTo(map);
				
var control = L.control.zoomBox({modal: true});
        map.addControl(control);

jpgimg = L.distortableImageOverlay('assets/imageoverlayjs/files/overlay.jpg', {
   mode: 'freeRotate',
   selected: true,
   fullResolutionSrc: 'assets/imageoverlayjs/files/overlay.jpg',
}).addTo(ImageOverlayJpg);

svgimg = L.distortableImageOverlay('assets/imageoverlayjs/files/overlay.svg', {
   mode: 'freeRotate',
   selected: true,
   fullResolutionSrc: 'assets/imageoverlayjs/files/overlay.svg',
}).addTo(ImageOverlaySvg);

pngimg = L.distortableImageOverlay('assets/imageoverlayjs/files/overlay.png', {
   mode: 'freeRotate',
   selected: true,
   fullResolutionSrc: 'assets/imageoverlayjs/files/overlay.png',
}).addTo(ImageOverlayPng);

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
var orthodrome = L.layerGroup();
var omphalos = new L.LatLng(53.4869, -7.5655);

var protractorIcon = L.icon({
   iconUrl: 'assets/img/Protractor.svg',
   iconSize: [400, 400], // size of the icon
   iconAnchor: [200,
   200], // point of the icon which will correspond to marker's location
});
var dotcircleIcon = L.icon({
   iconUrl: 'assets/img/dotcircle.svg',
   iconSize: [12, 12], // size of the icon
   iconAnchor: [6,
   6], // point of the icon which will correspond to marker's location
});
var LocationA = new L.LatLng(53.4869, -7.5655);
var LocationB = new L.LatLng(54.1218, -6.4335);
markerA = L.marker(LocationA, {
   draggable: true,
   icon: protractorIcon
}).addTo(orthodrome);
markerB = L.marker(LocationB, {
   draggable: true,
   icon: dotcircleIcon
}).addTo(orthodrome).bindTooltip().bindPopup("Drag me.").openPopup();
var geodesic = L.geodesic([
   [markerA.getLatLng(), markerB.getLatLng()]
], {
   weight: 1.8,
   opacity: 1,
   color: '#2c157d',
   steps: 10
}).addTo(orthodrome);

markerB.on('drag', (e) => {
   const points = geodesic.points;
   points[0].pop();
   geodesic.addLatLng(markerB.getLatLng(), points[0]);
   if (points[0].length > 1) {
      let vector = geodesic.geom.geodesic.inverse(points[0][geodesic
         .points[0].length - 2
      ], markerB.getLatLng());
      const totalDistance = (vector.distance !== undefined ? (vector
            .distance > 10000) ? (vector.distance / 1000).toFixed(0) +
         ' km' : (vector.distance).toFixed(0) + ' m' : 'invalid');
      markerB.setTooltipContent(
         `<b>Segment</b></br>Distance: +${totalDistance}</br>Initial Bearing: ${vector.initialBearing.toFixed(0)}°</br>final Bearing: ${vector.finalBearing.toFixed(0)}°`
         );
      markerB.openTooltip();
   }
});
geodesic.update = function() {
   geodesic.setLatLngs([
      [markerA.getLatLng(), markerB.getLatLng()]
   ]);
};
geodesic.update();
markerA.on('drag', geodesic.update);
markerB.on('drag', geodesic.update);

/* Lat Long Graticule */

var graticule = new L.featureGroup();

var latlngGraticule = L.latlngGraticule({
   showLabel: true,
   zoomInterval: [{
         start: 2,
         end: 2,
         interval: 40
      },
      {
         start: 3,
         end: 3,
         interval: 20
      },
      {
         start: 4,
         end: 4,
         interval: 10
      },
      {
         start: 5,
         end: 7,
         interval: 5
      },
      {
         start: 8,
         end: 20,
         interval: 1
      }
   ]
}).addTo(graticule);

var overlayMaps = {
   "National Monuments ROI": NationalMonuments,
   "National Monuments NI": NationalMonumentsNI,
   "Measurements": orthodrome,
   "Lat Lon Graticule ": latlngGraticule,
   "ImageOverlayJpg ": ImageOverlayJpg,
   "ImageOverlaySvg ": ImageOverlaySvg,
   "ImageOverlayPng ": ImageOverlayPng,

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
       
         $(document).ready(function(){
             $('[rel=tooltip]').tooltip({ trigger: "hover" });
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
    const originalConsole = { ...console };
    // Since the on-page console output div is removed, appendToConsole now just uses native console
    function appendToConsole(message, type = 'log') {
        originalConsole.log(...(Array.isArray(message) ? message : [message])); // Ensure it handles arrays or single messages
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

    // --- Leaflet Map and Layer Variables (now referencing global objects from Script B) ---
    // These variables will be assigned from window.map and window.layersControl
    // when the DOM is ready and Script B has initialized them.
    let map = null;
    let layersControl = null;
    let observerMarker = null; // This will now refer to Script B's bigMarker

    // Array to hold all LayerGroups created by Script C for easy clearing and GeoJSON export
    let scriptCOverlayGroups = [];

    /**
     * Clears all dynamically added overlay layers from the map that were generated by Script C.
     * This function now specifically targets layer groups managed by Script C.
     */
    function clearResultsDisplay() {
        // Iterate over layer groups created by Script C and remove them
        scriptCOverlayGroups.forEach(layerGroup => {
            if (window.map && window.map.hasLayer(layerGroup)) {
                window.map.removeLayer(layerGroup);
            }
            // Remove from layers control if it was added there
            if (window.layersControl && layerGroup.layerNameForControl) {
                window.layersControl.removeLayer(layerGroup);
            }
        });
        // Clear the array of Script C's layer groups
        scriptCOverlayGroups = [];

        console.log("Cleared all Script C generated overlay layers.");
    }

    // --- Astronomical Constants ---
    // These are standard apparent altitudes of the SUN'S CENTER relative to the GEOMETRIC HORIZON (0 degrees)
    // when different parts of the sun are at the horizon. They include average atmospheric refraction.
    const SOLAR_REFRACTION = 0.583; // Approx. refraction at horizon for Sun (degrees)
    const SOLAR_SEMIDIAMETER = 0.25; // Approx. semi-diameter of the Sun (degrees)

    // Target apparent altitude of the SUN'S CENTER for different events, relative to a geometric horizon (0 degrees)
    // These are the values that the 'horizonData[i].altitude' (which is also apparent altitude) needs to match.
    const TARGET_APPARENT_ALTITUDE_SUN_UPPER_LIMB_AT_HORIZON = -SOLAR_REFRACTION - SOLAR_SEMIDIAMETER; // Approx. -0.833 degrees (standard for official sunrise/sunset)
    const TARGET_APPARENT_ALTITUDE_SUN_CENTER_AT_HORIZON = -SOLAR_REFRACTION; // Approx. -0.583 degrees
    const TARGET_APPARENT_ALTITUDE_SUN_LOWER_LIMB_AT_HORIZON = -SOLAR_REFRACTION + SOLAR_SEMIDIAMETER; // Approx. -0.333 degrees

    // Exact azimuthal shift based on user's guidance for 1 degree for full disk (0.51 per semi-diameter)
    // This value is used to calculate the initial azimuth guesses for the center and lower limb,
    // reflecting the horizontal spread of the sun's disk at a geometric horizon.
    const AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT = 0.51; // degrees of azimuth for one solar semi-diameter's worth of altitude change

    // Array of colors for future polygons
    const POLYGON_COLORS = ['orange', 'blue', 'red', 'yellow', 'green'];

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

            const x = A * Math.cos(toRadians(lat1)) * Math.cos(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.cos(toRadians(endLon));
            const y = A * Math.cos(toRadians(lat1)) * Math.sin(toRadians(lon1)) + B * Math.cos(toRadians(endLat)) * Math.sin(toRadians(lon2OrDistanceKm));
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
            console.warn("getInterpolatedHorizonLatLon: No horizon data provided.");
            return null;
        }

        let targetAzimuthNormalized = normalizeAzimuth(azimuth);
        let p1 = null;
        let p2 = null;

        // To handle wrap-around, create an extended version of horizonData
        const extendedHorizonData = [...horizonData];
        if (horizonData.length > 0) {
            extendedHorizonData.push({ ...horizonData[0], azimuth: horizonData[0].azimuth + 360 });
            extendedHorizonData.unshift({ ...horizonData[horizonData.length - 1], azimuth: horizonData[horizonData.length - 1].azimuth - 360 });
        }

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

            if (p2_az_for_interp === p1_az_for_interp) { // Avoid division by zero for vertical segments
                return { lat: p1.horizonLat, lon: p1.horizonLon, azimuth: azimuth };
            }

            const ratio = (targetAz_for_ratio - p1_az_for_interp) / (p2_az_for_interp - p1_az_for_interp); // Interpolate based on azimuth here

            const interpolatedLat = p1.horizonLat + ratio * (p2.horizonLat - p1.horizonLat);
            const interpolatedLon = p1.horizonLon + ratio * (p2.horizonLon - p1.horizonLon);

            return { lat: interpolatedLat, lon: interpolatedLon, azimuth: azimuth };
        }
        console.warn(`getInterpolatedHorizonLatLon: Could not find valid bracketing points for azimuth ${azimuth.toFixed(3)}.`);
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
        const nStart = normalizeAzimuth(startAz);
        let nEnd = normalizeAzimuth(endAz);

        // If the intended clockwise range crosses 0/360 (e.g., from 350 to 10), adjust nEnd to be > nStart
        if (nStart > nEnd) {
            nEnd += 360; // Treat as 350 to 370 for comparison
        }

        // Create an extended version of horizonData with azimuths adjusted to cover the full 0-720 range
        // This simplifies range checking for wrapped segments.
        const extendedHorizonData = [];
        horizonData.forEach(p => {
            extendedHorizonData.push(p); // Original
            extendedHorizonData.push({ ...p, azimuth: p.azimuth + 360 }); // Add a +360 counterpart
        });
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
     * Draws the viewshed horizon as a polyline using provided lat/lon values.
     * @param {Array<Object>} horizonData - Array of {azimuth, altitude, horizonLat, horizonLon} objects.
     * @returns {L.Polyline|null} The created Leaflet Polyline object, or null if invalid data.
     */
    function drawViewshedHorizonLine(horizonData) {
        if (!horizonData || horizonData.length === 0) return null;

        const polylinePoints = [];
        horizonData.forEach(point => {
            if (!isNaN(point.horizonLat) && !isNaN(point.horizonLon)) {
                polylinePoints.push([point.horizonLat, point.horizonLon]);
            } else {
                console.warn(`Skipping point (Azimuth: ${point.azimuth}) due to invalid horizonLat/Lon values. This point will not be part of the drawn viewshed polyline.`);
            }
        });

        if (polylinePoints.length >= 2) {
            // Close the polyline by adding the first point again at the end, if not already closed
            const firstPoint = polylinePoints[0];
            const lastPoint = polylinePoints[polylinePoints.length - 1];
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
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
     * Normalizes an azimuth to be within the 0-360 degree range.
     * @param {number} az - Azimuth in degrees.
     * @returns {number} Normalized azimuth in degrees (0-360).
     */
    function normalizeAzimuth(az) {
        return (az % 360 + 360) % 360;
    }

    /**
     * Finds the true rise/set azimuth by locating the point on the viewshed horizon
     * whose apparent altitude matches the celestial body's target apparent altitude.
     * This uses a direct search through horizon segments for a matching altitude.
     * @param {Array<Object>} horizonData - An array of {azimuth, altitude, horizonLat, horizonLon} objects.
     * @param {number} targetApparentAltitude - The precise target apparent altitude (of the celestial body's center) that the viewshed horizon must match.
     * @param {number} initialAzimuthGuess - The scenario-specific initial 0-horizon azimuth guess (e.g., UL, Center, LL azimuth for a flat horizon).
     * @param {string} scenarioName - A descriptive name for the current calculation scenario (e.g., "Upper Limb").
     * @param {number} observerLat - The observer's latitude, used as a fallback for point generation.
     * @param {number} observerLon - The observer's longitude, used as a fallback for point generation.
     * @returns {{azimuth: number|null, lat: number|null, lon: number|null}} The calculated azimuth and its corresponding horizon Lat/Lon, or null if no matching azimuth found.
     */
    async function findActualAzimuthForTargetApparentAltitude(
        horizonData,
        targetApparentAltitude,
        initialAzimuthGuess, // This is now the scenario-specific initial guess
        scenarioName,
        observerLat, // Added observerLat
        observerLon // Added observerLon
    ) {
        const TOLERANCE_ALTITUDE = 0.001; // degrees, for matching altitude

        function setScenarioStatus(message, type = 'status') {
            console.log(`Display Message [${type}]: ${message}`);
        }
        setScenarioStatus(`Calculating ${scenarioName}...`, 'status');

        console.log(`--- Calculating for ${scenarioName} ---`);
        console.log(`  Target Apparent Altitude for Match: ${targetApparentAltitude.toFixed(5)}°`);
        // Ensure initialAzimuthGuess is a number before calling toFixed
        let safeInitialAzimuthGuess = parseFloat(initialAzimuthGuess);
        if (isNaN(safeInitialAzimuthGuess)) {
            console.error(`ERROR: initialAzimuthGuess for ${scenarioName} is not a valid number: ${initialAzimuthGuess}`);
            setScenarioStatus(`${scenarioName}: Error: Invalid initial azimuth.`, 'error');
            return null;
        }
        console.log(`  Initial Azimuth Guess (scenario's 0-Horizon): ${safeInitialAzimuthGuess.toFixed(3)}°`);

        let minHorizonAlt = Infinity;
        let maxHorizonAlt = -Infinity;

        if (horizonData.length > 0) {
            for (const point of horizonData) {
                if (point.altitude < minHorizonAlt) minHorizonAlt = point.altitude;
                if (point.altitude > maxHorizonAlt) maxHorizonAlt = point.altitude;
            }
        } else {
            console.error(`findActualAzimuthForTargetApparentAltitude (${scenarioName}): Empty horizonData received.`);
            setScenarioStatus(`${scenarioName}: Error: Empty horizon data.`, 'error');
            return null;
        }
        console.log(`  Horizon Data Apparent Altitude Range: Min ${minHorizonAlt.toFixed(3)}° to Max ${maxHorizonAlt.toFixed(3)}°`);

        // --- Check if celestial object clears all terrain or is always blocked ---
        if (targetApparentAltitude < minHorizonAlt - TOLERANCE_ALTITUDE) {
            console.warn(`  ${scenarioName}: Target celestial altitude (${targetApparentAltitude.toFixed(3)}°) is below the lowest horizon point (${minHorizonAlt.toFixed(3)}°). Object clears all terrain. Returning scenario's initial azimuth guess.`);
            setScenarioStatus(`${scenarioName}: Object clears all terrain. Result is initial 0-Horizon Azimuth.`, 'warn');
            // For this case, we need to provide a dummy lat/lon for the map line to extend
            const dummyPoint = getInterpolatedHorizonLatLon(safeInitialAzimuthGuess, horizonData);
            return { azimuth: safeInitialAzimuthGuess, lat: dummyPoint?.lat, lon: dummyPoint?.lon };
        }
        if (targetApparentAltitude > maxHorizonAlt + TOLERANCE_ALTITUDE) {
            console.warn(`  ${scenarioName}: Target celestial altitude (${targetApparentAltitude.toFixed(3)}°) is above the highest horizon point (${maxHorizonAlt.toFixed(3)}°). Object is always blocked by terrain. No true event azimuth.`);
            setScenarioStatus(`${scenarioName}: Object is always blocked by terrain. No true event azimuth.`, 'error');
            return null;
        }

        const candidatePoints = []; // Stores {azimuth, lat, lon} for candidates

        // Iterate through all segments of the horizon data to find crossing points
        for (let i = 0; i < horizonData.length; i++) {
            let p1 = horizonData[i];
            let p2 = horizonData[(i + 1) % horizonData.length]; // Wrap around for the last segment

            // Normalize azimuths for linear interpolation
            let p1_az_norm = normalizeAzimuth(p1.azimuth);
            let p2_az_norm = normalizeAzimuth(p2.azimuth);

            // Adjust p2's azimuth to be greater than p1's if it crosses 0/360 boundary for interpolation
            let p2_az_for_interp = p2_az_norm;
            if (p1_az_norm > p2_az_for_interp) {
                p2_az_for_interp += 360;
            }

            // Check if target altitude falls within the range of altitudes for this segment
            const altitudeCrosses = (targetApparentAltitude >= p1.altitude && targetApparentAltitude <= p2.altitude) ||
                (targetApparentAltitude <= p1.altitude && targetApparentAltitude >= p2.altitude);

            if (altitudeCrosses) {
                let interpolatedAzimuth;
                let interpolatedLat;
                let interpolatedLon;

                // Check if one of the endpoints is already at the target altitude within tolerance
                if (Math.abs(p1.altitude - targetApparentAltitude) < TOLERANCE_ALTITUDE) {
                    interpolatedAzimuth = p1_az_norm;
                    interpolatedLat = p1.horizonLat;
                    interpolatedLon = p1.horizonLon;
                    console.log(`  Candidate found (p1 endpoint) Az: ${interpolatedAzimuth.toFixed(3)}`);
                } else if (Math.abs(p2.altitude - targetApparentAltitude) < TOLERANCE_ALTITUDE) {
                    interpolatedAzimuth = p2_az_norm;
                    interpolatedLat = p2.horizonLat;
                    interpolatedLon = p2.horizonLon;
                    console.log(`  Candidate found (p2 endpoint) Az: ${interpolatedAzimuth.toFixed(3)}`);
                } else if (Math.abs(p2.altitude - p1.altitude) > TOLERANCE_ALTITUDE * 10) { // Avoid division by very small number or zero
                    const ratio = (targetApparentAltitude - p1.altitude) / (p2.altitude - p1.altitude);
                    interpolatedAzimuth = p1_az_for_interp + ratio * (p2_az_for_interp - p1_az_for_interp);
                    interpolatedLat = p1.horizonLat + ratio * (p2.horizonLat - p1.horizonLat);
                    interpolatedLon = p1.horizonLon + ratio * (p2.horizonLon - p1.horizonLon);
                    console.log(`  Candidate found (interpolation) Az: ${normalizeAzimuth(interpolatedAzimuth).toFixed(3)} from segment ${p1_az_norm.toFixed(3)}/${p1.altitude.toFixed(3)} to ${p2_az_norm.toFixed(3)}/${p2.altitude.toFixed(3)}`);
                } else {
                    // Segment is almost flat and at target altitude, or very close. Use midpoint.
                    interpolatedAzimuth = (p1_az_norm + p2_az_for_interp) / 2;
                    interpolatedLat = (p1.horizonLat + p2.horizonLat) / 2;
                    interpolatedLon = (p1.horizonLon + p2.horizonLon) / 2;
                    console.warn(`  Flat segment near target altitude between Az ${p1_az_norm.toFixed(3)} and ${p2_az_for_interp.toFixed(3)}, adding midpoint as candidate.`);
                }
                candidatePoints.push({ azimuth: normalizeAzimuth(interpolatedAzimuth), lat: interpolatedLat, lon: interpolatedLon });
            }
        }

        if (candidatePoints.length === 0) {
            console.warn(`${scenarioName}: No crossing horizon segment found for the target celestial altitude. This implies the object either clears all terrain or is always blocked (which should have been caught earlier). Attempting to find the azimuth with the minimum altitude difference.`);
            // Fallback to the point on the horizon closest in altitude, if no direct crossing found.
            let closestAltitudeDiff = Infinity;
            let bestFallbackPoint = null;
            let minAngularDifferenceForFallback = Infinity; // Track angular difference for fallback choice
            for (const point of horizonData) {
                const diff = Math.abs(point.altitude - targetApparentAltitude);

                let angularDiffFromGuess = Math.abs(point.azimuth - safeInitialAzimuthGuess);
                if (angularDiffFromGuess > 180) angularDiffFromGuess = 360 - angularDiffFromGuess; // Shortest angular diff

                // If current point is closer in altitude, or equally close in altitude AND closer angularly to initial guess
                if (diff < closestAltitudeDiff || (diff === closestAltitudeDiff && angularDiffFromGuess < minAngularDifferenceForFallback)) {
                    closestAltitudeDiff = diff;
                    bestFallbackPoint = point;
                    minAngularDifferenceForFallback = angularDiffFromGuess;
                }
            }
            if (bestFallbackPoint !== null) {
                console.warn(`${scenarioName}: Falling back to closest altitude match: ${normalizeAzimuth(bestFallbackPoint.azimuth).toFixed(3)}° (Altitude difference: ${closestAltitudeDiff.toFixed(3)}°)`);
                setScenarioStatus(`${scenarioName}: No direct crossing. Closest terrain match found.`, 'warn');
                return { azimuth: normalizeAzimuth(bestFallbackPoint.azimuth), lat: bestFallbackPoint.horizonLat, lon: bestFallbackPoint.horizonLon };
            }
            console.error(`Critical (${scenarioName}): No valid candidate or fallback azimuth found.`);
            setScenarioStatus(`${scenarioName}: Critical error. No match found.`, 'error');
            return null;
        }

        // Find the candidate point that is closest to the scenario's initial 0-horizon guess
        let bestActualPoint = null;
        let minAngularDifference = Infinity;

        candidatePoints.forEach(p => {
            let diff = Math.abs(p.azimuth - safeInitialAzimuthGuess);
            if (diff > 180) diff = 360 - diff; // Correctly calculate shortest angular difference

            if (diff < minAngularDifference) {
                minAngularDifference = diff;
                bestActualPoint = p;
            }
        });

        if (bestActualPoint === null) {
            console.error(`Internal error (${scenarioName}): Candidate azimuths found but no best match selected from candidates.`);
            setScenarioStatus(`${scenarioName}: Internal error.`, 'error');
            return null;
        }

        // Final validation before returning
        if (isNaN(bestActualPoint.lat) || isNaN(bestActualPoint.lon)) {
            console.error(`Calculated point for ${scenarioName} has NaN coordinates (lat: ${bestActualPoint.lat}, lon: ${bestActualPoint.lon}). Returning null.`);
            setScenarioStatus(`${scenarioName}: Calculation resulted in invalid coordinates.`, 'error');
            return null;
        }

        console.log(`  All Candidate Azimuths for selection: ${candidatePoints.map(p => p.azimuth.toFixed(3)).join(', ')}`);
        console.log(`  Selected Actual Azimuth (closest to scenario's initial guess ${safeInitialAzimuthGuess.toFixed(3)}°): ${bestActualPoint.azimuth.toFixed(3)}°`);
        setScenarioStatus(`${scenarioName}: Actual Azimuth calculated.`, 'success');
        return bestActualPoint;
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

            const lat = parseFloat(json?.lat);
            const lon = parseFloat(json?.lon);
            const elev_amsl = parseFloat(json?.elev_amsl);

            if (!isNaN(lat) && !isNaN(lon) && !isNaN(elev_amsl)) {
                displayMessage('locationStatus', 'Location data fetched successfully.', 'success-message');
                return { latitude: lat, longitude: lon, elevation_amsl: elev_amsl };
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
                // Expecting at least Azimuth (0), Altitude (1), Distance (2), Slope (3), Latitude (4), Longitude (5) - 6 columns
                if (parts.length >= 6) {
                    const azimuth = parseFloat(parts[0]);
                    const altitude = parseFloat(parts[1]);
                    const horizonLat = parseFloat(parts[4]); // 5th column (index 4)
                    const horizonLon = parseFloat(parts[5]); // 6th column (index 5)

                    if (!isNaN(azimuth) && !isNaN(altitude) && !isNaN(horizonLat) && !isNaN(horizonLon)) {
                        horizonData.push({ azimuth, altitude, horizonLat, horizonLon });
                    } else {
                        console.warn(`Skipping line ${i} due to invalid number parsing (az:${parts[0]}, alt:${parts[1]}, lat:${parts[4]}, lon:${parts[5]}): ${line}`);
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

    // Helper function to create and add a polygon layer group
    async function createAndAddPolygonLayer(
        initialAzimuthUL, initialAzimuthCenter, initialAzimuthLL,
        targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
        horizonData, locationData, polygonColor, scenarioName, layerGroupName
    ) {
        const observerLatLng = [locationData.latitude, locationData.longitude];
        // Ensure initialAzimuthUL is a number before comparison
        const isSunriseLike = (parseFloat(initialAzimuthUL) >= 0 && parseFloat(initialAzimuthUL) <= 180);
        const shiftDirectionFactor = isSunriseLike ? 1 : -1;

        const actualPointUL = await findActualAzimuthForTargetApparentAltitude(
            horizonData, targetAltitudeUL, initialAzimuthUL, `${scenarioName} Upper Limb at Horizon`, locationData.latitude, locationData.longitude
        );
        const actualPointCenter = await findActualAzimuthForTargetApparentAltitude(
            horizonData, targetAltitudeCenter, initialAzimuthCenter, `${scenarioName} Center at Horizon`, locationData.latitude, locationData.longitude
        );
        const actualPointLL = await findActualAzimuthForTargetApparentAltitude(
            horizonData, targetAltitudeLL, initialAzimuthLL, `${scenarioName} Lower Limb at Horizon`, locationData.latitude, locationData.longitude
        );

        let layerGroup = L.layerGroup();
        layerGroup.layerNameForControl = layerGroupName; // Store name for layers control

        let anyPointMissing = !(actualPointUL && actualPointCenter && actualPointLL);
        if (anyPointMissing) {
            console.warn(`Cannot draw ${scenarioName} polygon: one or more critical points are missing.`);
            return { layerGroup: layerGroup, success: false };
        }

        const polygonLatLngs = [];
        polygonLatLngs.push(observerLatLng);

        // Add UL point
        polygonLatLngs.push([actualPointUL.lat, actualPointUL.lon]);
        console.log(`Adding ${scenarioName} UL point to polygon: ${actualPointUL.lat.toFixed(6)}, ${actualPointUL.lon.toFixed(6)}`);

        // Add intermediate points between UL and Center
        let pointsBetweenULCenter;
        if (isSunriseLike) {
            pointsBetweenULCenter = getIntermediateHorizonPoints(actualPointUL.azimuth, actualPointCenter.azimuth, horizonData);
            pointsBetweenULCenter.forEach(p => { polygonLatLngs.push(p); console.log(`Adding intermediate point (${scenarioName} UL-Center): ${p[0].toFixed(6)}, ${p[1].toFixed(6)}`); });
        } else { // Sunset-like, traverse counter-clockwise for intermediate points
            pointsBetweenULCenter = getIntermediateHorizonPoints(actualPointCenter.azimuth, actualPointUL.azimuth, horizonData);
            pointsBetweenULCenter.reverse().forEach(p => { polygonLatLngs.push(p); console.log(`Adding intermediate point (${scenarioName} UL-Center, reversed): ${p[0].toFixed(6)}, ${p[1].toFixed(6)}`); });
        }

        // Add Center point
        polygonLatLngs.push([actualPointCenter.lat, actualPointCenter.lon]);
        console.log(`Adding ${scenarioName} Center point to polygon: ${actualPointCenter.lat.toFixed(6)}, ${actualPointCenter.lon.toFixed(6)}`);

        // Add intermediate points between Center and LL
        let pointsBetweenCenterLL;
        if (isSunriseLike) {
            pointsBetweenCenterLL = getIntermediateHorizonPoints(actualPointCenter.azimuth, actualPointLL.azimuth, horizonData);
            pointsBetweenCenterLL.forEach(p => { polygonLatLngs.push(p); console.log(`Adding intermediate point (${scenarioName} Center-LL): ${p[0].toFixed(6)}, ${p[1].toFixed(6)}`); });
        } else { // Sunset-like, traverse counter-clockwise for intermediate points
            pointsBetweenCenterLL = getIntermediateHorizonPoints(actualPointLL.azimuth, actualPointCenter.azimuth, horizonData);
            pointsBetweenCenterLL.reverse().forEach(p => { polygonLatLngs.push(p); console.log(`Adding intermediate point (${scenarioName} Center-LL, reversed): ${p[0].toFixed(6)}, ${p[1].toFixed(6)}`); });
        }

        // Add LL point
        polygonLatLngs.push([actualPointLL.lat, actualPointLL.lon]);
        console.log(`Adding ${scenarioName} LL point to polygon: ${actualPointLL.lat.toFixed(6)}, ${actualPointLL.lon.toFixed(6)}`);

        polygonLatLngs.push(observerLatLng); // Close the polygon

        const polygon = L.polygon(polygonLatLngs, {
            color: polygonColor,
            weight: 2,
            opacity: 1,
            dashArray: '5, 10',
            fillColor: polygonColor,
            fillOpacity: 0.1
        });
        layerGroup.addLayer(polygon);

        // Add individual markers to the layer group
        layerGroup.addLayer(drawIndividualPointMarker(actualPointUL, `${scenarioName} Upper Limb`, polygonColor));
        layerGroup.addLayer(drawIndividualPointMarker(actualPointCenter, `${scenarioName} Center`, polygonColor));
        layerGroup.addLayer(drawIndividualPointMarker(actualPointLL, `${scenarioName} Lower Limb`, polygonColor));

        // Add the layer group to the map and layers control
        window.map.addLayer(layerGroup);
        window.layersControl.addOverlay(layerGroup, layerGroupName);
        scriptCOverlayGroups.push(layerGroup); // Add to Script C's managed layers

        return { layerGroup: layerGroup, success: true };
    }


    // --- Event Listener for Form Submission ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Assign global map and layersControl from Script B once DOM is ready
        map = window.map;
        layersControl = window.layersControl;
        observerMarker = window.bigMarker; // Script B's draggable marker

        const form = document.getElementById('azimuthForm');
        const hwtIdentifierInput = document.getElementById('hwtIdentifierInput');
        const saveGeoJsonButton = document.getElementById('saveGeoJsonButton');
        const importGeoJsonInput = document.getElementById('importGeoJsonInput');
        const importGeoJsonButton = document.getElementById('importGeoJsonButton');
        const importStatusDiv = document.getElementById('importStatus');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // --- TROUBLESHOOTING: Print first 0-horizon azimuth value ---
        // These logs remain here to capture the initial state when DOMContentLoaded fires
        console.log(`TROUBLESHOOTING: Value of window.solsticeaziwinrise.value (from Script A): ${window.solsticeaziwinrise.value}`);
        // To ensure wsrZeroHorizonAzimuth is defined for this log, we'll define it locally here
        const initialWsrAzimuthForLog = parseFloat(window.solsticeaziwinrise.value);
        console.log(`TROUBLESHOOTING: Mapped wsrZeroHorizonAzimuth (in Script C, parsed): ${initialWsrAzimuthForLog}`);
        // --- END TROUBLESHOOTING ---


        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearResultsDisplay(); // Clear Script C's overlays before new calculations
            displayMessage('overallStatus', 'Starting terrain-adjusted azimuth calculation...', 'status');
            if (loadingSpinner) loadingSpinner.classList.remove('hidden');

            const hwtId = hwtIdentifierInput.value.trim();
            if (!hwtId) {
                displayMessage('overallStatus', 'Error: Please enter a HeyWhatsThat Identifier.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            let locationData = null;
            let horizonData = null;
            let anyCalculationFailed = false;

            // --- Fetch Location Data ---
            locationData = await fetchLocationData(hwtId);
            if (!locationData) {
                displayMessage('overallStatus', 'Calculation failed: Could not fetch location data.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // Update Script B's map and marker with fetched location data
            // This assumes Script B's map and bigMarker are already initialized.
            if (map && observerMarker) {
                map.setView([locationData.latitude, locationData.longitude], map.getZoom());
                observerMarker.setLatLng([locationData.latitude, locationData.longitude]);
                // Also update the input fields in the HTML, which Script B might read
                document.getElementById('latbox').value = locationData.latitude;
                document.getElementById('lngbox').value = locationData.longitude;
                observerMarker.bindPopup(`<b>Observer Location</b><br>Lat: ${locationData.latitude.toFixed(4)}, Lon: ${locationData.longitude.toFixed(4)}`).openPopup();
            } else {
                console.error("Leaflet map or observer marker not available from Script B.");
                displayMessage('overallStatus', 'Error: Map components not ready.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // --- Fetch Viewshed Data ---
            horizonData = await fetchHorizonDataHoriZONE(hwtId);
            if (!horizonData) {
                displayMessage('overallStatus', 'Calculation failed: Could not fetch viewshed data.', 'error');
                if (loadingSpinner) loadingSpinner.classList.add('hidden');
                return;
            }

            // --- Calculate Target Apparent Altitudes for the events ---
            const targetAltitudeUL = TARGET_APPARENT_ALTITUDE_SUN_UPPER_LIMB_AT_HORIZON;
            const targetAltitudeCenter = TARGET_APPARENT_ALTITUDE_SUN_CENTER_AT_HORIZON;
            const targetAltitudeLL = TARGET_APPARENT_ALTITUDE_SUN_LOWER_LIMB_AT_HORIZON;

            displayMessage('overallStatus', "Calculating actual azimuths...", 'status');

            // --- Viewshed Horizon Line ---
            const viewshedPolyline = drawViewshedHorizonLine(horizonData);
            if (viewshedPolyline) {
                let viewshedHorizonLineGroup = L.layerGroup();
                viewshedHorizonLineGroup.addLayer(viewshedPolyline);
                viewshedHorizonLineGroup.layerNameForControl = "Viewshed Horizon"; // Name for layers control
                window.map.addLayer(viewshedHorizonLineGroup);
                window.layersControl.addOverlay(viewshedHorizonLineGroup, viewshedHorizonLineGroup.layerNameForControl);
                scriptCOverlayGroups.push(viewshedHorizonLineGroup);
            }

            // --- Mapped Azimuth Values from Script A ---
            // These values are dynamically pulled from Script A's global variables.
            // We explicitly parse them as floats from the .value property of the HTML elements.
            const wsrZeroHorizonAzimuth = parseFloat(window.solsticeaziwinrise.value);
            const wssZeroHorizonAzimuth = parseFloat(window.solsticeaziwinset.value);
            const ssrZeroHorizonAzimuth = parseFloat(window.solsticeazisumrise.value);
            const sssZeroHorizonAzimuth = parseFloat(window.solsticeazisumset.value);
            const ncqrZeroHorizonAzimuth = parseFloat(window.crossquarterazisumrise.value);
            const scqrZeroHorizonAzimuth = parseFloat(window.crossquarteraziwinrise.value);
            const ncqsZeroHorizonAzimuth = parseFloat(window.crossquarterazisumset.value);
            const scqsZeroHorizonAzimuth = parseFloat(window.crossquarteraziwinset.value);
            const nmlrZeroHorizonAzimuth = parseFloat(window.majorazisumrise.value);
            const nmlsZeroHorizonAzimuth = parseFloat(window.majorazisumset.value);
            const smlrZeroHorizonAzimuth = parseFloat(window.majoraziwinrise.value);
            const smlsZeroHorizonAzimuth = parseFloat(window.majoraziwinset.value);
            const nmnlrZeroHorizonAzimuth = parseFloat(window.minorazisumrise.value);
            const smnlrZeroHorizonAzimuth = parseFloat(window.minoraziwinrise.value);
            const nmnlsZeroHorizonAzimuth = parseFloat(window.minorazisumset.value);
            const smnlsZeroHorizonAzimuth = parseFloat(window.minoraziwinset.value);
            const erZeroHorizonAzimuth = parseFloat(window.equinoxazisumrise.value);
            const esZeroHorizonAzimuth = parseFloat(window.equinoxazisumset.value);
            // --- END MAPPED AZIMUTH VALUES ---

            // --- Process each astronomical event using the helper function ---

            // WSR
            let wsrResult = await createAndAddPolygonLayer(
                wsrZeroHorizonAzimuth,
                normalizeAzimuth(wsrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(wsrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[0], "WSR", "Winter Solstice Rise"
            );
            if (!wsrResult.success) anyCalculationFailed = true;

            // WSS
            let wssResult = await createAndAddPolygonLayer(
                wssZeroHorizonAzimuth,
                normalizeAzimuth(wssZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(wssZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[0], "WSS", "Winter Solstice Set"
            );
            if (!wssResult.success) anyCalculationFailed = true;

            // SSR
            let ssrResult = await createAndAddPolygonLayer(
                ssrZeroHorizonAzimuth,
                normalizeAzimuth(ssrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(ssrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[0], "SSR", "Summer Solstice Rise"
            );
            if (!ssrResult.success) anyCalculationFailed = true;

            // SSS
            let sssResult = await createAndAddPolygonLayer(
                sssZeroHorizonAzimuth,
                normalizeAzimuth(sssZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(sssZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[0], "SSS", "Summer Solstice Set"
            );
            if (!sssResult.success) anyCalculationFailed = true;

            // NCQR
            let ncqrResult = await createAndAddPolygonLayer(
                ncqrZeroHorizonAzimuth,
                normalizeAzimuth(ncqrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(ncqrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[4], "NCQR", "North Cross-Quarter Rise"
            );
            if (!ncqrResult.success) anyCalculationFailed = true;

            // SCQR
            let scqrResult = await createAndAddPolygonLayer(
                scqrZeroHorizonAzimuth,
                normalizeAzimuth(scqrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(scqrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[4], "SCQR", "South Cross-Quarter Rise"
            );
            if (!scqrResult.success) anyCalculationFailed = true;

            // NCQS
            let ncqsResult = await createAndAddPolygonLayer(
                ncqsZeroHorizonAzimuth,
                normalizeAzimuth(ncqsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(ncqsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[4], "NCQS", "North Cross-Quarter Set"
            );
            if (!ncqsResult.success) anyCalculationFailed = true;

            // SCQS
            let scqsResult = await createAndAddPolygonLayer(
                scqsZeroHorizonAzimuth,
                normalizeAzimuth(scqsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(scqsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[4], "SCQS", "South Cross-Quarter Set"
            );
            if (!scqsResult.success) anyCalculationFailed = true;

            // NMLR
            let nmlrResult = await createAndAddPolygonLayer(
                nmlrZeroHorizonAzimuth,
                normalizeAzimuth(nmlrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(nmlrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[1], "NMLR", "North Major Lunar Rise"
            );
            if (!nmlrResult.success) anyCalculationFailed = true;

            // NMLS
            let nmlsResult = await createAndAddPolygonLayer(
                nmlsZeroHorizonAzimuth,
                normalizeAzimuth(nmlsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(nmlsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[1], "NMLS", "North Major Lunar Set"
            );
            if (!nmlsResult.success) anyCalculationFailed = true;

            // SMLR
            let smlrResult = await createAndAddPolygonLayer(
                smlrZeroHorizonAzimuth,
                normalizeAzimuth(smlrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(smlrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[1], "SMLR", "South Major Lunar Rise"
            );
            if (!smlrResult.success) anyCalculationFailed = true;

            // SMLS
            let smlsResult = await createAndAddPolygonLayer(
                smlsZeroHorizonAzimuth,
                normalizeAzimuth(smlsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(smlsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[1], "SMLS", "South Major Lunar Set"
            );
            if (!smlsResult.success) anyCalculationFailed = true;

            // NMnLR
            let nmnlrResult = await createAndAddPolygonLayer(
                nmnlrZeroHorizonAzimuth,
                normalizeAzimuth(nmnlrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(nmnlrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[2], "NMnLR", "North Minor Lunar Rise"
            );
            if (!nmnlrResult.success) anyCalculationFailed = true;

            // SMnLR
            let smnlrResult = await createAndAddPolygonLayer(
                smnlrZeroHorizonAzimuth,
                normalizeAzimuth(smnlrZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(smnlrZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[2], "SMnLR", "South Minor Lunar Rise"
            );
            if (!smnlrResult.success) anyCalculationFailed = true;

            // NMnLS
            let nmnlsResult = await createAndAddPolygonLayer(
                nmnlsZeroHorizonAzimuth,
                normalizeAzimuth(nmnlsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(nmnlsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[2], "NMnLS", "North Minor Lunar Set"
            );
            if (!nmnlsResult.success) anyCalculationFailed = true;

            // SMnLS
            let smnlsResult = await createAndAddPolygonLayer(
                smnlsZeroHorizonAzimuth,
                normalizeAzimuth(smnlsZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(smnlsZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[2], "SMnLS", "South Minor Lunar Set"
            );
            if (!smnlsResult.success) anyCalculationFailed = true;

            // ER
            let erResult = await createAndAddPolygonLayer(
                erZeroHorizonAzimuth,
                normalizeAzimuth(erZeroHorizonAzimuth + (1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(erZeroHorizonAzimuth + (2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[3], "ER", "Equinox Rise"
            );
            if (!erResult.success) anyCalculationFailed = true;

            // ES
            let esResult = await createAndAddPolygonLayer(
                esZeroHorizonAzimuth,
                normalizeAzimuth(esZeroHorizonAzimuth + (-1 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                normalizeAzimuth(esZeroHorizonAzimuth + (-2 * AZIMUTH_SHIFT_PER_SOLAR_SEMIDIAMETER_UNIT)),
                targetAltitudeUL, targetAltitudeCenter, targetAltitudeLL,
                horizonData, locationData, POLYGON_COLORS[3], "ES", "Equinox Set"
            );
            if (!esResult.success) anyCalculationFailed = true;


            // Adjust map bounds to encompass all drawn elements
            let bounds = new L.LatLngBounds();
            scriptCOverlayGroups.forEach(layerGroup => {
                if (window.map.hasLayer(layerGroup)) {
                    layerGroup.eachLayer(function(subLayer) {
                        if (subLayer.getLatLngs) { // For polygons/polylines
                            bounds.extend(subLayer.getBounds());
                        } else if (subLayer.getLatLng) { // For markers
                            bounds.extend(subLayer.getLatLng());
                        }
                    });
                }
            });

            // Also include the observer marker in the bounds
            if (observerMarker && observerMarker.getLatLng()) {
                bounds.extend(observerMarker.getLatLng());
            }

            if (bounds.isValid()) {
                window.map.fitBounds(bounds, { padding: [50, 50] });
            }

            if (!anyCalculationFailed) {
                displayMessage('overallStatus', 'Calculation Complete for all scenarios.', 'success');
            } else {
                displayMessage('overallStatus', 'Calculation finished with some scenarios not finding a direct match. Check detailed statuses and console for more info.', 'warn');
            }
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
        });

        // --- GeoJSON Export Functionality ---
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

            // Iterate through all generated overlay layer groups from Script C
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

        // --- GeoJSON Import Functionality ---
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
                        window.layersControl.addOverlay(importedLayerGroup, layerName);
                        importedLayerGroup.addTo(window.map);
                        if (bounds.isValid()) {
                            window.map.fitBounds(bounds, { padding: [50, 50] });
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
    });
})(); // End of IIFE