import { AUTHENTICATED_PROFILES } from '../support/utils/users'
import { tc } from '../support/qase'
import { auth } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

AUTHENTICATED_PROFILES.forEach((profile) => {
  const startRoute = profile.hasPremium ? ROUTES.flashcards : ROUTES.docs
  describe('Sair (logout) - ' + profile.id, () => {
    beforeEach(() => {
      cy.login(profile.id)
      cy.visitApp(startRoute)
    })

    it(tc(['SA01', 'SA04'], 'encerra a sessão, limpa o token e vai para o login'), () => {
      cy.shouldHaveSession(true)
      cy.logout()
      cy.contains(auth.welcomeTitle).should('be.visible')
      cy.shouldHaveSession(false)
    })

    it(tc('SA02', 'voltar no navegador após sair não mostra conteúdo protegido'), () => {
      cy.logout()
      cy.go('back')
      cy.location('pathname').should('eq', ROUTES.auth)
    })

    // Data-driven: todas as rotas protegidas devem redirecionar após o logout
    ;[ROUTES.words, ROUTES.pronunciation, ROUTES.flashcards, ROUTES.docs].forEach((rota) => {
      it(tc('SA03', `${rota} redireciona para o login após sair`), () => {
        cy.logout()
        cy.visitApp(rota)
        cy.location('pathname').should('eq', ROUTES.auth)
      })
    })

    it(tc('SA06', 'consegue entrar novamente após sair'), () => {
      cy.logout()
      // Limpa o cache do cy.session para forçar um login real pela interface
      cy.then(() => Cypress.session.clearAllSavedSessions())
      cy.login(profile.id)
      cy.visitApp(startRoute)
      cy.location('pathname').should('eq', startRoute)
    })
  })
})
