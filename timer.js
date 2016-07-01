'use strict'

const DEFAULT_OPTS = {
  paused: true,
  context: null,
  executeBeforeFirstLoop: false
}
class Timer {

  constructor(loopFn, intervalGetter, opts) {
    this._loopFn = loopFn
    this._intervalGetter = intervalGetter;
    opts = Object.assign({}, DEFAULT_OPTS, opts);

    if (opts.context) {
      this._loopFn = loopFn.bind(opts.context)
      this._intervalGetter = intervalGetter.bind(opts.context)
    }

    this.opts = opts;
    this.paused = opts.paused // easier to ref
    this._beforeFirstLoop = true;
    if (!this.paused) this.start();
  }

  reset() {
    if (!this.paused) {
      clearTimeout(this._timeoutId);
    }
    this._beforeFirstLoop = true;

    this.leftTime = 0;
    this.paused = true;
  }

  pause() {
    if (this.paused) return false;
    this.leftTime = this.waitTime - (Date.now() - this.lastTime)

    clearTimeout(this._timeoutId);
    this.paused = true;
    return true;
  }

  resume() {
    if (!this.paused) return false;
    // is possible `leftTime` < 0?
    // I'm not sure, this code is to protect from such situation
    if (this.leftTime > 0) {
      setTimeout(_ => {
        this._start()

      }, this.leftTime)

    } else this._start()

    this.paused = false;
    return true;
  }

  start() {
    return this.resume();
  }

  _start() {
    // currently interval is passed like a getter function
    // we'll try implement `changeInterval()` in the future.
    let ms = this._intervalGetter();
    if (isNaN(ms)) throw new Error("`intervalGetter()` should return a number")

    if (!(this._beforeFirstLoop && !this.opts.executeBeforeFirstLoop)) this._loopFn();

    this._timeoutId = setTimeout(_ => {
      this._beforeFirstLoop = false;
      this._start();
    }, ms)

    this.waitTime = ms;
    this.lastTime = Date.now();
  }
}


// Crude Test
/*var o = {
	str: "some info",
	ms: 5 * 1000,
	f1: function() {
		console.log('f1', this.str)
	},
	getInterval: function() {
		return this.ms
	}
}

var timer = new Timer (o.f1, o.getInterval, o);

console.log('paused?', timer.paused)
setTimeout(function () {
	timer.pause();
	console.log('paused?', timer.paused)
	setTimeout(function () {
		timer.resume();
		console.log('paused?', timer.paused)
	}, 5000)
}, 4500)*/


module.exports = Timer;
