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
        this._icon.src = '../js/images/slimer.png';
        this._list = L.DomUtil.create('ul', 'locations shortcuts hidden', container);
        
        var markers = [];

        var remove_markers = function(){
          for (i=0; i<markers.length; i++) {
            map.removeLayer(markers[i]);
          }
          markers = [];
        }
        
        var ghostIcon = this.options.ghostIcon;

        for (var i=0; i<this.options.locations.length; i++) {
            var $this = this.options.locations[i];
            var li = L.DomUtil.create('li', '', this._list);
            var link = L.DomUtil.create('a', '', li);
            link.setAttribute('data-loc', $this.loc);
            link.setAttribute('data-zoom', $this.zoom);
            link.innerHTML = $this.name;
            L.DomEvent
                .on(link, 'click', L.DomEvent.stopPropagation)
                .on(link, 'click', L.DomEvent.preventDefault)
                .on(link, 'click', function() {
                    remove_markers();
                    var loc = this.getAttribute('data-loc').split(",");
                    var zoom = this.getAttribute('data-zoom');
                    var geo = [Number(loc[0]).toFixed(7), Number(loc[1]).toFixed(7)].reverse();
                    map.setView(geo, zoom);
                    var marker = new L.marker(geo, {icon: ghostIcon}).addTo(map);
                    map.addLayer(marker);
                    markers.push(marker);
                    $(document).trigger('ghost-alert', {lat: geo[0], lon:geo[1]});
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