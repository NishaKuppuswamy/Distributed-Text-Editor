class Version {
  constructor(siteId) {
    this.siteId = siteId;
    // Operation count for that particular siteID
    this.counter = 0;
    //Operation not performed yet are stored in unHandled
    this.unHandled = [];
  }

  update(version) {
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