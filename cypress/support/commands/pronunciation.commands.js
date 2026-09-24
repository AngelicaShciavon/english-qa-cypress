import { pronunciation } from '../selectors'
import { API } from '../utils/routes'

/** Intercepta a geração de frase; com fixture a resposta é simulada */
Cypress.Commands.add('interceptGeneratePhrase', ({ fixture, statusCode = 200 } = {}) => {
  if (fixture) {
    cy.intercept('POST', API.generatePhrase, { statusCode, fixture }).as('generatePhrase')
  } else if (statusCode !== 200) {
    cy.intercept('POST', API.generatePhrase, { statusCode, body: {} }).as('generatePhrase')
  } else {
    cy.intercept('POST', API.generatePhrase).as('generatePhrase')
  }
})

/** Clica no botão de gerar frase (primeira vez ou "Gerar Outra Frase") */
Cypress.Commands.add('generatePhrase', () => {
  cy.contains('button', new RegExp(`${pronunciation.generateFirst}|${pronunciation.generateAnother}`)).click()
})

/** Valida a frase em inglês e a tradução exibidas */
Cypress.Commands.add('shouldShowPhrase', ({ english, portuguese }) => {
  cy.contains(pronunciation.phraseTitle).should('be.visible')
  cy.contains('p', english).should('be.visible')
  cy.contains('p', portuguese).should('be.visible')
})
