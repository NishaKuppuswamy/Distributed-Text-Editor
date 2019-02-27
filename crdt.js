class CRDT {
    constructor(index,val) {
      this.pos = index;
      this.val = val;
      this.siteid = 1;  
    }
}

module.exports = {
    CRDT: CRDT
}