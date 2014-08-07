var trackingPoints = [];

function findFollowingPointOnLine(coordinates) {
    var lat0 = coordinates[0][0];
    var lon0 = coordinates[0][1];
    var lat1 = coordinates[1][0];
    var lon1 = coordinates[1][1];
    var point0 = new LatLon(lat0, lon0);
    var point1 = new LatLon(lat1, lon1);

    var midpoint;
    if (point0.distanceTo(point1) * 1000 > 5) {
        midpoint = point0.midpointTo(point1)
        findFollowingPointOnLine(new Array([point0.lat, point0.lon], [midpoint.lat, midpoint.lon]));
    } else {
        trackingPoints.push(coordinates[1]);
    }
}

function findAllPoints(coordinates) {
    trackingPoints.push(coordinates[0]);
    findFollowingPointOnLine(coordinates);

    for (var i = 1; i < coordinates.length; i++) {
        var point0 = new LatLon(trackingPoints[trackingPoints.length - 1][0],
            trackingPoints[trackingPoints.length - 1][1]);
        var lat1 = coordinates[i][0];
        var lon1 = coordinates[i][1];
        var point1 = new LatLon(lat1, lon1);

        while ((point0.distanceTo(point1) * 1000) > 5) {
            point0 = new LatLon(trackingPoints[trackingPoints.length - 1][0],
                trackingPoints[trackingPoints.length - 1][1]);
            findFollowingPointOnLine(new Array(new Array(point0.lat, point0.lon), new Array(lat1, lon1)));
        }
    }
    writeToGPX("Computer Generated Trace", trackingPoints);
}

function writeToGPX(tracename, trace) {
    var contents = "";
    var header = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><gpx xmlns:xsi=\"http:\/\/www.w3.org\/2001\/XMLSchema-instance\" xmlns:schemaLocation=\"http:\/\/www.topografix.com\/GPX\/1\/0 http:\/\/www.topografix.com\/GPX\/1\/0\/gpx.xsd\" xmlns=\"http:\/\/www.topografix.com\/GPX\/1\/0\" version=\"1.0\" creator=\"mapzen - start where you are http:\/\/mapzen.com\">\r\n<trk>\r\n<name>";
    var footer = "<\/trkseg>\r\n<\/trk>\r\n<\/gpx>";

    contents = header + tracename + "<\/name>" + "<trkseg>"

    console.log("length");
    console.log(trace.length);
    trace.forEach(function(entry) {
        contents += createGPXElement(entry[0], entry[1]);
    });
    contents += footer;

    postMessage(contents);
}

function createGPXElement(lat, lon) {
    return "<trkpt lat=\"" + lat + "\" lon=\"" + lon + "\">\r\n<ele>0.0<\/ele>\r\n<time>2014-07-25T13:31:57-04:00<\/time>\r\n<\/trkpt>\r\n"
}

Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
};

Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
};


self.addEventListener('message', function(e) {
    findAllPoints(e.data);
}, false);


// Following code from http://www.movable-type.co.uk/scripts/latlong.html
function LatLon(lat, lon, height, radius) {
    if (!(this instanceof LatLon)) return new LatLon(lat, lon, height, radius);

    if (typeof height == 'undefined') height = 0;
    if (typeof radius == 'undefined') radius = 6371;
    radius = Math.min(Math.max(radius, 6353), 6384);

    this.lat = Number(lat);
    this.lon = Number(lon);
    this.height = Number(height);
    this.radius = Number(radius);
}

LatLon.prototype.distanceTo = function(point) {
    var R = this.radius;
    var phi1 = Math.radians(this.lat),
        lambda1 = Math.radians(this.lon);
    var phi2 = Math.radians(point.lat),
        lambda2 = Math.radians(point.lon);
    var deltaphi = phi2 - phi1;
    var deltalambda = lambda2 - lambda1;

    var a = Math.sin(deltaphi / 2) * Math.sin(deltaphi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltalambda / 2) * Math.sin(deltalambda / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
}


LatLon.prototype.midpointTo = function(point) {
    var phi1 = Math.radians(this.lat),
        lambda1 = Math.radians(this.lon);
    var phi2 = Math.radians(point.lat);
    var deltalambda = Math.radians((point.lon - this.lon));

    var Bx = Math.cos(phi2) * Math.cos(deltalambda);
    var By = Math.cos(phi2) * Math.sin(deltalambda);

    var phi3 = Math.atan2(Math.sin(phi1) + Math.sin(phi2),
        Math.sqrt((Math.cos(phi1) + Bx) * (Math.cos(phi1) + Bx) + By * By));
    var lambda3 = lambda1 + Math.atan2(By, Math.cos(phi1) + Bx);
    lambda3 = (lambda3 + 3 * Math.PI) % (2 * Math.PI) - Math.PI; // normalise to -180..+180º

    return new LatLon(Math.degrees(phi3), Math.degrees(lambda3));
}