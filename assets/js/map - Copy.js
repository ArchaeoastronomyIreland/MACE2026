
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
var cartoLight = L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    maxZoom: 19,
    useCache: true,
	crossOrigin: true,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
  
  });
  
var Esri_WorldImagery = L.tileLayer(
  'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  });
  
var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
        maxZoom: 20,
        subdomains:['mt0','mt1','mt2','mt3']
		});
  
var bigIcon = new L.icon({
        iconUrl: "assets/img/omphalos.svg",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -25]
    });

  


   

var baseLayers = {
    "OS Map": cartoLight,
    "ESRI Aerial": Esri_WorldImagery,
	"Google Aerial": googleSat,
	
};



// Create the map
var map = L.map('map', { // div id holding map
    layers: [cartoLight], // default map
    worldCopyJump: true, // move markers if scrolling horizontally across new map
    minZoom: 1, // minimum zoom level, skip level 0
    zoomControl: true // don't show zoom buttons, we're using zoomslider instead
}).setView([startLat, startLng], 7); // center map at starting position, zoom level 3

//map.addControl(new L.Control.Zoomslider());

// Add the map layer switching control
L.control.layers(baseLayers).addTo(map);

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



//  add Fullscreen to an existing map:
map.addControl(new L.Control.Fullscreen());

L.Control.Watermark = L.Control.extend({
		onAdd: function(map) {
			var img = L.DomUtil.create('img');
			
			img.src = 'assets/img/macelogo.png';
			img.style.width = '60px';
			
			return img;
		},
		
		onRemove: function(map) {
			// Nothing to do here
		}
	});

	L.control.watermark = function(opts) {
		return new L.Control.Watermark(opts);
	}
	
	L.control.watermark({ position: 'bottomright' }).addTo(map);