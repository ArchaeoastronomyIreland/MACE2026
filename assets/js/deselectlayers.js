function toggleLayer(checked, layer) {
  if (checked) {
    map.addLayer(layer);
  } else {
    map.removeLayer(layer);
  }
  zoomLevel = map.getZoom();
  if (zoomLevel >= 17) {
   newtest.addTo(map);
  }
  if (zoomLevel < 17) {
   newtest.removeFrom(map);
  }
 });
}