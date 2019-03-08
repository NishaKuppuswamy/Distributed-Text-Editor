let identifier = require('./identifier');
let Identifier = identifier.Identifier;
let char = require('./char');
let Char = char.Char;
//let compareTo = char.compareTo;
let version = require('./versionList');
let VersionList = version.VersionList;

class CRDT {
  constructor(/*controller,*/siteId, targetId, base=32, boundary=10, strategy='random', mult=2) {
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
    this.initiatorId = targetId;
  }

  handleLocalInsert(val, index, connections) {
    this.list.incCounter();
    console.log(this.list);
    //console.log(val);      
    const char = this.generateChar(val, index);
    this.insertChar(index, char);
    this.insertText(char.value, index);
    /* check if the local insert is done by initiator*/
    /*if(connections != undefined) {
    		var idFound = false;
    		if(connections[this.initiatorId] != null)
    		  connections[this.initiatorId].send("GetConnections:"+JSON.stringify({'id':this.siteId, 'char':char, 'action':"insert"}));
    		else*/
    this.broadcast(char, connections, "insert"); //will be executed if local insert is done by initiator
    //}
  }
  /* function to establish a new connection and broadcast the change*/
  /*broadcastNew(char, connections, action, peer) {
	  var charJSON = JSON.stringify({Insert: char});
	  for(let con of connections) {
		  console.log("NEW CONNECTION ");
		  console.log(con);
		  var sendTo = con.conn;
		  if(con.id != this.siteId) {
			  var c = peer.connect(con.id);
	        peer.on('open', function(id){		//if the connection is not between initiator and this.siteId, create new connection
				c.on('open', function(){
					if(action == "insert")
						c.send("Insert:"+charJSON);
					else 
						c.send("Delete:"+charJSON+" "+this.siteId);
				});
	        });
	        peer.on('connection', connect); 
		  }
		  else {
			  if(action === "insert")
				  this.connectionToTarget.send("Insert:"+charJSON); //use the connection established with the target, to send the change to target
			  else if(action == "delete")
				  this.connectionToTarget.send("Delete:"+charJSON); //use the connection established with the target, to send the change to target
		  }
	  }
  }*/

  /*function to broadcast the change with the existing connections */
  broadcast(char, connections, action) { //will be executed if local insert is done by initiator, broadcast local insert to all of its' connections
    var charJSON = JSON.stringify({Insert: char});    
	  for(var peerId in connections) {
      console.log("Broadcasting to connections"+peerId);
		  if(action === "insert"){
        connections[peerId].send("Insert:"+charJSON);
      }			  
		  else if(action == "delete"){
        connections[peerId].send("Delete:"+charJSON+" "+this.siteId);
      }			  
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

  handleLocalDelete(idx, connections) {
    this.list.incCounter();
    console.log(this.list);
    const char = this.struct.splice(idx, 1)[0];
    this.deleteText(idx);
    /*if(connections != undefined) {
	  if(connections[this.initiatorId] != null)
	    connections[this.initiatorId].send("GetConnections:"+JSON.stringify({'id':this.siteId, 'char':char, 'action':"delete"}));
	  else*/
		this.broadcast(char, connections, "delete"); //will be executed if local insert is done by initiator
    //}
  }

  handleRemoteDelete(char, siteId) {
	  
	console.log("In remote delete"+ char.value);
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);

    //this.controller.deleteFromEditor(char.value, index, siteId);
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