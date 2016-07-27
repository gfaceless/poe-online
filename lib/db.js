'use strict'

var Promise = require("bluebird");
var fs = require("fs");
var path = require("path");

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);
var FnChains = require("./fn-chain");

/**
 * A crude tiny fs database
 * currently only support collection-level save and retrieval 
 * document-level is not supported 
 */

/**
 * current structure (single db file)
 * {
 *    "collection1": [document, document, ...],
 *    "collection2": [document, document, ...]
 * }
 */

/**
 * one db, one file
 * file will be created if does not exists when constructor is called
 */
class Db {
  constructor(dbName) {
    this._fnChains = new FnChains();

    var fileName = dbName + ".db"

    // TODO: maybe use sys tmp folder
    var filePath = this.filePath = path.join(__dirname, fileName);

    // TODO: use async api instead of sync
    try {
      fs.statSync(filePath)
    } catch (e) {
      // file not created
      if (e.code == 'ENOENT') {
        try {
          fs.writeFileSync(filePath);
        } catch (e) {
          throw new Error('cannot create db file', e);
        }
      }
    }

    var text = fs.readFileSync(filePath)
    var parsed = this._parseFile(text)
    this.dbObj = parsed || {};
  }

  // load from memory
  load() {
    return Promise.resolve(this.dbObj);
  }

  save() {
    var promise = this._fnChains.add(_ => {
      return this._saveToDisk();
    })
    return promise
  }

  _saveToDisk() {
    return writeFile(this.filePath, JSON.stringify(this.dbObj))
  }

  remove(colName) {
    var success = delete this.dbObj[colName];
    if (!success) return Promise.reject(new Error('failed to delete collection'))
    return this.save()
  }

  _loadFromDisk() {

    return readFile(this.filePath)
      .then(text => {
        return this._parseFile(text)
      })
      .then(parsed => {
        this.dbObj = parsed || {};
      })
  }

  _createDbObj(obj) {
    this.dbObj = obj;
    /*obj.toJSON = function() {      
      return this;
    }*/
    return obj;
  }
  _parseFile(text) {
    let obj;
    try {
      obj = JSON.parse(text)
    } catch (e) {
      obj = undefined;
    }

    return obj;
  }

}

var DbFactory = (function() {
  var cache = {};

  function create(dbName) {
    if(cache[dbName]) return cache[dbName]
    return cache[dbName] = new Db(dbName);
  }

  function destroy (dbName) {
    // body...
  }

  return { create, destroy}
})();

class DbCollection {

  get collection() {
    return this._dbObj[this.name];
  }

  set collection(p) {
    this._dbObj[this.name] = p;
  }
  constructor(dbName, collectionName) {
    // TODO: use factory to better handle creating with cache
    this.name = collectionName
    this._db = DbFactory.create(dbName);
    // for easier reference
    this._dbObj = this._db.dbObj;
    this.collection = this.collection || [];
  }

  load(id) {
    // force database to refresh
    return this._db.load()
      .then(dbObj => {
        this._dbObj = dbObj;
        this.collection = this.collection || [];
        if (id) return this.find(id);
        else return this.collection;
      })
  }

  save(dataArr) {
    this.collection = dataArr;

    return this._db.save()
  }


  find(id) {
    return this.collection.find((doc, i) => {
      return doc.id === id;
    })
  }

  destroy() {
    return this._db.remove(this.name);
  }

  clear() {
    return this.save([]);
  }

  remove(doc) {

  }

}

module.exports = DbCollection;

/**
 * just a wrapper of array, providing some convenient api  
 * should give it a better name
 */
/*class EasierArray {
  constructor(arr) {
    this._arr = arr
  }

  find(id) {
    return this._arr.find(doc, i => {
      return doc.id === id;
    })
  }

  findIndex(id) {
    return this._arr.findIndex(doc, i => {
      return doc.id === id;
    })
  }

  update(arr) {
    this._arr = arr;
  }

  replace(id, newDoc) {
    var doc = this.find(id)
    if (!doc) return false;
    var idx = this.findIndex(id);

    this._arr.splice(idx, 1, newDoc);
    return true;
  }

  toJSON() {
    console.log('in toJSON');
    return this._arr;
  }
}*/


// Crude tests:
/*var collection = new DbCollection("hey", "wtf");
collection.save([{id:'shit',  a: 'a', b: 'b' }, {id: 2, c: 'c' }])
  .then(function() {
    console.log('save success');
    return collection.load()
      .then(obj => {
        console.log('loaded', obj)
        var c = collection.find("shit")
        console.log('found?', c);
      })
  }).catch(function(e) {
    console.log('fail', e)
  })
*/
