let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;
window.getURL =function(ip){
  document.getElementById('url').innerHTML = "http://"+ip+":3000/shared?id="+crdtController.peerId;
};

window.createController =function(peerId){
  console.log("created controller");
  crdtController = new CrdtController(peerId);
};

window.LogData =function(pos, value, action, connections){
  if(action == "insert")
  crdtController.crdt.localInsert(value, pos, connections);
  if(action == "remove")
  crdtController.crdt.localDelete(pos, connections);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.LogRemoteInsertData =function(char){
  return crdtController.remoteInsert(char);
};

window.LogRemoteDeleteData =function(char, id){
  return crdtController.remoteDelete(char, id);
};
