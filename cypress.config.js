const { defineConfig } = require('cypress')

// Os segredos do Qase vêm SEMPRE de variáveis de ambiente (nunca escreva o token aqui).
// Localmente o padrão é QASE_MODE=off: os testes rodam sem enviar nada ao Qase.
const qaseReporterOptions = {
  mode: process.env.QASE_MODE || 'off',
  debug: false,
  testops: {
    api: {
      token: process.env.QASE_TESTOPS_API_TOKEN,
    },
    project: process.env.QASE_TESTOPS_PROJECT,
    uploadAttachments: true,
    run: {
      title: process.env.QASE_TESTOPS_RUN_TITLE || `Cypress - English QA - ${new Date().toISOString()}`,
      complete: true,
    },
  },
  framework: {
    cypress: {
      screenshotsFolder: 'cypress/screenshots',
    },
  },
}

module.exports = defineConfig({
  reporter: require.resolve('cypress-qase-reporter'),
  reporterOptions: qaseReporterOptions,
  e2e: {
    baseUrl: 'https://english.qazando.com.br',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1366,
    viewportHeight: 768,
    // A IA pode demorar (100 palavras levaram ~32 s na execução manual)
    defaultCommandTimeout: 10000,
    responseTimeout: 60000,
    // Retenta só no modo headless (CI) para reduzir falsos negativos de rede/IA
    retries: { runMode: 2, openMode: 0 },
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Plugins do Qase: enviam resultados, screenshots e metadados (steps, fields...)
      require('cypress-qase-reporter/plugin')(on, config)
      require('cypress-qase-reporter/metadata')(on)
      return config
    },
  },
  // Valores públicos (não sensíveis) lidos com Cypress.expose('chave')
  expose: {
    iaTimeout: 60000,
  },
})
