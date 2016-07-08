var expect = require('chai').expect;
var Collection = require("../db");

var collection;
before(function() {
  collection = new Collection('.test', 'some-collection-name');
})

after(function() {
  return collection.destroy();
})


describe('Array', function() {
  var docs = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];

  it("basic save and load functionality", function() {
    return collection.save(docs)
      .then(function() {
        return collection.load()
      })
      .then(function(data) {
        expect(data).deep.equal(docs)
      })

  })

  it('basic find functionality', function() {
    expect(collection.find(2)).deep.equal(docs[1]);
  })

})

describe("whatever", function() {
  var docs1 = [{ name: "shit", id: 1 }, { name: "shit2", id: 2 }];
  var docs2 = [{ age: 11, id: 1 }, { age: 12, id: 2 }];


  it("racing save and load", function() {
    var p1 = collection.save(docs1)
    var p2 = new Promise(function(resolve, reject) {
	    setTimeout(function () {
	    	
		    return resolve(collection.save(docs2))

	    }, 5)
    	
    })


    p1.then(_ => {
        return collection.load()
      })
      .then(function(data) {

        console.log('d1', data)
        return;
        expect(data).deep.equal(docs1);
      })

    p2.then(function() {
        return collection.load()
      })
      .then(data => {
        console.log('d2', data)
        return;
        expect(data).deep.equal(docs2);
      })

    return Promise.all([p1, p2])

  })
})
