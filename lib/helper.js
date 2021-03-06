'use strict';

function isBoolean(p) {
  return typeof p === 'boolean';
}

function isUndefined(p) {
  return typeof p === 'undefined';
}

function isEmpty(p) {
  return p === '' || p === null || p === undefined || (typeof p === 'number' && isNaN(p)) || (typeof p == 'object' && Object.keys(p).length == 0)
}


function copy(obj, props) {
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

/**
 * Lodash `_.defaults()`:
 * mutates and returns target
 * usage including applying default settings. 
 * So instead of coding:
 * `opts = Object.assign({}, DEFAULT_SETTINGS, opts);`
 * we can code: `defaults(opts, DEFAULT_SETTINGS)`
 */
function defaults(target, ...sources) {
  sources.forEach(function(source, i) {
    Object.keys(source).forEach(function(k, i) {
      if (!target.hasOwnProperty(k)) {
        target[k] = source[k]
      }
    });
  });
  return target;
}

// note this function will return true for oct or hex 
// e.g. "0x123", "0o123"  

// currently all number and string are allowed (except NaN)
function idLike(p) {
  var numberLike = (typeof p === 'number' && !isNaN(p))
  var stringLike = typeof p == 'string';
  return numberLike || stringLike;
}


module.exports = {
  isUndefined,
  isEmpty,
  isBoolean,
  copy,
  defaults,
  idLike
}
