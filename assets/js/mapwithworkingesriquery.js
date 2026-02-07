
/*************************************************************/
/* Cookie Functions for saving favorite location             */
/*************************************************************/

function getCookieVal(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1)
        endstr = document.cookie.length;
    return unescape(document.cookie.substring(offset, endstr));
}

function GetCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen) {
        var j = i + alen;
        if (document.cookie.substring(i, j) == arg)
            return getCookieVal(j);
        i = document.cookie.indexOf(" ", i) + 1;
        if (i == 0) break;
    }
    return null;
}

function SetCookie(name, value) {
    var argv = SetCookie.arguments;
    var argc = SetCookie.arguments.length;
    var expires = (argc > 2) ? argv[2] : null;
    var path = (argc > 3) ? argv[3] : null;
    var domain = (argc > 4) ? argv[4] : null;
    var secure = (argc > 5) ? argv[5] : null;
    document.cookie = name + "=" + escape(value) +
        ((expires == null) ? "" : ("; expires=" + expires.toGMTString())) +
        ((path == null) ? "" : ("; path=" + path)) +
        ((domain == null) ? "" : ("; domain=" + domain)) +
        ((secure == null) ? "; secure" : "");
}

function DeleteCookie(name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = GetCookie(name);
    if (cval != null)
        document.cookie = name + "=" + cval + "; expires=" + exp.toGMTString();
}

function saveCookie() {
    var expdate = new Date();
    expdate.setTime(expdate.getTime() + (365 * 24 * 60 * 60 * 1000));
    SetCookie("lat", document.getElementById("latbox").value, expdate, null, null, false);
    SetCookie("lng", document.getElementById("lngbox").value, expdate, null, null, false);

}




var cookee = GetCookie("lat")
var startLat = (cookee) ? cookee : "53.4869"
cookee = GetCookie("lng")
var startLng = (cookee) ? cookee : "-7"
cookee = GetCookie("gmt")
var startZone = (cookee) ? cookee : "-0"


/* Basemap Layers */


var NationalMonuments = L.esri
        .featureLayer({
            url: "https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/ArcGIS/rest/services/SMROpenData/FeatureServer/3",
			where: "MONUMENT_CLASS = 'Megalithic tomb - passage tomb'",
	});















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
  
 
var googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 28,
        subdomains:['mt0','mt1','mt2','mt3']
		});
  
var bigIcon = new L.icon({
        iconUrl: "assets/img/omphalos.svg",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -25]
    });

  
/* Tangram terrain */
var terrain = new L.featureGroup();
var Tangramlayer = Tangram.leafletLayer({ scene: 'data:application/octet-stream;base64,c291cmNlczoKICAgIG5leHR6ZW46CiAgICAgICAgdHlwZTogTVZUCiAgICAgICAgdXJsOiBodHRwczovL3RpbGUubmV4dHplbi5vcmcvdGlsZXplbi92ZWN0b3IvdjEvMjU2L2FsbC97en0ve3h9L3t5fS5tdnQKICAgICAgICB1cmxfcGFyYW1zOgogICAgICAgICAgICBhcGlfa2V5OiB5VW1pTllFMlI1MjlRd2Y4QWhmTGNBCiAgICAgICAgbWF4X3pvb206IDgKICAgICAgICByYXN0ZXJzOiBbbm9ybWFsc10KICAgIG5vcm1hbHM6CiAgICAgICAgdHlwZTogUmFzdGVyCiAgICAgICAgdXJsOiBodHRwczovL3RpbGUubmV4dHplbi5vcmcvdGlsZXplbi90ZXJyYWluL3YxLzI1Ni9ub3JtYWwve3p9L3t4fS97eX0ucG5nCiAgICAgICAgdXJsX3BhcmFtczoKICAgICAgICAgICAgYXBpX2tleTogeVVtaU5ZRTJSNTI5UXdmOEFoZkxjQQogICAgICAgIG1heF96b29tOiAxNQoKc3R5bGVzOgogICAgdGVycmFpbi1lbnZtYXA6CiAgICAgICAgYmFzZTogcmFzdGVyCiAgICAgICAgcmFzdGVyOiBub3JtYWwKICAgICAgICBsaWdodGluZzogZmFsc2UKICAgICAgICBzaGFkZXJzOgogICAgICAgICAgICB1bmlmb3JtczoKICAgICAgICAgICAgICAgIHVfc2NhbGU6IC4xNQogICAgICAgICAgICAgICAgdV9lbnZtYXA6IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS90YW5ncmFtcy90ZXJyYWluLWRlbW9zL21hc3Rlci9pbWcvaW1ob2Y1LmpwZwogICAgICAgICAgICBibG9ja3M6CiAgICAgICAgICAgICAgICBnbG9iYWw6IHwKICAgICAgICAgICAgICAgICAgICAvLyBTaW1wbGlmaWVkIHZpZXctaW5kZXBlbmRlbnQgZW52aXJvbm1lbnQgbWFwCiAgICAgICAgICAgICAgICAgICAgdmVjNCBhcHBseUVudm1hcCAoaW4gc2FtcGxlcjJEIF90ZXgsIGluIHZlYzMgX25vcm1hbCkgewogICAgICAgICAgICAgICAgICAgICAgICB2ZWMyIHV2ID0gMC41ICogX25vcm1hbC54eSArIDAuNTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRleHR1cmUyRChfdGV4LCB1dik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY29sb3I6IHwKICAgICAgICAgICAgICAgICAgICBub3JtYWwueiAqPSB1X3NjYWxlOwogICAgICAgICAgICAgICAgICAgIG5vcm1hbCA9IG5vcm1hbGl6ZShub3JtYWwpOwogICAgICAgICAgICAgICAgICAgIGNvbG9yID0gYXBwbHlFbnZtYXAodV9lbnZtYXAsIG5vcm1hbCk7CiAgICBkb3RzOgogICAgICAgIGJhc2U6IGxpbmVzCiAgICAgICAgZGFzaDogWzEsIDJdCiAgICBmYWRlbGluZXM6CiAgICAgICAgYmFzZTogbGluZXMKICAgICAgICBibGVuZDogbXVsdGlwbHkKICAgIGZhZGV0ZXh0OgogICAgICAgIGJhc2U6IHRleHQKICAgICAgICBibGVuZDogb3ZlcmxheQogICAgZmFkZXBvbHlzOgogICAgICAgIGJhc2U6IHJhc3RlcgogICAgICAgIG1peDogdGVycmFpbi1lbnZtYXAKICAgICAgICBzaGFkZXJzOgogICAgICAgICAgICBibG9ja3M6CiAgICAgICAgICAgICAgICBjb2xvcjogfAogICAgICAgICAgICAgICAgICAgIGNvbG9yICo9IHZlYzQoMS4yKTsKbGF5ZXJzOgogICAgdGVycmFpbjoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbm9ybWFscywgbGF5ZXI6IF9kZWZhdWx0IH0KICAgICAgICBkcmF3OgogICAgICAgICAgICB0ZXJyYWluLWVudm1hcDoKICAgICAgICAgICAgICAgIG9yZGVyOiAwCgogICAgcGxhY2VzOgogICAgICAgIGRhdGE6IHsgc291cmNlOiBuZXh0emVuIH0KICAgICAgICBmaWx0ZXI6IAogICAgICAgICAgICBraW5kOiBbY2l0eV0KICAgICAgICBkcmF3OgogICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICBmaWxsOiB3aGl0ZQogICAgICAgICAgICAgICAgICAgIHNpemU6IDEwcHgKICAgICAgICAgICAgICAgICAgICBzdHJva2U6IHsgY29sb3I6ICcjNDQ0Jywgd2lkdGg6IDRweH0KICAgIGJvdW5kYXJpZXM6CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4gfQogICAgICAgIGRyYXc6CiAgICAgICAgICAgIGRvdHM6CiAgICAgICAgICAgICAgICBjb2xvcjogWy43NSwgLjc1LCAuNzVdCiAgICAgICAgICAgICAgICB3aWR0aDogMXB4CiAgICB3YXRlcjoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbmV4dHplbiB9CiAgICAgICAgbGluZXM6CiAgICAgICAgICAgIGZpbHRlcjoge2JvdW5kYXJ5OiB0cnVlfQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgbGluZXM6CiAgICAgICAgICAgICAgICAgICAgb3JkZXI6IDUKICAgICAgICAgICAgICAgICAgICBjb2xvcjogbGlnaHRibHVlCiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IC4zcHgKICAgIHdhdGVyLXRlcnJhaW46CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4sIGxheWVyOiB3YXRlciB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZXBvbHlzOgogICAgICAgICAgICAgICAgb3JkZXI6IDQKCiAgICByb2FkczoKICAgICAgICBkYXRhOiB7IHNvdXJjZTogbmV4dHplbiB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZWxpbmVzOgogICAgICAgICAgICAgICAgb3JkZXI6IDMKICAgICAgICAgICAgICAgIGNvbG9yOiBbWzEwLCBbLjksIC45LCAuOV1dLCBbMTgsIHdoaXRlXV0KICAgICAgICAgICAgICAgIHdpZHRoOiBbWzEzLCAxLjVweF0sIFsxNSwgNV1dCiAgICAgICAgbGFiZWxzOgogICAgICAgICAgICBmaWx0ZXI6IHskem9vbToge21pbjogMTB9fQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgZmFkZXRleHQ6CiAgICAgICAgICAgICAgICAgICAgYnVmZmVyOiAxMHB4CiAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMTBweAogICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHk6IEx1Y2lkYSBHcmFuZGUKICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogZnVuY3Rpb24oKSB7cmV0dXJuIFsxLCAxLCAxLCAkem9vbS8xNS5dO30KICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOgogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGZ1bmN0aW9uKCkge3JldHVybiBbMCwgMCwgMCwgJHpvb20vMTUuXTt9CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMXB4CiAgICBwbGFjZXM6CiAgICAgICAgZGF0YTogeyBzb3VyY2U6IG5leHR6ZW4gfQogICAgICAgIGZpbHRlcjogeyBub3Q6IHsga2luZDogW25laWdoYm91cmhvb2RdIH0gfQogICAgICAgIGNvdW50cmllczoKICAgICAgICAgICAgZmlsdGVyOiB7IGtpbmQ6IGNvdW50cnkgfQogICAgICAgICAgICBkcmF3OgogICAgICAgICAgICAgICAgdGV4dDoKICAgICAgICAgICAgICAgICAgICBmb250OgogICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHVwcGVyY2FzZQogICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAxMHB4CiAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseTogTHVjaWRhIEdyYW5kZQogICAgICAgICAgICAgICAgICAgICAgICBmaWxsOiB3aGl0ZQogICAgICAgICAgICAgICAgICAgICAgICBzdHJva2U6CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2sKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAycHgKICAgICAgICBjaXRpZXM6CiAgICAgICAgICAgIGZpbHRlcjogeyBub3Q6IHsga2luZDogW2NvdW50cnksIHN0YXRlXSB9IH0KICAgICAgICAgICAgYWxzbzoKICAgICAgICAgICAgICAgIGZpbHRlcjoKICAgICAgICAgICAgICAgICAgICBhbnk6CiAgICAgICAgICAgICAgICAgICAgICAgIC0gJHpvb206IHsgbWluOiA2LCBtYXg6IDggfQogICAgICAgICAgICAgICAgICAgICAgICAtIHsgbGFiZWxyYW5rOiB7bWluOiA1fSwgJHpvb206IHsgbWF4OiA2IH19CiAgICAgICAgICAgICAgICAgICAgICAgIC0geyBwb3B1bGF0aW9uOiB7IG1pbjogMTAwMDAwIH0gLCAkem9vbToge21pbjogOCB9IH0KICAgICAgICAgICAgICAgICAgICAgICAgLSB7IHBvcHVsYXRpb246IHsgbWluOiA1MDAwMCB9ICwgJHpvb206IHttaW46IDEyIH0gfQogICAgICAgICAgICAgICAgZHJhdzoKICAgICAgICAgICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25hbDogZmFsc2UKICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDEwcHgKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseTogTHVjaWRhIEdyYW5kZQogICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogd2hpdGUKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cm9rZToKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogYmxhY2sKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMnB4CiAgICAgICAgc3RhdGVzOgogICAgICAgICAgICBmaWx0ZXI6CiAgICAgICAgICAgICAgICAtIGtpbmQ6IHN0YXRlCiAgICAgICAgICAgICAgICAgICR6b29tOiB7IG1pbjogNiB9CiAgICAgICAgICAgIGRyYXc6CiAgICAgICAgICAgICAgICB0ZXh0OgogICAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiAzCiAgICAgICAgICAgICAgICAgICAgZm9udDoKICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB1cHBlcmNhc2UKICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMTBweAogICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHk6IEx1Y2lkYSBHcmFuZGUKICAgICAgICAgICAgICAgICAgICAgICAgZmlsbDogd2hpdGUKICAgICAgICAgICAgICAgICAgICAgICAgc3Ryb2tlOgogICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGJsYWNrCiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogMnB4CiAgICBidWlsZGluZ3M6CiAgICAgICAgZGF0YToge3NvdXJjZTogbmV4dHplbiB9CiAgICAgICAgZHJhdzoKICAgICAgICAgICAgZmFkZWxpbmVzOgogICAgICAgICAgICAgICAgb3JkZXI6IDEwCiAgICAgICAgICAgICAgICBjb2xvcjogWy45NSwgLjk1LCAuOTVdCiAgICAgICAgICAgICAgICB3aWR0aDogMnB4' });

Tangramlayer.addTo(terrain);

var topoUrl = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',{});

var BING_KEY = 'AmPQVvaKSid_g48EnFJjbYUOyWPlkQh1QGJlsFFZnw1EnJioQ5kvSiv2w7SUaJ9B'

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
    zoomControl: true // don't show zoom buttons, we're using zoomslider instead

}).setView([startLat, startLng], 7); // center map at starting position, zoom level 3


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
bigMarker.on('dragend', function () {
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
    } else { // float
        number = parseFloat(number)
    }
    if (number < min) {
        number = min
    } else if (number > max) {
        number = max
    } else if (number.toString() == "NaN") {
        number = def
    }
    if ((pad) && (intgr)) {
        document.getElementById(inputId).value = zeroPad(number, 2)
    } else {
        document.getElementById(inputId).value = number
    }
    return number
}


/* Orthodrome Layers */

var div_circle = L.divIcon({ className: 'circle'})
var orthodrome = L.layerGroup();
var omphalos = new L.LatLng(53.4869, -7.5655);

        const geodesic = L.geodesic([omphalos], {
            weight: 1.5,
			color: '#ffab91',
        }).addTo(orthodrome);

        const marker = new L.marker(omphalos, { draggable: true, icon: div_circle })
            .bindTooltip('Measurements').bindPopup("Drag to position. Click to add measurement point").openPopup().addTo(orthodrome);

        
        marker.on('drag', (e) => {
            const points = geodesic.points;
            points[0].pop()
            geodesic.addLatLng(marker.getLatLng(), points[0]);
            if (points[0].length > 1) {
                let vector = geodesic.geom.geodesic.inverse(points[0][geodesic.points[0].length - 2], marker.getLatLng());
                const totalDistance = (vector.distance !== undefined ? (vector.distance > 10000) ? (vector.distance / 1000).toFixed(0) + ' km' : (vector.distance).toFixed(0) + ' m' : 'invalid')
                marker.setTooltipContent(`<b>Segment</b></br>Distance: +${totalDistance}</br>Bearing: ${vector.initialBearing.toFixed(0)}°</br>Final Bearing: ${vector.finalBearing.toFixed(0)}°`);
                marker.openTooltip();

                
            }
        });

        map.on('click', (e) => {
            geodesic.addLatLng(e.latlng);
            let vector = geodesic.geom.geodesic.inverse(marker.getLatLng(), e.latlng);
            const totalDistance = (vector.distance !== undefined ? (vector.distance > 10000) ? (vector.distance / 1000).toFixed(0) + ' km' : (vector.distance).toFixed(0) + ' m' : 'invalid')
            marker.setLatLng(e.latlng);
            marker.setTooltipContent(`<b>Segment</b></br>Distance: +${totalDistance}</br>Bearing: ${vector.finalBearing.toFixed(0)}°`);
            marker.openTooltip();
           
        });

        
/* Lat Long Graticule */

var graticule = new L.featureGroup();


var latlngGraticule = L.latlngGraticule({
            showLabel: true,
            zoomInterval: [
                {start: 2, end: 2, interval: 40},
                {start: 3, end: 3, interval: 20},
                {start: 4, end: 4, interval: 10},
                {start: 5, end: 7, interval: 5},
                {start: 8, end: 20, interval: 1}
            ]
        }).addTo(graticule);




var overlayMaps = {
    "National Monuments": NationalMonuments,
	"Measurements": orthodrome,
	"Lat Lon Graticule ": latlngGraticule,
	"ImageOverlayJpg ": ImageOverlayJpg,
	"ImageOverlaySvg ": ImageOverlaySvg,
	"ImageOverlayPng ": ImageOverlayPng,
	
	

};

// Add the map layer switching control
var layerswitcher = L.control.layers(baseLayers,overlayMaps).addTo(map);


// Remove measurements from map

var Clear = L.Control.extend({
            options: {
                position: 'topleft'
				
            },
            onAdd: function (map) {
                var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control trash');
                container.title = "Clear Measurements"
                container.onclick = function (e) {
                    e.stopPropagation();
                    geodesic.setLatLngs([marker.getLatLng()]);
                    marker.setTooltipContent(`Distance: 0 m</br>Bearing: -`);
                    
                }
                return container;
            },
        });

        map.addControl(new Clear());







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
    var lng = parseFloat(document.getElementById("lngbox").value.substring(0, 10))

    solsticeazisumriselat = L.latLng(parseFloat(lat), parseFloat(lng));
    solsticeazisumriselng = L.latLng(parseFloat(solstice1lat), parseFloat(solstice1long));
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
    solsticeazisumsetlng = L.latLng(parseFloat(solstice2lat), parseFloat(solstice2long));
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
    solsticeaziwinriselng = L.latLng(parseFloat(solstice3lat), parseFloat(solstice3long));
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
    solsticeaziwinsetlng = L.latLng(parseFloat(solstice4lat), parseFloat(solstice4long));
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
    equinoxazisumriselng = L.latLng(parseFloat(equinox1lat), parseFloat(equinox1long));
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
    equinoxazisumsetlng = L.latLng(parseFloat(equinox2lat), parseFloat(equinox2long));
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
    crossquarterazisumriselng = L.latLng(parseFloat(crossquarter1lat), parseFloat(crossquarter1long));
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
    crossquarterazisumsetlng = L.latLng(parseFloat(crossquarter2lat), parseFloat(crossquarter2long));
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
    crossquarteraziwinriselng = L.latLng(parseFloat(crossquarter3lat), parseFloat(crossquarter3long));
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
    crossquarteraziwinsetlng = L.latLng(parseFloat(crossquarter4lat), parseFloat(crossquarter4long));
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

NationalMonuments.bindPopup(function (layer) {
        return L.Util.template(
          
		  "<p><strong>Monument Type:</strong> {MONUMENT_CLASS}</p><p><strong>SMR:</strong> {SMRS}</p><p><strong>Name:</strong> {TOWNLAND}</p><p><strong>LAT/LON:</strong> {LATITUDE}, {LONGITUDE}</p><p><small>{WEB_NOTES}</small></p>",
          layer.feature.properties
        );
		});



//  add Fullscreen to an existing map:
map.addControl(new L.Control.Fullscreen());

