var expect = require('chai').expect;
var should = require('chai').should();
var Collection = require("../db");


const docs = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];

describe('collection basics', function() {
  var collection;
  before(function() {
    collection = new Collection('.test', 'some-collection-name');
  })

  after(function() {
    return collection.destroy();
  })


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

  describe("race test", function() {
    var docs1 = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];
    var docs2 = [{ age: 11, id: 1 }, { age: 12, id: 2 }];


    it("raced saving would not result error. Latter request wins", function() {
      var pArr = [];
      var i = 3
      var j = 5;
      var z = 3;

      while (i--) { pArr.push(collection.save(docs1)) }

      while (j--) {
        (function(ms) {
          pArr.push(delay(function() {
            return collection.save(Object.assign({}, docs2, { _ms: ms }));
          }, ms))
        })(5 - j);
      }

      while (z--) { pArr.push(collection.save(docs1)) }

      return Promise.all(pArr)
        .then(function() {

          return collection.load()
            .then(function(data) {
              data.should.deep.equal(Object.assign({}, docs2, { _ms: 5 }));
            })

        }, function(err) {
          console.log('this error will happen when `fs.writeFile()` throws', err)
          throw err;
        })

    })
  })
})

describe('collections', function() {
  var c1 = new Collection('.test', 'c1');
  var c2 = new Collection('.test', 'c2');

  after(function() {
    return Promise.all([c1.destroy(), c2.destroy()])
  })

  it('two collections should coexist', function() {
    return c1.save(docs)
      .then(function() {
        expect(c1._db === c2._db);
        Object.keys(c1._dbObj).should.deep.equal(["c1", "c2"]);
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
