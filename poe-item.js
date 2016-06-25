'use strict'
var checkOnline = require("./check-online")
var Rx = require("rx");

const CHECK_INTERVAL = 100 * 1000;
let id = 0;

class PoeItem {

  constructor(name, url) {

    this.name = name;
    this.url = url;
    this.online = false;
    this.checkedTimes = 0;
    this.startedTime = undefined;
    this.interval = CHECK_INTERVAL

    this.id = id++;
  }

  get onlineInfo() {
    var info = this.name + ' is ' + (this.online ? 'online' : 'offline');
    if (this.online) {
      let durationInfo = this.startedTime ?
        ' for ' + round((Date.now() - this.startedTime) / 1000 / 60, 1) + ' min' : ' just online';
      info += durationInfo;
    }
    info += ` (${this.checkedTimes} times)`

    return info;
  }

  checkOnline() {

    return checkOnline(this.url, this.name)
      .then(online => {

        if (online && !this.online) this._startRecord();
        if (!online && this.online) this._endRecord();

        this.checkedTimes++;
        this.online = online;
        return online;
      })
  }



  changeInterval(interval) {
    this.interval = interval;

    // if item is doing checking, we alter time loop by restart it.
    // else we do nothing but simply change interval
    if (!this.checking) return;
    this._stopLoopTimer();
    this._startLoopTimer();
  }



  // we notify our parent online status.
  // should find a better method name.
  startCheck() {
    if (this.checking) return;
    if (!this.inited) this.init();

    // subscribe the checker
    // kick start
    this._subscriber = this.checker.subscribe()
    this.checking = true;
  }

  stopCheck() {
    if (!this.checking) return;
    this._subscriber.dispose();
    console.log('after dispose?', 2)
    this.checking = false;
  }

  // why do we seperate constructor and init? idk.. wierd tradition
  // maybe for test?
  init() {
    // create checker
    this.checker = Rx.Observable.create(observer => {
        console.log('this will be called when subscribed or resubscribed')
        this._observer = observer;
        this._startLoopTimer();
        return _ => {
          console.log('this will be called when unsubscribed!!');
          this._stopLoopTimer();
          console.log('after dispose?', 1)
        }
      })
      .flatMap(_ => {
        return this.checkOnline()
          .then(
            online => online,
            function(err) {
              // TODO: Add system erorr handling
              console.log(`Racing happened, we caught it as an error`, err);
            })
      })
      .map(online => {
        this.notifier.onNext(online);
      })

    this.notifier = new Rx.Subject()
    this.inited = true;
  }

  _startRecord() {
    this.startedTime = Date.now();
  }

  _endRecord() {
    this.startedTime = undefined;
  }
  _startLoopTimer() {
    this._loopTimer = setInterval(_ => {
      console.log('in loop');
      this._observer.onNext();
    }, this.interval)
    this._observer.onNext()
  }

  _stopLoopTimer() {
    if (!this.checking) return;
    clearInterval(this._loopTimer)
      // TODO: may cancel pending requests, if possible
  }

}


function round(number, bits) {
  // should find a better name
  bits = bits || 2;
  let mul = Math.pow(10, bits);
  return Math.round(number * mul) / mul;
}
module.exports = PoeItem;
