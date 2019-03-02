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
    res.render('index.html', { siteID: 'Hello World!' });
    //crdtController = new CrdtController();
});

app.get('/createSiteId', function (req, res) {
    //crdtController.siteID = req.query.siteId;
});

app.get('/updateCrdt', function (req, res) {
    // console.log(req.query.val);
    //let crdt1 = new CRDT(req.query.index, req.query.val);
    console.log(req.query.index);
    //crdtController.processCrdt(req.query.index, req.query.val, req.query.action);
    
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