var FnChain = require("../fn-chain");
// var Promise = require("bluebird");
var chai = require('chai');
var expect = chai.expect;
var should = chai.should();
chai.use(require("chai-as-promised"));
var sinon = require("sinon");

function f1(obj) {
  // return Promise.delay(2000)
  return new Promise(function(_r) {
    setTimeout(function() {
      _r('f1 resolved');
    }, 2000)
  })
}

function f2() {
  // return Promise.delay(2000, 'f2 resolve')
}

function f3() {
  return new Promise(function(_r) {
    setTimeout(function() {
      _r();
    }, 2000)
  })
}

function f4() {
  return Promise.resolve('shit')
}

function e1() {

  return new Promise(function(_, _r) {
    setTimeout(function() {
      _r(new Error('e1'));
    }, 2000)
  })
}


describe("function chain", function() {
  this.timeout(0);
  var o = { f1, f2, f3, e1 };
  var checker1, checker2, checker3

  beforeEach(function() {

    // note after these operations, `o.f1` no longer equals to `f1`
    // TODO: maybe use sinon sandbox instead of before/after hooks
    sinon.spy(o, "f1")
    sinon.spy(o, "f2")
    sinon.spy(o, "f3")
    sinon.spy(o, "e1")

    checker1 = sinon.spy()
    checker2 = sinon.spy()
    checker3 = sinon.spy()
  })

  afterEach(function() {
    o.f1.restore()
    o.f2.restore()
    o.f3.restore()
    o.e1.restore()
  })

  it("execute functions in chain in sequence", function() {

    // WTF promise-based test is so awkward!!
    // It seems to be the only way to make delayed promise

    var chain = new FnChain([o.f1, o.f2, o.f3])

    return Promise.all([
        chain.promiseFor(o.f1).then(checker1),
        chain.promiseFor(o.f2).then(checker2),
        chain.promiseFor(o.f3).then(checker3)
      ])
      .then(function() {
        sinon.assert.callOrder(o.f1, checker1, o.f2, checker2, o.f3, checker3)
      })
  });

  it('error handling: rejected promise does not interupt execution chain', function() {
    const ERR = new Error('shitttt')

    var chain = new FnChain([o.f1, o.e1, o.f3])

    // `Promise.all` is fail-fast, for this test we must make sure that
    // every promise chain passed into it will be resolved rather than rejected
    // since `e1` will be rejected, we must continue the promise chain 
    // by catching the error in the `checker2` callback 
    return Promise.all([
        chain.promiseFor(o.f1).then(checker1),
        chain.promiseFor(o.e1).then(null, checker2),
        chain.promiseFor(o.f3).then(checker3)
      ])
      .then(function() {
        checker2.args[0][0].should.be.an('error');
        sinon.assert.callOrder(o.f1, checker1, o.e1, checker2, o.f3, checker3)
      })

  })

  it('handle sync-throw-error functions'/*, function() {
    var chain = new FnChain([o.f1, o.bad1, o.f2]);


  }*/)

  /*var p1 = chain.add(e1).should.be.rejectedWith(Error)
  var p2 = chain.add(f4);
  var p3 = chain.promiseFor(f1).should.eventually.equal('f1 resolve');

  return Promise.all([p1, p2, p3]);*/

  it.skip('test progress', function() {
    var progressSpy = sinon.spy();

    return promise.then(null, null, progressSpy).then(function() {
      progressSpy.should.have.been.calledWith("33%");
      progressSpy.should.have.been.calledWith("67%");
      progressSpy.should.have.been.calledThrice;
    });
  })
})




process.on('unhandledRejection', function(reason, p) {
  console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging here
});
process.on('rejectionHandled', function(p) {
  console.log("Rejection was just handled ", p);
  // application specific logging here
});
