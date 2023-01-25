#!/usr/bin/env node

// @ts-check

// runs Cypress with "normal" CLI parameters
// but after the run verifies the expected number of passing tests
const cypress = require('cypress')
const debug = require('debug')('cypress-expect')
const arg = require('arg')
const fs = require('fs')
const { expectTestResults } = require('../src/utils')

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
    '--expect-exactly': String, // filename of JSON file with test names and statuses
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
const isExpectExactlySpecified = '--expect-exactly' in args
const noOptionsSpecified =
  !isPassingSpecified &&
  !isMinPassingSpecified &&
  !isPendingSpecified &&
  !isFailingSpecified &&
  !isExpectSpecified &&
  !isExpectExactlySpecified

debug('specified options %o', {
  isPassingSpecified,
  isMinPassingSpecified,
  isFailingSpecified,
  isPendingSpecified,
  isExpectSpecified,
  isExpectExactlySpecified,
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
  if (filename && !fs.existsSync(filename)) {
    console.error('Cannot find file specified using --expect option')
    console.error('filename: "%s"', filename)
    console.error(cliHelpMessage)
    process.exit(1)
  }
}

if (isExpectExactlySpecified) {
  const filename = args['--expect-exactly']
  if (filename && !fs.existsSync(filename)) {
    console.error('Cannot find file specified using --expect-exactly option')
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
  expectExactly: args['--expect-exactly'],
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
  .then(expectTestResults(args))
  .catch((e) => {
    console.log('error: %s', e.message)
    console.error(e)
    process.exit(1)
  })
