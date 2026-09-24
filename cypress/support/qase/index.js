import { qase } from 'cypress-qase-reporter/mocha'
import { QASE_IDS } from './qase-ids'

/**
 * Monta o título do teste e, se houver ID do Qase mapeado, vincula o teste ao caso.
 *
 * @param {string|string[]} casos  ID(s) da planilha. Ex.: 'GP01' ou ['SA01', 'SA04']
 * @param {string} titulo          Descrição do teste
 * @returns {string} título pronto para o it()
 *
 * @example
 *   it(tc('GP01', 'gera 10 palavras'), () => { ... })
 *   // título: "GP01 - gera 10 palavras"  e  vinculado ao caso do Qase mapeado
 */
export const tc = (casos, titulo) => {
  const lista = Array.isArray(casos) ? casos : [casos]
  const tituloCompleto = `${lista.join('/')} - ${titulo}`

  lista.forEach((id) => {
    if (!(id in QASE_IDS)) throw new Error(`ID "${id}" não existe em qase-ids.js`)
  })

  const qaseIds = lista.map((id) => QASE_IDS[id]).filter((id) => id !== null)
  if (qaseIds.length === 0) return tituloCompleto

  return qase(qaseIds.length === 1 ? qaseIds[0] : qaseIds, tituloCompleto)
}

export { qase }
