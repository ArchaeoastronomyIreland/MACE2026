// cartoLight duplicate for minimap
  
var cartoLight2 = new L.TileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    maxZoom: 19,
    useCache: true,
	crossOrigin: true,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'

});	
	var miniMap = new L.Control.MiniMap(cartoLight2, { toggleDisplay: true, minimized: true, position: 'bottomleft', collapsedWidth: 32, collapsedHeight: 32 }).addTo(map); 