# English QA – Automação E2E com Cypress

Automação dos casos de teste da planilha `Casos_de_Teste_English_QA_executados.xlsx`.
Cada `it()` começa com o ID do caso (GP01, TF03, FC13...), então dá para rastrear teste ↔ planilha.

## Requisitos

- Node.js 22, 24 ou 26+ (exigência do Cypress 16)
- Cypress 16.1 (definido no `package.json`)

## Como rodar

```bash
npm install
cp cypress.env.example.json cypress.env.json   # preencha as senhas da Documentação
npm run cy:open        # modo interativo
npm run cy:run         # headless (CI)
npm run test:flashcards  # apenas uma funcionalidade
```

O `cypress.env.json` está no `.gitignore`, então as senhas **não vão para o Git**.

## Estrutura

```
cypress/
├── e2e/                      # Specs: um arquivo por funcionalidade
├── fixtures/                 # Massas de dados e respostas simuladas da API
└── support/
    ├── e2e.js                # Carregado antes de cada spec; importa os commands
    ├── commands/
    │   ├── index.js          # Index: importa todos os grupos de commands
    │   ├── auth.commands.js  # cy.login, cy.logout, cy.shouldHaveSession
    │   ├── ui.commands.js    # cy.visitApp, cy.shouldShowToast, cy.spySpeech
    │   ├── words.commands.js
    │   ├── pronunciation.commands.js
    │   └── flashcards.commands.js
    ├── selectors/            # TODOS os seletores num só lugar (+ index.js)
    ├── qase/                 # Helper tc() e mapa planilha → IDs do Qase
    └── utils/routes.js       # Rotas da aplicação e endpoints da API
```

### Por que essa organização facilita a manutenção

| Mudou na aplicação... | Você altera só... |
|---|---|
| Texto de um botão ou seletor | O arquivo em `support/selectors/` |
| Uma rota ou endpoint | `support/utils/routes.js` |
| O fluxo de login | `support/commands/auth.commands.js` |
| Dados de teste | `fixtures/` |

Os specs **não têm seletores soltos**: eles só chamam commands e usam os objetos de seletores.

## Conceitos usados (e por quê)

- **`cy.session` no login**: o login pela tela é feito uma vez por perfil e reaproveitado em todos os testes e specs (`cacheAcrossSpecs`). O `validate()` confere se o token ainda está no localStorage.
- **`cy.env()` para senhas**: no Cypress 16 o `Cypress.env()` foi removido. O `cy.env()` lê apenas as chaves pedidas e não mostra os valores no log. Para valores públicos, o projeto usa `Cypress.expose()` (ex.: `iaTimeout`).
- **`cy.intercept`**: há dois usos.
  - *Espionar* (`cy.interceptGenerateWords()`): a requisição vai para a IA real. Usado nos testes smoke.
  - *Simular* (`{ fixture: 'words-3.json' }`): a resposta vem da fixture. Deixa o teste rápido, sem custo de IA e sem resultado aleatório. Também permite testar falhas (`statusCode: 500`).
- **`cy.mockFlashcards()`**: simula o progresso vazio e o salvamento. Assim os testes **não alteram o progresso real** da conta.
- **`cy.spy` na síntese de voz**: confere o texto e o idioma falados sem precisar de áudio.
- **Testes data-driven**: um único `forEach` gera um teste por rota ou valor inválido.

## Testes marcados com `[BUG]`

Esses testes validam o comportamento **esperado** e hoje **falham de propósito**, porque reproduzem bugs encontrados na execução manual (ex.: GP07, GP09, GP19, FC13, FC15, PR11, DC08). Quando o bug for corrigido, o teste passa a funcionar como teste de regressão.

## Não automatizados

Os casos que dependem de microfone ou de voz real (TF04 a TF12) precisam de execução manual.

## Integração com o Qase

O reporter oficial é o **`cypress-qase-reporter`** (não existe pacote `qase-cypress`). Ele já está no `package.json` e configurado no `cypress.config.js`.

### Fluxo

1. Push ou Pull Request na `main` dispara o pipeline do Azure DevOps.
2. O pipeline roda `npx cypress run` com `QASE_MODE=testops`.
3. O reporter cria uma **Test Run** no Qase e envia o status de cada teste (com screenshots das falhas).
4. Ao final, a run é concluída automaticamente (`run.complete: true`).

### Passo a passo

1. **Token:** no Qase, gere um API token (Workspace > APIs/Apps).
2. **Casos no Qase:** cadastre (ou importe) os casos da planilha. Cada caso recebe um número (ex.: `ENG-12` → **12**).
3. **Mapeamento:** em `cypress/support/qase/qase-ids.js`, troque o `null` do ID da planilha pelo número do Qase:
   ```js
   GP01: 12,
   ```
4. **Nos testes**, o título é montado pelo helper `tc()`, que também faz o vínculo:
   ```js
   import { tc } from '../support/qase'

   it(tc('GP01', 'gera 10 palavras'), () => { ... })
   // título: "GP01 - gera 10 palavras", vinculado ao caso 12 do Qase
   it(tc(['SA01', 'SA04'], 'encerra a sessão'), () => { ... }) // vários casos
   ```
   Enquanto o ID estiver `null`, o teste roda normalmente, mas não fica vinculado a um caso.
5. **Secrets no Azure DevOps:** crie `QASE_API_TOKEN` (secreta) e `QASE_PROJECT_CODE`. O `azure-pipelines.yml` já repassa como `QASE_TESTOPS_API_TOKEN` e `QASE_TESTOPS_PROJECT`.

### Rodar localmente enviando ao Qase

Por padrão (`QASE_MODE` vazio = `off`), rodar local **não envia nada**. Para enviar:

```bash
# Linux/macOS
QASE_TESTOPS_API_TOKEN=seu_token QASE_TESTOPS_PROJECT=ENG npm run cy:run:qase
```
```powershell
# Windows PowerShell
$env:QASE_TESTOPS_API_TOKEN="seu_token"; $env:QASE_TESTOPS_PROJECT="ENG"; npm run cy:run:qase
```

### Recursos extras do reporter (opcionais)

Dentro de um `it()` é possível usar `qase.step('...', () => {...})`, `qase.fields({ severity: 'critical' })` e `qase.attach(...)`. Importe com `import { qase } from '../support/qase'`.

## CI (Azure DevOps)

O `azure-pipelines.yml` roda os testes em headless em push e PR na `main`. As senhas e o token do Qase entram como variáveis secretas. No Azure, variável secreta só chega ao script se for mapeada em `env:`, e é por isso que elas estão listadas lá. O `cy.env()` lê as variáveis com prefixo `CYPRESS_`.

## Perfis de teste

A variável `USER_PROFILES`, em `cypress/support/utils/users.js`, centraliza premium, free e admin. Os títulos das suítes identificam o perfil executado.

- Gerador de Palavras, Treinar Fala e Flashcards: premium e admin executam os cenários funcionais; free verifica o bloqueio de acesso.
- Documentação e Sair: os cenários executam para os três perfis.
- Premium: preserva os cenários específicos de cada perfil.

`hasPremium` descreve o acesso esperado; não concede permissões. E-mails e senhas permanecem em `cypress.env.json`, nas chaves `emailKey` e `passwordKey`. Cada perfil possui sua própria sessão.

O perfil `unconfirmed` também integra `USER_PROFILES`. `AUTHENTICATED_PROFILES` seleciona apenas premium, free e admin para cenários autenticados. O spec `login.cy.js` usa `unconfirmedEmail` e `unconfirmedPassword` e exige a resposta real `email_not_confirmed`, permanência em `/auth` e ausência de sessão. `invalid_credentials` indica que a conta de teste precisa ser corrigida no ambiente.

No Azure DevOps, configure também a variável secreta `UNCONFIRMED_PASSWORD`; o pipeline a encaminha para o novo perfil.
