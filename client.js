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
};

window.LogData =function(pos, value, action, connections){
  if(action == "insert")
  crdtController.crdt.handleLocalInsert(value, pos, connections);
  if(action == "remove")
  crdtController.crdt.handleLocalDelete(pos);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.fetchVersion =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.LogRemoteInsertData =function(char, siteId){
  crdtController.crdt.handleRemoteInsert(char);
};

window.SendResult = function(result) {
	r = JSON.parse(result);
};
window.SendConnections = function(connections) {
	var conn;
	for(let c of connections) { //find connection object between initiator and the peer that has requested the connections
		if(c.id == r.id)
			conn = c.conn;
	}
	conn.send(JSON.stringify(r)+" break "+stringify(connections)); //use the found connection object to send connections to requested peer 
};


window.CallBroadcast = function(char, connections) {
	crdtController.crdt.broadcastNew(char, parse(connections));
};
