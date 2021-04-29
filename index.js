#!/usr/bin/env node

// @ts-check

// runs Cypress with "normal" CLI parameters
// but after the run verifies the expected number of passing tests
const cypress = require('cypress')
const debug = require('debug')('cypress-expect')
const arg = require('arg')
const fs = require('fs')

const REPO_URL = 'https://github.com/bahmutov/cypress-expect'
const CLI_HELP_URL = 'https://github.com/bahmutov/cypress-expect#options'
const cliHelpMessage = `see ${CLI_HELP_URL}`

const isValidPassing = (x) => typeof x === 'number' && x > 0

// remove all our arguments to let Cypress only deal with its arguments
const args = arg(
  {
    '--passing': Number, // number of total passing tests to expect
    '--min-passing': Number, // at least this number of passing tests
    '--failing': Number, // number of failing tests to expect
    '--pending': Number, // number of pending tests to expect
    '--expect': String, // filename of JSON file with test names and statuses
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
const isExpectSpecified = '--expect' in args
const noOptionsSpecified =
  !isPassingSpecified &&
  !isMinPassingSpecified &&
  !isPendingSpecified &&
  !isFailingSpecified &&
  !isExpectSpecified

debug('specified options %o', {
  isPassingSpecified,
  isMinPassingSpecified,
  isFailingSpecified,
  isPendingSpecified,
  isExpectSpecified,
  noOptionsSpecified,
})

if (noOptionsSpecified) {
  console.error('Need to specify at least one parameter:')
  console.error(
    '--passing or --min-passing or --failing or --pending or --expect',
  )
  console.error(cliHelpMessage)
  process.exit(1)
}

const isNumberOptionSpecified =
  isPassingSpecified ||
  isMinPassingSpecified ||
  isFailingSpecified ||
  isPendingSpecified
if (isExpectSpecified && isNumberOptionSpecified) {
  console.error('You used --expect with some other option')
  console.error('--expect <filename> can be the only option by itself')
  console.error(cliHelpMessage)
  process.exit(1)
}

if (isPassingSpecified) {
  if (!isValidPassing(args['--passing'])) {
    console.error('expected a number of --passing tests', args['--passing'])
    console.error(cliHelpMessage)
    process.exit(1)
  }
}

if (isMinPassingSpecified) {
  if (!isValidPassing(args['--min-passing'])) {
    console.error(
      'expected a number of --min-passing tests',
      args['--min-passing'],
    )
    console.error(cliHelpMessage)
    process.exit(1)
  }
}

if (isFailingSpecified) {
  if (!isValidPassing(args['--failing'])) {
    console.error('expected a number of --failing tests', args['--failing'])
    console.error(cliHelpMessage)
    process.exit(1)
  }
}

if (isPassingSpecified && isMinPassingSpecified) {
  console.error('Cannot specify both --passing and --min-passing options')
  console.error(cliHelpMessage)
  process.exit(1)
}

if (isExpectSpecified) {
  const filename = args['--expect']
  if (!fs.existsSync(filename)) {
    console.error('Cannot find file specified using --expect option')
    console.error('filename: "%s"', filename)
    console.error(cliHelpMessage)
    process.exit(1)
  }
}

debug('params %o', {
  passing: args['--passing'],
  minPassing: args['--min-passing'],
  failing: args['--failing'],
  pending: args['--pending'],
  expect: args['--expect'],
})

const getExpectedTestStatuses = (filename) => {
  const text = fs.readFileSync(filename, 'utf-8')
  const json = JSON.parse(text)
  return json
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

    if (runResults.status !== 'finished') {
      console.error(
        'cypress-error: Hmm, unknown run status "%s"',
        runResults.status,
      )
      console.error('cypress-error: not sure how to proceed')
      console.error('cypress-error: seek help at %s', REPO_URL)
      console.error('cypress-error: exiting with an error')
      process.exit(1)
    }

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
  })
  .catch((e) => {
    console.log('error: %s', e.message)
    console.error(e)
    process.exit(1)
  })
