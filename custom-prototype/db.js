function Db () {
  this._claims = {}
  this._indexes = {}
}

const variableCache = {}

function Variable (name) {
  this.name = name;
}

function variable (name) {
  if (!variableCache[name]) {
    variableCache[name] = new Variable(name)
  }
  return variableCache[name]
}

function claim (name, args) {
  return {name, args};
}

Db.claim = claim;
Db.variable = variable;

Db.prototype = {
  addClaim ({name, args}) {
    if (!this._claims[name]) {
      this._claims[name] = []
    }

    if (!this._indexes[name]) {
      this._indexes[name] = {}
    }

    for (let i = 0; i < args.length; i++) {
      const value = args[i]

      // don't index non primitive values
      if (value instanceof Object) {
        continue
      }

      if (!this._indexes[name][i]) {
        this._indexes[name][i] = {}
      }

      if (!this._indexes[name][i][value]) {
        this._indexes[name][i][value] = []
      }

      this._indexes[name][i][value].push(args)
    }

    this._claims[name].push(args)
  },

  query (claims) {
    let matches = [{}]

    for (let ci = 0; ci < claims.length; ci++) {
      const claim = claims[ci]

      let joinedMatches = []

      for (let mi = 0; mi < matches.length; mi++) {
        const context = matches[mi]
        const newMatches = this._findMatchesForClaim(claim, context)

        joinedMatches = joinedMatches.concat(newMatches)
      }

      matches = joinedMatches

      if (matches.length === 0) {
        return []
      }
    }

    return matches
  },

  _findMatchesForClaim (claim, context = {}) {
    const name = claim.name;
    const args = claim.args.slice() // clone args because they will be mutated

    const claims = this._claims[name]

    const constantArgs = []
    const varArgs = []
    const matchingClaims = []

    // quick return if no claims with that name exist
    if (!claims) {
      return []
    }

    // proccess arguments
    for (let i = 0; i < args.length; i++) {
      const value = args[i]

      if (value instanceof Variable) {
        if (context[value.name]) { // resolve variables which are in context
          args[i] = context[value.name]
          constantArgs.push({index: i, value: context[value.name]})

        } else { // add other variables to varArgs
          varArgs.push({index: i, name: value.name})
        }
      }

      else if (value !== undefined) {
        constantArgs.push({index: i, value})
      }
    }

    // return all claims without filter if there are no constant arguments
    if (constantArgs.length === 0) {
      return claimsToMatches(claims, varArgs, context)
    }

    // ... otherwise filter
    for (let ci = 0; ci < claims.length; ci++) {
      const compareClaim = claims[ci]
      let isMatch = true

      for (let ai = 0; ai < constantArgs.length; ai++) {
        const {index, value} = constantArgs[ai]

        if (value !== compareClaim[index]) {
          isMatch = false
          break
        }
      }

      if (isMatch) {
        matchingClaims.push(compareClaim)
      }
    }

    return claimsToMatches(matchingClaims, varArgs, context)
  }
}

function claimsToMatches (claims, varArgs, context) {
  const matches = []

  for (let ci = 0; ci < claims.length; ci++) {
    const claim = claims[ci]
    const match = {...context}

    for (let ai = 0; ai < varArgs.length; ai++) {
      const arg = varArgs[ai]
      match[arg.name] =  claim[arg.index]
    }

    matches.push(match)
  }

  return matches
}

module.exports = Db
