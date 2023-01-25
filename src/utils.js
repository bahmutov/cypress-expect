// @ts-check

const fs = require('fs')
const path = require('path')
const R = require('ramda')
const allPaths = require('@bahmutov/all-paths')
const debug = require('debug')('cypress-expect')

const REPO_URL = 'https://github.com/bahmutov/cypress-expect'

const getExpectedTestStatuses = (filename) => {
  const text = fs.readFileSync(filename, 'utf-8')
  const json = JSON.parse(text)
  return json
}

// NOTE: modifies the object in place
const removeEmptyLeaves = (json) => {
  if (typeof json === 'string') {
    return
  }
  Object.keys(json).forEach((key) => {
    removeEmptyLeaves(json[key])
    if (R.isEmpty(json[key])) {
      delete json[key]
    }
  })

  return json
}

const collectPaths = (json) => {
  const list = allPaths(json)
    // leave only paths that lead to the test status
    // which is a string, effectively filtering out
    // all outer suite names
    .filter((path) => {
      return typeof R.path(path, json) === 'string'
    })
  return list
}

const testTitle = (parts) => parts.join(' / ')

/**
 * Normalizes different forms of test status to
 * @see https://on.cypress.io/writing-and-organizing-tests#Test-statuses
 */
const normalizeTestState = (s) => {
  if (s === 'passing' || s === 'pass' || s === 'passes' || s === 'passed') {
    return 'passed'
  }
  if (s === 'failing' || s === 'fail' || s === 'fails' || s === 'failed') {
    return 'failed'
  }
  if (s === 'pend' || s === 'pending') {
    return 'pending'
  }
  if (s === 'skip' || s === 'skipping' || s === 'skipped') {
    return 'skipped'
  }
  console.error('unknown test state name "%s"', s)

  return s
}

const expectTestResults = (args) => (runResults) => {
  const isPassingSpecified = '--passing' in args
  const isMinPassingSpecified = '--min-passing' in args
  const isFailingSpecified = '--failing' in args
  const isPendingSpecified = '--pending' in args
  const isExpectSpecified = '--expect' in args
  const isExpectExactlySpecified = '--expect-exactly' in args

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

  if (isExpectSpecified) {
    // a single object with expected test results
    let expectedTestStatuses = getExpectedTestStatuses(args['--expect'])
    debug('expected test statuses %o', expectedTestStatuses)

    debug('test runs %o', runResults.runs)
    // collect every test result reported by Cypress
    const tests = []
    runResults.runs.forEach((runResult) => {
      runResult.tests.forEach((testResult) => {
        tests.push({
          // title is an array with strings
          // from the outer suite title, all the way to the test title
          title: testResult.title,
          state: testResult.state,
        })
      })
    })
    debug('test results %o', tests)

    // match every test result with expected test result
    // if not found, the only acceptable test state is passing
    let didNotMatch = 0

    tests.forEach((test) => {
      const expectedTestStatus = R.path(test.title, expectedTestStatuses)

      if (!expectedTestStatus) {
        debug('missing expected state for test "%o"', test.title)

        // cannot find the expected test status, should be passing
        if (test.state !== 'passed') {
          didNotMatch += 1
          console.log(
            'cypress-expect: expected implicitly the test "%s" to pass, got %s',
            test.title.join(' / '),
            test.state,
          )
        }
      } else {
        // found the expected test record in the JSON file
        // let's remove it - by the end of the matching the "expected"
        // object will only have expected test results that were NOT
        // present in the test results
        expectedTestStatuses = R.dissocPath(test.title, expectedTestStatuses)

        const normalized = normalizeTestState(expectedTestStatus)
        debug(
          'test "%s" should have status "%s"',
          test.title.join(' / '),
          normalized,
        )

        if (test.state !== normalized) {
          didNotMatch += 1
          console.log(
            'cypress-expect: expected the test "%s" to be %s, got %s',
            test.title.join(' / '),
            normalized,
            test.state,
          )
        }
      }
    })

    if (didNotMatch) {
      console.error(
        'cypress-expect: %d %s did not match the expected state from %s',
        didNotMatch,
        didNotMatch === 1 ? 'test' : 'tests',
        args['--expect'],
      )
      console.error('')
      process.exit(1)
    }

    const removedEmpty = removeEmptyLeaves(expectedTestStatuses)
    if (!R.isEmpty(removedEmpty)) {
      console.error('cypress-expect: expected the find the following tests')
      const titles = collectPaths(removedEmpty)
        .map(testTitle)
        .map((s) => '* ' + s)
      console.error(titles.join('\n'))
      console.error()
      process.exit(1)
    }

    // nothing else to do
    return
  }

  if (isExpectExactlySpecified) {
    // a single object with expected test results
    let expectedTestStatuses = getExpectedTestStatuses(args['--expect-exactly'])
    debug('expected test statuses %o', expectedTestStatuses)

    debug('test runs %o', runResults.runs)
    // collect every test result reported by Cypress
    const tests = []
    runResults.runs.forEach((runResult) => {
      runResult.tests.forEach((testResult) => {
        tests.push({
          // title is an array with strings
          // from the outer suite title, all the way to the test title
          title: testResult.title,
          state: testResult.state,
          relative: runResult.spec.relative,
        })
      })
    })
    debug('test results')
    debug(tests)

    // match every test result with expected test result
    let didNotMatch = 0

    tests.forEach((test) => {
      const fullTestPath = test.relative.split(path.sep).concat(test.title)
      const expectedTestStatus = R.path(fullTestPath, expectedTestStatuses)

      if (!expectedTestStatus) {
        console.error(
          'cypress-expect: missing expected result for test "%s" from file %s',
          fullTestPath.join(' / '),
          args['--expect-exactly'],
        )
        console.error('')
        process.exit(1)
      } else {
        // found the expected test record in the JSON file
        // let's remove it - by the end of the matching the "expected"
        // object will only have expected test results that were NOT
        // present in the test results
        expectedTestStatuses = R.dissocPath(fullTestPath, expectedTestStatuses)

        const normalized = normalizeTestState(expectedTestStatus)
        debug(
          'test "%s" should have status "%s"',
          test.title.join(' / '),
          normalized,
        )

        if (test.state !== normalized) {
          console.error(
            'cypress-expect: expected the test "%s" to be %s, got %s',
            test.title.join(' / '),
            normalized,
            test.state,
          )
          console.error('')
          process.exit(1)
        }
      }
    })

    const removedEmpty = removeEmptyLeaves(expectedTestStatuses)
    if (!R.isEmpty(removedEmpty)) {
      console.error('cypress-expect: expected the find the following tests')
      const titles = collectPaths(removedEmpty)
        .map(testTitle)
        .map((s) => '* ' + s)
      console.error(titles.join('\n'))
      console.error()
      process.exit(1)
    }

    // nothing else to do
    return
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
}

module.exports = { expectTestResults }
