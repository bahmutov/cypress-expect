#!/usr/bin/env node

// @ts-check

// runs Cypress with "normal" CLI parameters
// but after the run verifies the expected number of passing tests
const cypress = require('cypress')
const debug = require('debug')('cypress-expect')
const arg = require('arg')

const isValidPassing = (x) => typeof x === 'number' && x > 0

// remove all our arguments to let Cypress only deal with its arguments
const args = arg(
  {
    '--passing': Number, // number of total passing tests to expect
    '--min-passing': Number, // at least this number of passing tests
    '--failing': Number, // number of failing tests to expect
    '--pending': Number, // number of pending tests to expect
  },
  {
    // allow other flags to be present - to be sent to Cypress CLI
    permissive: true,
  },
)
debug('args %o', args)

const isPassingSpecified = '--passing' in args
const isMinPassingSpecified = '--min-passing' in args
const isFailingSpecified = '--failing' in args
const isPendingSpecified = '--pending' in args
const noOptionsSpecified =
  !isPassingSpecified &&
  !isMinPassingSpecified &&
  !isPendingSpecified &&
  !isFailingSpecified

debug('specified options %o', {
  isPassingSpecified,
  isMinPassingSpecified,
  isFailingSpecified,
  isPendingSpecified,
  noOptionsSpecified,
})

if (noOptionsSpecified) {
  console.error('Need to specify at least one parameter:')
  console.error('--passing or --min-passing or --failing or --pending')
  process.exit(1)
}

if (isPassingSpecified) {
  if (!isValidPassing(args['--passing'])) {
    console.error('expected a number of --passing tests', args['--passing'])
    process.exit(1)
  }
}

if (isMinPassingSpecified) {
  if (!isValidPassing(args['--min-passing'])) {
    console.error(
      'expected a number of --min-passing tests',
      args['--min-passing'],
    )
    process.exit(1)
  }
}

if (isFailingSpecified) {
  if (!isValidPassing(args['--failing'])) {
    console.error('expected a number of --failing tests', args['--failing'])
    process.exit(1)
  }
}

if (isPassingSpecified && isMinPassingSpecified) {
  console.error('Cannot specify both --passing and --min-passing options')
  process.exit(1)
}

debug('params %o', {
  passing: args['--passing'],
  minPassing: args['--min-passing'],
  failing: args['--failing'],
  pending: args['--pending'],
})

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
    debug('run status %s', runResults.status)
    if (!runResults.status) {
      // @ts-ignore
      if (runResults.failures) {
        runResults.status = 'failed'
      } else {
        runResults.status = 'finished'
      }
      debug('set run status %s', runResults.status)
    }

    // see https://on.cypress.io/module-api
    if (runResults.status === 'failed' && runResults.failures) {
      console.error(runResults.message)
      process.exit(1)
    }

    if (runResults.status === 'finished') {
      const totals = {
        failed: runResults.totalFailed,
        passed: runResults.totalPassed,
        pending: runResults.totalPending,
      }
      debug('test totals %o', totals)

      if (isFailingSpecified) {
        if (totals.failed !== args['--failing']) {
          console.error(
            'ERROR: expected %d failing tests, got %d',
            args['--failing'],
            totals.failed,
          )
          process.exit(1)
        }
      } else {
        // any unexpected failed tests are bad
        if (totals.failed) {
          console.error('%d test(s) failed', totals.failed)
          process.exit(totals.failed)
        }
      }

      if (isPassingSpecified) {
        // make sure the expected number of tests executed
        if (totals.passed !== args['--passing']) {
          console.error(
            'ERROR: expected %d passing tests, got %d',
            args['--passing'],
            totals.passed,
          )
          process.exit(1)
        }
      }

      if (isMinPassingSpecified) {
        if (totals.passed < args['--min-passing']) {
          console.error(
            'ERROR: expected at least %d passing tests, got %d',
            args['--min-passing'],
            totals.passed,
          )
          process.exit(1)
        }
      }

      if (isPendingSpecified) {
        if (totals.pending !== args['--pending']) {
          console.error(
            'ERROR: expected %d pending tests, got %d',
            args['--pending'],
            totals.pending,
          )
          process.exit(1)
        }
      }
    }
  })
  .catch((e) => {
    console.log('error: %s', e.message)
    console.error(e)
    process.exit(1)
  })
