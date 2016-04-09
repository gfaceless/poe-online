'use strict';
const notifier = require('node-notifier');
var request = require('request');
// String
// notifier.notify('Message');

var url;
let onlineStr = '<span class="success label">online</span>'
const interval = 60 * 1000;


url = 'http://poe.trade/search/imokimikimaham';

var run = function() {

  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      let online = body.includes(onlineStr);
      if (online) {
        notifier.notify({
          'title': 'My notification',
          'message': 'on line!',
          sound: true,
        });
        console.log('checked, ONLINE', new Date().toLocaleTimeString())
      } else {

        console.log('checked, not online', new Date().toLocaleTimeString())
      }

    }
  })
}

run();
setInterval(run, interval);