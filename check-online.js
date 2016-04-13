'use strict';


var Promise = require('bluebird')
var request = require('request')

Promise.config({
  cancellation: true
})

var interval = 60 * 1000
let onlineStr = '<span class="success label">online</span>'


module.exports = function check(url) {
  return new Promise(function(resolve, reject, onCancel) {
    // store pending requests:
    var requests = [];

    function go() {
      var r = request(url, function(error, response, body) {

        if (error) { /*ommit error for now*/ }

        pop(requests, r)

        if (!error && response.statusCode == 200) {

          let online = body.includes(onlineStr);
          if (online) {
            // TODO: cancel remaining requests
            console.log('checked, ONLINE', new Date().toLocaleTimeString())

            resolve()
            clearInterval(timer)

            // cancel pending requests
            requests.forEach(function(r) {
              r.abort();
            })

          } else {
            console.log('checked, not online', new Date().toLocaleTimeString())

          }
        }
      })

      requests.push(r)
    }
    var timer = setInterval(go, interval)
    go();
    onCancel(function() {
      console.log('cancelled!')
      clearInterval(timer)
    })
  })
}


function pop(arr, item) {
  var idx = arr.indexOf(item)
  if (idx > -1) arr.splice(idx, 1)
}