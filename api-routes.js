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
    .then(res.ok.bind(res), next)
});

router.get('/item/:id', function(req, res, next) {
  let id = req.params.id

  req.poe.showItem(id)
    .then(res.ok.bind(res), next)
});

router.get('/item', function(req, res, next) {

  req.poe.showItems()
    .then(res.ok.bind(res), next)

})

router.delete('/item/:id', function(req, res, next) {
  let id = req.params.id

  req.poe.removeItem(id)
    .then(res.ok.bind(res), next)
});


router.put('/item/:id', function(req, res, next) {
  let id = req.params.id

  req.poe.updateItem(id, req.body)
    .then(res.ok.bind(res), next)
});

router.get('/settings', function(req, res, next) {
  req.poe.showSettings()
    .then(res.ok.bind(res), next)

})

router.put('/settings', function(req, res, next) {

  // note here we should not care about if `req.body` is empty or not
  // all logic goes to `poe` itself 
  req.poe.updateSettings(req.body)
    .then(res.ok.bind(res), next)

});

router.get('/', function(req, res, next) {
  req.poe.summary()
    .then(res.ok.bind(res), next)

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





module.exports = router;
