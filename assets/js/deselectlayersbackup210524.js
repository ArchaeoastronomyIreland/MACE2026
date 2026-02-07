function toggleLayer(checked, layer) {
  if (checked) {
    map.addLayer(layer);
  } else {
    map.removeLayer(layer);
  }
}