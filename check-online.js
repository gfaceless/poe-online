'use strict';

var Promise = require('bluebird')
var request = require('request')

/*Promise.config({
  cancellation: true
})*/

let onlineStr = '<span class="success label">online</span>'


module.exports = function check(url, meta) {
  return new Promise(function(resolve, reject, onCancel) {

    request(url, function(error, response, body) {
      if (error) { /*ommit error for now*/ }

      if (!error && response.statusCode == 200) {

        let online = body.includes(onlineStr);
        if (online) {
          // TODO: cancel remaining requests
          console.log(`checked, ONLINE ${meta}`, new Date().toLocaleTimeString())
        } else {
          console.log('checked, not online', new Date().toLocaleTimeString())
        }
        resolve(online);
      }
    })

  });

}