'use strict'
const sysNotifier = require('node-notifier');
var Rx = require("rx");

var Timer = require("./timer");
var isEmpty = require("./helper").isEmpty;

const DEFAULT_SETTING = {
  interval: 30 * 1000,
  sound: true,
  buzz: true,
  title: 'fuck up'
}

class Notifier {


  constructor(opts) {
    opts = Object.assign({}, DEFAULT_SETTING, opts);
    this.settings = opts;

    this.sysNotifier = sysNotifier;
    this._buzzTimer = new Timer(this._buzzNotify, _ => this.settings.buzzInterval, { context: this });
  }

  notify(msg) {
    if (isEmpty(msg)) return;

    this._buzzMsg = msg;
    this._notify(msg);
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

    var lastBuzz = opts.buzz;

    Object.assign(this.settings, opts)
    if (opts.buzz == lastBuzz) return;
    opts.buzz ? this._enableBuzz() : this._disableBuzz();

  }

  _enableBuzz() {
    if (this.settings.buzz) return false;
    var started = this._buzzTimer.start()
    this.settings.buzz = started;
    return started;
  }

  _disableBuzz() {
    if (!this.settings.buzz) return false;

    return this._buzzTimer.pause();
  }


  _buzzNotify() {
    this._notify(this._buzzMsg)
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
