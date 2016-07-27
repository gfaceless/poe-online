'use strict';

var Promise = require('bluebird')
var request = require('request')

/*Promise.config({
  cancellation: true
})*/

let onlineStr = '<span class="success label">online</span>'
  // TODO: cache should have an auto clean function. or use structure such as LimitMap
let cache = {};

module.exports = function check(url, meta) {

  return new Promise(function(resolve, reject, onCancel) {

    request(url, function(error, res, body) {
      if (error) {
        /*ommit error for now*/
        return reject(error);
      }

      if (res.statusCode != 200) {
        return reject(new Error(`res error, code ${res.statusCode}`))
      }

      var dateStr = res.headers.date;
      var date, ts;
      try {
        date = new Date(dateStr);
      } catch (e) {}

      // TODO: should have more robust logic
      // atm date parse may break normal code flow. e.g. server returns gibberish.
      if (date) {
        ts = date.getTime()

        if (!cache[url] || cache[url] < ts) {
          cache[url] = ts;
        } else { // if server "date" header has an older timestamp, we reject the promise
          let diff = Math.round((ts - cache[url])/1000);
          return reject(new Error(`returned timestamp is stale, ${diff} sec later`))
        }
      }


      let online = body.includes(onlineStr);
      if (online) {
        // TODO: cancel remaining requests
        console.log(`checked, ONLINE ${meta}`, new Date().toLocaleTimeString())
      } else {
        console.log('checked, not online', new Date().toLocaleTimeString())
      }
      resolve(online);

    })

  });

}
