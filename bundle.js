(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./char":2,"./crdtLinear":4}],2:[function(require,module,exports){
let identifier = require('./identifier');
let Identifier = identifier.Identifier;

class Char {
  constructor(peerId, value, counter, identifiers) {
    this.peerId = peerId;
    this.value = value;
    this.counter = counter;
    this.position = identifiers;     
  }

  //Custom comparator for comparing two characters based on identifiers 
  compareTo(char2) {
    let id1, id2, result;

    const pos1 = this.position;
    const pos2 = char2.position;

    //Comparing the identifiers until the minimum length among pos1 and pos2
    for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
      id1 = new Identifier(pos1[i].digit,pos1[i].peerId);
      id2 = new Identifier(pos2[i].digit,pos2[i].peerId);
      result = id1.compare(id2);

      if (result !== 0) {
        return result;
      }
    }
    // Comparing the length of the identifiers if the result was 0
    //Return -1 if the length of position of char1 is less than char2
    if (pos1.length < pos2.length) {
      return -1;
    } 
    //Return 1 if the length of position of char1 is greater than char2
    else if (pos1.length > pos2.length) {
      return 1;
    } 
    //Return 0 if the length of position of char1 is equal to char2
    else {
      return 0;
    }
  }
}

module.exports = {
    Char: Char
}
},{"./identifier":5}],3:[function(require,module,exports){
let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
const {parse, stringify} = require('flatted/cjs');
var crdtController;
var r;
window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.peerId;
};

window.createController =function(peerId, targetId){
  console.log("created controller");
  crdtController = new CrdtController(peerId, targetId);
};

window.LogData =function(pos, value, action, connections){
  if(action == "insert")
  crdtController.crdt.handleLocalInsert(value, pos, connections);
  if(action == "remove")
  crdtController.crdt.handleLocalDelete(pos, connections);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.LogRemoteInsertData =function(char){
  return crdtController.handleRemoteInsert(char);
};

window.LogRemoteDeleteData =function(char, id){
  return crdtController.handleRemoteDelete(char, id);
};

},{"./CrdtController":1,"flatted/cjs":6}],4:[function(require,module,exports){
let identifier = require('./identifier');
let Identifier = identifier.Identifier;
let char = require('./char');
let Char = char.Char;
let version = require('./versionList');
let VersionList = version.VersionList;

class CRDT {
  constructor(/*controller,*/peerId, targetId, base=32, boundary=10, strategy='random', mult=2) {
    //this.controller = controller;  
    this.list = new VersionList(peerId);
    this.struct = [];
    this.peerId = peerId;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.mult = mult;
    this.connectionToTarget = "";
    this.initiatorId = targetId;
  }

  handleLocalInsert(val, index, connections) {
    this.list.incCounter();
    console.log(this.list);
    //console.log(val);      
    const char = this.generateChar(val, index);
    this.insertChar(index, char);
    this.insertText(char.value, index);
    //Broadcast the insert to all my coonections
    this.broadcast(char, connections, "insert"); //will be executed if local insert is done by initiator
  }
  
  /*function to broadcast the change with all the existing connections */
  broadcast(char, connections, action) {
    var charJSON = JSON.stringify({Insert: char});    
	  for(var peerId in connections) {
      console.log("Broadcasting to connections"+peerId);
      if(connections[peerId].peerConnection.signalingState == "closed") {
		  delete connections[peerId];
		  continue;
	  }
		  if(action === "insert"){
        connections[peerId].send("Insert:"+charJSON);
      }			  
		  else if(action == "delete"){
        connections[peerId].send("Delete:"+charJSON+"break"+this.peerId);
      }			  
	  }
  }

  handleRemoteInsert(char) {
	  console.log("Remote ins "+char);
    const index = this.findInsertIndex(char);
    this.insertChar(index, char);
    this.insertText(char.value, index);
    return this.text;
  }

  generateText() {
    return this.struct.map(char => char.value).join('');
  }

  insertChar(index, char) {
    console.log("Inserting char");   
    this.struct.splice(index, 0, char);
    console.log(this.struct);
  }

  handleLocalDelete(idx, connections) {
    this.list.incCounter();
    console.log(this.list);
    const char = this.struct.splice(idx, 1)[0];
    this.deleteText(idx);
    //Broadcast the delete operation to all the connections
    this.broadcast(char, connections, "delete"); 
  }

  handleRemoteDelete(char, peerId) {	  
	  console.log("In remote delete"+ char.value);
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);
    this.deleteText(index);
    return this.text;
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
    const localCounter = this.list.localVersion.counter;
    return new Char(this.peerId, val, localCounter, newPos);
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

    let id1 = pos1[0] || new Identifier(0, this.peerId);
    let id2 = pos2[0] || new Identifier(base, this.peerId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.generateIdBetween(id1.digit, id2.digit, boundaryStrategy);
      newPos.push(new Identifier(newDigit, this.peerId));
      return newPos;

    } else if (id2.digit - id1.digit === 1) {

      newPos.push(id1);
      return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);

    } else if (id1.digit === id2.digit) {
      if (id1.peerId < id2.peerId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);
      } else if (id1.peerId === id2.peerId) {
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
    if(val.length == 0) {
      val = "\n";
    }
    this.text = this.text.slice(0, index) + val + this.text.slice(index);
    console.log(this.text);
  }

  deleteText(index) {
    this.text = this.text.slice(0, index) + this.text.slice(index + 1);
    console.log("Deleting char");
    console.log(this.struct);  
    console.log(this.text); 
  }
}

module.exports = {
    CRDT: CRDT
}
},{"./char":2,"./identifier":5,"./versionList":8}],5:[function(require,module,exports){
class Identifier {

  constructor(digit, peerId) {
    this.digit = digit; 
    this.peerId = peerId;
  }

  // Function for comparing the identifiers using their digit value followed by their peerId
  compare(id2) {
    // Return -1 if the digit value of id2 is greater
    if (this.digit < id2.digit) {
      return -1;
    } 
    // Return 1 if the digit value of id2 is smaller
    else if (this.digit > id2.digit) {
      return 1;
    } 
    // When both have digit values equal peerId is compared
    else {
      //Return -1 if the peerId of id2 is greater
      if (this.peerId < id2.peerId) {
        return -1;
      } 
      //Return 1 if the peerId of id2 is smaller
      else if (this.peerId > id2.peerId) {
        return 1;
      } 
      // Return 0 if identifiers are equal
      else {
        return 0;
      }
    }
  }
}

module.exports = {
    Identifier: Identifier
}
},{}],6:[function(require,module,exports){
var Flatted = (function (Primitive, primitive) {

  /*!
   * ISC License
   *
   * Copyright (c) 2018, Andrea Giammarchi, @WebReflection
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
   * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
   * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
   * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
   * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
   * OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
   * PERFORMANCE OF THIS SOFTWARE.
   */

  var Flatted = {

    parse: function parse(text, reviver) {
      var input = JSON.parse(text, Primitives).map(primitives);
      var value = input[0];
      var $ = reviver || noop;
      var tmp = typeof value === 'object' && value ?
                  revive(input, new Set, value, $) :
                  value;
      return $.call({'': tmp}, '', tmp);
    },

    stringify: function stringify(value, replacer, space) {
      for (var
        firstRun,
        known = new Map,
        input = [],
        output = [],
        $ = replacer && typeof replacer === typeof input ?
              function (k, v) {
                if (k === '' || -1 < replacer.indexOf(k)) return v;
              } :
              (replacer || noop),
        i = +set(known, input, $.call({'': value}, '', value)),
        replace = function (key, value) {
          if (firstRun) {
            firstRun = !firstRun;
            return value;
            // this was invoking twice each root object
            // return i < 1 ? value : $.call(this, key, value);
          }
          var after = $.call(this, key, value);
          switch (typeof after) {
            case 'object':
              if (after === null) return after;
            case primitive:
              return known.get(after) || set(known, input, after);
          }
          return after;
        };
        i < input.length; i++
      ) {
        firstRun = true;
        output[i] = JSON.stringify(input[i], replace, space);
      }
      return '[' + output.join(',') + ']';
    }

  };

  return Flatted;

  function noop(key, value) {
    return value;
  }

  function revive(input, parsed, output, $) {
    return Object.keys(output).reduce(
      function (output, key) {
        var value = output[key];
        if (value instanceof Primitive) {
          var tmp = input[value];
          if (typeof tmp === 'object' && !parsed.has(tmp)) {
            parsed.add(tmp);
            output[key] = $.call(output, key, revive(input, parsed, tmp, $));
          } else {
            output[key] = $.call(output, key, tmp);
          }
        } else
          output[key] = $.call(output, key, value);
        return output;
      },
      output
    );
  }

  function set(known, input, value) {
    var index = Primitive(input.push(value) - 1);
    known.set(value, index);
    return index;
  }

  // the two kinds of primitives
  //  1. the real one
  //  2. the wrapped one

  function primitives(value) {
    return value instanceof Primitive ? Primitive(value) : value;
  }

  function Primitives(key, value) {
    return typeof value === primitive ? new Primitive(value) : value;
  }

}(String, 'string'));
module.exports = Flatted;

},{}],7:[function(require,module,exports){
class Version {
  constructor(peerId) {
    this.peerId = peerId;
    // Operation count for that particular peerId
    this.counter = 0;
  }
}

module.exports = {
    Version: Version
}
},{}],8:[function(require,module,exports){
let ver = require('./version');
let Version = ver.Version;

//Local version for the peer which increments the counter for each operation
class VersionList {
  constructor(peerId) {
    this.localVersion = new Version(peerId);
  }
   //Increment counter of local version for each operation
  incCounter() {
    this.localVersion.counter++;
  }
}

module.exports = {
    VersionList: VersionList
}

},{"./version":7}]},{},[3]);
