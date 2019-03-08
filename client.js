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

window.createController =function(siteID, targetId){
  console.log("created controller");
  crdtController = new CrdtController(siteID, targetId);
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

window.SendConnections = function(peerId, connObj){
  connObj.send("Sending new connection:"+peerId);
}

/*window.ParseConnection = function(connObj){
  return parse(connObj);
}*/

/*window.SendResult = function(result) {
	r = JSON.parse(result);
};
window.SendConnections = function(connections) {
	var conn;
	console.log("SEND");
	console.log(connections);
	 //use the found connection object to send connections to requested peer 
};


window.CallBroadcast = function(char, connections, action, peer) {
	crdtController.crdt.broadcastNew(char, parse(connections), action, peer);
};*/
