/*
Copyright (c) 2014 Harish Krishna

This plugin adds a bunch of custom locations to your leaflet map as a drop down menu L.Control
(Useful, if you want to jump from one location to another to lets say test a geocoder within map bounds) 
*/
L.Control.Busters = L.Control.extend({
    options: {
        position: 'topleft',
        icon: 'glyphicon-th-list glyphicon',
        strings: {
            title: "Ghost Buster"
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

    trigger_ghost_buster: function(mode) {
        $(document).trigger('ghost-buster-alert', [mode]);
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div',
            'leaflet-control-busters leaflet-bar leaflet-control');

        var self = this;
        
        this._layer = new L.LayerGroup();
        this._layer.addTo(map);

        this._container = container;

        // ghost busters
        for (key in this.options.ghostbuster_icons) {
            var icon = this.options.ghostbuster_icons[key];
            this._transit_link = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single', container);
            this._transit_link.href = '#';
            this._transit_link.title = this.options.strings.title + (key === 'foot' ? ' on ' : ' on a ') + key;
            this._transit_link.setAttribute('class', key === 'foot' ? 'busting' : '');
            this._transit_link.setAttribute('data-ghost-buster-mode', key)
            this._transit_icon = L.DomUtil.create('img', 'ghosts', this._transit_link);
            this._transit_icon.src = icon;
            L.DomEvent
            .on(this._transit_link, 'click', L.DomEvent.stopPropagation)
            .on(this._transit_link, 'click', L.DomEvent.preventDefault)
            .on(this._transit_link, 'click', function() {
                var is_busting = this.getAttribute('class') === 'busting';
                if (!is_busting) {
                    $('.busting').removeClass('busting');
                    this.setAttribute('class', 'busting');
                    self.trigger_ghost_buster(this.getAttribute('data-ghost-buster-mode'));
                }
                
            })
            .on(this._transit_link, 'dblclick', L.DomEvent.stopPropagation);
        }
        // default ghost buster on foot
        self.trigger_ghost_buster('foot');

        return container;
    }
});

L.control.busters = function (options) {
    return new L.Control.Busters(options);
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