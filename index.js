'use strict';
const osNotifier = require('node-notifier');

const NOTIFY_INTERVAL = 50 * 1000;

var Rx = require("rx");
var PoeItem = require("./poe-item");
var DisposableMgr = require("./disposable-mgr");

var carts = [
  new PoeItem("some always online item(test only)", 'http://poe.trade/search/ahagekuberikii'),
  new PoeItem("some other always online item(test only)", 'http://poe.trade/search/agiakiogomahos'),
  new PoeItem('(buy it!)Maligaro > 45 mul', 'http://poe.trade/search/watakenikikomi'),
  new PoeItem('heretic\'s veil( es > 283 price < 4ex)', 'http://poe.trade/search/osamonowotabot'),
  new PoeItem('life, phys, mult < 1.5ex', 'http://poe.trade/search/iteoukutooagom'),
  new PoeItem('a better ev helmet, 1ex, craft and buy it', 'http://poe.trade/search/tekukawonoyase'),
  new PoeItem('a good ring! only 2chaos buy it!', 'http://poe.trade/search/etasetimameria'),
  // new PoeItem('a good ring! buy it!', 'http://poe.trade/search/hamarubogomite'),
  // new PoeItem('perfect belt! buy it!', 'http://poe.trade/search/uteyehoohusita'),
  // new PoeItem('intuitive leap <= 50c', 'http://poe.trade/search/arihanyahuwina'),
  new PoeItem('enlighten <= 20c', 'http://poe.trade/search/emeraurazotari'),
  new PoeItem('a boot < 10c, buy it', 'http://poe.trade/search/matonekononiko'),
]

var itemMgr = {
  items: carts,
  notifier: null,
  onlineItems: [],
  _cache: [],
  _disposableMgr: new DisposableMgr(),
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

    // notify at a constant pace. start a new interval when infomation changes.
    if (this.timer) clearTimeout(this.timer)
    this.timer = setInterval(_ => {
      this.notifier.onNext(this.genOnlineInfo())
    }, NOTIFY_INTERVAL)
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
      this.items[0].changeInterval(10 * 1000);
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
    let item = this.items.push(new PoeItem(name, url))
    this.watchItem(item);
  },

  removeItem(item) {
    this.unwatchItem(item)
    let idx = this.items.indexOf(item)
    if (~idx) this.onlineItems.splice(idx, 1);

  }

}

//TODO: maybe try constructor instead of singleton
itemMgr.init();
