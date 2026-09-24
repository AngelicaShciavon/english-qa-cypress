import { AUTHENTICATED_PROFILES } from '../support/utils/users'
import { premium } from '../support/selectors'
import { tc } from '../support/qase'
import { pronunciation } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

AUTHENTICATED_PROFILES.forEach((profile) => {
  describe('Treinar Fala - ' + profile.id, () => {
    if (!profile.hasPremium) {
      it(tc('PR01', 'usuário comum recebe o bloqueio de conteúdo premium'), () => {
        cy.login(profile.id)
        cy.visitApp(ROUTES.pronunciation)
        cy.contains(premium.blockedTitle).should('be.visible')
      })
      return
    }
    beforeEach(() => {
      cy.login(profile.id)
      cy.visitApp(ROUTES.pronunciation)
    })

    it(tc('TF01', 'gera frase real em inglês com tradução (smoke com IA)'), () => {
      cy.interceptGeneratePhrase()
      cy.generatePhrase()
      cy.wait('@generatePhrase', { timeout: Cypress.expose('iaTimeout') })
        .its('response.body')
        .should('include.keys', ['english', 'portuguese'])
      cy.contains(pronunciation.phraseTitle).should('be.visible')
      cy.contains(pronunciation.translationTitle).should('be.visible')
    })

    context('Com frase simulada', () => {
      beforeEach(() => {
        cy.interceptGeneratePhrase({ fixture: 'phrase.json' })
        cy.fixture('phrase.json').as('frase')
      })

      it(tc('TF01', 'exibe a frase e os botões de prática'), function () {
        cy.generatePhrase()
        cy.wait('@generatePhrase')
        cy.shouldShowPhrase(this.frase)
        cy.contains('button', pronunciation.listen).should('be.visible')
        cy.contains('button', pronunciation.speak).should('be.visible')
        cy.contains('button', pronunciation.generateAnother).should('be.visible')
      })

      it(tc('TF02', '"Gerar Outra Frase" faz nova requisição'), () => {
        cy.generatePhrase()
        cy.wait('@generatePhrase')
        cy.generatePhrase()
        cy.wait('@generatePhrase')
        cy.get('@generatePhrase.all').should('have.length', 2)
      })

      it(tc('TF03', '"Ouvir Pronúncia Correta" fala a frase em en-US'), function () {
        cy.generatePhrase()
        cy.wait('@generatePhrase')
        cy.spySpeech()
        cy.contains('button', pronunciation.listen).click()
        cy.get('@speak').its('lastCall.args.0').should('include', {
          text: this.frase.english,
          lang: 'en-US',
        })
      })

      it(tc('TF13', 'navegador sem reconhecimento de voz mostra aviso'), () => {
        cy.generatePhrase()
        cy.wait('@generatePhrase')
        // Simula um navegador sem Web Speech API (ex.: Firefox)
        cy.window().then((win) => {
          delete win.SpeechRecognition
          delete win.webkitSpeechRecognition
        })
        cy.contains('button', pronunciation.speak).click()
        cy.shouldShowToast('Seu navegador não suporta reconhecimento de voz')
      })

      it(tc('TF16', '[BUG] duplo clique deve gerar apenas 1 requisição'), () => {
        cy.contains('button', pronunciation.generateFirst).dblclick()
        cy.wait('@generatePhrase')
        cy.get('@generatePhrase.all').should('have.length', 1)
      })
    })

    it(tc('TF15', 'falha da IA mostra mensagem amigável'), () => {
      cy.interceptGeneratePhrase({ statusCode: 500 })
      cy.generatePhrase()
      cy.wait('@generatePhrase')
      cy.shouldShowToast('Não foi possível gerar uma nova frase')
      cy.contains('button', pronunciation.generateFirst).should('be.enabled')
    })
  })
})
