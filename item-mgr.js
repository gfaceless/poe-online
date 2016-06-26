'use strict';
const osNotifier = require('node-notifier');

const NOTIFICATION_INTERVAL = 50; /*sec*/

var Rx = require("rx");
var PoeItem = require("./poe-item");
var DisposableMgr = require("./disposable-mgr");
var Timer = require("./timer");

var carts = [
  // new PoeItem("some always online item(test only)", 'http://poe.trade/search/ahagekuberikii'),
  // new PoeItem("some other always online item(test only)", 'http://poe.trade/search/agiakiogomahos'),
  new PoeItem('(buy it!)Maligaro > 45 mul', 'http://poe.trade/search/watakenikikomi'),
  new PoeItem('heretic\'s veil( es > 283 price < 4ex)', 'http://poe.trade/search/osamonowotabot'),
  new PoeItem('life, phys, mult < 1.5ex', 'http://poe.trade/search/iteoukutooagom'),
  new PoeItem('a better ev helmet, 1ex, craft and buy it', 'http://poe.trade/search/tekukawonoyase'),
  new PoeItem('a good ring! only 2chaos buy it!', 'http://poe.trade/search/etasetimameria'),
  // new PoeItem('perfect belt! buy it!', 'http://poe.trade/search/uteyehoohusita'),
  new PoeItem('intuitive leap <= 50c', 'http://poe.trade/search/arihanyahuwina'),
  new PoeItem('enlighten <= 20c', 'http://poe.trade/search/emeraurazotari'),
  new PoeItem('a boot < 10c, buy it', 'http://poe.trade/search/matonekononiko'),
]

var itemMgr = {
  items: carts,
  notifier: null,
  ntfInterval: NOTIFICATION_INTERVAL,

  onlineItems: [],
  _cache: [],
  _disposableMgr: new DisposableMgr(),
  _timer: null,
  /** 
   * a change monitoring center.
   * notifies our users when an off item has become online (asap)
   * but 
   * emits nothing but an empty event for our consumers to know something has changed
   * and then they will most probably directly use `itemMgr.onlineItems`.
   * note that this method will be called frequently
   */
  checkForChanges(item) {
    var idx = this.onlineItems.indexOf(item);
    var alreadyOnline = ~idx
    if (!alreadyOnline && item.online) {
      this.onlineItems.push(item);
      this.notify();
    }
    if (alreadyOnline && !item.online) {
      this.onlineItems.splice(idx, 1);

      // if we want to add logic to notify users that an item becomes offline,
      // we do it here.
      // for now, we simply remove that item from `onlineItems` and do nothing else

      // this.notify();
    }
  },

  /**
   * generate a snapshot of properties
   * two requests to one. 
   */
  summary() {
    var summary = {};

    return Promise.all([this.showItems(), this.showNtfSetting()])
      .then(arr => {
        summary.items = arr[0]
        summary.ntf = arr[1];
      })
  },

  genOnlineInfo() {
    return this.onlineItems.map(function(item) {
      // `onlineInfo` is a getter
      return item.onlineInfo
    }).join("\n");
  },

  // NOTE: this function is only called when overall online info has changed.
  notify() {

    console.log('in notify!!, should be only called when overall online info has changed.')
    var msg = this.genOnlineInfo()

    this.notifier.onNext(msg);

  },

  init() {

    this.items.forEach((item, i) => {
      this.watchItem(item);
    });

    let TEST = false

    ///////////////////////
    // some crude tests: //
    ///////////////////////
    if (TEST) {
      setTimeout(_ => {
        console.log('about to unwatch!');
        this.unwatchItem(this.items[0])
        setTimeout(_ => {
          console.log('about to rewatch!');
          this.watchItem(this.items[0]);
        }, 100 * 1000)
      }, 20 * 1000)

      // online becomes offline:
      this.items[1].url = 'http://poe.trade/search/hamarubogomite';
      // change checking interval to 10seconds for this paticular item:
      this.items[0].update({ interval: 10 * 1000 });
    }



    this.notifier = new Rx.Subject();
    this.notifier.subscribe(
      function(msg) {

        osNotifier.notify({
          'title': 'your item is online!',
          'message': msg,
          sound: true,
        });
      },

      function(err) {
        console.log('Error: ' + err);
      },
      function() {
        console.log('Completed');
      })

    this._timer = new Timer(this.notify, _ => this.ntfInterval*1000, this);
  },

  watchItem(item) {
    item.startCheck();
    let sub = item.notifier.subscribe(_ => {
      this.checkForChanges(item);
    })
    this._disposableMgr.add(item.id, sub)
  },

  // notice that we remove item from `onlineItems` when we unwatch it
  // the logic may be a little confusing (or not)
  unwatchItem(item) {
    item.stopCheck();
    this._disposableMgr.dispose(item.id);
    let idx = this.onlineItems.indexOf(item);
    if (~idx) this.onlineItems.splice(idx, 1);
  },

  addItem(name, url) {

    return new Promise(function(resolve, reject) {
      let item = new PoeItem(name, url)
      if (!item) return reject(new Error("item creation failed"))

      this.items.push(item)
      this.watchItem(item);
      resolve(item);
    })
  },

  // param can be either item object or an id
  removeItem(item) {
    var item = this.find(item)
    if (!item) return Promise.reject(new Error("could not find item"));

    this.unwatchItem(item);
    this.items.splice(this.items.indexOf(item), 1);
    // maybe call item.destroy()?;
    return Promise.resolve()

  },

  changeItem(item, updates) {

    var item = this.find(item)
    if (!item) return Promise.reject(new Error("could not find item"));
    return item.update(updates)
  },

  showItem(id) {
    let item = this.find(id);
    if (!item) return Promise.reject(new Error("could not find item"));

    return Promise.resolve(item.info())
  },

  showItems() {
    let items = this.items.map((item, i) => {
      return item.info()
    });

    return Promise.resolve(items)
  },

  // TODO: as notification logic grows, we'd better seperate it from main manager
  showNtfSetting() {
    return Promise.resolve({
      interval: this.ntfInterval
    })
  },

  changeNtfSetting(opts) {

    // Note, the interval is in form of second rather than milisecond
    if (opts.interval) this.ntfInterval = +opts.interval

    return Promise.resolve();
  },

  pauseNotification() {
    this._timer.pause();
    return Promise.resolve()
  },
  resumeNotification() {
    this._timer.resume();
    return Promise.resolve();
  },


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

function isUndefined(p) {
  return typeof p === 'undefined';
}

//TODO: maybe try constructor instead of singleton
itemMgr.init();
module.exports = itemMgr;
