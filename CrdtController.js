const TreeMap = require("treemap-js");
var ArrayList = require('arraylist-js')

class CrdtController {
    constructor() {
        this.crdtList = new ArrayList();
    }

    processCrdt(crdt) {
        var size = this.crdtList.size();
        console.log("inserting at pos"+crdt.pos+":val:"+crdt.val);
        if (size == 0 || size<crdt.pos) {
            this.crdtList.add(crdt);
        }
       
            //console.log("here: " + this.crdtMap.get(crdt.pos).val);
    }

    listCrdtMap() {
        console.log("listcrdt");
        this.crdtList.map(function (crdt) {
            console.log(codt.pos+":"+ crdt.val);
        })
   }
}

module.exports = {
    CrdtController: CrdtController
}