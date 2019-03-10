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