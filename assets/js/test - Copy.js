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
                    color: lineColors[feature.properties.stroke],
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
        control = L.Control.fileLayerLoad({
            fitBounds: true,
            layerOptions: {
                style: style,
                pointToLayer: function (data, latlng) {
                    return L.circleMarker(
                        latlng,
                        { style: style }
                    );
                }
            }
        });
        control.addTo(map);
        





		
		

		