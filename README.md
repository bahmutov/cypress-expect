# cypress-expect [![ci status][ci image]][ci url]

> Cypress CLI wrapper where you can specify the total number of expected tests

## Use

Assuming `cypress` has been installed already

```shell
npm i -D cypress-expect # or yarn add -D cypress-expect
# instead of "cypress run ..."
npx cypress-expect run --expect <N> ...
```

Where `N` is the number of total tests expected to pass.

The rest of the arguments is parsed using [Cypress CLI method](https://on.cypress.io/module-api#cypress-cli) and executed via [`cypress.run`](https://on.cypress.io/module-api#cypress-run). Thus the execution should match the regular `cypress run ...` command.

**Note:** when running in parallel mode where the tests are split, this module would not work, since only a subset of specs will execute on the current machine.

## Debugging

Run this script with environment variable `DEBUG=cypress-expect` to see verbose logs

[ci image]: https://github.com/bahmutov/cypress-expect/workflows/ci/badge.svg?branch=main
[ci url]: https://github.com/bahmutov/cypress-expect/actions
