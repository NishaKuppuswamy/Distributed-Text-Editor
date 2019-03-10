//const TreeMap = require("treemap-js");
//var ArrayList = require('arraylist-js')
//var LSEQArray = require('lseqarray');
let crdtLinear = require('./crdt');
let CRDT = crdtLinear.CRDT;
let char = require('./char');
let Char = char.Char;

class CrdtController {
    constructor(peerId) {
        this.peerId = peerId;
        this.crdt = new CRDT(peerId);
    }

    processCrdt(pos, value, action) {
        if(action == "insert")
        this.crdt.localInsert(value, pos);
        if(action == "remove")
        this.crdt.localDelete(value);
    }

    remoteInsert(char){
        char = new Char(char.peerId, char.value, char.counter, char.position);
        return this.crdt.remoteInsert(char);
    }
    
    remoteDelete(char, id){
        char = new Char(char.peerId, char.value, char.counter, char.position);
        return this.crdt.remoteDelete(char, id);
    }
}

module.exports = {
    CrdtController: CrdtController
}