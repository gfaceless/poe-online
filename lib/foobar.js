var Promise = require("bluebird");
var child_process = require("child_process");
var exec = Promise.promisify(child_process.exec)
var path = require("path");

var beeper = {
  beep(times) {
    if (typeof times == 'undefined') times = 1;
    if (times === 0) return 'fin';

    return this._play()
      .then(_ => {        
        return this.beep(--times);
      })

  },

  audioPath: path.resolve(__dirname, "beep.mp3"),

  _play() {
    return exec(`foobar2000 ${this.audioPath} /immediate`).delay(1000)
  },

  launchPlayer() {
    var cmd = `foobar2000`;
    const spawn = child_process.spawn;
    var c = spawn(cmd, [], {
      detached: true,
      stdio: ['ignore']
    });
    c.unref()
  }
}

beeper.launchPlayer();

module.exports = beeper;

/*beeper.beep(5)
.then(function(a) {
  console.log('suc', a)
}, function(e) {
  console.log('err', e)
})
*/