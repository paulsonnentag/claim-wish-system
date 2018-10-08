const CONSTANT_ARG = 'CONSTANT_ARG'
const VARIABLE_ARG = 'VARIABLE_ARG'

function Claim (literals, ...args) {
  return parseClaim(literals, args)
}

function parseClaim (literals, args) {
  return {
    name: normalizeWhitespace(literals.raw.join('@')),
    args: args.map(constant)
  }
}

function When (literals, ...args) {
  return parseWhen(literals, args)
}

function parseWhen (literals, args) {
  const whenStatement = literals.join('')
  const constantValues = args.map(constant)
  const tokens = interleave(literals.raw, constantValues)
    .map((chunk) => {
      if (typeof chunk !== 'string') {
        return [chunk]
      }

      let normalizedChunk = normalizeWhitespace(chunk)
      let tokens = []
      let insideVariableToken = false
      let part = ''

      for (let i = 0; i < normalizedChunk.length; i++) {
        switch (normalizedChunk[i]) {
          case '{':
            if (insideVariableToken) {
              throw new Error(`unexpected character { in When: '${whenStatement}'`)
            }

            insideVariableToken = true
            tokens.push(part)
            part = ''
            break

          case '}':
            if (!insideVariableToken) {
              throw new Error(`unexpected character } in When: '${whenStatement}'`)
            }

            insideVariableToken = false
            tokens.push(variable(part))
            part = ''
            break

          default:
            part += normalizedChunk[i]
            break
        }
      }

      return tokens
    })
    .reduce(flatten)

  const name = tokens.map((token) => (typeof token === 'string') ? token : '@').join('')
  const values = tokens.filter((token) => typeof token !== 'string')

  return {name, values}
}

function constant (value) {
  return {type: CONSTANT_ARG, value}
}

function variable (name) {
  return {type: VARIABLE_ARG, name}
}

function normalizeWhitespace (str) {
  return str.replace(/\s+/g, ' ')
}

function interleave (arr1, arr2) {
  const result = [];
  const n = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < n; i++) {
    if (arr1[i]) {
      result.push(arr1[i])
    }

    if (arr2[i]) {
      result.push(arr2[i])
    }
  }

  return result;
}

function flatten (arr1, arr2) {
  return arr1.concat(arr2)
}

// test cases

console.log(JSON.stringify(Claim `${'Homer'} is father of ${'Bart'}`, null, 2))

console.log(JSON.stringify(When `${'Homer'} is father of {child}`, null, 2))

