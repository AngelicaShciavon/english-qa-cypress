import { words } from '../selectors'
import { API } from '../utils/routes'

/**
 * Preenche os campos do Gerador de Palavras.
 * Passe null para não mexer num campo; '' para limpá-lo.
 * @example cy.fillWordsForm({ quantidade: 10, tema: 'comida' })
 */
Cypress.Commands.add('fillWordsForm', ({ quantidade = null, tema = null } = {}) => {
  if (quantidade !== null) {
    cy.get(words.quantity).clear()
    if (String(quantidade) !== '') cy.get(words.quantity).type(String(quantidade))
  }
  if (tema !== null) {
    cy.get(words.topic).clear()
    if (tema !== '') cy.get(words.topic).type(tema, { parseSpecialCharSequences: false })
  }
})

/** Botão "Gerar Palavras com IA" */
Cypress.Commands.add('getGenerateWordsButton', () => {
  return cy.contains('button', words.generateButton)
})

/** Preenche e clica em gerar */
Cypress.Commands.add('generateWords', (dados) => {
  cy.fillWordsForm(dados)
  cy.getGenerateWordsButton().click()
})

/**
 * Intercepta a Edge Function generate-words.
 * - sem fixture: apenas espiona (chama a IA real)
 * - com fixture: devolve a resposta simulada (rápido e determinístico)
 */
Cypress.Commands.add('interceptGenerateWords', (options = {}) => {
  const { fixture, statusCode = 200, alias = 'generateWords' } = options
  if (fixture) {
    cy.intercept('POST', API.generateWords, { statusCode, fixture }).as(alias)
  } else if (statusCode !== 200) {
    cy.intercept('POST', API.generateWords, { statusCode, body: { error: 'Erro simulado' } }).as(alias)
  } else {
    cy.intercept('POST', API.generateWords).as(alias)
  }
})

/** Valida a quantidade de palavras exibidas (1 botão de áudio por palavra) */
Cypress.Commands.add('shouldHaveWordCount', (total) => {
  cy.contains('h2', words.resultTitle).should('be.visible')
  cy.get(words.audioButton).should('have.length', total)
})
