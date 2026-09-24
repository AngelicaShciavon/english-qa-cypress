import { auth } from '../selectors'
import { USER_PROFILES } from '../utils/users'
import { ROUTES, AUTH_STORAGE_KEY } from '../utils/routes'

// Mapeia o perfil para as chaves do cypress.env.json
const PROFILES = Object.fromEntries(
  USER_PROFILES.map(({ id, emailKey, passwordKey }) => [id, [emailKey, passwordKey]]),
)

const hasAuthToken = (win) =>
  Object.keys(win.localStorage).some((key) => AUTH_STORAGE_KEY.test(key))

/**
 * Faz login pela interface e guarda a sessão com cy.session.
 * Na 2ª chamada com o mesmo perfil, o Cypress só restaura a sessão (muito mais rápido).
 * @example cy.login('premium')
 */
Cypress.Commands.add('login', (profile = 'premium') => {
  const keys = PROFILES[profile]
  if (!keys) throw new Error(`Perfil desconhecido: ${profile}`)

  // cy.env() é a forma atual (Cypress 16) de ler segredos; os valores não aparecem no log
  cy.env(keys).then((env) => {
    const [emailKey, passwordKey] = keys
    const email = env[emailKey]
    const password = env[passwordKey]
    if (!email || !password) {
      throw new Error(`Configure ${emailKey} e ${passwordKey} no cypress.env.json`)
    }

    cy.session(
      ['login', profile],
      () => {
        cy.visit(ROUTES.auth)
        cy.get(auth.email).type(email)
        cy.get(auth.password).type(password, { log: false })
        cy.contains(auth.submit, auth.submitText).click()
        cy.location('pathname').should('not.eq', ROUTES.auth)
        cy.window().should((win) => expect(hasAuthToken(win), 'token salvo').to.be.true)
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          cy.window().should((win) => expect(hasAuthToken(win), 'sessão válida').to.be.true)
        },
      },
    )
  })
})

/** Clica em "Sair" no menu lateral */
Cypress.Commands.add('logout', () => {
  cy.contains('button', 'Sair').click()
  cy.location('pathname').should('eq', ROUTES.auth)
})

/** Verifica se a chave de sessão do Supabase existe (true) ou não (false) no localStorage */
Cypress.Commands.add('shouldHaveSession', (expected = true) => {
  cy.window().should((win) => expect(hasAuthToken(win)).to.eq(expected))
})
