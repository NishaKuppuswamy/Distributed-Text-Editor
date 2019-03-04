let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;

window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.siteID;
};

window.createController =function(siteID){
  console.log("created controller");
  crdtController = new CrdtController(siteID);
};

window.LogData =function(pos, value, action){
  if(action == "+input")
  crdtController.crdt.handleLocalInsert(value, pos);
  if(action == "+delete")
  crdtController.crdt.handleLocalDelete(pos);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};
