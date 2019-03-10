//const TreeMap = require("treemap-js");
//var ArrayList = require('arraylist-js')
//var LSEQArray = require('lseqarray');
let crdtLinear = require('./crdtLinear');
let CRDT = crdtLinear.CRDT;
let char = require('./char');
let Char = char.Char;

class CrdtController {
    constructor(peerId, targetId) {
        this.peerId = peerId;
        this.crdt = new CRDT(peerId, targetId);
    }

    processCrdt(pos, value, action) {
        if(action == "insert")
        this.crdt.handleLocalInsert(value, pos);
        if(action == "remove")
        this.crdt.handleLocalDelete(value);
    }

    handleRemoteInsert(char){
        char = new Char(char.peerId, char.value, char.counter, char.position);
        return this.crdt.handleRemoteInsert(char);
    }
    
    handleRemoteDelete(char, id){
        char = new Char(char.peerId, char.value, char.counter, char.position);
        return this.crdt.handleRemoteDelete(char, id);
    }
}

module.exports = {
    CrdtController: CrdtController
}