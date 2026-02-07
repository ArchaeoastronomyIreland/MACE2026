L.browserPrint({
                printLayer: L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
    maxZoom: 19,
    useCache: true,
	crossOrigin: true,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
  
  }),
                closePopupsOnPrint: false,      
                printModesNames: {Portrait:"Portrait", Landscape:"Landscape", Auto:"Auto", Custom:"Custom"}

            }).addTo(map);
            
            

        
        