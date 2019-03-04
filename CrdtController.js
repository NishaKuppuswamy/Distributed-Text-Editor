//const TreeMap = require("treemap-js");
//var ArrayList = require('arraylist-js')
//var LSEQArray = require('lseqarray');
let crdtLinear = require('./crdtLinear');
let CRDT = crdtLinear.CRDT;

class CrdtController {
    constructor(siteID=1) {
        this.siteID = siteID;
        this.crdt = new CRDT();
    }

    processCrdt(pos, value, action) {
        if(action == "insert")
        this.crdt.handleLocalInsert(value, pos);
        if(action == "remove")
        this.crdt.handleLocalDelete(value);
    }

    /*listCrdtMap() {
        console.log("listcrdt");
        this.crdtList.map(function (crdt) {
            console.log(codt.pos + ":" + crdt.val);
        })
    }*/
}

module.exports = {
    CrdtController: CrdtController
}