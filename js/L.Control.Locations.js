/*
Copyright (c) 2014 Harish Krishna

This plugin adds a bunch of custom locations to your leaflet map as a drop down menu L.Control
(Useful, if you want to jump from one location to another to lets say test a geocoder within map bounds) 
*/
L.Control.Locations = L.Control.extend({
    options: {
        position: 'topleft',
        icon: 'glyphicon-th-list glyphicon',
        locations: [
            {'loc': [-73.98223400115967,40.75314146550602], 'zoom': 12, 'name': 'NYPL'},
            {'loc': [-73.9818263053894,40.76812671399359], 'zoom': 12, 'name': 'STAY PUFT'},
            {'loc': [-73.9791065454483,40.77227875282056], 'zoom': 12, 'name': 'ZUUL'},
            {'loc': [-74.00659918785095,40.71963998768315], 'zoom': 12, 'name': 'Firehouse'}
        ],
        strings: {
            title: "Show me other locations"
        }
    },

    initialize: function (options) {
        for (var i in options) {
            if (typeof this.options[i] === 'object') {
                L.extend(this.options[i], options[i]);
            } else {
                this.options[i] = options[i];
            }
        }
        this.ghost_markers = {};
        this.ghost_locations = {};
        
        var that = this;
        this.options.locations.forEach( function(gLoc) {
            var geo = [Number(gLoc.loc[0]).toFixed(7), Number(gLoc.loc[1]).toFixed(7)].reverse();
            var marker = new L.marker(geo, {icon: that.options.ghostIcon}).bindPopup(gLoc.name);
            that.options.map.addLayer(marker);
            that.ghost_markers[gLoc.name] = marker;
            that.ghost_locations[gLoc.name] = {lat: geo[0], lon: geo[1]};  
        });
        window.setTimeout(function(){
            that.trigger_spooky();    
        }, 1000);
        
    },

    trigger_spooky: function() {
        var locs  = [];
        var glocations = this.ghost_locations;
        for (loc in glocations) {
            locs.push({lat: glocations[loc].lat, lon: glocations[loc].lon })
        }
        $(document).trigger('ghost-alert', [locs]);
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div',
            'leaflet-control-locations leaflet-bar leaflet-control');

        var self = this;
        
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);

        this._container = container;

        this._link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
        this._link.href = '#';
        this._link.title = this.options.strings.title;
        this._icon = L.DomUtil.create('img', 'ghosts', this._link);
        this._icon.src = './js/images/slimer.png';
        this._list = L.DomUtil.create('ul', 'locations shortcuts hidden', container);
        
        var markers = [];

        var remove_marker = function(s, name){
          s.ghost_markers[name].setOpacity(0);
          delete s.ghost_locations[name];
          s.trigger_spooky();
        };

        var add_marker = function(s, geo, name){
          s.ghost_markers[name].setOpacity(1);
          s.ghost_locations[name] = {lat: geo[1], lon: geo[0]};
          s.trigger_spooky();
        };
        
        var ghostIcon = this.options.ghostIcon;

        for (var i=0; i<this.options.locations.length; i++) {
            var $this = this.options.locations[i];
            var li = L.DomUtil.create('li', '', this._list);
            var link = L.DomUtil.create('a', '', li);
            link.setAttribute('data-loc', $this.loc);
            link.setAttribute('class', 'haunting');
            link.setAttribute('data-name', $this.name);
            link.setAttribute('data-zoom', $this.zoom);
            link.setAttribute('data-haunting', 'true');
            link.innerHTML = $this.name;
            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', function() {
                    var loc = this.getAttribute('data-loc').split(",");
                    var geo = [Number(loc[0]).toFixed(7), Number(loc[1]).toFixed(7)].reverse();
                    var haunting = this.getAttribute('data-haunting') === 'true';
                    var name= this.getAttribute('data-name');

                    if (haunting) {
                        remove_marker(self, name);
                        this.setAttribute('class', '');
                        this.setAttribute('data-haunting', '');
                    } else {
                        add_marker(self, loc, name);
                        this.setAttribute('class', 'haunting');
                        this.setAttribute('data-haunting', 'true');
                    }
                })
        }

        L.DomEvent
            .on(this._link, 'click', L.DomEvent.stopPropagation)
            .on(this._link, 'click', L.DomEvent.preventDefault)
            .on(this._link, 'click', function() {
                if (!self._show) {
                    L.DomUtil.addClasses(self._container, "expanded");
                    L.DomUtil.removeClasses(self._list, "hidden");
                    self._show = true;  
                } else {
                    L.DomUtil.removeClasses(self._container, "expanded");
                    L.DomUtil.addClasses(self._list, "hidden");
                    self._show = false;
                }
                
            })
            .on(this._link, 'dblclick', L.DomEvent.stopPropagation);

        return container;
    }
});

L.control.locations = function (options) {
    return new L.Control.Locations(options);
};

(function(){
  // code borrowed from https://github.com/domoritz/leaflet-locatecontrol (thank you Dominik Moritz)
  // leaflet.js raises bug when trying to addClass / removeClass multiple classes at once
  // Let's create a wrapper on it which fixes it.
  var LDomUtilApplyClassesMethod = function(method, element, classNames) {
    classNames = classNames.split(' ');
    classNames.forEach(function(className) {
        L.DomUtil[method].call(this, element, className);
    });
  };

  L.DomUtil.addClasses = function(el, names) { LDomUtilApplyClassesMethod('addClass', el, names); };
  L.DomUtil.removeClasses = function(el, names) { LDomUtilApplyClassesMethod('removeClass', el, names); };
})();