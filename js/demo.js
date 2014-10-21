var app = angular.module('routing', []);
var hash_params = L.Hash.parseHash(location.hash);

app.run(function($rootScope) {
  var hash_loc = hash_params ? hash_params : {'center': {'lat': 40.7259, 'lng': -73.9805}, 'zoom': 12};
  $rootScope.geobase = {
    'zoom': hash_loc.zoom,
    'lat' : hash_loc.center.lat,
    'lon' : hash_loc.center.lng
  }
  $(document).on('new-location', function(e){
    $rootScope.geobase = {
      'zoom': e.zoom,
      'lat' : e.lat,
      'lon' : e.lon
    };
  })
});

app.controller('RouteController', function($scope, $rootScope, $sce, $http) {
    // --------- suggestions ---------
  var map = L.map('map', {
      zoom: $rootScope.geobase.zoom,
      zoomControl: false,
      center: [$rootScope.geobase.lat, $rootScope.geobase.lon]
  });

  var ghostLocations = [];
  var ghostBusterMode = 'foot';

  var ghostIcon = L.icon({
      iconUrl: 'js/images/slimer-1.png',
      shadowUrl: 'js/images/marker-shadow.png',

      iconSize:     [38, 35], // size of the icon
      shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   [22, 34], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  var ghostbuster_icons = {
    'foot': 'js/images/egon-1.png',
    'bicycle': 'js/images/bike-01.png',
    'car' : 'js/images/ecto1-1.png'
  };

  var getIcon = function(icon){
    return L.icon({
      iconUrl: ghostbuster_icons[icon],
      shadowUrl: 'js/images/marker-shadow.png',

      iconSize:     [38, 35], // size of the icon
      shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   [22, 34], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
  };

  L.tileLayer('//{s}.tiles.mapbox.com/v3/randyme.jpnaac3a/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18
  }).addTo(map);
  new L.Control.Zoom({ position: 'topright' }).addTo(map);
  L.control.locate({ position: 'topright', keepCurrentZoomLevel: true }).addTo(map);
  L.control.busters({ position: 'topright', keepCurrentZoomLevel: true, map:map, ghostbuster_icons: ghostbuster_icons }).addTo(map);
  L.control.locations({ position: 'topright', keepCurrentZoomLevel: true, ghostIcon: ghostIcon, map: map }).addTo(map);
  

  // Set up the hash
  var hash = new L.Hash(map);
  var markers = [];
  var remove_markers = function(){
    for (i=0; i<markers.length; i++) {
      map.removeLayer(markers[i]);
    }
    markers = [];
  };

  // Number of ghostbusters
  var ghostbusters = 0;
  
  var resetGhostBusters = function() {
    $('svg').html('');
    $('.leaflet-routing-container.leaflet-control').remove();
    remove_markers();
    ghostbusters = 0;
  };

  $rootScope.$on( 'map.setView', function( ev, geo, zoom ){
    map.setView( geo, zoom || 8 );
  });

  $rootScope.$on( 'map.dropMarker', function( ev, geo, mode ){
    var marker = new L.marker(geo, {icon: getIcon(mode || 'foot')});
    map.addLayer(marker);
    markers.push(marker);
    // marker.openPopup();
  });
  
  map.on('click', function(e) {
    var geo = {
      'lat': e.latlng.lat,
      'lon': e.latlng.lng
    };
    if (ghostbusters > 0) {
      resetGhostBusters();
    }
    
    if (ghostLocations) {
      var waypoints = [L.latLng(geo.lat, geo.lon)];
      ghostLocations.forEach(function(gLoc) {
        waypoints.push(L.latLng(gLoc.lat, gLoc.lon));
      });
      $rootScope.$emit( 'map.dropMarker', [geo.lat, geo.lon], ghostBusterMode);
      ghostbusters++;
      L.Routing.control({
        waypoints: waypoints,
        geocoder: null,
        transitmode: ghostBusterMode
      }).addTo(map);
    }
  
  });

  $(document).on('ghost-alert', function(e, geo) {
    ghostLocations = geo;
    resetGhostBusters();
  });

  $(document).on('ghost-buster-alert', function(e, mode) {
    ghostBusterMode = mode;
    resetGhostBusters();
  });

  $(document).on('route:time_distance', function(e, td){
    var time = td.time,
        distance = td.distance;
    console.log(time) //not sure what to do with this right now
  });
    
})
