L.Control.ZoomBox = L.Control.extend({
    _active: false,
    _map: null,
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    options: {
        position: 'topleft',
        addToZoomControl: false,
        content: "",
        className: "leaflet-zoom-box-icon",
        modal: false,
        title: "Zoom to specific area"
    },
    onAdd: function (map) {
        this._map = map;
        var separate_container = !map.zoomControl || !this.options.addToZoomControl;
        if (!separate_container) {
            this._container = map.zoomControl._container;
        } else {
            this._container = L.DomUtil.create('div', 'leaflet-zoom-box-control leaflet-bar');
            this._container.title = this.options.title;
        }
        this._link = L.DomUtil.create('a', this.options.className, this._container);
        if (!separate_container){
            this._link.title = this.options.title;
        }
        this._link.innerHTML = this.options.content || "";
        this._link.href = "#";

        // Store original boxZoom handler for conditional override
        // When control is active: override to work without Shift
        // When control is inactive: use original handler (requires Shift)
        this._origMouseDown = map.boxZoom._onMouseDown;

        map.on('zoomend', function(){
            if (map.getZoom() == map.getMaxZoom()){
                L.DomUtil.addClass(this._link, 'leaflet-disabled');
            }
            else {
                L.DomUtil.removeClass(this._link, 'leaflet-disabled');
            }
        }, this);
        if (!this.options.modal) {
            map.on('boxzoomend', this.deactivate, this);
        }

        L.DomEvent
            .on(this._link, 'dblclick', L.DomEvent.stop)
            .on(this._link, 'click', L.DomEvent.stop)
            .on(this._link, 'mousedown', L.DomEvent.stopPropagation)
            .on(this._link, 'click', function(){
                this._active = !this._active;
                if (this._active && map.getZoom() != map.getMaxZoom()){
                    this.activate();
                }
                else {
                    this.deactivate();
                }
            }, this);
        return this._container;
    },
    activate: function() {
        L.DomUtil.addClass(this._link, 'active');
        this._map.dragging.disable();
        // Ensure boxZoom hooks are added
        if (!this._map.boxZoom._enabled) {
            this._map.boxZoom.addHooks();
        }
        // Override _onMouseDown to inject shiftKey: true so zoom box works without Shift
        var map = this._map;
        var origHandler = this._origMouseDown;
        this._map.boxZoom._onMouseDown = function(e){
            if (e.button === 2) return;  // prevent right-click from triggering zoom box
            origHandler.call(map.boxZoom, {
                clientX: e.clientX,
                clientY: e.clientY,
                which: 1,
                shiftKey: true
            });
        };
        L.DomUtil.addClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
    },
    deactivate: function() {
        L.DomUtil.removeClass(this._link, 'active');
        this._map.dragging.enable();
        // Restore original handler so native Shift+drag zoom works
        this._map.boxZoom._onMouseDown = this._origMouseDown;
        L.DomUtil.removeClass(this._map.getContainer(), 'leaflet-zoom-box-crosshair');
        this._active = false;
    }
});

L.control.zoomBox = function (options) {
  return new L.Control.ZoomBox(options);
};
