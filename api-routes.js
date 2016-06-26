'use strict'

var express = require('express');
var router = express.Router();
var resProto = express.response;

var poe = require("./item-mgr");

router.get('/', function(req, res) {
  res.send('shit');
})

router.post('/item/', function(req, res, next) {
  var name = req.body.name;
  var url = req.body.url;

  poe.addItem(name, url)
    // hope I could use new bind notation `::res.ok`
    .then(res.ok.bind(res), res.err.bind(res))
});

router.get('/item/:id', function(req, res) {
  let id = req.params.id

  poe.showItem(id)
    .then(res.ok.bind(res), res.err.bind(res))
});

router.get('/item', function(req, res) {

  poe.showItems()
    .then(res.ok.bind(res), res.err.bind(res))

})

router.delete('/item/:id', function(req, res) {
  let id = req.params.id

  poe.removeItem(id)
    .then(res.ok.bind(res), res.err.bind(res))
});


router.put('/item/:id', function(req, res) {
  let id = req.params.id

  poe.changeItem(id, req.body)
    .then(res.ok.bind(res), res.err.bind(res))
});


router.get('/ntf/setting', function(req, res) {
  poe.showNtfSetting()
    .then(res.ok.bind(res), res.err.bind(res))

})
router.post('/ntf/resume', function(req, res) {
  poe.resumeNotification()
    .then(res.ok.bind(res), res.err.bind(res))
})

router.post('/ntf/pause', function(req, res) {
  poe.pauseNotification()
    .then(res.ok.bind(res), res.err.bind(res));
})

// notification setting
router.post('/ntf/setting', function(req, res) {

  var opts = {};
  var sec = req.body.interval;
  if (sec) opts.interval = sec;

  poe.changeNtfSetting(opts)
    .then(res.ok.bind(res), res.err.bind(res))

});

/*function responseWithOk(res, data) {
  let ret = {
    success: true
  };
  if (data) ret.data = data;

  res.json(ret);
}

function responseWithError(res, err) {
  res.status(400)
    .json({
      success: false,
      err: err
    })
}*/

/**
 * extending response:
 * @param  {[type]} data [description]
 * @return {[type]}      [description]
 */
resProto.ok = function(data) {
  console.log('in resProto ok')
  let ret = {
    success: true
  };
  if (data) ret.data = data;

  // note `json()` calls `send()`
  // our api is json based for now.
  return this.json(ret);
}

// TODO: use next(err) instead
resProto.err = function(err) {
  console.log('in resProto err')
  let ret = {
    success: false
  };
  // deal with different kinds of errors here:
  if (err) ret.err = err.message;

  return this.status(400).json(ret);
}




module.exports = router;
