let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;


window.createController =function(){
  console.log("created controller");
  crdtController = new CrdtController();
};

window.LogData =function(pos, value, action){
  if(action == "+input")
  crdtController.crdt.handleLocalInsert(value, pos);
  if(action == "+delete")
  crdtController.crdt.handleLocalDelete(value);
};
