import { AUTHENTICATED_PROFILES } from '../support/utils/users'
import { premium } from '../support/selectors'
import { tc } from '../support/qase'
import { flashcards } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

AUTHENTICATED_PROFILES.forEach((profile) => {
  describe('Flashcards QA - ' + profile.id, () => {
    if (!profile.hasPremium) {
      it(tc('PR01', 'usuário comum recebe o bloqueio de conteúdo premium'), () => {
        cy.login(profile.id)
        cy.visitApp(ROUTES.flashcards)
        cy.contains(premium.blockedTitle).should('be.visible')
      })
      return
    }
    beforeEach(() => {
      cy.login(profile.id)
    })

    it(tc('FC01', 'usuário novo começa com 40 na fila, 0 revisados e 0 dominados'), () => {
      cy.mockFlashcards() // lista real de cards + progresso vazio
      cy.visitApp(ROUTES.flashcards)
      cy.wait(['@getCards', '@getProgress'])
      cy.shouldHaveFlashcardStats({ queue: 40, reviewed: 0, mastered: 0 })
    })

    context('Com 3 cards simulados', () => {
      beforeEach(() => {
        cy.mockFlashcards({ cardsFixture: 'flashcards-3.json' })
        cy.visitApp(ROUTES.flashcards)
        cy.wait(['@getCards', '@getProgress'])
      })

      it(tc('FC02', '"Mostrar Tradução" exibe tradução e botões de avaliação'), () => {
        cy.contains('button', flashcards.showTranslation).click()
        cy.contains('Nossa sprint dura duas semanas.').should('be.visible')
        Object.values(flashcards.rating).forEach((nivel) => {
          cy.contains('button', nivel).should('be.visible')
        })
      })

      it(tc('FC03', 'Fácil: fila -1, revisados +1 e salva progresso'), () => {
        cy.rateCard('easy')
        cy.get('@saveProgress').its('request.body').should('include', {
          flashcard_id: 'e2e-card-1',
          repetitions: 1,
          interval_days: 2,
        })
        cy.shouldHaveFlashcardStats({ queue: 2, reviewed: 1 })
      })

      it(tc('FC04', 'Difícil: card volta para o fim da fila e reinicia o SM-2'), () => {
        cy.rateCard('hard')
        cy.get('@saveProgress').its('request.body').should('include', {
          repetitions: 0,
          interval_days: 0,
        })
        cy.shouldHaveFlashcardStats({ queue: 3, reviewed: 1 })
      })

      it(tc('FC05', 'Médio: intervalo de 1 dia na primeira revisão'), () => {
        cy.rateCard('medium')
        cy.get('@saveProgress').its('request.body').should('include', {
          repetitions: 1,
          interval_days: 1,
          ease_factor: 2.5,
        })
      })

      it(tc('FC07', 'concluir a fila mostra "Tudo em dia!"'), () => {
        cy.rateCard('easy')
        cy.rateCard('easy')
        cy.rateCard('easy')
        cy.contains(flashcards.allDone).should('be.visible')
        cy.contains('button', flashcards.reloadQueue).should('be.visible')
        cy.shouldHaveFlashcardStats({ queue: 0, reviewed: 3 })
      })

      it(tc('FC11', 'áudio da palavra e do exemplo em inglês'), () => {
        cy.spySpeech()
        cy.contains('button', flashcards.wordAudio).click()
        cy.get('@speak').its('lastCall.args.0.text').should('eq', 'Sprint')
        cy.get(flashcards.exampleAudio).click()
        cy.get('@speak').its('lastCall.args.0.text').should('eq', 'Our sprint lasts two weeks.')
      })

      it(tc('FC13', '[BUG] duplo clique na avaliação conta apenas 1 revisão'), () => {
        cy.contains('button', flashcards.showTranslation).click()
        cy.contains('button', flashcards.rating.medium).dblclick()
        cy.wait('@saveProgress')
        cy.shouldHaveFlashcardStats({ queue: 2, reviewed: 1 })
      })

      it(tc('FC15', '[BUG] "Recarregar fila" só traz cards com revisão vencida'), () => {
        cy.rateCard('easy')
        cy.rateCard('easy')
        cy.rateCard('easy')
        cy.contains('button', flashcards.reloadQueue).click()
        // Todos foram agendados para daqui a 2 dias: a fila deveria continuar vazia
        cy.shouldHaveFlashcardStats({ queue: 0 })
      })
    })
  })
})
