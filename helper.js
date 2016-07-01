

function isUndefined(p) {
  return typeof p === 'undefined';
}

function isEmpty(p) {
  return p === '' || p === null || p === undefined || (typeof p === 'number' && isNaN(p)) 
  || (typeof p == 'object' && Object.keys(p).length == 0)
}


module.exports = {
	isUndefined,
	isEmpty
}