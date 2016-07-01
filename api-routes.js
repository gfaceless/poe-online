'use strict'

var express = require('express');
var router = express.Router();
var resProto = express.response;
var itemMgrFactory = require("./item-mgr");


var factoryPromise = itemMgrFactory.create('app')

router.use(function(req, res, next) {

  factoryPromise.then(poe => {
    req.poe = poe;
    next();
  })

})


router.post('/item/', function(req, res, next) {
  console.log('in post item router', req.body)

  req.poe.addItem(req.body)
    // hope I could use new bind notation `::res.ok`
    .then(res.ok.bind(res), res.err.bind(res))
});

router.get('/item/:id', function(req, res) {
  let id = req.params.id

  req.poe.showItem(id)
    .then(res.ok.bind(res), res.err.bind(res))
});

router.get('/item', function(req, res) {

  req.poe.showItems()
    .then(res.ok.bind(res), res.err.bind(res))

})

router.delete('/item/:id', function(req, res) {
  let id = req.params.id

  req.poe.removeItem(id)
    .then(res.ok.bind(res), res.err.bind(res))
});


router.put('/item/:id', function(req, res) {
  let id = req.params.id

  req.poe.updateItem(id, req.body)
    .then(res.ok.bind(res), res.err.bind(res))
});

router.get('/settings', function(req, res) {
  req.poe.showSettings()
    .then(res.ok.bind(res), res.err.bind(res))

})

router.post('/settings', function(req, res) {

  // note here we should not care about if `req.body` is empty or not
  // all logic goes to `poe` itself 
  req.poe.updateSettings(req.body)
    .then(res.ok.bind(res), res.err.bind(res))

});

router.get('/', function(req, res) {
  req.poe.summary()
    .then(res.ok.bind(res), res.err.bind(res))

})
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
