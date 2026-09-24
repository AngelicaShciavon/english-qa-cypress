import { flashcards } from '../selectors'
import { API } from '../utils/routes'

/**
 * Isola os testes do progresso real do usuário:
 * - GET do progresso devolve [] (usuário "novo")
 * - POST (upsert) é simulado, nada é gravado no banco
 * - opcionalmente substitui a lista de cards por uma fixture
 */
Cypress.Commands.add('mockFlashcards', ({ cardsFixture } = {}) => {
  if (cardsFixture) {
    cy.intercept('GET', API.flashcards, { fixture: cardsFixture }).as('getCards')
  } else {
    cy.intercept('GET', API.flashcards).as('getCards')
  }
  cy.intercept('GET', API.flashcardProgress, { body: [] }).as('getProgress')
  cy.intercept('POST', API.flashcardProgress, (req) => {
    req.reply({ statusCode: 201, body: { id: `e2e-${Date.now()}`, ...req.body } })
  }).as('saveProgress')
})

/**
 * Lê o número de um contador (Na fila / Revisados hoje / Dominados).
 * No HTML o número é a div irmã imediatamente anterior ao rótulo.
 */
Cypress.Commands.add('getFlashcardStat', (label) => {
  return cy
    .contains('div', new RegExp(`^${label}$`))
    .prev()
    .invoke('text')
    .then((text) => Number(text.trim()))
})

/** Valida os três contadores de uma vez */
Cypress.Commands.add('shouldHaveFlashcardStats', ({ queue, reviewed, mastered }) => {
  const { stats } = flashcards
  if (queue !== undefined) cy.getFlashcardStat(stats.queue).should('eq', queue)
  if (reviewed !== undefined) cy.getFlashcardStat(stats.reviewedToday).should('eq', reviewed)
  if (mastered !== undefined) cy.getFlashcardStat(stats.mastered).should('eq', mastered)
})

/**
 * Mostra a tradução e avalia o card atual.
 * @param {'hard'|'medium'|'easy'} nivel
 */
Cypress.Commands.add('rateCard', (nivel) => {
  cy.contains('button', flashcards.showTranslation).click()
  cy.contains('button', flashcards.rating[nivel]).click()
  cy.wait('@saveProgress')
})
