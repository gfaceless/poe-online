'use strict'

var Promise = require("bluebird");
var fs = require("fs");
var path = require("path");

var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);


/**
 * A crude tiny fs database
 * currently only support collection-level save and retrieval 
 * document-level is not supported 
 */

/**
 * current structure (single db file)
 * {
 * 		"collection1": [document, document, ...],
 * 		"collection2": [document, document, ...]
 * }
 */

// one db, one file
class Db {
  constructor(dbName) {
    var fileName = dbName + ".db"
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
    var obj = this._parseFile(text)
    this._createDbObj(obj);
  }

  load() {
    return readFile(this.filePath)
      .then(text => {
        return this._parseFile(text)
      })
      .then(obj => {
        return this._createDbObj(obj);
      })
  }
  save() {
    console.log('saving', this.dbObj)
    return writeFile(this.filePath, JSON.stringify(this.dbObj))
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
      obj = {};
    }

    return obj;
  }

}

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
    this._db = new Db(dbName);
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
        if(id) return this.find(id);
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