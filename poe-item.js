'use strict'
var checkOnline = require("./check-online")
var Rx = require("rx");
var helper = require("./helper");
var isUndefined = helper.isUndefined;
var shadowCopy = helper.shadowCopy;
var isBoolean = helper.isBoolean;

const CHECK_INTERVAL = 50; /*seconds*/
const DEFAULT_SETTINGS = {
  interval: CHECK_INTERVAL,
  watchFlag: true
}
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

  constructor(data) {

    data = Object.assign({}, DEFAULT_SETTINGS, data);

    this.name = data.name;
    this.url = data.url;
    this.interval = data.interval
    this.watchFlag = data.watchFlag

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

    // TODO: find a good way to create id
    this.id = data.id || id++;

    this.notifier = new Rx.Subject()
    this._createChecker();

    if (this.watchFlag) this.watch()
  }

  get watching() {
    return this._watching;
  }

  // use a setter to conviniently change `watchFlag`

  set watching(p) {
    this._watching = p;
    this.watchFlag = p;
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

  /**
   * this information will go to client (front-end)
   */
  info() {
    return shadowCopy(this, ["id", "name", "url", "online", "interval", "watchFlag"]);
  }

  /**
   * this information will be stored into db
   */
  toJSON() {
    var obj = this.info();
    // dont store `online` into db
    delete obj.online;
    return obj;
  }

  // notify online status to parent.
  // should find a better method name.
  watch() {
    if (this.watching) return this.notifier;

    // kick start by calling `subscribe()`
    this._subscriber = this._checker.subscribe()
    this.watching = true;
    return this.notifier

  }

  // TODO: cancel pending http requests here
  // use some cache e.g. `pendingRequest[]`
  unwatch() {
    if (!this.watching) return;
    this._subscriber.dispose();
    console.log('after dispose?', 2)
    this.watching = false;
    // return true;
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

  // I wanted to introduce a `partial success` error type to our app,
  // but i seems to unneccesarily complicate our app at this early stage.
  // so there is only success or failure, no intermediate stage, for now.
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

    if (isBoolean(updates.watchFlag) && updates.watchFlag != this.watchFlag) {
      updates.watchFlag ? this.watch() : this.unwatch()
    }

    return Promise.resolve(this.info())
  }

  _changeInterval(interval) {
    var _interval = +interval
    if (this.interval === _interval) return;
    this.interval = _interval;
    this._restartLoopTimer();
  }

  _restartLoopTimer() {
    // if item is during watch, we alter time loop by restart it.
    // else we do nothing
    if (!this.watching) return;
    this._stopLoopTimer();
    this._startLoopTimer();
  }


  _createChecker() {
    this._checker = Rx.Observable.create(observer => {
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
              return new Error('oops');
            })
      })
      .map(online => {
        // deal with errors here
        // e.g. if error keeps emerging for some period of time, then we'll call `notifier.onError()`
        // possibly we'll use `retryWhen()` for `_checker`
        if (online instanceof Error) {
          return;
        }
        // NOTE here we introduce another Rx object `notifier`
        // which actually do the same thing as `_checker`.
        // The reason behind this is that `_checker` needs to start and stop, 
        // which is achieved by being subscribed/unsubscribed. (cold observable)
        // Thus we can not expose it to the outer api lest our consumer's subscribing/un would mess up the logic
        // So we end up using another Rx object for the task.
        this.notifier.onNext(online);
      })


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
    if (!this.watching) return;
    clearInterval(this._loopTimer);
    // TODO: may cancel pending requests, if possible
  }

}


function round(number, bits) {
  // should find a better name
  bits = bits || 2;
  let mul = Math.pow(10, bits);
  return Math.round(number * mul) / mul;
}

// TEST:
/*var p = new PoeItem({
  name: "shit",
  url: 'http://poe.trade/search/onokasedahauih',
  // watchFlag: false,
  interval: 5
})

p.watch() 
  .subscribe(function(a) {

    console.log('a?', a);
  }, function(e) {
    console.log('err??', e)
  }, function() {
    console.log('inf!')
  })

setTimeout(function() {
  console.log('about to unwatch')
  p.unwatch()

}, 20 * 1000)*/


module.exports = PoeItem;
