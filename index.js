'use strict';
const osNotifier = require('node-notifier');
const CHECK_INTERVAL = 100 * 1000;
const NOTIFY_INTERVAL = 50 * 1000;

var Rx = require("rx");
var PoeItem = require("./poe-item");

var carts = [
  new PoeItem("some always online item(test only)", 'http://poe.trade/search/ahagekuberikii'),
  new PoeItem("some other always online item(test only)", 'http://poe.trade/search/agiakiogomahos'),
  // new PoeItem('(buy it!)Maligaro > 45 mul', 'http://poe.trade/search/watakenikikomi'),
  // new PoeItem('heretic\'s veil( es > 283 price < 4ex)', 'http://poe.trade/search/osamonowotabot'),
  // new PoeItem('life, phys, mult < 1.5ex', 'http://poe.trade/search/iteoukutooagom'),
  // new PoeItem('a better ev helmet, 1ex, craft and buy it', 'http://poe.trade/search/tekukawonoyase'),
  // new PoeItem('a good ring! only 2chaos buy it!', 'http://poe.trade/search/etasetimameria'),
  // new PoeItem('a good ring! buy it!', 'http://poe.trade/search/hamarubogomite'),
  // new PoeItem('perfect belt! buy it!', 'http://poe.trade/search/uteyehoohusita'),
  new PoeItem('intuitive leap <= 50c', 'http://poe.trade/search/arihanyahuwina'),
  // new PoeItem('enlighten <= 20c', 'http://poe.trade/search/emeraurazotari'),
  // new PoeItem('a boot < 10c, buy it', 'http://poe.trade/search/matonekononiko'),
]

var itemMgr = {
  carts,
  notifier: null,
  onlineItems: [],
  _cache: [],
  // notifies our users when any item changes online status.
  // emits nothing, just an event so that our consumers know something has changed
  // and then they will most probably directly use `itemMgr.onlineItems`.
  checkForChanges(item) {
    var idx = this.onlineItems.indexOf(item);
    var alreadyOnline = ~idx
    if (!alreadyOnline && item.online) {
      this.onlineItems.push(item);
      this.notify();
    }
    if (alreadyOnline && !item.online) {
      this.onlineItems.splice(idx, 1);
      this.notify();
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
  }
}

//TODO: maybe try constructor instead of singleton
itemMgr.init();

var streams = itemMgr.carts
  .map(function(item) {

    return Rx.Observable.timer(0, CHECK_INTERVAL)
      // 
      .flatMap(function(idx) {

        return item.checkOnline()
          .then(function(online) {
            return online
          }, function(err) {
            // TODO: Add system erorr handling
            console.log(`Racing happened, we caught it as an error`, err);
          })
      })
      // emit only when online status being `false->true` or `true->false`
      .map(function() {
        itemMgr.checkForChanges(item)
      })
      //must subscribe. (cold Observable??)
      .subscribe()
  });

/*(function wait() {
  if (!exitFixed) setTimeout(wait, 10000);
})();*/

// var source = Rx.Observable.merge(...streams)


/*
var notifyStream;

source.subscribe(
  function(results) {
    if (notifyStream) notifyStream.dispose();

    console.log('here in Next!!, total %d times on start!', carts.length + 1);
    let onlineItems = results.filter(function(result) {
        return result.status
      })
      .map(function(result) {
        return result.item
      });

    if (!onlineItems.length) return;
    var msg = onlineItems.map(function(item) {
        return item.name })
      .join("\n")

    // frequently notify our user
    // TODO: add some interaction allowing user to discard further notification
    notifyStream = Rx.Observable.timer(0, CHECK_INTERVAL / 2)
      .subscribe(function(idx) {

        notify(`${msg}\n(${idx+1} times)`);

      }, function() {}, function() {
        console.log('notifyStream Completed')
      })


  },

  function(err) {
    console.log('Error: ' + err);
  },
  function() {
    console.log('Completed');
  });*/
