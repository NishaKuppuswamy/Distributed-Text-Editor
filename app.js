var express = require('express');
var app = express();
const path = require('path');  
var ExpressPeerServer = require('peer').ExpressPeerServer;

app.use(express.static(__dirname)); 

app.get('/', function (req, res) {
    res.sendFile('/index.html', { root: __dirname })
});

app.get('/shared', function (req, res) {
    //console.log(req.query.id);
    res.sendFile('/index.html', { root: __dirname })    
});

app.get('/error', function(req, res){
    res.redirect('/error.html');
});

var server = app.listen(3000, function () { });

var options = {
    debug: true
}

var peerserver = ExpressPeerServer(server, options);

app.use('/api', peerserver);