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