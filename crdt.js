let identifier = require('./identifier');
let Identifier = identifier.Identifier;
let char = require('./char');
let Char = char.Char;
let version = require('./versionList');
let VersionList = version.VersionList;

class CRDT {
  constructor(peerId, base=32, boundary=10, strategy='random', multiplyFactor=2) { 
    this.peerId = peerId; // unique identifier for each node
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.multiplyFactor = multiplyFactor;
    this.list = new VersionList(peerId);
    this.struct = []; // array that stores crdt objects   
    this.text = "";
  }

  //called when local insert event happens in browser
  //val - value entered by user
  //index - index position in the editor 
  //connections -  existing connections with the peer
  //insert object in its own array and broadcasts to the other peers through connections
  localInsert(val, index, connections) {
    this.list.incCounter();
    console.log(this.list);
    const char = this.createChar(val, index);
    this.struct.splice(index, 0, char);
    this.insertChar(char.value, index);
    //Broadcast the insert to all my connections
    this.broadcast(char, connections, "insert"); 
  }
  
  /*function to broadcast the change with all the existing connections */
  broadcast(char, connections, action) {
    var charJSON = JSON.stringify({Insert: char});    
	  for(var peerId in connections) {
      //Checking the status of the connection and delete the entry if the connection is closed
      if(connections[peerId].peerConnection.signalingState == "closed") {
        delete connections[peerId];
        continue;
      }
      console.log("Broadcasting to connections"+peerId);
      if(action === "insert") {
        connections[peerId].send("Insert:"+charJSON);
      }			  
      else if(action == "delete") {
        connections[peerId].send("Delete:"+charJSON+"break"+this.peerId);
      }			  
	  }
  }

  //called when a remote user inserts a value
  //char - crdt object
  //finds the position to insert in the local array
  //inserts inside the index position and updates the text string
  remoteInsert(char) {
	  console.log("Remote insert "+char.value);
    const index = this.findInsertIndex(char);
    this.struct.splice(index, 0, char);
    this.insertChar(char.value, index);
    return this.text;
  }

  // deletes the object from the index position (charId)
  // broadcast the insert operation to others
  localDelete(charId, connections) {
    this.list.incCounter();
    console.log(this.list);
    const char = this.struct.splice(charId, 1)[0];
    this.deleteChar(charId);
    //Broadcast the delete operation to all the connections
    this.broadcast(char, connections, "delete"); 
  }

  //deletes the char object from remote delete operation
  //finds the index position to delete
  //deletes from the array and text string
  remoteDelete(char, peerId) {	  
	  console.log("Remote delete"+ char.value);
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);
    this.deleteChar(index);
    return this.text;
  }

  // binary searches the char object in the array
  findInsertIndex(char) {
    let left = 0;
    let right = this.struct.length - 1;
    let mid, compareNum;

    if (this.struct.length === 0 || char.compareTo(this.struct[left]) < 0) {
      return left;
    } 
    else if (char.compareTo(this.struct[right]) > 0) {
      return this.struct.length;
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = char.compareTo(this.struct[mid]);

      if (compareNum === 0) {
        return mid;
      } 
      else if (compareNum > 0) {
        left = mid;
      } 
      else {
        right = mid;
      }
    }

    return char.compareTo(this.struct[left]) === 0 ? left : right;
  }

  //binary searches the char object in the array
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
      } 
      else if (compareNum > 0) {
        left = mid;
      } 
      else {
        right = mid;
      }
    }

    if (char.compareTo(this.struct[left]) === 0) {
      return left;
    } 
    else if (char.compareTo(this.struct[right]) === 0) {
      return right;
    } 
    else {
      console.log("No such character exists in CRDT");
    }
  }

  //creates a char object for each value
  createChar(val, index) {
    const positionBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    const positionAfter = (this.struct[index] && this.struct[index].position) || [];
    const newPosition = this.getPositionBetween(positionBefore, positionAfter);
    const localCounter = this.list.localVersion.counter;
    return new Char(this.peerId, val, localCounter, newPosition);
  }

  getStrategy(level) {
    if (this.strategyCache[level]) return this.strategyCache[level];
    let strategy = Math.round(Math.random()) === 0 ? '+' : '-';
    this.strategyCache[level] = strategy;
    return strategy;
  }

  //finds the new index position based on the neighbours pos1 and pos2
  //if the neighbours have many levels, it should search recursively 
  getPositionBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(this.multiplyFactor, level) * this.base;
    let boundaryStrategy = this.getStrategy(level);

    let id1 = pos1[0] || new Identifier(0, this.peerId);
    let id2 = pos2[0] || new Identifier(base, this.peerId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.generateIdBetween(id1.digit, id2.digit, boundaryStrategy);
      newPos.push(new Identifier(newDigit, this.peerId));
      return newPos;

    } 
    else if (id2.digit - id1.digit === 1) {

      newPos.push(id1);
      return this.getPositionBetween(pos1.slice(1), [], newPos, level+1);

    } 
    else if (id1.digit === id2.digit) {
      if (id1.peerId < id2.peerId) {
        newPos.push(id1);
        return this.getPositionBetween(pos1.slice(1), [], newPos, level+1);
      } 
      else if (id1.peerId === id2.peerId) {
        newPos.push(id1);
        return this.getPositionBetween(pos1.slice(1), pos2.slice(1), newPos, level+1);
      } 
      else {
        console.log("Fix Position Sorting");
      }
    }
  }

  generateIdBetween(min, max, boundaryStrategy) {
    if ((max - min) < this.boundary) {
      min = min + 1;
    } 
    else {
      if (boundaryStrategy === '-') {
        min = max - this.boundary;
      } 
      else {
        min = min + 1;
        max = min + this.boundary;
      }
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }

  //inserts value to the text string
  insertChar(val, index) {
    if(val.length == 0) {
      val = "\n";
    }
    this.text = this.text.slice(0, index) + val + this.text.slice(index);
    console.log(this.struct);
    console.log(this.text);
  }

  // deletes char object at index
  deleteChar(index) {
    this.text = this.text.slice(0, index) + this.text.slice(index + 1);
    console.log("Deleting char");
    console.log(this.struct);  
    console.log(this.text); 
  }
}

module.exports = {
    CRDT: CRDT
}