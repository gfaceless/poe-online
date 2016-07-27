var expect = require('chai').expect;
var should = require('chai').should();
var Collection = require("../db");


const docs = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];

const doc1 = { hey: 'girl', id: 'oops' };
const doc2 = { hey: 'girl2', id: 'oops2' };

describe('DATABASE COLLCETION TESTS', function() {

  var cNames = ['c-default', 'c-add', 'c-remove', 'c-race'];
  var collections = cNames.map(function(name, i) {
    return new Collection('.test', name);
  });
  var [collection, cAdd, cRemove, cRace] = collections

  after(function() {
    return Promise.all(collections.map(c => {
      return c.destroy();
    }));
  })

  describe('collection basics', function() {

    it("save and load functionality", function() {
      return collection.save(docs)
        .then(function() {
          return collection.load()
        })
        .then(function(data) {
          expect(data).deep.equal(docs)
        })
    })

    it('find functionality', function() {
      expect(collection.find(2)).deep.equal(docs[1]);
    })


  });

  describe('add ops', function() {
    var collection = cAdd;
    afterEach(function() {
      return collection.clear();
    })

    it('should reject with an error if id is not provided', function() {
      return collection.add({ no: 'id' })
        .catch(function(e) {
          e.should.be.an('error');
        })
    })

    it('should have only one doc in the inner array', function() {
      var op1 = collection.add(doc1)
      return op1.then(function() {
        collection.documents.should.deep.equal([doc1]);
      })
    })

    it('should have two docs in the inner array, list in order', function() {

      var op1 = collection.add(doc1)
      var op2 = collection.add(doc2)
      return Promise.all([op1, op2])
        .then(function() {
          collection.documents.should.deep.equal([doc1, doc2]);
        })
    })

  });

  describe('remove ops', function() {
    var collection = cRemove;
    before(function() {
      return collection.clear()
        .then(function() {
          return Promise.all([collection.add(doc1), collection.add(doc2)])
        })
    })

    it('should only have doc2 left after doc1 is removed', function() {
      return collection.remove(doc1.id)
        .then(function(id) {
          expect(id).equal(doc1.id);
          collection.documents.should.deep.equal([doc2]);
        })
    })

    it('should reject with an error if wrong id is provided', function() {
      return collection.remove(Symbol('unique'))
        .catch(function(e) {
          e.should.be.an('error')
        })
    })
  })

  describe("race test", function() {

    var docs1 = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];
    var docs2 = [{ age: 11, id: 1 }, { age: 12, id: 2 }];
    var collection = cRace;

    it("raced saving would not result error. Latter request wins", function() {
      var pArr = [];
      var i = 3
      var j = 5;
      var z = 3;

      while (i--) { pArr.push(collection.save(docs1)) }

      while (j--) {
        (function(ms) {
          pArr.push(delay(function() {
            var _doc = docs2.slice();
            _doc.push({ _ms: ms })
            return collection.save(_doc);
          }, ms))
        })(5 - j);
      }

      while (z--) { pArr.push(collection.save(docs1)) }

      return Promise.all(pArr)
        .then(function() {

          return collection.load()
            .then(function(data) {
              var _doc = docs2.slice();
              _doc.push({ _ms: 5 });
              data.should.deep.equal(_doc);
            })

        }, function(err) {
          console.log('this error will happen when `fs.writeFile()` throws', err)
          throw err;
        })

    })
  })

  describe('multiple collections', function() {

    it('two collections should coexist', function() {
      expect(collection._db === cRace._db);
      expect(cAdd._db === cRemove._db);
      expect(collection._db === cAdd._db);

      Object.keys(collection._dbObj).should.deep.equal(cNames);
    })
  })
})



function delay(fn, ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(fn())
    }, ms)
  })
}
