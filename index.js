'use strict';
const notifier = require('node-notifier');
var Promise = require('bluebird');

var check = require('./check-online')

// String
// notifier.notify('Message');

var urls

urls = [
  'http://poe.trade/search/imokimikimaham',
  'http://poe.trade/search/atoamanoarinaz',
  // 'http://poe.trade/search/siterehusitara', // online
]
// url = 'http://poe.trade/search/kononihuramduz';

var checkers = urls.map(function(url) {
  return check(url)
})


function notify(){
  notifier.notify({
    'title': 'My notification',
    'message': 'on line!',
    sound: true,
  });
}
Promise.any(checkers)
.then(function() {
  checkers.forEach(function(c){
    // note: the one fullfilled won't call `onCancel()`
    c.cancel();
  })
  notify();
  setInterval(notify, 60*1000)
})
.catch(function(e) {console.log('err', e)})