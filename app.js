var express = require('express');
var app = express();
const path = require('path');  
let crdt = require('./CRDT');
let CRDT = crdt.CRDT;
let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;
var ExpressPeerServer = require('peer').ExpressPeerServer;

app.use(express.static(__dirname)); 

app.get('/', function (req, res) {
    res.sendFile('/index.html', { root: __dirname })
    //crdtController = new CrdtController();
});

app.get('/shared', function (req, res) {
    // console.log(req.query.val);
    //let crdt1 = new CRDT(req.query.index, req.query.val);
    //console.log(req.query.id);
    res.sendFile('/index.html', { root: __dirname })
    
});

app.get('/listCRDT', function (req, res) {
    crdtController.listCrdtMap();
});

var server = app.listen(3000, function () { });

var options = {
    debug: true
}

var peerserver = ExpressPeerServer(server, options);

app.use('/api', peerserver);