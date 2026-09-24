import { AUTHENTICATED_PROFILES } from '../support/utils/users'
import { tc } from '../support/qase'
import { docs } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

// Seções que precisam existir na Documentação
const SECOES = [
  'Cadastro e Acesso',
  'Ativação Premium',
  'Gerador de Palavras',
  'Treinar Fala',
  'Painel Admin',
]

AUTHENTICATED_PROFILES.forEach((profile) => {
  describe('Documentação - ' + profile.id, () => {
    beforeEach(() => {
      cy.login(profile.id)
      cy.visitApp(ROUTES.docs)
    })

    it('exibe as seções de funcionalidades e a tabela de usuários de teste', () => {
      cy.contains('h1', docs.pageTitle).should('be.visible')
      SECOES.forEach((secao) => cy.contains(docs.sectionButton, secao).should('be.visible'))
      cy.contains(docs.testUsersTitle).should('be.visible')
    })

    it(tc('DC02', 'expande e recolhe uma seção (aria-expanded)'), () => {
      cy.contains(docs.sectionButton, 'Gerador de Palavras')
        .as('secao')
        .should('have.attr', 'aria-expanded', 'false')
        .click()
      cy.get('@secao').should('have.attr', 'aria-expanded', 'true')
      cy.contains('quantidade de palavras (1 a 100)').should('be.visible')
      cy.get('@secao').click().should('have.attr', 'aria-expanded', 'false')
    })

    it(tc('DC08', '[BUG] a página declara o idioma pt-BR'), () => {
      cy.get('html').should('have.attr', 'lang', 'pt-BR')
    })

    it(tc('DC07', '[BUG] senhas de teste não devem aparecer na página'), () => {
      cy.contains(docs.testUsersTitle).should('be.visible')
      cy.contains('main', 'Teste@').should('not.exist')
    })
  })
})

describe('Documentação - usuário sem premium', () => {
  it(tc('DC01', 'usuário sem premium acessa a Documentação'), () => {
    cy.login('free')
    cy.visitApp(ROUTES.docs)
    cy.contains('h1', docs.pageTitle).should('be.visible')
  })
})
