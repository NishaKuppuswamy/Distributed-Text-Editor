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
