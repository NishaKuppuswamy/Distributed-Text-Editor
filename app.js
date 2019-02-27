var express = require('express');
var app = express();
var path = require('path');
let crdt = require('./CRDT');
let CRDT = crdt.CRDT;
let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
    crdtController = new CrdtController();
});

app.get('/updateCrdt', function (req, res) {
   // console.log(req.query.val);
    let crdt1 = new CRDT(req.query.index, req.query.val);
    crdtController.processCrdt(crdt1)
    
});

app.get('/listCRDT', function (req, res) {
    crdtController.listCrdtMap();
});
var server = app.listen(3000, function () { });