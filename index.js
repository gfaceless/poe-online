'use strict';
const notifier = require('node-notifier');
const ONE_MIN = 60 * 1000;

var Rx = require("rx");
var urls

var carts = [
  {name: "wind of change", url: 'http://poe.trade/search/imokimikimaham'},
  {name: "enlighten <= 50 chaos", url: 'http://poe.trade/search/atoamanoarinaz'},
  // {name: "some always online item(test only)", url: 'http://poe.trade/search/siterehusitara'}, // online
  {name: '(buy it!)Maligaro > 45 mul', url: 'http://poe.trade/search/watakenikikomi'} 
]

var starters = {status: undefined}

var checkOnline = require("./check-online")


var streams = carts
.map(function(item) {
  var latestIdx = -1;

  return Rx.Observable.timer(0, ONE_MIN)
  
  .flatMap(function(idx) {
    return checkOnline(item.url, item.name)
    .then(function(status) {
      
      /*status: online, offline, sold*/
      if(latestIdx < idx) latestIdx = idx;
      return {idx, status, item}
    })
  })
  // eliminate those requests first but comes later
  .filter(function(result) {
    // console.log('in filter', result);
    let latest = result.idx === latestIdx;
    if(!latest) console.log('VERY RARE that previous comes later', result.idx, latestIdx);
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

function notify(msg){

  notifier.notify({
    'title': 'your item is online!',
    'message': msg,
    sound: true,
  });
}


var notifyStream;

source.subscribe(
    function (results) {
        if(notifyStream) notifyStream.dispose();

        console.log('here in Next!!, total %d times on start!', carts.length+1);
        let onlineItems = results.filter(function(result) {
          return result.status
        })
        .map(function(result) {
          return result.item
        });

        if(!onlineItems.length) return;
        var msg = onlineItems.map(function(item) {return item.name})
        .join("\n")

        // frequently notify our user
        // TODO: add some interaction allowing user to discard further notification
        notifyStream = Rx.Observable.timer(0, ONE_MIN/2)
        .subscribe(function(idx) {

          notify(`${msg}\n(${idx+1} times)`);
          
        }, function() {}, function() {
          console.log('notifyStream Completed')
        })


    },

    function (err) {
        console.log('Error: ' + err);
    },
    function () {
        console.log('Completed');
    });
