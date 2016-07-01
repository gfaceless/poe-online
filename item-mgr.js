'use strict';

var PoeItem = require("./poe-item");
var DisposableMgr = require("./disposable-mgr");
var DbCollection = require("./db");
var Notifier = require("./notifier");
var helper = require("./helper");
var isEmpty = helper.isEmpty
var isDefined = helper.isDefined

const DEFAULT_NTF_SETTING = {
  buzz: true,
  buzzInterval: 30 * 1000,
  title: "your item is online!",
  sound: true,
}

class ItemMgr {

  constructor(data, db) {

    this.id = data.id;
    this._db = db;
    this.items = [];

    this._disposableMgr = new DisposableMgr()

    data.items.forEach((data, i) => {
      this.items.push(new PoeItem(data.name, data.url))
    });

    this.settings = data.settings;
    var ntfSettings = Object.assign({}, DEFAULT_NTF_SETTING, this.settings);
    this.notifier = new Notifier(ntfSettings);

    this.onlineItems = [];

    // tmp:
    this.items.forEach((item, i) => {
      this._watchItem(item);
    });

  }

  /**
   * 1. control notifier: buzz on/off, buzz freq, buzz sound(?) pause/resume notification
   * 2. some other options (havent added yet)
   * Note currently only support notification settings
   */
  updateSettings(opts) {
    if (isEmpty(opts)) return Promise.reject(new Error('need params'));

    Object.assign(this.settings, opts);
    this.notifier.updateSettings(this.settings);

    return this.save();
  }

  showSettings() {
    return Promise.resolve(this.settings);
  }

  /**
   * all item info update goes here, including watch toggle
   * returns a promise which gives item full info on success
   * and throws error on fail. note there is a "partial fail" error
   * indicating despite of failure, some properties have still been updated.
   */
  updateItem(item, updates) {

    var item = this.find(item)
    if (!item) return Promise.reject(new Error("could not find item"));
    var toggleSuccess;
    if (typeof updates.watch == 'boolean') {
      toggleSuccess = updates.watch ? this._watchItem(item) : this._unwatchItem(item);
    }

    // I wanted to introduce a `partial success` error type to our app,
    // but i seems to unneccesarily complicate our app at this early stage.
    // so there is only success or failure, no intermediate stage, for now.
    if (toggleSuccess === false) return Promise.reject(new Error('fail to toggle watch'))

    return item.update(updates)
      .then(itemInfo => {
        if (typeof updates.watch == 'boolean') itemInfo.watch = updates.watch;
        return itemInfo
      })
  }

  showItem(id) {
    let item = this.find(id);
    if (!item) return Promise.reject(new Error("could not find item"));

    return Promise.resolve(item.info())
  }

  showItems() {
    let items = this.items.map((item, i) => {
      return item.info()
    });

    return Promise.resolve(items)
  }

  reload() {
    return this._db.load(this.id)
      .then(data => {
        this.items = data.items
        this.settings = data.settings
      })
  }

  /**
   * note currently this._db is a collection-level db interface.
   * it saves an array of documents rather than a single document.
   * this is not intuitive. in the future we'll have a document interface
   * then we can simply call `_dbDocument.save(doc)`
   */
  save() {
    return this._db.save([{
      id: this.id,
      items: this.items,
      settings: this.settings
    }])
  }


  addItem(data) {
    this._addItem(data);
    return this.save();

  }

  // param can be either item object or an id
  removeItem(item) {
    var item = this.find(item)
    if (!item) return Promise.reject(new Error("could not find item"));

    this._unwatchItem(item);
    this.items.splice(this.items.indexOf(item), 1);
    // maybe call item.destroy()?;
    return this.save();

  }

  /**
   * generate a snapshot of properties
   * two requests to one. 
   */
  summary() {
    var summary = {};

    return this.showItems()
      .then(items => {
        summary.items = items
        summary.settings = this.settings
        return summary
      })
  }

  genOnlineInfo() {
    return this.onlineItems.map(function(item) {
      // `onlineInfo` is a getter
      return item.onlineInfo
    }).join("\n");
  }

  _addItem(data) {
    let item = new PoeItem(data.name, data.url)
    this.items.push(item)
    this._watchItem(item);
  }

  /** 
   * a change monitoring center.
   * notifies our users when an offline item has become online (asap)
   * emits nothing but an empty event for our consumers to know something has changed
   * and then they will most probably directly use `ItemMgr.onlineItems`.
   * note that this method will be called frequently
   */
  _checkForChanges(item) {
    var idx = this.onlineItems.indexOf(item);
    var alreadyOnline = ~idx
    if (!alreadyOnline && item.online) {
      this.onlineItems.push(item);
      this._notify();
    }
    if (alreadyOnline && !item.online) {
      this.onlineItems.splice(idx, 1);

      // this will make a passive notification
      // for details, see notifier.passiveNotify()
      this._notify(true);
    }
  }

  // NOTE: this function is only called when overall online info has changed.
  _notify(passive) {
    console.log('in notify!!, should be only called when overall online info has changed.')
    var msg = this.genOnlineInfo();

    // Note that `msg` could be an empty string here,
    // in that case we dont call `notify()` but call `clear()` to clear all the buzz
    // looking for a more intuitive name other than `clear()`
    if (isEmpty(msg)) {
      return this.notifier.clear();
    }

    if (!passive) this.notifier.notify(msg);
    else this.notifier.passiveNotify(msg);
  }

  // note that private functions like this dont check passing parameters
  _watchItem(item) {

    var result = item.startCheck();
    if (!result) return false;

    let sub = item.notifier.subscribe(_ => {
      this._checkForChanges(item);
    })
    this._disposableMgr.add(item.id, sub)
    return true;
  }

  // notice that we remove item from `onlineItems` when we unwatch it
  // the logic may be a little confusing (or not)
  _unwatchItem(item) {
    item.stopCheck();
    this._disposableMgr.dispose(item.id);
    let idx = this.onlineItems.indexOf(item);
    if (~idx) this.onlineItems.splice(idx, 1);
    // passively notify if item is online when removed
    if (item.online) this.notify(true)
  }


  // TODO: `items` and `onlineItems` should be created by some class
  // like `EasierArray`, or even better, by Observerbles, like angular2 does

  /**
   * returns item if found, else returns undefined
   */
  find(idOrItem) {

    if (idLike(idOrItem)) {
      let id = +idOrItem
      return this.items.find((item, i) => {
        return item.id === id;
      })
    } else {
      let item = idOrItem
      let idx = this.items.indexOf(item);
      if (~idx) return item;
      else return undefined;
    }
  }

}

// note this function will return true for oct or hex 
// e.g. "0x123", "00123" 
function idLike(p) {
  return !isNaN(+p);
}


var itemMgrFactory = {
  _promiseCache: {},
  _db: new DbCollection("whatever", "itemMgrs"),
  // always return a promise
  create(id) {
    // TODO: add error handling.
    if (!isEmpty(id)) {
      if (!this._promiseCache[id]) {
        this._promiseCache[id] = this._db.load(id)
          .then(data => {
            var itemMgr = new ItemMgr(data, this._db);
            return itemMgr
          }, function(err) {
            // should clear cache here
            throw err
          })
      }

      return this._promiseCache[id];
    }
    // fucky way to generate a unique id
    var id = Math.random();
    return Promise.resolve(new ItemMgr({
      id: id
    }, this._db))
  }
}

module.exports = itemMgrFactory

/*let TEST = false
  ///////////////////////
  // some crude tests: //
  ///////////////////////
if (TEST) {
  setTimeout(_ => {
    console.log('about to unwatch!');
    this._unwatchItem(this.items[0])
    setTimeout(_ => {
      console.log('about to rewatch!');
      this._watchItem(this.items[0]);
    }, 100 * 1000)
  }, 20 * 1000)

  // online becomes offline:
  this.items[1].url = 'http://poe.trade/search/hamarubogomite';
  // change checking interval to 10seconds for this paticular item:
  this.items[0].update({ interval: 10 * 1000 });
}*/
