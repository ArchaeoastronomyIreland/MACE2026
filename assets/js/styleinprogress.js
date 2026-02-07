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
  "10": "darkblue",
  "11": "#FF0000",
  "12": "#2c3c65",
  "13": "#FF0000",
  "14": "#3195b7",
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
  "#ff8040": "#9370DB"
};


style = function (feature) {
                return {
                    color: '#4B0082',
                    steps: 50,
                    geodesic: "true",
					geodesic_steps: 50,
					geodesic_wrap: "true",
					weight: 2,
                    opacity: 1.0,
                    
                    radius: 5,
                };
            },


L.Control.FileLayerLoad.LABEL = '<img class="icon" src="assets/img/folder.svg" alt="file icon"/>';
        
        



var fileload = new L.Control.fileLayerLoad({
    fileSizeLimit: 5000,
    fitBounds: true, //MOVE THE CENTER OF THE SCREEN
    layerOptions: {
		
        onEachFeature: function(feature, layer) {
            // Need to assign a random name in case it is not defined in the file. You may not need this.
            var name = feature.properties.name;
            if (typeof name === "undefined") {
            	name = "random" + Math.round(Math.random()*100);
            }
            
            layer.bindPopup( "Name: " + name);
			
            
            // Store the reference to each individual layer if you want to add them to the Layers Control as individual layers.
            overlayMaps[name] = layer;
        }
    }
}).addTo(map);





fileload.loader.on('data:loaded', function (e) {
    // Add to map layer switcher
    
    // Example from Leaflet.FileLayer to load the entire file content as 1 single layer.
    layerswitcher.addOverlay(e.layer, e.filename);
    
    // Example to load each individual feature as a separate overlay.
    /*for (var i in overlayMaps) {
    	layerswitcher.addOverlay(overlayMaps[i], i)
    }
    overlayMaps = {};*/
});
		
		

		