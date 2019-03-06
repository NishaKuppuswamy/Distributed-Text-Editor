(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./char":2,"./crdtLinear":4}],2:[function(require,module,exports){
let identifier = require('./identifier');
let Identifier = identifier.Identifier;

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
      id1 = new Identifier(pos1[i].digit,pos1[i].siteId);
      id2 = new Identifier(pos2[i].digit,pos2[i].siteId);
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
},{"./identifier":5}],3:[function(require,module,exports){
let controller = require('./CrdtController');
let CrdtController = controller.CrdtController;
const {parse, stringify} = require('flatted/cjs');
var crdtController;
var r;
window.getURL =function(){
  document.getElementById('url').innerHTML = "http://localhost:3000/shared?id="+crdtController.siteID;
};

window.createController =function(siteID){
  console.log("created controller");
  crdtController = new CrdtController(siteID);
};

window.LogData =function(pos, value, action, connections){
  if(action == "insert")
  crdtController.crdt.handleLocalInsert(value, pos, connections);
  if(action == "remove")
  crdtController.crdt.handleLocalDelete(pos);
};

window.fetchCrdt =function(){
  return crdtController.crdt;
};

window.fetchVersion =function(){
  return crdtController.crdt;
};

window.syncStruct =function(struct,text){
  crdtController.crdt.struct = struct;
  crdtController.crdt.text = text;
};

window.LogRemoteInsertData =function(char, siteId){
  return crdtController.handleRemoteInsert(char);
};

window.SendResult = function(result) {
	r = JSON.parse(result);
};
window.SendConnections = function(connections) {
	var conn;
	for(let c of connections) { //find connection object between initiator and the peer that has requested the connections
		if(c.id == r.id)
			conn = c.conn;
	}
	conn.send(JSON.stringify(r)+" break "+stringify(connections)); //use the found connection object to send connections to requested peer 
};


window.CallBroadcast = function(char, connections) {
	crdtController.crdt.broadcastNew(char, parse(connections));
};

},{"./CrdtController":1,"flatted/cjs":6}],4:[function(require,module,exports){
let identifier = require('./identifier');
let Identifier = identifier.Identifier;
let char = require('./char');
let Char = char.Char;
//let compareTo = char.compareTo;
let version = require('./versionList');
let VersionList = version.VersionList;


class CRDT {
  constructor(/*controller,*/siteId, base=32, boundary=10, strategy='random', mult=2) {
    //this.controller = controller;
    //this.vector = controller.vector;    
    this.list = new VersionList(siteId);
    this.struct = [];
    this.siteId = siteId;//controller.siteID;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.mult = mult;
    this.connectionToTarget = "";
  }

  handleLocalInsert(val, index, connections) {
    this.list.incCounter();
    console.log(this.list);
    //console.log(val);      
    const char = this.generateChar(val, index);
    this.insertChar(index, char);
    this.insertText(char.value, index);
    /* check if the local insert is done by initiator*/
    if(connections != undefined) {
    		var idFound = false;
    		for(let conn of connections) {
    			if(conn.id == this.siteId) {		//local insert is not done by initiator
    				idFound = true;				
    				this.connectionToTarget = conn.conn; //get connection object (connection between initiator and this.siteId)
    			}
    		}
    	  if(idFound) {		//ask initiator to send all the connections
    		  this.connectionToTarget.send("GetConnections:"+JSON.stringify({'id':this.siteId, 'char':char}));    		
    	  }
    	  else
    	    this.broadcast(char, connections); //will be executed if local insert is done by initiator
    }
  }
  /* function to establish a new connection and broadcast the change*/
  broadcastNew(char, connections) {
	  var charJSON = JSON.stringify({Insert: char});
	  for(let con of connections) {
		  var peer = new Peer({key: 'api'});
		  var sendTo = con.conn;
		  if(con.id != this.siteId) {
	        peer.on('open', function(id){		//if the connection is not between initiator and this.siteId, create new connection
	                var c = peer.connect(con.id);
						c.on('open', function(){
	                        c.send("Insert:"+charJSON);
						});
	        });
		  }
		  else
			  this.connectionToTarget.send("Insert:"+charJSON); //use the connection established with the target, to send the change to target
	  }
  }
  /*function to broadcast the change with the existing connections */
  broadcast(char, connections) { //will be executed if local insert is done by initiator, broadcast local insert to all of its' connections
	  var charJSON = JSON.stringify({Insert: char});
	  for(let connection of connections) {
		  connection.conn.send("Insert:"+charJSON);
	  }
	  //connections.forEach(c => c.conn.send("Insert:"+charJSON));
  }

  handleRemoteInsert(char) {
	console.log("Remote ins "+char);
    const index = this.findInsertIndex(char);
    this.insertChar(index, char);
    this.insertText(char.value, index);
    return this.text;  
    //this.controller.insertIntoEditor(char.value, index, char.siteId);
  }

  generateText() {
    return this.struct.map(char => char.value).join('');
  }

  insertChar(index, char) {
    console.log("Inserting char");   
    this.struct.splice(index, 0, char);
    console.log(this.struct);
  }

  handleLocalDelete(idx) {
    this.list.incCounter();
    console.log(this.list);
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
    const localCounter = this.list.localVersion.counter;
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
  constructor(siteId) {
    this.siteId = siteId;
    // Operation count for that particular siteID
    this.counter = 0;
    //Operation not performed yet are stored in unHandled
    this.unHandled = [];
  }

  updateVersion(version) {
    const incCounter = version.counter;
    // If incoming counter is less than the current counter add to unHandled array
    if (incCounter <= this.counter) {
      const idx = this.unHandled.indexOf(incCounter);
      this.unHandled.splice(idx, 1);
    } 
    //If incoming counter is current counter+1 then it is the next operation
    else if (incCounter === this.counter + 1) {
      this.counter = this.counter + 1;
    } 
    // If incoming counter is greater than current counter+1 
    //add all the missing operation counter to the unHandled array
    else {
      for (let i = this.counter + 1; i < incCounter; i++) {
        this.unHandled.push(i);
      }
      this.counter = incCounter;
    }
  }
}

module.exports = {
    Version: Version
}
},{}],8:[function(require,module,exports){
let ver = require('./version');
let Version = ver.Version;

//List of versions for each siteID to maintain consistency and 
//avoid duplicate operations
class VersionList {
   constructor(siteId) {
    this.versions = [];
    this.localVersion = new Version(siteId);
    this.versions.push(this.localVersion);
  }

   //Increment counter of local version for each operation
   incCounter() {
    this.localVersion.counter++;
  }
  //Updating the versionlist on receiving versions from other sites 
  updateVersionList(inVersion) {
    const exists = this.versions.find(version => inVersion.siteId === version.siteId);
    //If the site ID of the received version doesnot already exist create a new version
    //and update the new version
    if (!exists) {
      const newVersion = new Version(inVersion.siteId);
      newVersion.updateVersion(inVersion);
      this.versions.push(newVersion);
    } else {
        exists.updateVersion(inVersion);
    }
  } 

  // Validating if the incoming operation has already been applied
  applied(inVersion) {
    const localInVersion = this.getVersionFromList(inVersion);
    const applied = !!localInVersion;
    // If the version itself doesnt exist in the list return false
    if (!applied){
        return false;
    }
    //If version exists check for the counter and if it has been already handled
    const isLower = inVersion.counter <= localInVersion.counter;
    const isUnHandled = localInVersion.unHandled.includes(inVersion.counter);
    return isLower && !isUnHandled;
  }

  //Check if version exists in the list and return it
  getVersionFromList(inVersion) {
    return this.versions.find(version => version.siteId === inVersion.siteId);
  }

  //Returns the siteId and counter of local version
  getLocalVersion() {
    return {
      siteId: this.localVersion.siteId,
      counter: this.localVersion.counter
    };
  }
}

module.exports = {
    VersionList: VersionList
}

},{"./version":7}]},{},[3]);
