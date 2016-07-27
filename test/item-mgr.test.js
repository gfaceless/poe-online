var assert = require('chai').assert;
var expect = require('chai').expect;
var should = require('chai').should();

var sinon = require("sinon");
var Bluebird = require("bluebird");

var itemMgrFactory = require("../app/item-mgr");
var PoeItem = require("../app/poe-item");

var poe;
var noop = function() {}

before(function() {
  const collectionName = '_test_'

  return itemMgrFactory._dbCollection.destroy()
    .then(function() {
      return itemMgrFactory.create(collectionName)
        .then(function(p) {
          poe = p
        })
    })
    .catch(function() {
      console.log('oops', err)
      throw err;
    })
});

after(function() {
  // return itemMgrFactory._dbCollection.destroy()
})

var ALWAYS_ONLINE_URL = "http://poe.trade/search/etiohazasiatoy"
var ALWAYS_OFFLINE_URL_1 = "http://poe.trade/search/anyatootaritak"
var ALWAYS_OFFLINE_URL_2 = "http://poe.trade/search/agokokewoketun"


describe('TEST FOR ITEM-MANAGER', function() {
  this.timeout(0);

  afterEach(function() {
    // poe.removeItem
  })

  // TODO: stub checkOnline() and make a mock server
  // maybe use `useFakeTimer()` as well.
  
  // these tests are semi-manual
  describe('(has db manipulation)', function() {

    it('should notify user that some item is online', function() {
      return poe.addItem({
          name: "always online",
          url: ALWAYS_ONLINE_URL
        })
        .then(function(item) {
          // keep mocha running for some time
          return Bluebird.delay(15 * 1000)
        })
        .then(function() {
          return poe.removeItem(0);
        })
        .then(function() {
          poe.items.should.have.length.of(0);
        })
    })
    it('online item becomes offline, no longer any notification');
    it('opens the webpage in browser and buzz stops after clicking the popup');
    

  });

  describe('unit tests', function() {
    before(function() {
      return poe._clear()
    })

    var sandbox;

    beforeEach(function() {
      
       sandbox = sinon.sandbox.create();
    })

    afterEach(function() {      
      sandbox.restore();
    })


    it('add 2 x offline items: should call `checkOnline` twice', function() {
      
      var checkOnline = sandbox.spy(PoeItem.prototype, "checkOnline");

      var item1 = poe._addItem({
        name: "cospri1",
        url: ALWAYS_OFFLINE_URL_1
      })

      var item2 = poe._addItem({
        name: "cospri2",
        url: ALWAYS_OFFLINE_URL_2
      })

      var p1 = Bluebird.fromCallback(function(cb) {
        item1.notifier
          .subscribe(function(online) {
            expect(online).to.be.false;
            cb();
          })

      })

      var p2 = Bluebird.fromCallback(function(cb) {
        item2.notifier
          .subscribe(function(online) {
            expect(online).to.be.false;
            cb();
          })
      })

      return Promise.all([p1, p2])
        .then(function() {
          expect(checkOnline.callCount).to.equal(2)
        })

    });

    it('unwatch: should only call `checkOnline` once')

  })

});