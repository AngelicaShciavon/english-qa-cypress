import { USER_PROFILES } from '../support/utils/users'
import { auth } from '../support/selectors'
import { API, ROUTES } from '../support/utils/routes'

USER_PROFILES.filter((profile) => !profile.canLogin).forEach((profile) => {
  describe('Login - ' + profile.id, () => {
    it('rejeita login por e-mail não confirmado e não cria sessão', () => {
      cy.env([profile.emailKey, profile.passwordKey], { log: false }).then((env) => {
        const email = env[profile.emailKey]
        const password = env[profile.passwordKey]
        if (!email || !password) {
          throw new Error('Configure ' + profile.emailKey + ' e ' + profile.passwordKey + ' no cypress.env.json')
        }

        // Resposta real: credenciais invalidas nao comprovam bloqueio por confirmacao.
        cy.intercept('POST', API.signIn).as('signIn')
        cy.visit(ROUTES.auth)
        cy.get(auth.email).type(email, { log: false })
        cy.get(auth.password).type(password, { log: false })
        cy.contains(auth.submit, auth.submitText).click()
        cy.wait('@signIn', { log: false }).then(({ response }) => {
          // Assert apenas valores escalares para nao expor requisicao ou tokens.
          expect(response.statusCode, 'status do login').to.eq(400)
          expect(response.body.code || response.body.error_code, 'motivo da rejeição')
            .to.eq('email_not_confirmed')
        })
        cy.location('pathname').should('eq', ROUTES.auth)
        cy.shouldHaveSession(false)
        cy.contains(auth.submit, auth.submitText).should('be.enabled')
      })
    })
  })
})
