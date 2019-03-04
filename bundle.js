(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./crdtLinear":4}],2:[function(require,module,exports){
class Char {
  constructor(value, counter, siteId, identifiers) {
    this.position = identifiers;
    this.counter = counter;
    this.siteId = siteId;
    this.value = value;
  }

  compareTo(otherChar) {
    let comp, id1, id2;
    const pos1 = this.position;
    const pos2 = otherChar.position;

    for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
      id1 = pos1[i];
      id2 = pos2[i];
      comp = id1.compareTo(id2);

      if (comp !== 0) {
        return comp;
      }
    }

    if (pos1.length < pos2.length) {
      return -1;
    } else if (pos1.length > pos2.length) {
      return 1;
    } else {
      return 0;
    }
  }
}

module.exports = {
    Char: Char
}
},{}],3:[function(require,module,exports){
let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
var crdtController;

window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.siteID;
};

window.createController =function(siteID){
  console.log("created controller");
  crdtController = new CrdtController(siteID);
  //crdtController.siteID = siteID;
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

},{"./CrdtController":1}],4:[function(require,module,exports){
let identifier = require('./identifier');
let Identifier = identifier.Identifier;
let char = require('./char');
let Char = char.Char;


class CRDT {
  constructor(/*controller,*/ base=32, boundary=10, strategy='random', mult=2) {
    //this.controller = controller;
    //this.vector = controller.vector;
    this.struct = [];
    this.siteId = 1;//controller.siteID;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.mult = mult;
  }

  handleLocalInsert(val, index) {
   // this.vector.increment();
    console.log(val);
    const char = this.generateChar(val, index);
    this.insertChar(index, char);
    this.insertText(char.value, index);

    //this.controller.broadcastInsertion(char);
  }

  handleRemoteInsert(char) {
    const index = this.findInsertIndex(char);

    this.insertChar(index, char);
    this.insertText(char.value, index);

    //this.controller.insertIntoEditor(char.value, index, char.siteId);
  }

  generateText() {
    return this.struct.map(char => char.value).join('');
  }

  insertChar(index, char) {
    this.struct.splice(index, 0, char);
  }

  handleLocalDelete(idx) {
    //this.vector.increment();

    const char = this.struct.splice(idx, 1)[0];
    this.deleteText(idx);

    //this.controller.broadcastDeletion(char);
  }

  handleRemoteDelete(char, siteId) {
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);

    //this.controller.deleteFromEditor(char.value, index, siteId);
    this.deleteText(index);
  }

  findInsertIndex(char) {
    let left = 0;
    let right = this.struct.length - 1;
    let mid, compareNum;

    if (this.struct.length === 0 || char.compareTo(this.struct[left]) < 0) {
      return left;
    } else if (char.compareTo(this.struct[right]) > 0) {
      return this.struct.length;
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = char.compareTo(this.struct[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    return char.compareTo(this.struct[left]) === 0 ? left : right;
  }

  findIndexByPosition(char) {
    let left = 0;
    let right = this.struct.length - 1;
    let mid, compareNum;

    if (this.struct.length === 0) {
      throw new Error("Character does not exist in CRDT.");
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = char.compareTo(this.struct[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    if (char.compareTo(this.struct[left]) === 0) {
      return left;
    } else if (char.compareTo(this.struct[right]) === 0) {
      return right;
    } else {
      throw new Error("Character does not exist in CRDT.");
    }
  }

  generateChar(val, index) {
    const posBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    const posAfter = (this.struct[index] && this.struct[index].position) || [];
    const newPos = this.generatePosBetween(posBefore, posAfter);
    const localCounter = 0;// this.vector.localVersion.counter;

    return new Char(val, localCounter, this.siteId, newPos);
  }

  retrieveStrategy(level) {
    if (this.strategyCache[level]) return this.strategyCache[level];
    let strategy;

    switch (this.strategy) {
      case 'plus':
        strategy = '+';
        break;
      case 'minus':
        strategy = '-';
        break;
      case 'random':
        strategy = Math.round(Math.random()) === 0 ? '+' : '-';
        break;
      case 'every2nd':
        strategy = ((level+1) % 2) === 0 ? '-' : '+';
        break;
      case 'every3rd':
        strategy = ((level+1) % 3) === 0 ? '-' : '+';
        break;
      default:
        strategy = ((level+1) % 2) === 0 ? '-' : '+';
        break;
    }

    this.strategyCache[level] = strategy;
    return strategy;
  }

  generatePosBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(this.mult, level) * this.base;
    let boundaryStrategy = this.retrieveStrategy(level);

    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(base, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.generateIdBetween(id1.digit, id2.digit, boundaryStrategy);
      newPos.push(new Identifier(newDigit, this.siteId));
      return newPos;

    } else if (id2.digit - id1.digit === 1) {

      newPos.push(id1);
      return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);

    } else if (id1.digit === id2.digit) {
      if (id1.siteId < id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);
      } else if (id1.siteId === id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos, level+1);
      } else {
        throw new Error("Fix Position Sorting");
      }
    }
  }

  generateIdBetween(min, max, boundaryStrategy) {
    if ((max - min) < this.boundary) {
      min = min + 1;
    } else {
      if (boundaryStrategy === '-') {
        min = max - this.boundary;
      } else {
        min = min + 1;
        max = min + this.boundary;
      }
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }

  insertText(val, index) {
    if(val.length == 0) val = "\n";
    this.text = this.text.slice(0, index) + val + this.text.slice(index);
  }

  deleteText(index) {
    this.text = this.text.slice(0, index) + this.text.slice(index + 1);
  }
}

module.exports = {
    CRDT: CRDT
}
},{"./char":2,"./identifier":5}],5:[function(require,module,exports){
class Identifier {
  constructor(digit, siteId) {
    this.digit = digit; 
    this.siteId = siteId;
  }

// Compare identifiers using their digit value with siteID as the tiebreaker
// If identifers are equal, return 0
  compareTo(otherId) {
    if (this.digit < otherId.digit) {
      return -1;
    } else if (this.digit > otherId.digit) {
      return 1;
    } else {
      if (this.siteId < otherId.siteId) {
        return -1;
      } else if (this.siteId > otherId.siteId) {
        return 1;
      } else {
        return 0;
      }
    }
  }
}

module.exports = {
    Identifier: Identifier
}
},{}]},{},[3]);
