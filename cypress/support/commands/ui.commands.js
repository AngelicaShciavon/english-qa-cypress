import { common } from '../selectors'

/**
 * Visita uma rota protegida já impedindo a tradução automática do navegador.
 * Motivo: <html lang="en"> com conteúdo em PT faz o Chrome traduzir e o React quebrar
 * (bug GP25/TF14). Assim os testes funcionais não são afetados por esse bug.
 */
Cypress.Commands.add('visitApp', (path) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.document.documentElement.setAttribute('translate', 'no')
    },
  })
})

/** Valida que existe um toast contendo o texto informado */
Cypress.Commands.add('shouldShowToast', (text) => {
  cy.contains(common.toast, text).should('be.visible')
})

/**
 * Espiona a síntese de voz do navegador (speechSynthesis.speak).
 * Uso: cy.spySpeech() e depois cy.get('@speak').should('have.been.called')
 */
Cypress.Commands.add('spySpeech', () => {
  cy.window().then((win) => {
    cy.spy(win.speechSynthesis, 'speak').as('speak')
  })
})

/** Retorna o texto enviado na última chamada de speechSynthesis.speak */
Cypress.Commands.add('lastSpokenText', () => {
  return cy.get('@speak').its('lastCall.args.0.text')
})
