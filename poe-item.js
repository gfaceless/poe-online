'use strict'
var checkOnline = require("./check-online")
var Rx = require("rx");


const CHECK_INTERVAL = 100; /*seconds*/
let id = 0;

class PoeItem {

  static create(name, url) {
    console.log('static ok: ', this === PoeItem)

    let validated = PoeItem.validate();
    if (!validated) return false;

    // add database logic here?
    // NOTE try seperating db logic
    return new PoeItem(name, url);
  }

  // basic validation 
  static validate(info) {
    return true;
  }

  constructor(name, url) {

    this.name = name;
    this.url = url;

    /**
     * I want some basic validation here
     * but it is not intuitive for constructor to indicate validation failure.
     * (because it must return an object, the best we could do is to return 
     * something lie {faliure: true} ---- not intuitive) 
     * another way, throwing an error, not convinient neither 
     * (needs global error handling or try/catch)
     *
     * so in near future, I'll try some factory method like `PoeItem.create()` for the job
     */

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

  info() {
    return shadowCopy(this, ["id", "name", "url", "online", "interval"]);
  }

  toJSON(){    
    return this.info();
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

  update(updates) {
    // call validation here
    if (updates.name) this.name = updates.name;

    // if url changes, we should start check again asap    
    // operator precedence `==` > `&&`
    if (updates.url && this.url != updates.url) {
      this.url = updates.url;
      this.checkedTimes = 0;
      this._restartLoopTimer();
    }

    if (updates.interval) this._changeInterval(updates.interval)

    return new Promise.resolve(this.info())
  }

  _changeInterval(interval) {
    var _interval = +interval
    if(this.interval === _interval) return;
    this.interval = _interval;
    this._restartLoopTimer();
  }

  _restartLoopTimer() {
    // if item is doing checking, we alter time loop by restart it.
    // else we do nothing
    if (!this.checking) return;
    this._stopLoopTimer();
    this._startLoopTimer();
  }

  // notify online status to parent.
  // should find a better method name.
  startCheck() {
    if (this.checking) return false;
    if (!this.inited) this.init();

    // subscribe the checker
    // kick start
    this._subscriber = this.checker.subscribe()
    this.checking = true;
    return true;
  }

  stopCheck() {
    if (!this.checking) return false;
    this._subscriber.dispose();
    console.log('after dispose?', 2)
    this.checking = false;
    return true;
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
              console.log(`err happened, we caught it as an error, may be network failure or racing`, err);
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
    let ms = this.interval * 1000;    
    this._loopTimer = setInterval(_ => {
      console.log('in loop');
      this._observer.onNext();
    }, ms)
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


function shadowCopy(obj, props) {
  var clone = {};
  if (!props) {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('_')) return;
      clone[key] = obj[key];
    })
  } else {
    props.forEach(function(prop, i) {
      clone[prop] = obj[prop];
    });
  }

  return clone;
}

module.exports = PoeItem;
