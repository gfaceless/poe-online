function isBoolean(p) {
  return typeof p === 'boolean';
}

function isUndefined(p) {
  return typeof p === 'undefined';
}

function isEmpty(p) {
  return p === '' || p === null || p === undefined || (typeof p === 'number' && isNaN(p)) 
  || (typeof p == 'object' && Object.keys(p).length == 0)
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


module.exports = {
	isUndefined,
	isEmpty,
	isBoolean,
	shadowCopy
}