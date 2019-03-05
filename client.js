let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
const {parse, stringify} = require('flatted/cjs');
var crdtController;
var r;
window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.siteID;
};

window.createController =function(siteID){
  console.log("created controller");
  crdtController = new CrdtController(siteID);
  //crdtController.siteID = siteID;
};

window.LogData =function(pos, value, action, connections){
  if(action == "+input")
  crdtController.crdt.handleLocalInsert(value, pos, connections);
  if(action == "+delete")
  crdtController.crdt.handleLocalDelete(pos);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct){
  crdtController.crdt.struct = struct;
};

window.LogRemoteInsertData =function(char, siteId){
  crdtController.crdt.handleRemoteInsert(char);
};

window.SendResult = function(result) {
	r = JSON.parse(result);
};
window.SendConnections = function(connections) {
	var conn;
	for(let c of connections) {
		if(c.id == r.id)
			conn = c.conn;
	}
	conn.send(JSON.stringify(r)+" break "+stringify(connections));
};


window.CallBroadcast = function(char, connections) {
	console.log("CALIING FROM CLIENT "+parse(connections)[0].conn);
	crdtController.crdt.broadcast(char, parse(connections));
};
