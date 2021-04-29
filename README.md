# cypress-expect [![ci status][ci image]][ci url] [![renovate-app badge][renovate-badge]][renovate-app]

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

## Debugging

Run this script with environment variable `DEBUG=cypress-expect` to see verbose logs

[ci image]: https://github.com/bahmutov/cypress-expect/workflows/ci/badge.svg?branch=main
[ci url]: https://github.com/bahmutov/cypress-expect/actions
[renovate-badge]: https://img.shields.io/badge/renovate-app-blue.svg
[renovate-app]: https://renovateapp.com/
