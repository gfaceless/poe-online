'use strict'


module.exports = class DisposableMgr {
  

  constructor() {
    this.disposables = [];
  }

  find(id) {
    return this.disposables.find(item => {
      return item.id === id;
    })
  }

  add(id, subscription) {

  	// if item is already in the pool or subscription does not have a `dispose` method,
    // returns false
    if(!subscription.dispose || this.find(id)) return false;
    this.disposables.push({id: id, subscription: subscription})
    // if success, returns true
    return true;
  }

  dispose(id) {
  	var item = this.find(id);
    if(!item) return false;
    
    item.subscription.dispose();
    let idx = this.disposables.indexOf(item);
    this.disposables.splice(idx, 1);
    return true;
  }
}
