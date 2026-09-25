// Carregado automaticamente antes de cada spec (supportFile no cypress.config.js)
import { register as registerCypressGrep } from '@cypress/grep'
import './commands'

// Permite filtrar testes pelo título. Ex.: --expose grep=-[BUG] (tudo, menos os [BUG])
registerCypressGrep()