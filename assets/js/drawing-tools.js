/**
 * =========================================================================
 * Drawing Tools Module
 * Extracted from drawing.html for integration into MACE application
 * =========================================================================
 */

(function() {
    'use strict';

    /**
     * =========================================================================
     * MODULE 1: UI Utilities & Config
     * =========================================================================
     */
    const UIUtils = {
        PRESET_COLORS: ['#3388ff', '#ff3333', '#33ff33', '#ffaa00', '#9933ff', '#00ffff', '#ff00ff', '#ffff00'],
        PRESET_GREYS: ['#ffffff', '#e0e0e0', '#c0c0c0', '#a0a0a0', '#808080', '#606060', '#404040', '#000000'],

        createPalette: function(containerId, inputId, updateOpacity = false) {
            const container = document.getElementById(containerId);
            if (!container) return;
            const input = document.getElementById(inputId);
            if (!input) return;
            
            const buildRow = (colors) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'palette-row';
                colors.forEach(color => {
                    const swatch = document.createElement('div');
                    swatch.className = 'color-swatch';
                    swatch.style.backgroundColor = color;
                    swatch.title = color;
                    swatch.onclick = () => {
                        input.value = color;
                        if (updateOpacity) {
                            const opacitySlider = document.getElementById('fill-opacity');
                            if (opacitySlider && opacitySlider.value == 0) {
                                opacitySlider.value = 0.5;
                                this.updateOpacityLabel(0.5);
                            }
                        }
                    };
                    rowDiv.appendChild(swatch);
                });
                container.appendChild(rowDiv);
            };
            buildRow(this.PRESET_COLORS);
            buildRow(this.PRESET_GREYS);
        },

        updateOpacityLabel: function(val) {
            const label = document.getElementById('opacity-label');
            if (label) label.innerText = Math.round(val * 100) + '%';
        },

        updateWeightLabel: function(val) {
            const label = document.getElementById('outline-weight-label');
            if (label) label.innerText = val + 'px';
        },

        updateArrowSizeLabel: function(val) {
            const label = document.getElementById('arrow-size-label');
            if (label) label.innerText = val + 'px';
        },

        setStatus: function(msg) {
            const status = document.getElementById('status-msg');
            if (status) status.innerText = msg;
        },

        setActiveButton: function(id) {
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
            if (id) {
                const btn = document.getElementById('btn-' + id);
                if (btn) btn.classList.add('active');
            }
        },

        updateStats: function(map, itemCount) {
            if (!map) return;
            const center = map.getCenter();
            const zoomEl = document.getElementById('zoom-level');
            const latEl = document.getElementById('center-lat');
            const lngEl = document.getElementById('center-lng');
            const countEl = document.getElementById('item-count');
            
            if (zoomEl) zoomEl.innerText = map.getZoom();
            if (latEl) latEl.innerText = center.lat.toFixed(4);
            if (lngEl) lngEl.innerText = center.lng.toFixed(4);
            if (countEl && itemCount !== undefined) countEl.innerText = itemCount;
        },

        // Modal Handlers
        tempTextCallback: null,
        openTextModal: function(callback) {
            this.tempTextCallback = callback;
            const textInput = document.getElementById('text-input');
            const overlay = document.getElementById('modal-overlay');
            const modal = document.getElementById('text-modal');
            
            if (textInput) textInput.value = "";
            if (overlay) overlay.style.display = 'block';
            if (modal) {
                modal.style.display = 'block';
                if (textInput) textInput.focus();
            }
        },
        confirmTextModal: function() {
            const textInput = document.getElementById('text-input');
            const text = textInput ? textInput.value : "";
            if (this.tempTextCallback) this.tempTextCallback(text);
            this.closeTextModal();
        },
        cancelTextModal: function() {
            if (this.tempTextCallback) this.tempTextCallback(null);
            this.closeTextModal();
        },
        closeTextModal: function() {
            const overlay = document.getElementById('modal-overlay');
            const modal = document.getElementById('text-modal');
            if (overlay) overlay.style.display = 'none';
            if (modal) modal.style.display = 'none';
            this.tempTextCallback = null;
        },
        openConfirmModal: function() {
            const overlay = document.getElementById('modal-overlay');
            const modal = document.getElementById('confirm-modal');
            if (overlay) overlay.style.display = 'block';
            if (modal) modal.style.display = 'block';
        },
        closeConfirmModal: function() {
            const overlay = document.getElementById('modal-overlay');
            const modal = document.getElementById('confirm-modal');
            if (overlay) overlay.style.display = 'none';
            if (modal) modal.style.display = 'none';
        }
    };

    /**
     * =========================================================================
     * MODULE 2: DRAWING MANAGER (PORTABLE)
     * =========================================================================
     */
    class DrawingManager {
        constructor(map, drawnItemsGroup, decoratorGroup) {
            this.map = map;
            this.drawnItems = drawnItemsGroup;
            this.decoratorItems = decoratorGroup;
            
            this.currentDrawer = null;
            this.currentDrawType = null;
            
            // Initialize Edit/Delete handlers from Leaflet.Draw
            this.editHandler = new L.EditToolbar.Edit(map, { featureGroup: this.drawnItems });
            this.deleteHandler = new L.EditToolbar.Delete(map, { featureGroup: this.drawnItems });

            this.tempLatLng = null;
            this.initEvents();
        }

        // --- Public API ---

        startTool(type) {
            this.stopDrawing();
            this.currentDrawType = type;

            // 1. Manual Tools (Text & Presets)
            if (type === 'text' || type.startsWith('preset')) {
                const msg = type === 'text' ? "Click map to place text." : "Click map to place marker.";
                UIUtils.setStatus(msg);
                UIUtils.setActiveButton(type);
                L.DomUtil.addClass(this.map.getContainer(), 'cursor-crosshair');
                
                this.map.once('click', (e) => this._onManualMapClick(e));
                return;
            }

            // 2. Standard Leaflet.Draw Tools
            const options = this._getShapeOptions(type);
            
            if (type === 'marker') {
                this.currentDrawer = new L.Draw.Marker(this.map);
            } else if (type === 'polyline' || type === 'arrow') {
                this.currentDrawer = new L.Draw.Polyline(this.map, { shapeOptions: options });
            } else if (type === 'polygon') {
                this.currentDrawer = new L.Draw.Polygon(this.map, { showArea: true, shapeOptions: options });
            } else if (type === 'rectangle') {
                this.currentDrawer = new L.Draw.Rectangle(this.map, { shapeOptions: options });
            } else if (type === 'circle') {
                this.currentDrawer = new L.Draw.Circle(this.map, { shapeOptions: options });
            }

            if (this.currentDrawer) {
                this.currentDrawer.enable();
                UIUtils.setActiveButton(type);
                UIUtils.setStatus("Drawing " + type + "...");
            }
        }

        startEdit() {
            this.stopDrawing();
            this.editHandler.enable();
            UIUtils.setActiveButton('edit');
            UIUtils.setStatus("Editing... Drag handles. Click Save when done.");
        }

        startDelete() {
            this.stopDrawing();
            this.deleteHandler.enable();
            UIUtils.setActiveButton('delete');
            UIUtils.setStatus("Delete mode... Click shapes to remove.");
        }

        saveActions() {
            this.editHandler.save();
            this.deleteHandler.save();
            this.stopDrawing();
            UIUtils.setStatus("Changes saved.");
        }

        stopDrawing() {
            if (this.currentDrawer) {
                this.currentDrawer.disable();
                this.currentDrawer = null;
            }
            this.editHandler.disable();
            this.deleteHandler.disable();
            
            this.map.off('click', this._onManualMapClick);
            L.DomUtil.removeClass(this.map.getContainer(), 'cursor-crosshair');

            UIUtils.setActiveButton(null);
            UIUtils.setStatus("Ready.");
            this.currentDrawType = null;
        }

        clearAll() {
            this.drawnItems.clearLayers();
            this.decoratorItems.clearLayers();
            this.updateCount();
            UIUtils.closeConfirmModal();
        }

        fitBounds() {
            if (this.drawnItems.getLayers().length > 0) {
                this.map.fitBounds(this.drawnItems.getBounds(), { padding: [50, 50] });
            } else {
                UIUtils.setStatus("No items to zoom to.");
            }
        }

        // --- Internal Logic ---

        _getShapeOptions(type) {
            const outlineColorEl = document.getElementById('outline-color');
            const outlineWeightEl = document.getElementById('outline-weight');
            const outlineDashedEl = document.getElementById('outline-dashed');
            const fillColorEl = document.getElementById('fill-color');
            const fillOpacityEl = document.getElementById('fill-opacity');

            const outlineColor = outlineColorEl ? outlineColorEl.value : '#333333';
            const outlineWeight = outlineWeightEl ? parseInt(outlineWeightEl.value) : 2;
            const isDashed = outlineDashedEl ? outlineDashedEl.checked : false;
            const fillColor = fillColorEl ? fillColorEl.value : '#3388ff';
            const fillOpacity = fillOpacityEl ? parseFloat(fillOpacityEl.value) : 1;

            return {
                color: outlineColor,
                weight: outlineWeight,
                opacity: 0.8,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                dashArray: isDashed ? '10, 10' : null,
                lineCap: 'square'
            };
        }

        _onManualMapClick(e) {
            this.tempLatLng = e.latlng;
            UIUtils.openTextModal((text) => this._finalizeManualShape(text));
        }

        _finalizeManualShape(text) {
            if (text === null) {
                this.stopDrawing();
                return;
            }

            const styles = this._getShapeOptions(this.currentDrawType);

            if (this.currentDrawType === 'text') {
                if (text && text.trim() !== "") {
                    const icon = L.divIcon({
                        className: 'text-label-icon',
                        html: `<span class="text-label-content" style="color:${styles.color}">${text}</span>`,
                        iconSize: null,
                        iconAnchor: [0, 0]
                    });
                    const layer = L.marker(this.tempLatLng, { icon: icon, draggable: true });
                    this.drawnItems.addLayer(layer);
                }
            } else if (this.currentDrawType.startsWith('preset')) {
                let radius = 8;
                if (this.currentDrawType === 'preset-small') radius = 4;
                if (this.currentDrawType === 'preset-medium') radius = 8;
                if (this.currentDrawType === 'preset-large') radius = 15;

                const marker = L.circleMarker(this.tempLatLng, {
                    radius: radius,
                    color: styles.color,
                    fillColor: styles.fillColor,
                    fillOpacity: styles.fillOpacity,
                    weight: styles.weight
                });

                if (text && text.trim() !== "") {
                    marker.bindPopup(text);
                }
                this.drawnItems.addLayer(marker);
            }

            this.updateCount();
            this.stopDrawing();
        }

        initEvents() {
            // 1. Handle Creation from Leaflet.Draw
            this.map.on(L.Draw.Event.CREATED, (e) => {
                const layer = e.layer;
                this.drawnItems.addLayer(layer);

                if (this.currentDrawType === 'arrow' && layer instanceof L.Polyline) {
                    this._addArrowDecoration(layer);
                }

                this.updateCount();
                this.stopDrawing();
            });

            // 2. Handle Deletion
            this.drawnItems.on('layerremove', (e) => {
                const layer = e.layer;
                if (layer._decorator) {
                    this.decoratorItems.removeLayer(layer._decorator);
                    layer._decorator = null;
                }
                this.updateCount();
            });

            // 3. Handle Editing
            this.map.on('draw:edited', (e) => {
                const layers = e.layers;
                layers.eachLayer((layer) => {
                    if (layer._decorator) {
                        layer._decorator.setPaths([layer]);
                    }
                });
            });
        }

        _addArrowDecoration(layer) {
            if (!L.polylineDecorator) return;

            const arrowFreqEl = document.getElementById('arrow-frequency');
            const arrowSizeEl = document.getElementById('arrow-size');
            const outlineColorEl = document.getElementById('outline-color');
            const outlineWeightEl = document.getElementById('outline-weight');

            const arrowFreq = arrowFreqEl ? arrowFreqEl.value : 'end';
            const arrowSize = arrowSizeEl ? parseInt(arrowSizeEl.value) : 15;
            const color = outlineColorEl ? outlineColorEl.value : '#333333';
            const weight = outlineWeightEl ? parseInt(outlineWeightEl.value) : 2;

            const symbol = L.Symbol.arrowHead({
                pixelSize: arrowSize,
                polygon: false,
                pathOptions: { stroke: true, color: color, weight: weight }
            });

            const patterns = [];
            if (arrowFreq === 'end') patterns.push({ offset: '100%', repeat: 0, symbol: symbol });
            else if (arrowFreq === 'start-end') {
                patterns.push({ offset: '0%', repeat: 0, symbol: symbol });
                patterns.push({ offset: '100%', repeat: 0, symbol: symbol });
            } else if (arrowFreq === 'repeat') patterns.push({ offset: 25, repeat: 100, symbol: symbol });

            const decorator = L.polylineDecorator(layer, { patterns: patterns });
            this.decoratorItems.addLayer(decorator);
            layer._decorator = decorator;
        }

        updateCount() {
            const count = this.drawnItems.getLayers().length;
            UIUtils.updateStats(this.map, count);
        }
    }

    /**
     * =========================================================================
     * MODULE 3: MAIN APP GLUE
     * =========================================================================
     */
    window.DrawingToolsApp = {
        map: null,
        drawingManager: null,
        ui: UIUtils,

        init: function(mapInstance) {
            if (!mapInstance) {
                console.error('DrawingToolsApp: map instance required');
                return;
            }

            this.map = mapInstance;

            // Setup Layers
            const drawnItems = new L.FeatureGroup().addTo(this.map);
            const decoratorItems = new L.FeatureGroup().addTo(this.map);

            // Initialize Drawing Manager
            this.drawingManager = new DrawingManager(this.map, drawnItems, decoratorItems);

            // Initialize UI Components
            UIUtils.createPalette('outline-palette', 'outline-color');
            UIUtils.createPalette('fill-palette', 'fill-color', true);
            
            // Update stats on move
            this.map.on('moveend', () => UIUtils.updateStats(this.map));
            this.map.on('zoomend', () => UIUtils.updateStats(this.map));
            UIUtils.updateStats(this.map, 0);

            // Handle 'Enter' key in text modal
            const textInput = document.getElementById('text-input');
            if (textInput) {
                textInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") UIUtils.confirmTextModal();
                });
            }
        },

        // Delegate button clicks to manager
        startTool: function(type) {
            if (this.drawingManager) this.drawingManager.startTool(type);
        },
        startEdit: function() {
            if (this.drawingManager) this.drawingManager.startEdit();
        },
        startDelete: function() {
            if (this.drawingManager) this.drawingManager.startDelete();
        },
        saveActions: function() {
            if (this.drawingManager) this.drawingManager.saveActions();
        },
        stopDrawing: function() {
            if (this.drawingManager) this.drawingManager.stopDrawing();
        },
        
        exportDrawings: function() {
            if (!this.drawingManager || !this.drawingManager.drawnItems) {
                alert('No drawings to export.');
                return;
            }
            
            // Collect all drawn items
            const features = [];
            this.drawingManager.drawnItems.eachLayer(function(layer) {
                let feature = null;
                
                if (layer instanceof L.Marker) {
                    const latlng = layer.getLatLng();
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [latlng.lng, latlng.lat]
                        },
                        properties: {
                            type: 'marker',
                            icon: layer.options.icon ? (layer.options.icon.options ? layer.options.icon.options.html : null) : null,
                            draggable: layer.options.draggable || false
                        }
                    };
                } else if (layer instanceof L.CircleMarker) {
                    const latlng = layer.getLatLng();
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [latlng.lng, latlng.lat]
                        },
                        properties: {
                            type: 'circleMarker',
                            radius: layer.options.radius,
                            color: layer.options.color,
                            fillColor: layer.options.fillColor,
                            fillOpacity: layer.options.fillOpacity,
                            weight: layer.options.weight,
                            popup: layer._popup ? layer._popup._content : null
                        }
                    };
                } else if (layer instanceof L.Polyline) {
                    const latlngs = layer.getLatLngs();
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: latlngs.map(ll => [ll.lng, ll.lat])
                        },
                        properties: {
                            type: 'polyline',
                            color: layer.options.color,
                            weight: layer.options.weight,
                            opacity: layer.options.opacity,
                            dashArray: layer.options.dashArray,
                            hasArrow: !!layer._decorator
                        }
                    };
                } else if (layer instanceof L.Polygon) {
                    const latlngs = layer.getLatLngs();
                    // Handle both simple and multi-ring polygons
                    let coordinates;
                    if (Array.isArray(latlngs[0]) && Array.isArray(latlngs[0][0])) {
                        coordinates = latlngs.map(ring => ring.map(ll => [ll.lng, ll.lat]));
                    } else {
                        coordinates = [latlngs.map(ll => [ll.lng, ll.lat])];
                    }
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: coordinates
                        },
                        properties: {
                            type: 'polygon',
                            color: layer.options.color,
                            weight: layer.options.weight,
                            opacity: layer.options.opacity,
                            fillColor: layer.options.fillColor,
                            fillOpacity: layer.options.fillOpacity,
                            dashArray: layer.options.dashArray
                        }
                    };
                } else if (layer instanceof L.Rectangle) {
                    const bounds = layer.getBounds();
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [bounds.getWest(), bounds.getNorth()],
                                [bounds.getEast(), bounds.getNorth()],
                                [bounds.getEast(), bounds.getSouth()],
                                [bounds.getWest(), bounds.getSouth()],
                                [bounds.getWest(), bounds.getNorth()]
                            ]]
                        },
                        properties: {
                            type: 'rectangle',
                            color: layer.options.color,
                            weight: layer.options.weight,
                            opacity: layer.options.opacity,
                            fillColor: layer.options.fillColor,
                            fillOpacity: layer.options.fillOpacity
                        }
                    };
                } else if (layer instanceof L.Circle) {
                    const latlng = layer.getLatLng();
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [latlng.lng, latlng.lat]
                        },
                        properties: {
                            type: 'circle',
                            radius: layer.getRadius(),
                            color: layer.options.color,
                            weight: layer.options.weight,
                            opacity: layer.options.opacity,
                            fillColor: layer.options.fillColor,
                            fillOpacity: layer.options.fillOpacity
                        }
                    };
                }
                
                if (feature) {
                    features.push(feature);
                }
            });
            
            // Collect current style settings
            const styles = {
                outlineColor: document.getElementById('outline-color') ? document.getElementById('outline-color').value : '#333333',
                outlineWeight: document.getElementById('outline-weight') ? parseInt(document.getElementById('outline-weight').value) : 2,
                outlineDashed: document.getElementById('outline-dashed') ? document.getElementById('outline-dashed').checked : false,
                fillColor: document.getElementById('fill-color') ? document.getElementById('fill-color').value : '#3388ff',
                fillOpacity: document.getElementById('fill-opacity') ? parseFloat(document.getElementById('fill-opacity').value) : 1,
                arrowFrequency: document.getElementById('arrow-frequency') ? document.getElementById('arrow-frequency').value : 'end',
                arrowSize: document.getElementById('arrow-size') ? parseInt(document.getElementById('arrow-size').value) : 15
            };
            
            const exportData = {
                type: 'DrawingToolsExport',
                version: '1.0',
                styles: styles,
                features: features
            };
            
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `drawings-${new Date().toISOString().split('T')[0]}.geojson`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            UIUtils.setStatus(`Exported ${features.length} items with styles.`);
        },
        
        importDrawings: function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    // Validate format
                    if (importData.type !== 'DrawingToolsExport') {
                        alert('Invalid file format. Expected DrawingToolsExport file.');
                        return;
                    }
                    
                    // Restore styles
                    if (importData.styles) {
                        const styles = importData.styles;
                        const outlineColorEl = document.getElementById('outline-color');
                        const outlineWeightEl = document.getElementById('outline-weight');
                        const outlineDashedEl = document.getElementById('outline-dashed');
                        const fillColorEl = document.getElementById('fill-color');
                        const fillOpacityEl = document.getElementById('fill-opacity');
                        const arrowFreqEl = document.getElementById('arrow-frequency');
                        const arrowSizeEl = document.getElementById('arrow-size');
                        
                        if (outlineColorEl) outlineColorEl.value = styles.outlineColor || '#333333';
                        if (outlineWeightEl) {
                            outlineWeightEl.value = styles.outlineWeight || 2;
                            if (UIUtils.updateWeightLabel) UIUtils.updateWeightLabel(styles.outlineWeight || 2);
                        }
                        if (outlineDashedEl) outlineDashedEl.checked = styles.outlineDashed || false;
                        if (fillColorEl) fillColorEl.value = styles.fillColor || '#3388ff';
                        if (fillOpacityEl) {
                            fillOpacityEl.value = styles.fillOpacity !== undefined ? styles.fillOpacity : 1;
                            if (UIUtils.updateOpacityLabel) UIUtils.updateOpacityLabel(styles.fillOpacity !== undefined ? styles.fillOpacity : 1);
                        }
                        if (arrowFreqEl) arrowFreqEl.value = styles.arrowFrequency || 'end';
                        if (arrowSizeEl) {
                            arrowSizeEl.value = styles.arrowSize || 15;
                            if (UIUtils.updateArrowSizeLabel) UIUtils.updateArrowSizeLabel(styles.arrowSize || 15);
                        }
                    }
                    
                    // Clear existing drawings
                    if (this.drawingManager) {
                        this.drawingManager.drawnItems.clearLayers();
                        this.drawingManager.decoratorItems.clearLayers();
                    }
                    
                    // Restore features
                    if (importData.features && Array.isArray(importData.features)) {
                        importData.features.forEach(feature => {
                            if (!feature.geometry || !feature.properties) return;
                            
                            let layer = null;
                            const props = feature.properties;
                            
                            if (props.type === 'marker' && feature.geometry.type === 'Point') {
                                const coords = feature.geometry.coordinates;
                                const icon = props.icon ? L.divIcon({
                                    className: 'text-label-icon',
                                    html: props.icon,
                                    iconSize: null,
                                    iconAnchor: [0, 0]
                                }) : L.Icon.Default.prototype;
                                layer = L.marker([coords[1], coords[0]], {
                                    icon: icon,
                                    draggable: props.draggable || false
                                });
                            } else if (props.type === 'circleMarker' && feature.geometry.type === 'Point') {
                                const coords = feature.geometry.coordinates;
                                layer = L.circleMarker([coords[1], coords[0]], {
                                    radius: props.radius || 8,
                                    color: props.color || '#333333',
                                    fillColor: props.fillColor || '#3388ff',
                                    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1,
                                    weight: props.weight || 2
                                });
                                if (props.popup) layer.bindPopup(props.popup);
                            } else if (props.type === 'polyline' && feature.geometry.type === 'LineString') {
                                const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
                                layer = L.polyline(coords, {
                                    color: props.color || '#333333',
                                    weight: props.weight || 2,
                                    opacity: props.opacity !== undefined ? props.opacity : 0.8,
                                    dashArray: props.dashArray || null
                                });
                                if (props.hasArrow && this.drawingManager) {
                                    this.drawingManager.currentDrawType = 'arrow';
                                    this.drawingManager._addArrowDecoration(layer);
                                }
                            } else if (props.type === 'polygon' && feature.geometry.type === 'Polygon') {
                                const coords = feature.geometry.coordinates.map(ring => ring.map(c => [c[1], c[0]]));
                                layer = L.polygon(coords, {
                                    color: props.color || '#333333',
                                    weight: props.weight || 2,
                                    opacity: props.opacity !== undefined ? props.opacity : 0.8,
                                    fillColor: props.fillColor || '#3388ff',
                                    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1,
                                    dashArray: props.dashArray || null
                                });
                            } else if (props.type === 'rectangle' && feature.geometry.type === 'Polygon') {
                                const coords = feature.geometry.coordinates[0];
                                const bounds = L.latLngBounds(coords.map(c => [c[1], c[0]]));
                                layer = L.rectangle(bounds, {
                                    color: props.color || '#333333',
                                    weight: props.weight || 2,
                                    opacity: props.opacity !== undefined ? props.opacity : 0.8,
                                    fillColor: props.fillColor || '#3388ff',
                                    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1
                                });
                            } else if (props.type === 'circle' && feature.geometry.type === 'Point') {
                                const coords = feature.geometry.coordinates;
                                layer = L.circle([coords[1], coords[0]], {
                                    radius: props.radius || 1000,
                                    color: props.color || '#333333',
                                    weight: props.weight || 2,
                                    opacity: props.opacity !== undefined ? props.opacity : 0.8,
                                    fillColor: props.fillColor || '#3388ff',
                                    fillOpacity: props.fillOpacity !== undefined ? props.fillOpacity : 1
                                });
                            }
                            
                            if (layer && this.drawingManager) {
                                this.drawingManager.drawnItems.addLayer(layer);
                            }
                        });
                        
                        if (this.drawingManager) {
                            this.drawingManager.updateCount();
                        }
                        
                        UIUtils.setStatus(`Imported ${importData.features.length} items with styles.`);
                    }
                } catch (error) {
                    alert('Error reading file: ' + error.message);
                    console.error('Import error:', error);
                }
            };
            reader.onerror = () => {
                alert('Error reading file.');
            };
            reader.readAsText(file);
            
            // Reset file input
            event.target.value = '';
        }
    };

    // Expose UI utils globally for HTML onclick handlers
    window.drawingUI = UIUtils;

})();

