const Db = require('./db')
const db = new Db()

function assert (test, message) {
  if (!test) {
    console.error('failed:', message)
  }
}

// family example

db.addClaim(Db.claim('@ is father of @', ['Abe', 'Homer']))
db.addClaim(Db.claim('@ is father of @', ['Homer', 'Bart']))
db.addClaim(Db.claim('@ is father of @', ['Homer', 'Lisa']))

db.addClaim(Db.claim('@ has gender @', ['Homer', 'male']))
db.addClaim(Db.claim('@ has gender @', ['Bart', 'male']))
db.addClaim(Db.claim('@ has gender @', ['Lisa', 'female']))
db.addClaim(Db.claim('@ has gender @', ['Abe', 'male']))


db.addClaim(Db.claim('@ likes person @', ['Homer', 'Homer']))
db.addClaim(Db.claim('@ likes person @', ['Homer', 'Lisa']))


const child = Db.variable('child')
const simpleResult = db.query([
  Db.claim('@ is father of @', ["Homer", child]),
])

assert(JSON.stringify(simpleResult) === JSON.stringify([
  {child: 'Bart'},
  {child: 'Lisa'}
]), 'simple query should return children of homer')


const x = Db.variable('x')
const y = Db.variable('y')
const z = Db.variable('z')

const joinedResult = db.query([
  Db.claim('@ is father of @', [x, y]),
  Db.claim('@ is father of @', [y, z])
])

assert(JSON.stringify(joinedResult) === JSON.stringify([
  {x: 'Abe', y: 'Homer', z: 'Bart'},
  {x: 'Abe', y: 'Homer', z: 'Lisa'}
]), 'joined query should return grand children of abe')


const joinedResult2 = db.query([
  Db.claim('@ is father of @', [x, y]),
  Db.claim('@ is father of @', [y, z]),
  Db.claim('@ has gender @', [z, "female"])
])

assert(JSON.stringify(joinedResult2) === JSON.stringify([
  {x: 'Abe', y: 'Homer', z: 'Lisa'}
]), 'joined query 2 should return female grand children of abe')


const multiVarResult = db.query([
  Db.claim('@ likes person @', [x, x])
])

assert(JSON.stringify(multiVarResult) === JSON.stringify([
  {x: 'Homer'}
]), 'multi var result')
