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