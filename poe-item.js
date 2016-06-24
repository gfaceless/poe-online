'use strict'
var checkOnline = require("./check-online")

class PoeItem {


  constructor(name, url) {

    this.name = name;
    this.url = url;
		this.online = false;
		this.checkedTimes = 0;
		this.startedTime = undefined;
  }

  get onlineInfo () {
		var info = this.name + ' is ' + (this.online ? 'online': 'offline');
		if(this.online) {
	  	let durationInfo = this.startedTime ? 
	  	// TODO: should round up to one digit.
	  	' for ' + round((Date.now()-this.startedTime) / 1000 / 60, 1) + ' min' : ' just online';			
	  	info += durationInfo;
		}
		info += ` (${this.checkedTimes} times)`

  	return info;
  }

  checkOnline () {
    
  	return checkOnline(this.url, this.name)
  	.then( online => {

      if(online && !this.online) this.startRecord();
      if(!online && this.online) this.endRecord();
      
      this.checkedTimes++;
      this.online = online;
  		return online;
  	})
  }

  startRecord () {
  	this.startedTime = Date.now();
  }

  endRecord(){
  	this.startedTime = undefined;
  }


}


function round (number, bits) {
  // should find a better name
  bits = bits || 2;
  let mul = Math.pow(10, bits);
  return Math.round(number * mul) / mul;
}
module.exports = PoeItem;