var http = require('http')
var express = require("express");

var app = express();
var port = 1337;

app.use(express.static(__dirname));

app.get("/", function(req, res) {
    res.sendfile('index.html');
});

app.listen(port, function() {
    console.log("Listening on port " + port);
    console.log("Available at " + "http://127.0.0.1:" + port);
});