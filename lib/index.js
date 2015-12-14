'use strict'

function makeError (res, originalError) {
  var errorMessage = res.body.message || res.body.error_message || res.body.ErrorMessage
  if (errorMessage) {
    var error = new Error(originalError.message)
    if (res.body.code) {
      error.code = res.body.code
    }
    if (res.body.name) {
      error.name = res.body.name
    }
    if (res.body.stack) {
      error.stack = (
        res.body.stack.split('\n')
        .filter(line => !/node_modules\//.test(line))
        .join('\n')
      )
    } else {
      error.message += '\n     ' + errorMessage
    }

    return error
  }
}

// Modify supertest to return thenables, and to show the error message
// in the error:
require('supertest/lib/test').prototype.then = function () {
  var self = this
  var promise = new Promise(function (resolve, reject) {
    return self.end(function (err, result) {
      if (err) {
        if (/^expected /.test(err.message) && result.statusCode >= 400) {
          var error = makeError(result, err)
          if (error) return reject(error)
        }
        return reject(err)
      }
      resolve(result)
    })
  })

  return promise.then.apply(promise, arguments)
}

module.exports = require('supertest')
