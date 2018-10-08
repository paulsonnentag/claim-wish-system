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
  Db.claim('@ is father of @', ['Homer', child]),
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
  Db.claim('@ has gender @', [z, 'female'])
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

const nonPrimitiveResult = db.query([
  Db.claim('@ is father of @', [{}, {}])
])

assert(nonPrimitiveResult.length === 0)



// benchmark

function getPaperProgramsDB () {
  const db = new Db()

  db.addClaim(Db.claim('@ is a @', ['table', 'supporter']))
  db.addClaim(Db.claim('@ has width @', ['table', Math.random()]))
  db.addClaim(Db.claim('@ has height @', ['table', Math.random()]))
  db.addClaim(Db.claim('@ contains markers @', ['table', randomPoints()]))

  for (let i = 0; i < 100; i++) {
    db.addClaim(Db.claim('@ is a @', [i, 'paper']))
    db.addClaim(Db.claim('@ has width @', [i, Math.random()]))
    db.addClaim(Db.claim('@ has height @', [i, Math.random()]))
    db.addClaim(Db.claim('@ has corner points @', [i, {
      top: randomPoint(),
      left: randomPoint(),
      bottom: randomPoint(),
      right: randomPoint()
    }]))
    db.addClaim(Db.claim('@ has center point @', [i, randomPoint()]))
    db.addClaim(Db.claim('@ is on supporter @', [i, 'table']))
    db.addClaim(Db.claim('@ contains markers @', [i, randomPoints()]))
  }

  return db
}

(() => {
  let minTime = Infinity

  for (let iter = 0; iter < 50; iter++) {
    let timestamp = Date.now()

    const db = getPaperProgramsDB()

    for (let you = 0; you < 100; you++) {
      const result1 = db.query([
        Db.claim('@ contains markers @', [you, Db.variable('markers')]),
        Db.claim('@ is on supporter @', [you, Db.variable('supporter')]),
        Db.claim('@ has center point @', [you, Db.variable('point')])
      ])

      const result2 = db.query([
        Db.claim('@ is a @', [Db.variable('paper'), 'paper']),
        Db.claim('@ has center point @', [Db.variable('paper'), Db.variable('otherPoint')]),
      ])

      if (you === 0 && false) {
        console.log(result1)
        console.log(result2)
      }
    }

    if (minTime > (Date.now() - timestamp)) {
      minTime = (Date.now() - timestamp)
    }
  }

  console.log('query duration', minTime)

  // baseline: 24 ms
  // use index lookup: 16 ms (33% improvement)

})()

function randomPoint () {
  return {x: Math.random(), y: Math.random()}
}

function randomPoints () {
  const points = [randomPoint()]

  while (Math.random() < 0.9) {
    points.push(randomPoint())
  }

  return points
}

paperProgrammsDB = getPaperProgramsDB()