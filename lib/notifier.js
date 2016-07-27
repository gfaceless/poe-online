'use strict'
const sysNotifier = require('node-notifier');
var Rx = require("rx");

var Timer = require("./timer");
var {isEmpty, isBoolean} = require("./helper")
var foobar = require("./foobar");

const DEFAULT_SETTING = {
  buzzInterval: 30,
  sound: true,
  buzz: true,
  title: 'fuck up'
}

class Notifier {


  constructor(opts) {
    opts = Object.assign({}, DEFAULT_SETTING, opts);
    this.settings = opts;

    this.sysNotifier = sysNotifier;
    this.foobar = foobar;

    this._buzzTimer = new Timer(this._buzzNotify, _ => this.settings.buzzInterval * 1000, { context: this });
  }

  /**
   * [notify description]
   * @param  {[type]} msg can be a string or a function, if a function, buzz message will be generate dynamically
   *                      everytime `_buzzNotify()` runs
   */
  notify(msg) {
    if (isEmpty(msg)) return;
    var msgFn;
    if (typeof msg == 'function') {
      msgFn = msg;
    }

    this._buzzMsg = msg;
    this._notify(msgFn ? msgFn() : msg);
    this._buzzTimer.reset();
    if (this.settings.buzz) this._buzzTimer.start();
  }

  /**
   * using this function when we dont want to actively notify.
   * If notification has just happend, and buzz is under its effect, 
   * it will use buzz chance to notify end user, and if buzz is timedout or disabled, end user will
   * recieve nothing.
   *
   * if notification has never started, it will behave like a normal notifcation.
   * TODO: this function is not intuitive, need some rework
   */
  passiveNotify(msg) {
    if (isEmpty(msg)) return;
    // we use `typeof _buzzMsg` as a way to determine if there was notification before
    // a crude but effective way`
    if (typeof this._buzzMsg == 'undefined') {
      this.notify(msg);
      return;
    }

    // we dont care about other stuff, because we are in a "passive" function
    // we just change buzzMsg.
    this._buzzMsg = msg;
  }

  // make notifier a clean slate
  // clean all the buzz
  clear() {
    this._buzzMsg = undefined;
    this._buzzTimer.reset();
  }

  // currently support buzz on/off as well as buzz interval
  // since Timer's interval is a getter, it will automatically update its interval
  // (not very intuitive api, we'll see to this, maybe change to `timer.updateInterval()`)
  // also note such api does not have a return value (yet).
  // we plan to return an error if fail to update, or make this promise-based api  
  updateSettings(opts) {

    console.log('lets see what happened', opts);
    var lastBuzz = this.settings.buzz;

    Object.assign(this.settings, opts)
    console.log('this.settings', this.settings);

    if (isBoolean(opts.buzz) && opts.buzz != lastBuzz) {
      opts.buzz ? this._enableBuzz() : this._disableBuzz();
    }
  }

  _enableBuzz() {

    this._buzzTimer.start()
    this.settings.buzz = true;
  }

  _disableBuzz() {

    this._buzzTimer.pause();
    this.settings.buzz = false;
  }


  _buzzNotify() {
    var msg = (typeof this._buzzMsg == 'function') ? this._buzzMsg() : this._buzzMsg;
    this._notify(msg);
  }

  /**
   * raw notification method
   */
  _notify(msg) {
    if (!msg) return;

    this.sysNotifier.notify({
      'title': this.settings.title,
      'message': msg,
      sound: this.settings.sound,
    });

    if(this.settings.sound) this.foobar.beep(5);
  }
}



module.exports = Notifier;

// Crude Test:
/*var n = new Notifier({ title: 'shit', buzzInterval: 10 * 1000 });

n.notify('hi there')

setTimeout(function() {
  console.log('about to notify hey girl')
  n.notify('hey girl')

  setTimeout(function() {
    console.log('about to _disableBuzz');
    n._disableBuzz()

    setTimeout(function() {
      console.log('about to _enableBuzz');
      n._enableBuzz()
      n.notify('oops')
      console.log('about to update settings')
      n.updateSettings({ buzzInterval: 30 * 1000, title: 'shit2' })

    }, 30 * 1000)
  }, 15000)
}, 5 * 1000)
*/
