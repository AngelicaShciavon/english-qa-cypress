import { AUTHENTICATED_PROFILES } from '../support/utils/users'
import { premium } from '../support/selectors'
import { tc } from '../support/qase'
import { words } from '../support/selectors'
import { ROUTES } from '../support/utils/routes'

AUTHENTICATED_PROFILES.forEach((profile) => {
  describe('Gerador de Palavras - ' + profile.id, () => {
    if (!profile.hasPremium) {
      it(tc('PR01', 'usuário comum recebe o bloqueio de conteúdo premium'), () => {
        cy.login(profile.id)
        cy.visitApp(ROUTES.words)
        cy.contains(premium.blockedTitle).should('be.visible')
      })
      return
    }
    beforeEach(() => {
      cy.login(profile.id)
      cy.visitApp(ROUTES.words)
    })

    context('Integração real com a IA (smoke)', () => {
      it(tc('GP01', 'gera 10 palavras com tradução, exemplo e áudio'), () => {
        cy.interceptGenerateWords() // só espiona, chama a IA de verdade
        cy.generateWords({ quantidade: 10, tema: 'comida' })

        cy.wait('@generateWords', { timeout: Cypress.expose('iaTimeout') })
          .its('request.body')
          .should('deep.equal', { topic: 'comida', quantity: 10 })

        cy.shouldHaveWordCount(10)
        cy.shouldShowToast('10 palavras geradas')
      })
    })

    context('Validações dos campos (sem chamar a IA)', () => {
      beforeEach(() => cy.fixture('words-data').as('dados'))

      it(tc(['GP04', 'GP05', 'GP06', 'GP08'], 'bloqueia quantidade fora de 1 a 100'), function () {
        cy.interceptGenerateWords({ fixture: 'words-3.json' })

        this.dados.quantidadeInvalida.forEach(({ id, valor }) => {
          cy.log(`${id}: quantidade "${valor}"`)
          cy.generateWords({ quantidade: valor, tema: 'viagens' })
          cy.shouldShowToast(this.dados.mensagemQuantidade)
        })

        // Garante que a IA nunca foi chamada
        cy.get('@generateWords.all').should('have.length', 0)
      })

      it(tc('GP11', 'botão desabilitado com tema vazio'), () => {
        cy.fillWordsForm({ quantidade: 10, tema: '' })
        cy.getGenerateWordsButton().should('be.disabled')
      })

      it(tc('GP12', 'botão desabilitado com tema só de espaços'), () => {
        cy.fillWordsForm({ tema: '     ' })
        cy.getGenerateWordsButton().should('be.disabled')
      })

      it(tc('GP10', 'campo numérico não aceita letras'), () => {
        cy.get(words.quantity).clear().type('abc')
        cy.get(words.quantity).should('have.value', '')
      })

      it(tc('GP24', '[BUG] campos devem ter label associado (acessibilidade)'), () => {
        cy.contains('label', 'Quantidade de palavras').should('have.attr', 'for')
        cy.contains('label', 'Tema do vocabulário').should('have.attr', 'for')
      })
    })

    context('Regras de quantidade com resposta simulada', () => {
      it(tc('GP02', 'quantidade mínima (1) é enviada para a API'), () => {
        cy.interceptGenerateWords({ fixture: 'words-3.json' })
        cy.generateWords({ quantidade: 1, tema: 'viagens' })
        cy.wait('@generateWords').its('request.body.quantity').should('eq', 1)
      })

      it(tc('GP03', 'quantidade máxima (100) é enviada para a API'), () => {
        cy.interceptGenerateWords({ fixture: 'words-3.json' })
        cy.generateWords({ quantidade: 100, tema: 'viagens' })
        cy.wait('@generateWords').its('request.body.quantity').should('eq', 100)
      })

      it(tc('GP07', '[BUG] quantidade decimal (2.5) deve ser rejeitada'), () => {
        cy.interceptGenerateWords({ fixture: 'words-3.json' })
        cy.generateWords({ quantidade: '2.5', tema: 'animais' })
        cy.shouldShowToast('A quantidade deve estar entre 1 e 100')
        cy.get('@generateWords.all').should('have.length', 0)
      })

      it(tc('GP09', '[BUG] "1e2" deve ser tratado como 100 (valor do navegador)'), () => {
        cy.interceptGenerateWords({ fixture: 'words-3.json' })
        cy.generateWords({ quantidade: '1e2', tema: 'cores' })
        cy.wait('@generateWords').its('request.body.quantity').should('eq', 100)
      })
    })

    context('Tema, exibição e comportamento', () => {
      beforeEach(() => cy.interceptGenerateWords({ fixture: 'words-3.json' }))

      it(tc('GP12b', 'tema com espaços nas pontas é enviado com trim'), () => {
        cy.generateWords({ quantidade: 3, tema: '  viagens  ' })
        cy.wait('@generateWords').its('request.body.topic').should('eq', 'viagens')
      })

      it(tc('GP15', 'tema com acentos e caracteres especiais'), () => {
        cy.fixture('words-data').then(({ caracteresEspeciais }) => {
          cy.generateWords({ quantidade: 3, tema: caracteresEspeciais })
          cy.wait('@generateWords').its('request.body.topic').should('eq', caracteresEspeciais)
        })
      })

      it(tc('GP16', 'XSS no tema não é executado'), () => {
        cy.window().then((win) => cy.stub(win, 'alert').as('alert'))
        cy.fixture('words-data').then(({ xss }) => {
          cy.generateWords({ quantidade: 3, tema: xss })
        })
        cy.wait('@generateWords')
        cy.shouldHaveWordCount(3)
        cy.get('@alert').should('not.have.been.called')
        cy.get('main img[src="x"]').should('not.exist')
      })

      it(tc('GP01', 'cada palavra mostra tradução, exemplo e tradução do exemplo'), () => {
        cy.generateWords({ quantidade: 3, tema: 'comida' })
        cy.wait('@generateWords')
        cy.fixture('words-3.json').then(({ words: lista }) => {
          lista.forEach((w) => {
            cy.contains('h3', w.word).should('be.visible')
            cy.contains(w.translation).should('be.visible')
            cy.contains(w.sentence).should('be.visible')
            cy.contains(w.sentenceTranslation).should('be.visible')
          })
        })
      })

      it(tc('GP19', '[BUG] duplo clique deve enviar apenas 1 requisição'), () => {
        cy.fillWordsForm({ quantidade: 3, tema: 'roupas' })
        cy.getGenerateWordsButton().dblclick()
        cy.wait('@generateWords')
        cy.get('@generateWords.all').should('have.length', 1)
      })

      it(tc('GP21', 'áudio da palavra usa voz em inglês'), () => {
        cy.generateWords({ quantidade: 3, tema: 'comida' })
        cy.wait('@generateWords')
        cy.spySpeech()
        cy.get(words.audioButton).first().click()
        cy.get('@speak').should('have.been.calledOnce')
        cy.get('@speak').its('lastCall.args.0').should('include', { text: 'Food', lang: 'en-US' })
      })

      it(tc('GP23', 'Enter no campo Tema dispara a geração'), () => {
        cy.fillWordsForm({ quantidade: 3 })
        cy.get(words.topic).clear().type('escola{enter}')
        cy.wait('@generateWords')
      })
    })

    it(tc('GP20', 'falha da IA mostra mensagem e mantém a página funcional'), () => {
      cy.interceptGenerateWords({ statusCode: 500 })
      cy.generateWords({ quantidade: 3, tema: 'animais' })
      cy.wait('@generateWords')
      cy.shouldShowToast('Erro')
      cy.getGenerateWordsButton().should('be.enabled')
    })
  })
})
