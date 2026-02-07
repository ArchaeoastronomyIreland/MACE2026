// Lon Lat	script
var c = new L.Control.Coordinates();
		c.addTo(map);

		function onMapClick(e) {
			c.setCoordinates(e);
		}

		map.on('click', onMapClick);