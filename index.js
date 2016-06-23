'use strict';
const osNotifier = require('node-notifier');
const CHECK_INTERVAL = 105 * 1000;
const NOTIFY_INTERVAL = 50 * 1000;

var Rx = require("rx");
var urls

var carts = [
  // {name: "wind of change", url: 'http://poe.trade/search/imokimikimaham'},
  // {name: "enlighten <= 50 chaos", url: 'http://poe.trade/search/atoamanoarinaz'},
  {name: "some always online item(test only)", url: 'http://poe.trade/search/siterehusitara'}, // online
  { name: '(buy it!)Maligaro > 45 mul', url: 'http://poe.trade/search/watakenikikomi' },
  { name: 'heretic\'s veil( es > 283 price < 4ex)', url: 'http://poe.trade/search/osamonowotabot' },
  { name: 'life, phys, mult < 1.5ex', url: 'http://poe.trade/search/iteoukutooagom' },
  { name: 'a better ev helmet, 1ex, craft and buy it', url: 'http://poe.trade/search/tekukawonoyase' },
  { name: 'a good ring! only 2chaos buy it!', url: 'http://poe.trade/search/etasetimameria' },
  // {name: 'a good ring! buy it!', url: 'http://poe.trade/search/hamarubogomite'},
  // {name: 'perfect belt! buy it!', url: 'http://poe.trade/search/uteyehoohusita'},
  // {name: 'intuitive leap <= 50c', url: 'http://poe.trade/search/arihanyahuwina'},
  { name: 'enlighten <= 20c', url: 'http://poe.trade/search/emeraurazotari' },
  { name: 'jewel life+resist 2ex', url: 'http://poe.trade/search/aututakomuritu' },
  { name: 'a boot < 10c, buy it', url: 'http://poe.trade/search/matonekononiko' },
  // {name: 'a helmet, just 10c buy it(bought)', url:  'http://poe.trade/search/eseyagaruiruho'},  
  // {name: 'a good ring! (price may be wrong. try my luck)', url: 'http://poe.trade/search/itarihamikehar'},

]

var starters = { status: undefined }
var checkOnline = require("./check-online")


var streams = carts
  .map(function(item) {
    var latestIdx = -1;

    return Rx.Observable.timer(0, CHECK_INTERVAL)

    .flatMap(function(idx) {
        return checkOnline(item.url, item.name)
          .then(function(status) {

            /*status: online, offline, sold*/
            if (latestIdx < idx) latestIdx = idx;
            return { idx, status, item }
          })
      })
      // eliminate those requests first but comes later
      .filter(function(result) {
        // console.log('in filter', result);
        let latest = result.idx === latestIdx;
        if (!latest) console.log('VERY RARE that previous comes later', result.idx, latestIdx);
        return latest;
      })
      .distinctUntilChanged(function(result) {
        return result.status
      })
      // if we want `combineLatest` to work as soon as we get a response, 
      // we must have some starter variables.
      .startWith(starters)

  })

var source = Rx.Observable.combineLatest(streams)

function notify(msg) {

  osNotifier.notify({
    'title': 'your item is online!',
    'message': msg,
    sound: true,
  });
}


var notifier = new Rx.Subject()

source.subscribe(function(results) {
    let onlineItems = results.filter(function(result) {
        return result.status
      })
      .map(function(result) {
        return result.item
      });

    if (!onlineItems.length) return;
    var msg = onlineItems.map(function(item) {
        return item.name
      })
      .join("\n")
    // `this` is the observer implicitly created by rxjs using `Rx.Observer(f1, f2, f3)`,
    // we use it to reference `msg` or `timer` more easily. of course we could use some global var instead.
    if(msg===this.prevMsg) return;

    this.prevMsg = msg;
    notifier.onNext(msg);

    // if the msg remains the same, we keep notifying
    if(this.timer) clearTimeout(this.timer)
    this.timer = setInterval( _=> {
      notifier.onNext(msg)
    }, NOTIFY_INTERVAL)

    
  }, function(err) {
    console.log('Error: ' + err);
  },
  function() {
    console.log('Completed');
  });

/*setTimeout(function () {

  notifier.onNext('shit');
}, 3000)*/

notifier.subscribe(
  notify,

  function(err) {
    console.log('Error: ' + err);
  },
  function() {
    console.log('Completed');
  })

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
