'use strict'

 class Timer {

  constructor(loopFn, intervalGetter, context) {
    this._loopFn = loopFn
    this._intervalGetter = intervalGetter;
    if (context) {
      this._loopFn = loopFn.bind(context)
      this._intervalGetter = intervalGetter.bind(context)
    }
    this.paused = false;
    this._start();
  }

  pause() {
    if (this.paused) return;
    this.leftTime = this.waitTime - (Date.now() - this.lastTime)
      // if (this.leftTime < 0) 

    clearTimeout(this._timeoutId);
    this.paused = true;
  }

  resume() {
    if (!this.paused) return;
    // is possible `leftTime` < 0?
    // I'm not sure, this code is to protect from such situation
    if (this.leftTime > 0) {
      setTimeout(_ => {
        this._start()

      }, this.leftTime)

    } else this._start()

    this.paused = false;
  }

  _start() {
    let ms = this._intervalGetter();
    
    if(isNaN(ms)) throw new Error("`intervalGetter()` should return a number") 
    	
    this._loopFn();

    this._timeoutId = setTimeout(_ => {
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