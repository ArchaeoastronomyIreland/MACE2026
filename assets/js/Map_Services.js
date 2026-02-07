document.addEventListener('DOMContentLoaded', function() {

        

        // 2. STATE VARIABLES
        let activeTesterLayers = [];
        let activeHeatmapLayers = []; 
        let searchMarker = null; 
        let detectedServiceType = 'ESRI'; 
        let activeEsriWhere = null; 
        let activeColorAttribute = null;
        let availableLayers = [];
        let fieldTypes = {};
        let availableFields = [];
        let isHeatmapMode = false;
        
        let currentActiveServiceUrl = null;
        let currentActiveLayerId = null;
        let currentLayerRef = null;

        // 3. UI REFERENCES
        const ui = {
            btnLoad: document.getElementById('MS_btnLoad'), 
            btnAdd: document.getElementById('MS_btnAdd'), 
            btnClear: document.getElementById('MS_btnClear'),
            btnExport: document.getElementById('MS_btnExport'),
            status: document.getElementById('MS_status'), 
            loading: document.getElementById('MS_loadingIndicator'),
            capUrl: document.getElementById('MS_capUrl'), 
            presetSelect: document.getElementById('MS_presetSelect'), 
            baseUrl: document.getElementById('MS_baseUrl'),
            layerSelect: document.getElementById('MS_layerSelect'), 
            layerSection: document.getElementById('MS_layerSection'), 
            srsSelect: document.getElementById('MS_srsSelect'),
            wmsOptions: document.getElementById('MS_wmsOptions'), 
            wfsTechnical: document.getElementById('MS_wfsTechnicalOptions'),
            queryContainer: document.getElementById('MS_queryContainer'), 
            detectedBadge: document.getElementById('MS_detectedType'),
            versionDisplay: document.getElementById('MS_versionDisplay'), 
            controls: document.getElementById('MS_controls'),
            toggleHeatmap: document.getElementById('MS_toggleHeatmap'),
            searchInput: document.getElementById('MS_searchInput'),
            searchBtn: document.getElementById('MS_btnSearch'),
            toggleAdvanced: document.getElementById('MS_toggleAdvanced'),
            advancedSettings: document.getElementById('MS_advancedSettings')
        };

        const queryUI = {
            enable: document.getElementById('MS_enableQuery'), 
            controls: document.getElementById('MS_queryControls'), 
            attrSelect: document.getElementById('MS_attributeSelect'),
            btnFetch: document.getElementById('MS_btnFetchValues'), 
            list: document.getElementById('MS_uniqueValuesList'), 
            btnRun: document.getElementById('MS_btnRunQuery'),
            container: document.getElementById('MS_uniqueValuesContainer')
        };

        // BIND EVENTS MANUALLY (Replaces inline onclick/oninput)
        if(ui.capUrl) ui.capUrl.addEventListener('input', window.MS_detectServiceType);
        
        if(ui.toggleAdvanced) {
            ui.toggleAdvanced.addEventListener('click', function(e) {
                e.preventDefault();
                ui.advancedSettings.classList.toggle('hidden');
            });
        }

        // 4. HELPER FUNCTIONS
        function setStatus(msg, type='normal') {
            if(!ui.status) return;
            ui.status.classList.remove('hidden', 'alert-danger', 'alert-success', 'alert-info', 'alert-warning'); 
            ui.status.innerHTML = msg;
            if(type==='error') ui.status.classList.add('alert-danger'); 
            else if(type==='success') ui.status.classList.add('alert-success'); 
            else ui.status.classList.add('alert-info');
        }
        function resetQueryState() {
            activeEsriWhere = null; activeColorAttribute = null; fieldTypes = {}; availableFields = [];
            queryUI.enable.checked = false; queryUI.controls.classList.add('hidden'); queryUI.container.classList.add('hidden');
            queryUI.list.innerHTML = ''; queryUI.attrSelect.innerHTML = '<option value="">Loading attributes...</option>';
        }

        const ColorHash = {
            _hash: function(str) { let hash = 0; if (!str) return hash; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); hash = hash & hash; } return hash; },
            getColor: function(str) { if (!str) return "#9333ea"; const hash = this._hash(String(str)); const h = Math.abs(hash % 360); const s = 65 + (Math.abs(hash) % 20); const l = 45 + (Math.abs(hash) % 15); return `hsl(${h}, ${s}%, ${l}%)`; }
        };
        function getFeatureColor(f) { return activeColorAttribute ? ColorHash.getColor(f.properties[activeColorAttribute]) : "#9333ea"; }

        // 5. FETCH HELPERS
        async function fetchSafeJson(url) {
            const res = await fetch(url); const txt = await res.text();
            if(txt.trim().startsWith('<')) throw new Error("Server returned XML (Error/Cap).");
            return JSON.parse(txt);
        }
        
        function arcgisToGeoJSON(arcgis) {
            const features = [];
            if (arcgis.features) {
                arcgis.features.forEach(f => {
                    let geom = null;
                    if (f.geometry) {
                        if (f.geometry.x && f.geometry.y) geom = { type: "Point", coordinates: [f.geometry.x, f.geometry.y] };
                        else if (f.geometry.rings) geom = { type: "Polygon", coordinates: f.geometry.rings };
                        else if (f.geometry.paths) geom = { type: "LineString", coordinates: f.geometry.paths };
                    }
                    features.push({ type: "Feature", properties: f.attributes, geometry: geom });
                });
            }
            return { type: "FeatureCollection", features: features };
        }

        function normalizeGeoJSON(geoJson) {
            return geoJson;
        }

        async function fetchEsriService(baseUrl, layerId) {
            let queryUrl = baseUrl.endsWith(layerId) ? baseUrl : `${baseUrl}/${layerId}`;
            if (!queryUrl.includes('query')) queryUrl += '/query';

            const b = map.getBounds();
            const params = new URLSearchParams({
                f: 'json', returnGeometry: 'true', spatialRel: 'esriSpatialRelIntersects',
                geometry: `${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`,
                geometryType: 'esriGeometryEnvelope', inSR: '4326', outFields: '*', outSR: '4326'
            });
            if (activeEsriWhere) params.append('where', activeEsriWhere); else params.append('where', '1=1');

            const data = await fetchSafeJson(`${queryUrl}?${params}`);
            return normalizeGeoJSON(arcgisToGeoJSON(data));
        }

        // 6. MAIN LOGIC
        window.MS_detectServiceType = function() {
            const url = ui.capUrl.value.toLowerCase();
            if (url.includes('mapserver') || url.includes('featureserver')) detectedServiceType = 'ESRI'; else detectedServiceType = 'OTHER';
            if(detectedServiceType === 'ESRI') { 
                ui.queryContainer.classList.remove('hidden'); 
                ui.detectedBadge.textContent = "ESRI REST"; 
                ui.detectedBadge.className = "ms-type-badge ms-type-esri"; 
            } else { 
                ui.queryContainer.classList.add('hidden'); 
                ui.detectedBadge.textContent = "OTHER"; 
                ui.detectedBadge.className = "ms-type-badge ms-type-other"; 
            }
        };
        
        ui.presetSelect.addEventListener('change', () => { if(ui.presetSelect.value) { ui.capUrl.value = ui.presetSelect.value; window.MS_detectServiceType(); }});

        // SEARCH LOCATION LOGIC
        let lastNominatimRequest = 0;
        const NOMINATIM_RATE_LIMIT = 1000; // 1 second between requests (Nominatim requirement)
        
        async function performSearch() {
            const q = ui.searchInput.value.trim();
            if(!q) return;
            
            setStatus("Searching...", "normal");
            
            const latLonMatch = q.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
            if(latLonMatch) {
                const lat = parseFloat(latLonMatch[1]);
                const lon = parseFloat(latLonMatch[3]);
                updateSearchMarker(lat, lon, "Coordinates: " + q);
                setStatus("Jumped to coordinates.", "success");
                return;
            }

            try {
                // Rate limiting: Nominatim allows max 1 request per second
                const now = Date.now();
                const timeSinceLastRequest = now - lastNominatimRequest;
                if (timeSinceLastRequest < NOMINATIM_RATE_LIMIT) {
                    const waitTime = NOMINATIM_RATE_LIMIT - timeSinceLastRequest;
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
                lastNominatimRequest = Date.now();
                
                // Nominatim requires identification - browsers block User-Agent header modification
                // So we use the email parameter which Nominatim accepts as an alternative
                // Also includes rate limiting (max 1 request per second)
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&email=archaeoastronomyireland@gmail.com`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    },
                    mode: 'cors'
                });
                
                if (!res.ok) {
                    throw new Error(`Nominatim API error: ${res.status} ${res.statusText}`);
                }
                
                const data = await res.json();
                if(data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    const displayName = data[0].display_name;
                    updateSearchMarker(lat, lon, displayName);
                    setStatus("Found: " + displayName.split(',')[0], "success");
                } else {
                    setStatus("Location not found.", "error");
                }
            } catch(e) {
                setStatus("Search error: " + e.message, "error");
            }
        }

        function updateSearchMarker(lat, lon, title) {
            if(searchMarker) map.removeLayer(searchMarker);
            map.setView([lat, lon], 12);
            searchMarker = L.marker([lat, lon]).addTo(map)
                .bindPopup(`<div style="font-size:11px"><b>Search Result</b><br>${title}</div>`).openPopup();
        }

        ui.searchBtn.addEventListener('click', performSearch);
        ui.searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') performSearch(); });

        // LOAD
        ui.btnLoad.addEventListener('click', async () => {
            resetQueryState(); let url = ui.capUrl.value.trim(); if(!url) return;
            if(location.protocol==='https:' && url.startsWith('http:')) url = url.replace('http:', 'https:');
            if ((url.includes('/MapServer') || url.includes('/FeatureServer')) && !url.includes('?') && !url.includes('f=')) url = url + "?f=json";
            else if ((url.includes('/MapServer') || url.includes('/FeatureServer')) && !url.includes('f=')) url = url + "&f=json";

            setStatus("Connecting...", "normal");
            try {
                const res = await fetch(url); const json = await res.json();
                if (json.error) throw new Error("ESRI Error: " + (json.error.message || json.error.code));
                availableLayers = [];
                if (json.layers) { availableLayers = json.layers.map(l => ({ name: l.id, title: l.name })); ui.baseUrl.value = url.split('?')[0]; } 
                else if (json.id !== undefined && json.name) { availableLayers = [{ name: json.id, title: json.name }]; ui.baseUrl.value = url.split('?')[0].replace(/\/\d+$/, ''); } 
                else { throw new Error("No layers found."); }
                
                detectedServiceType = 'ESRI';
                ui.layerSelect.innerHTML = '';
                availableLayers.forEach(l => { const o = document.createElement('option'); o.value=l.name; o.textContent=l.title; ui.layerSelect.appendChild(o); });
                setStatus(`Found ${availableLayers.length} layers.`, 'success');
                ui.layerSection.style.opacity = '1'; ui.layerSection.style.pointerEvents = 'auto';
                document.querySelector('#MS_layerNameDisplay span').textContent = ui.layerSelect.value;
            } catch(e) { setStatus("Error: " + e.message, 'error'); }
        });

        ui.layerSelect.addEventListener('change', () => { document.querySelector('#MS_layerNameDisplay span').textContent = ui.layerSelect.value; resetQueryState(); });

        // RENDER
        function renderGeoJSON(data, isAutoRefresh=false) {
            if(data && data.features && data.features.length > 0) {
                 // Helper function to escape HTML for popup content
                 function escapeHtml(text) {
                     const div = document.createElement('div');
                     div.textContent = text;
                     return div.innerHTML;
                 }
                 
                 // Helper function to create popup content with heading/value format
                 function createPopupContent(props) {
                     if (!props || Object.keys(props).length === 0) {
                         return '<div>No properties available</div>';
                     }
                     
                     let popupContent = '<div style="max-width: 300px; font-size: 12px;">';
                     let first = true;
                     
                     for (const key in props) {
                         if (props.hasOwnProperty(key)) {
                             if (!first) {
                                 popupContent += '<div style="margin-top: 8px;"></div>';
                             }
                             first = false;
                             
                             let value = props[key];
                             // Format value - handle numbers, strings, objects, etc.
                             if (value === null || value === undefined) {
                                 value = '';
                             } else if (typeof value === 'object') {
                                 // For objects, try to make them readable
                                 try {
                                     value = JSON.stringify(value, null, 2);
                                 } catch (e) {
                                     value = String(value);
                                 }
                             } else {
                                 value = String(value);
                             }
                             
                             // Heading on one line
                             popupContent += '<div style="font-weight: bold; color: #333; margin-bottom: 2px;">' + 
                                            escapeHtml(key) + ':</div>';
                             // Value on next line with wrapping
                             popupContent += '<div style="color: #666; word-wrap: break-word; white-space: pre-wrap; overflow-wrap: break-word;">' + 
                                            escapeHtml(value) + '</div>';
                         }
                     }
                     
                     popupContent += '</div>';
                     return popupContent;
                 }
                 
                 const gj = L.geoJSON(data, { 
                     pointToLayer: (f,l)=>L.circleMarker(l, {radius:3, fillColor:getFeatureColor(f), color:'#333', weight:1, opacity:0.9}),
                     style: (f) => ({ fillColor: getFeatureColor(f), color: "#333", weight: 1, opacity: 1, fillOpacity: 0.6 }),
                     onEachFeature: (f,l)=>l.bindPopup(createPopupContent(f.properties))
                 }).addTo(map);
                 
                 gj.isVectorLayer = true; 
                 activeTesterLayers.push(gj); 
                 
                 if (activeEsriWhere && !isAutoRefresh) map.fitBounds(gj.getBounds());
                 setStatus(`Loaded ${data.features.length} features.`, "success");
                 if(isHeatmapMode) updateHeatmapDisplay();
                 return gj;
            } else { setStatus("No features found in view.", "normal"); return null; }
        }

        // ADD
        ui.btnAdd.addEventListener('click', async () => {
            const layer = ui.layerSelect.value;
            currentActiveServiceUrl = ui.baseUrl.value; currentActiveLayerId = layer; currentLayerRef = null;
            if (detectedServiceType === 'ESRI') {
                // Allow loading at ANY zoom if query is active
                if (map.getZoom() <= 10 && !activeEsriWhere) { setStatus("Zoom in (>10) to load.", "normal"); return; }
                const data = await fetchEsriService(ui.baseUrl.value, layer);
                currentLayerRef = renderGeoJSON(data);
            }
        });

        // AUTO REFRESH
        map.on('moveend', async () => {
             const zoom = map.getZoom();
             // Only clear layers if zoomed out AND no query is active
             if (zoom <= 10 && !activeEsriWhere) {
                 const keptLayers = [];
                 activeTesterLayers.forEach(l => { if (l.isVectorLayer) { map.removeLayer(l); } else { keptLayers.push(l); } });
                 activeTesterLayers = keptLayers; currentLayerRef = null; setStatus("Zoom <= 10: Vectors hidden.", 'normal');
                 return;
             }
             
             // Allow refresh even if query active (to get more data as user pans), 
             // OR if zoom > 10 for general browsing
             if (detectedServiceType === 'ESRI' && currentActiveServiceUrl && (zoom > 10 || activeEsriWhere)) {
                 if (currentLayerRef && map.hasLayer(currentLayerRef)) { map.removeLayer(currentLayerRef); activeTesterLayers = activeTesterLayers.filter(l => l !== currentLayerRef); }
                 const data = await fetchEsriService(currentActiveServiceUrl, currentActiveLayerId);
                 currentLayerRef = renderGeoJSON(data, true);
             }
        });

        // HEATMAP
        function updateHeatmapDisplay() {
            // 1. Remove ANY existing heat layers
            activeHeatmapLayers.forEach(l => map.removeLayer(l)); 
            activeHeatmapLayers = [];

            if (isHeatmapMode) {
                // 2. Hide specific vector marker layers
                activeTesterLayers.forEach(l => map.removeLayer(l));
                
                // 3. Aggregate ALL points from ALL active layers into a single array
                // This fixes the issue where separate loads didn't "heat up" together
                let allPoints = [];
                activeTesterLayers.forEach(layer => {
                    if(layer.eachLayer) {
                        layer.eachLayer(f => { 
                            if(f.getLatLng) { 
                                const c = f.getLatLng(); 
                                // Intensity 0.2 means ~5 overlapping points = 1.0 (Maximum/Red)
                                // This provides a much smoother gradient than 0.5
                                allPoints.push([c.lat, c.lng, 0.2]); 
                            } 
                        });
                    }
                });

                // 4. Create ONE unified heat layer with BALANCED settings
                if(allPoints.length > 0) {
                    const heat = L.heatLayer(allPoints, {
                        radius: 25,    // Standard radius for cleaner clusters
                        blur: 15,      // Standard blur
                        max: 1.0,      // Max intensity threshold
                        minOpacity: 0.4 // Keep blue visible
                    }).addTo(map);
                    activeHeatmapLayers.push(heat);
                }
                
                setStatus(`Heatmap Mode (${allPoints.length} points).`, 'success');
            } else {
                // 5. Switch back to markers
                activeTesterLayers.forEach(l => l.addTo(map));
                setStatus("Markers Mode.", 'normal');
            }
        }
        if(ui.toggleHeatmap) ui.toggleHeatmap.addEventListener('change', (e) => { isHeatmapMode = e.target.checked; updateHeatmapDisplay(); });

        // QUERY
        queryUI.enable.addEventListener('change', async () => {
            if(queryUI.enable.checked) {
                queryUI.controls.classList.remove('hidden');
                const layerUrl = ui.baseUrl.value.endsWith(ui.layerSelect.value) ? ui.baseUrl.value : `${ui.baseUrl.value}/${ui.layerSelect.value}`;
                try {
                    const res = await fetch(`${layerUrl}?f=json`); const meta = await res.json();
                    queryUI.attrSelect.innerHTML = ''; availableFields = [];
                    if (meta.fields) {
                        meta.fields.forEach(f => {
                             fieldTypes[f.name] = f.type; availableFields.push({name: f.name, alias: f.alias || f.name});
                             const opt = document.createElement('option'); opt.value = f.name; opt.textContent = f.alias || f.name;
                             queryUI.attrSelect.appendChild(opt);
                        });
                    }
                } catch(e) {}
            } else { queryUI.controls.classList.add('hidden'); activeEsriWhere = null; }
        });

        queryUI.btnFetch.addEventListener('click', async () => {
            const f = queryUI.attrSelect.value;
            setStatus("Loading values...", "normal");
            const layerUrl = ui.baseUrl.value.endsWith(ui.layerSelect.value) ? ui.baseUrl.value : `${ui.baseUrl.value}/${ui.layerSelect.value}`;
            let queryUrl = `${layerUrl}/query?where=1=1&returnGeometry=false&outFields=${f}&returnDistinctValues=true&f=json`;
            try {
                let res = await fetch(queryUrl); let json = await res.json();
                if(json.error) {
                    queryUrl = `${layerUrl}/query?where=1=1&returnGeometry=false&outFields=${f}&resultRecordCount=500&f=json`;
                    res = await fetch(queryUrl); json = await res.json();
                }
                const vals = new Set(); if(json.features) json.features.forEach(x => vals.add(x.attributes[f]));
                
                queryUI.list.innerHTML = '';
                Array.from(vals).sort().forEach(v => {
                    if(v===null||v==="") return;
                    // Use prefixed classes here for dynamically created elements
                    const div = document.createElement('div'); div.className = 'ms-checkbox-item';
                    const row = document.createElement('div'); row.className = 'ms-checkbox-row w-100';
                    const input = document.createElement('input'); input.type='checkbox'; input.value=v;
                    const label = document.createElement('span'); label.className='text-xs w-100 truncate'; label.style.marginLeft="5px"; label.textContent=v;
                    
                    const filterDiv = document.createElement('div'); filterDiv.className = 'ms-item-search-controls'; filterDiv.style.display = 'none';
                    const fieldSel = document.createElement('select'); fieldSel.className = 'form-control input-sm mb-1'; fieldSel.style.fontSize="10px"; fieldSel.style.height="26px";
                    fieldSel.innerHTML = '<option value="">Select Field...</option>';
                    availableFields.forEach(fd => { const o = document.createElement('option'); o.value=fd.name; o.textContent=fd.alias; fieldSel.appendChild(o); });
                    const txtIn = document.createElement('input'); txtIn.type='text'; txtIn.className='form-control input-sm'; txtIn.style.fontSize="10px"; txtIn.style.height="26px"; txtIn.placeholder='Contains...';
                    filterDiv.appendChild(fieldSel); filterDiv.appendChild(txtIn);

                    input.addEventListener('change', e => { filterDiv.style.display = e.target.checked ? 'block' : 'none'; if(!e.target.checked) { txtIn.value=''; fieldSel.value=''; } });
                    row.appendChild(input); row.appendChild(label); div.appendChild(row); div.appendChild(filterDiv); queryUI.list.appendChild(div);
                });
                queryUI.container.classList.remove('hidden'); setStatus("Values loaded.", "success");
            } catch(e) { setStatus("Error: "+e.message, "error"); }
        });

        queryUI.btnRun.addEventListener('click', () => {
             const f = queryUI.attrSelect.value;
             // Ensure selector matches prefixed class
             const items = queryUI.list.querySelectorAll('.ms-checkbox-item');
             let conditions = [];
             items.forEach(item => {
                 const cb = item.querySelector('input[type="checkbox"]');
                 const txtIn = item.querySelector('input[type="text"]');
                 const fieldSel = item.querySelector('select');
                 if(cb && cb.checked) {
                     const val = cb.value;
                     const isString = !fieldTypes[f] || fieldTypes[f].includes('String') || fieldTypes[f].includes('Date') || fieldTypes[f].includes('GUID');
                     let clause = isString ? `${f} = '${val.replace(/'/g,"''")}'` : `${f} = ${val}`;
                     if(txtIn && fieldSel && txtIn.value.trim() && fieldSel.value) {
                         clause = `(${clause} AND ${fieldSel.value} LIKE '%${txtIn.value.replace(/'/g,"''")}%')`;
                     }
                     conditions.push(clause);
                 }
             });
             if(conditions.length) { activeEsriWhere = conditions.join(' OR '); activeColorAttribute = f; } else { activeEsriWhere = null; activeColorAttribute = null; }
             ui.btnAdd.click();
        });

        // EXPORT
        document.getElementById('MS_btnExport').addEventListener('click', () => {
            if(activeTesterLayers.length === 0) { setStatus("No markers to export.", "error"); return; }
            const collection = { type: "FeatureCollection", features: [] };
            activeTesterLayers.forEach(layer => { if(layer.toGeoJSON) { const json = layer.toGeoJSON(); if(json.features) collection.features.push(...json.features); else collection.features.push(json); } });
            if(collection.features.length === 0) { setStatus("No vector data found.", "error"); return; }
            const blob = new Blob([JSON.stringify(collection)], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = "map_markers.geojson"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
        });

        ui.btnClear.addEventListener('click', () => {
            activeTesterLayers.forEach(l => map.removeLayer(l)); activeTesterLayers=[];
            activeHeatmapLayers.forEach(l => map.removeLayer(l)); activeHeatmapLayers=[];
            if(searchMarker) { map.removeLayer(searchMarker); searchMarker = null; } // Clear search marker
            resetQueryState(); setStatus("Map Cleared.", 'normal');
        });

        window.MS_detectServiceType();
    });