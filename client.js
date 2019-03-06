let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
let list = require('./versionList');
let VersionList = list.VersionList;
let ver = require('./version');
let Version = ver.Version;
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
  crdtController.crdt.handleLocalDelete(pos, connections);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.fetchVersion =function(){
  return crdtController.crdt.list;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.syncVersion =function(list){
  console.log("check list");
  console.log(list);
  const versions = list.versions.map(ver => {
    let version = new Version(ver.siteId);
    version.counter = ver.counter;
    ver.unHandled.forEach(ex => version.unHandled.push(ex));
    return version;
  });
  versions.forEach(version => crdtController.crdt.list.versions.push(version));
};

window.LogRemoteInsertData =function(char){
  return crdtController.handleRemoteInsert(char);
};

window.LogRemoteDeleteData =function(char, id){
  return crdtController.handleRemoteDelete(char, id);
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


window.CallBroadcast = function(char, connections, action) {
	crdtController.crdt.broadcastNew(char, parse(connections), action);
};
