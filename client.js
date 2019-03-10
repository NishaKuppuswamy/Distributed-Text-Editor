let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
const {parse, stringify} = require('flatted/cjs');
var crdtController;
var r;
window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.peerId;
};

window.createController =function(peerId, targetId){
  console.log("created controller");
  crdtController = new CrdtController(peerId, targetId);
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

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.LogRemoteInsertData =function(char){
  return crdtController.handleRemoteInsert(char);
};

window.LogRemoteDeleteData =function(char, id){
  return crdtController.handleRemoteDelete(char, id);
};
