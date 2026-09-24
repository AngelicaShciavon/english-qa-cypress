import { tc } from '../support/qase'
import { premium, common } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

describe('Premium - usuário premium', () => {
  beforeEach(() => cy.login('premium'))

  it(tc('PR09', 'menu mostra o selo Premium e não mostra "Ativar Premium"'), () => {
    cy.visitApp(ROUTES.words)
    cy.contains('span', common.sidebar.premiumBadge).should('be.visible')
    cy.contains(common.sidebar.activatePremium).should('not.exist')
  })

  it(tc('PR10', '/activate-premium informa que já é premium'), () => {
    cy.visitApp(ROUTES.activatePremium)
    cy.contains(premium.alreadyPremium).should('be.visible')
  })

  it(tc('PR11', '[BUG] "Ir para Exercícios" leva para /exercises'), () => {
    cy.visitApp(ROUTES.activatePremium)
    cy.contains('button', premium.goToExercises).click()
    cy.location('pathname').should('eq', ROUTES.exercises)
  })

  it(tc('PR12', 'usuário não admin é barrado no /admin'), () => {
    cy.visitApp(ROUTES.admin)
    cy.shouldShowToast(premium.accessDenied)
    cy.location('pathname').should('eq', ROUTES.home)
  })
})

describe('Premium - usuário sem premium', () => {
  beforeEach(() => cy.login('free'))

  // Mesmo teste para todas as rotas premium (data-driven)
  ;[ROUTES.words, ROUTES.pronunciation, ROUTES.flashcards].forEach((rota) => {
    it(tc('PR01', `${rota} exibe "Conteúdo Premium"`), () => {
      cy.visitApp(rota)
      cy.contains(premium.blockedTitle).should('be.visible')
    })
  })

  it(tc('PR02', 'menu mostra "Ativar Premium"'), () => {
    cy.visitApp(ROUTES.docs)
    cy.contains('a', common.sidebar.activatePremium).should('be.visible')
  })

  it(tc('PR05', 'código vazio mostra mensagem'), () => {
    cy.visitApp(ROUTES.activatePremium)
    cy.get('main form').submit()
    cy.shouldShowToast('Por favor, digite um código')
  })
})

describe('Premium - admin', () => {
  it(tc('PR08', 'admin acessa funcionalidade premium'), () => {
    cy.login('admin')
    cy.visitApp(ROUTES.words)
    cy.contains(premium.blockedTitle).should('not.exist')
    cy.contains('h1', 'Gerador de Palavras').should('be.visible')
  })
})
