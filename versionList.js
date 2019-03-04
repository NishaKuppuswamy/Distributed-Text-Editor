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
