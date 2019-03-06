//const TreeMap = require("treemap-js");
//var ArrayList = require('arraylist-js')
//var LSEQArray = require('lseqarray');
let crdtLinear = require('./crdtLinear');
let CRDT = crdtLinear.CRDT;
let char = require('./char');
let Char = char.Char;

class CrdtController {
    constructor(siteID) {
        this.siteID = siteID;
        this.crdt = new CRDT(siteID);
    }

    processCrdt(pos, value, action) {
        if(action == "insert")
        this.crdt.handleLocalInsert(value, pos);
        if(action == "remove")
        this.crdt.handleLocalDelete(value);
    }

    handleRemoteInsert(char){
        char = new Char(char.value, char.counter, char.siteId, char.position);
        return this.crdt.handleRemoteInsert(char);
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