// GOOGLE ANALYTICS
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-47035811-1', 'mapzen.com');
ga('send', 'pageview');

var map, activeResult, browser_lat, browser_lng;
var markers = [];
var searchResults = [];

function setCoords() {
  var center = map.getCenter();
  $('#lon').val(center.lng);
  $('#lat').val(center.lat);
  $('#sort_ll').val(center.lng + ',' + center.lat);
  var bounds = map.getBounds();
  var ne = bounds._northEast.lng+','+bounds._northEast.lat;
  var sw = bounds._southWest.lng+','+bounds._southWest.lat;
  $('#filter_bb').val(ne+','+sw);
}
function remove_markers(){
  for (i=0; i<markers.length; i++) {
    map.removeLayer(markers[i]);
  }
  markers = [];
}
function create_marker(obj) {
  var lonlat = [obj.geometry.coordinates[1], obj.geometry.coordinates[0]];
  var type = obj.properties.type;
  marker = L.marker(lonlat);
  marker.bindPopup(getPopupText(obj));
  markers.push(marker);
  map.addLayer(marker);
  map.panTo(lonlat);
  marker.openPopup();
  if (markers.length==2) {$(document).trigger( "routing:ready", [ markers ] );}
}

function getPopupText(obj) {
  var text = [];
  if (obj.properties.name != null) { text.push('<b>Name:</b> '+obj.properties.name) }
  if (obj.properties.neighborhood_name != null) { text.push('<b>Neighborhood:</b> '+obj.properties.neighborhood_name) }
  if (obj.properties.locality_name != null) { text.push('<b>Locality:</b> '+obj.properties.locality_name) }
  if (obj.properties.local_admin_name != null) { text.push('<b>Local admin:</b> '+obj.properties.local_admin_name) }
  if (obj.properties.admin2_name != null) { text.push('<b>Admin2:</b> '+obj.properties.admin2_name) }
  if (obj.properties.admin1_name != null) { text.push('<b>Admin1:</b> '+obj.properties.admin1_name) }
  if (obj.properties.admin1_abbr != null) { text.push('<b>Admin1 abbr:</b> '+obj.properties.admin1_abbr) }
  if (obj.properties.country_name != null) { text.push('<b>Country:</b> '+obj.properties.country_name) }
  if (obj.properties.country_code != null) { text.push('<b>Country code:</b> '+obj.properties.country_code) }
  return '<p>' + text.join('<br/>') + '</p>';
}

function getDescription(type) {
  if (type=='poi' || type=='address' || type=='street') {
    return "OSM: " + type;
  }
  else if (type == 'geoname') {
    return "Geoname";
  }
  else {
    return "Quattroshapes: " + type.replace('_', ' ');
  }
}

function getAdmin(obj) {
  var admin = [];
  if (obj.neighborhood_name!=null) { admin.push(obj.neighborhood_name) }
  if (obj.local_admin_name!=null) { admin.push(obj.local_admin_name) }
  else if (obj.locality_name!=null) { admin.push(obj.locality_name) }
  else if (obj.admin2_name!=null) { admin.push(obj.admin2_name) }
  if (obj.admin1_abbr!=null) { admin.push(obj.admin1_abbr) }
  return admin.join(", ");
}

PRECISION = 6;
//decode compressed route geometry
var _decode_geometry= function(encoded, precision) {
  precision = Math.pow(10, -precision);
  var len = encoded.length, index=0, lat=0, lng = 0, array = [];
  while (index < len) {
    var b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    //array.push( {lat: lat * precision, lng: lng * precision} );
    array.push( [lat * precision, lng * precision] );
  }
  return array;
}

$(function() {
  // MAP SETUP
  map = L.mapbox.map('map', 'randyme.gajlngfe').setView([40.73035,-73.98639], 15);
  map.on('move', setCoords);

  // SEARCH SETUP
  if (location.search != '') {
    var $_GET = {};
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
      function decode(s) {
        return decodeURIComponent(s.split("+").join(" "));
      }
      $_GET[decode(arguments[1])] = decode(arguments[2]);
    });
    var putMarkerOnMap = function(query) {
      var query_string = '/search?query=' + query;
      if ($_GET.sort=='on') {
        query_string += '&center='+$_GET.sort_ll;
      }
      if ($_GET.filter=='on') {
        query_string += '&viewbox='+$_GET.filter_bb;
      }
      $.ajax({
        type: 'GET',
        dataType: "json",
        url: 'http://pelias.test.mapzen.com' + query_string,
        success: function(geoJson) {
          create_marker(geoJson.features[0]);
        }
      });
    }
    remove_markers();
    if ($_GET.start){
      $('#start').val($_GET.start);
      putMarkerOnMap($_GET.start)
    } 
    if ($_GET.end) {
      $('#end').val($_GET.end);
      putMarkerOnMap($_GET.end)
    }
    var create_route = function(points_to_plot) {
      var plottedPolyline = L.Polyline.Plotter(points_to_plot,{
          weight: 5
      }).addTo(map);
      var all_points = [];
      all_points.push(markers[0]._latlng);
      all_points.push(points_to_plot);
      all_points.push(markers[1]._latlng);
      map.fitBounds(all_points);
    }
    $(document).on("routing:ready", function(event,mks){
      // Routing
      var vroute_query_string = "loc="+mks[0]._latlng.lat+"%2C"+mks[0]._latlng.lng+"&loc="+mks[1]._latlng.lat+"%2C"+mks[1]._latlng.lng+"&instructions=true&z=16";
      $.ajax({
        type:'GET',
        dataType:"json",
        url: 'http://api-osrm-test.mapzen.com/'+ $_GET.transitMode +'/viaroute?' + vroute_query_string,
        success: function(data) {
          var geometry_points = _decode_geometry(data.route_geometry, PRECISION );
          create_route(geometry_points)
        }
      })
    });
  }
  else {
    // CURRENT LOCATION
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          map.setView([position.coords.latitude, position.coords.longitude])
        },
        function(msg) {
          console.log(msg);
        }
      );
    }
  }
  $('.typeahead').typeahead([{
    name: 'suggestions',
    remote: {
      url: 'http://api-pelias-test.mapzen.com/suggest?size=10&query=%QUERY',
      filter: function (geojsonResponse) {
        var arr = [];
        var features = geojsonResponse.features;
        for (key in geojsonResponse.features) {
          if (geojsonResponse.features.hasOwnProperty(key)) {
            obj = geojsonResponse.features[key];
            arr.push({
              value: obj.properties.name,
              desc: getDescription(obj.properties.type),
              type: obj.properties.type,
              geoJson: obj
            });
          }
        }
        return arr;
      }
    },
    template: [
      '<p class="result-text">{{value}}</p>',
      '<p class="result-desc">{{desc}}</p>'
    ].join(''),
    limit: 10,
    engine: Hogan
  }]).bind('typeahead:selected', function (obj, datum) {
    $('#search-results').empty();
    $('#search-results').append(['<a href="#" class="list-group-item">',
      '<h4 class="list-group-item-heading">'+datum.value+'</h4><p class="list-group-item-text">',
      getDescription(datum.geoJson.properties.type)+'</p></a>'
    ].join(''));
    create_marker(datum.geoJson);
  });
  if ($_GET!=null && $_GET.transitMode=='car') {
    $('#car').prop('checked', true);
  }
  if ($_GET!=null && $_GET.transitMode=='bicycle') {
    $('#bicycle').prop('checked', true);
  }
  if ($_GET!=null && $_GET.transitMode=='foot') {
    $('#foot').prop('checked', true);
  }
});
