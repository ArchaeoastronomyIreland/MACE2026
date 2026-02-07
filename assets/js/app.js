










	
	
	
	
	
	
    

  /* Basemap Layers */
var cartoLight = L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    maxZoom: 19,
    useCache: true,
	crossOrigin: true,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
  
  });
  
  

  


  
  
  

	

	
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




var baseLayers = {
    "Map": cartoLight,
    
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









// Divisons Layer
var Division1Colours = {
  "1": "#C0D9AF",
  "2": "#77896C",
  "3": "#A6D785",
  "4": "#4DBD33",
  "5": "#525C65",
  "6": "#fd9a00",
  "7": "#2c3c65",
  "8": "#2c3c65",
  "9": "#2c3c65",
  "10": "#0EBFE9",
  "11": "#0EBFE9",
  "12": "#2c3c65",
  "13": "#2c3c65",
  "14": "#fd9a00",
  "15": "#fd9a00",
  "16": "#009b2e",
  "17": "#009b2e",
  "18": "#ff3135",
  "19": "#ff3135",
  "GS": "#6e6e6e",
  "J": "#976900",
  "Z": "#976900",
  "L": "#969696",
  "N": "#ffff00",
  "Q": "#ffff00",
  "R": "#ffff00"
};


//Create a color dictionary based off of lines geojson feature.properties.stroke
var lineColors = {
  "#ffb74d": "#ffb74d",
  "#fff176": "#fff176",
  "#aed581": "#97dc4bff",
  "#7283a7": "#759ae8ff",
  "#ff8a65": "#ff8a65",
  "#a1887f": "#cbdadfff",
  "#dce775": "#f9e9e7ff",
  "#f3e5f5": "#666666ff",
  "#e1bee7": "#666666ff",
  "10": "#0EBFE9",
  "11": "#0EBFE9",
  "12": "#2c3c65",
  "13": "#2c3c65",
  "14": "#fd9a00",
  "15": "#fd9a00",
  "16": "#009b2e",
  "17": "#009b2e",
  "18": "#ff3135",
  "19": "#ff3135",
  "GS": "#6e6e6e",
  "J": "#976900",
  "Z": "#976900",
  "L": "#969696",
  "N": "#ffff00",
  "Q": "#ffff00",
  "R": "#ffff00"
};



















				  

					  
					  

































					
					
					
					

































		

		

		
		

		
		



//  add Fullscreen to an existing map:
map.addControl(new L.Control.Fullscreen());



//code for showing/hiding layers control on click
$('.leaflet-control-layers').show();
$('.leaflet-control-layers').css('topright','30px');


