# cypress-expect [![ci status][ci image]][ci url] [![renovate-app badge][renovate-badge]][renovate-app] ![cypress version](https://img.shields.io/badge/cypress-12.14.0-brightgreen)

> Cypress CLI wrapper where you can specify the total number of expected tests. Read [Wrap Cypress Using NPM Module API](https://glebbahmutov.com/blog/wrap-cypress-using-npm/) and [Cypress Metaprogramming](https://glebbahmutov.com/blog/cy-metaprogramming/)

## Use

Assuming `cypress` has been installed already

```shell
npm i -D cypress-expect # or yarn add -D cypress-expect
# instead of "cypress run ..."
npx cypress-expect run --passing <N> ...
```

Where `N` is the number of total tests expected to pass.

The rest of the arguments is parsed using [Cypress CLI method](https://on.cypress.io/module-api#cypress-cli) and executed via [`cypress.run`](https://on.cypress.io/module-api#cypress-run). Thus the execution should match the regular `cypress run ...` command.

**Note:** when running in parallel mode where the tests are split, this module would not work, since only a subset of specs will execute on the current machine.

**Tip:** Cypress has 4 test statuses explained in the [Writing and Organizing Tests](http://on.cypress.io/writing-and-organizing-tests#Test-statuses) guide.

## Options

`--passing <N>` checks if the total number of passing tests is `<N>`

`--min-passing <N>` checks if the total number of passing tests is `>= <N>`

`--failing <N>` checks if the total number of failing tests is `<N>`

`--pending <N>` checks if the total number of pending tests is `<N>`

`--expect <path/to/file.json>` checks test status against test names in a JSON file, see the details below

`--expect-exactly <path/to/file.json>` checks test status against test names in a JSON file, see the details below

### expected test results

The `--expect` option is interesting as it allows you to specify the expected test statuses in a JSON file. Each object key is a suite name, and individual string keys and values are the test names and statuses. For example, the following spec file [cypress/failing/spec.js](./cypress/failing/spec.js) has a suite with 2 tests, first should pass, and the second is expected to fail:

```js
describe('1 passing 1 failing', () => {
  it('passes', () => { ... })

  it('fails', () => {
    expect(true).to.be.false
  })
})
```

You can list the expected test results in a JSON file, for example see [cypress/failing/expected.json](./cypress/failing/expected.json). The file should show the structure of the spec:

```json
{
  "cypress": {
    "failing": {
      "spec.js": {
        "1 passing 1 failing": {
          "passes": "passed",
          "fails": "fail"
        }
      }
    }
  }
}
```

You can if the tests really behave this way by running:

```shell
$ npx cypress-expect run --expect ./cypress/failing/expected.json
```

**Tip:** you do not have to list the passing tests. Every test not listed in the expected JSON is assumed "passing" by default.

**Tip 2:** you do not have to remember the precise name of each test status, the JSON file can use synonyms, like `passed`, `pass`, `passing`, `pass`.

**Tip 3:** if there are more tests listed in the expected JSON file, the process will error with the list of tests not found

```text
cypress-expect: expected the find the following tests
* login tests / first test
* authentication test
```

### exactly expected test results

When using `--expect <filename>` option, the test run might have _extra_ passing test results. When using `--expect-exactly <filename>` option, the test run cannot have _any_ additional test results. All tests results must match exactly what is listed in the file.

#### Empty specs

Sometimes a spec is empty, or all tests were filtered out. In this case, the exact expected result should have an empty object, see the "empty-specs" tests

```json
{
  "cypress": {
    "empty-specs": {
      "empty.js": {}
    }
  }
}
```

If the expected empty object is missing, then the empty spec should not run.

## Debugging

Run this script with environment variable `DEBUG=cypress-expect` to see verbose logs

## Small print

Author: Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt; &copy; 2021

- [@bahmutov](https://twitter.com/bahmutov)
- [glebbahmutov.com](https://glebbahmutov.com)
- [blog](https://glebbahmutov.com/blog)
- [videos](https://www.youtube.com/glebbahmutov)
- [presentations](https://slides.com/bahmutov)
- [cypress.tips](https://cypress.tips)

License: MIT - do anything with the code, but don't blame me if it does not work.

Support: if you find any problems with this module, email / tweet /
[open issue](https://github.com/bahmutov/cypress-expect/issues) on Github

## MIT License

Copyright (c) 2021 Gleb Bahmutov &lt;gleb.bahmutov@gmail.com&gt;

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

[ci image]: https://github.com/bahmutov/cypress-expect/workflows/ci/badge.svg?branch=main
[ci url]: https://github.com/bahmutov/cypress-expect/actions
[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
