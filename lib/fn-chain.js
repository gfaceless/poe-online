'use strict'

const DEFAULT_OPTS = {
  autoStart: true
}

class FnChain {

  constructor(arr, opts) {
    this._chain = [];
    opts = Object.assign({}, DEFAULT_OPTS, opts);
    this._context = opts.context || null;
    this._autoStart = opts.autoStart

    this._promiseMap = new WeakMap();

    arr = arr || [];
    arr.forEach((fn, i) => {
      this._add(fn);
    });

    if (this._autoStart) this._start();
  }

  add(fn) {
    var p = this._add(fn);
    if (this._chain.length == 1 && this._autoStart) this._start();
    return p;
  }

  // start
  start() {
    this._autoStart = true;
    this._start();
  }

  promiseFor(fn) {
    return this._promiseMap.get(fn);
  }

  // no stop function yet


  _start() {
    if (this.running) return;
    var fn = this._chain[0];
    if (!fn) return;

    fn();
    this.running = true;
  }

  _add(fn) {
    var resolve, reject;
    var wrapper = _ => {
      var next = this._next.bind(this);
      var doReject = err => {
        reject(err);
        Promise.resolve().then(next)
      }
      var doResolve = data => {
        resolve(data);
        Promise.resolve().then(next);
      }

      // returned value could be either a promise or a simple value
      // if either case, we resolve the returned value,
      // and execute the next function in the fn-chain
      var ret, err;
      try {
        ret = fn.call(this._context);
      } catch (e) {
        err = e;
      }

      if (err) return doReject(err);
      // ret is likely to be `undefined`
      if (!promiseLike(ret)) {
        return doResolve(ret);
      }

      ret.then(doResolve, doReject)

    }

    this._chain.push(wrapper)

    var promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    })

    this._promiseMap.set(fn, promise);

    return promise
  }

  _next() {

    var nextWrapperFn
    if (nextWrapperFn = this._chain[1]) {
      // process.nextTick(nextWrapperFn);
      nextWrapperFn()
    } else {
      this.running = false;
    }

    // the array manipulation (shift) is executed in `_next()` instead of in wrapper,
    // such design is not intuitive,
    // the intention is not clear, maybe I wanted to keep a reference to the currently running funciton.
    // For immediately-executed function, `unshift` is ok, but since this lib supports promise chain
    // and most likely is used so, keep a ref of the pending function sounds good. 
    this._chain.shift();
  }


}

function promiseLike(p) {

  return p && p.then
}

module.exports = FnChain
