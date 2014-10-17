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

  var ghostLocation;

  var ghostIcon = L.icon({
      iconUrl: 'js/images/slimer.png',
      shadowUrl: 'js/images/marker-shadow.png',

      iconSize:     [38, 35], // size of the icon
      shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   [22, 34], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  var walkIcon = L.icon({
      iconUrl: 'js/images/egon.png',
      shadowUrl: 'js/images/marker-shadow.png',

      iconSize:     [38, 35], // size of the icon
      shadowSize:   [50, 64], // size of the shadow
      iconAnchor:   [22, 34], // point of the icon which will correspond to marker's location
      shadowAnchor: [4, 62],  // the same for the shadow
      popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
  });

  L.tileLayer('//{s}.tiles.mapbox.com/v3/randyme.jpnaac3a/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18
  }).addTo(map);
  new L.Control.Zoom({ position: 'topright' }).addTo(map);
  L.control.locate({ position: 'topright', keepCurrentZoomLevel: true }).addTo(map);
  L.control.locations({ position: 'topright', keepCurrentZoomLevel: true, ghostIcon: ghostIcon }).addTo(map);

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
    remove_markers();
    ghostbusters = 0;
  };

  $rootScope.$on( 'map.setView', function( ev, geo, zoom ){
    map.setView( geo, zoom || 8 );
  });

  $rootScope.$on( 'map.dropMarker', function( ev, geo, text, icon_name, color ){
    var marker = new L.marker(geo, {icon: walkIcon}).addTo(map);
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
    $rootScope.$emit( 'map.dropMarker', [geo.lat, geo.lon], '', 'search');
    ghostbusters++;
    L.Routing.control({
      waypoints: [
        L.latLng(ghostLocation.lat, ghostLocation.lon),
        L.latLng(geo.lat, geo.lon)
      ],
      geocoder: null,
      transitmode: 'foot'
    }).addTo(map);
  
  });

  $(document).on('route:time_distance', function(e, td){
    var time = td.time,
        distance = td.distance;
    console.log(time) //not sure what to do with this right now
  })

  $(document).on('ghost-alert', function(e, geo) {
    ghostLocation = geo;
    resetGhostBusters();
  });

  // faking a search when query params are present
  var hash_query  = hash_params ? hash_params.q : false;
  if (hash_query){
    $scope.keyPressed({ 'which': 13});
  }
    
})
