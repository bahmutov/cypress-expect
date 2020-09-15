#!/usr/bin/env node

// @ts-check

// runs Cypress with "normal" CLI parameters
// but after the run verifies the expected number of passing tests
const cypress = require('cypress')
const debug = require('debug')('cypress-expect')
const arg = require('arg')

const isValidPassing = (x) => typeof x === 'number' && x > 0

// remove all our arguments to let Cypress only deal with its arguments
const args = arg({
  '--passing': Number, // number of total passing tests to expect
  '--min-passing': Number, // at least this number of passing tests
})

if ('--passing' in args) {
  if (!isValidPassing(args['--passing'])) {
    console.error('expected a number of --passing tests', args['--passing'])
    process.exit(1)
  }
}

if ('--min-passing' in args) {
  if (!isValidPassing(args['--min-passing'])) {
    console.error(
      'expected a number of --min-passing tests',
      args['--min-passing'],
    )
    process.exit(1)
  }
}

if ('--passing' in args && '--min-passing' in args) {
  console.error('Cannot specify both --passing and --min-passing options')
  process.exit(1)
}

const parseArguments = async () => {
  const cliArgs = args._
  if (cliArgs[0] !== 'cypress') {
    cliArgs.unshift('cypress')
  }

  if (cliArgs[1] !== 'run') {
    cliArgs.splice(1, 0, 'run')
  }

  debug('parsing Cypress CLI %o', cliArgs)
  return await cypress.cli.parseRunArguments(cliArgs)
}

parseArguments()
  .then((options) => {
    debug('parsed CLI options %o', options)

    return cypress.run(options)
  })
  .then((runResults) => {
    // see https://on.cypress.io/module-api
    if (runResults.failures) {
      console.error(runResults.message)
      process.exit(1)
    }

    if (runResults.totalFailed) {
      console.error('%d test(s) failed', runResults.totalFailed)
      process.exit(runResults.totalFailed)
    }

    // make sure the expected number of tests executed
    if (runResults.totalPassed !== args['--passing']) {
      console.error(
        'expected %d passing tests, got %d',
        args['--passing'],
        runResults.totalPassed,
      )
      process.exit(1)
    }
  })
  .catch((e) => {
    console.log('error: %s', e.message)
    console.error(e)
    process.exit(1)
  })
