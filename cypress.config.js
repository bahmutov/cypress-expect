const { defineConfig } = require('cypress')

module.exports = defineConfig({
  fixturesFolder: false,
  video: false,
  e2e: {
    setupNodeEvents(on, config) {},
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.js',
  },
})
