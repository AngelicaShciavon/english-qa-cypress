// Mapa: ID da planilha  ->  ID do caso de teste no Qase.
// Depois de cadastrar/importar os casos no Qase, troque cada null pelo número
// do caso (ex.: o caso "ENG-12" no Qase vira 12).
// Enquanto estiver null, o teste roda normalmente, mas não é vinculado a um caso
// no Qase (o reporter registra o resultado só pelo título).
export const QASE_IDS = {
  // Gerador de Palavras
  GP01: null, GP02: null, GP03: null, GP04: null, GP05: null, GP06: null,
  GP07: null, GP08: null, GP09: null, GP10: null, GP11: null, GP12: null,
  GP12b: null, GP15: null, GP16: null, GP19: null, GP20: null, GP21: null,
  GP23: null, GP24: null,
  // Treinar Fala
  TF01: null, TF02: null, TF03: null, TF13: null, TF15: null, TF16: null,
  // Flashcards
  FC01: null, FC02: null, FC03: null, FC04: null, FC05: null, FC07: null,
  FC11: null, FC13: null, FC15: null,
  // Documentação
  DC01: null, DC02: null, DC07: null, DC08: null,
  // Premium
  PR01: null, PR02: null, PR05: null, PR08: null, PR09: null, PR10: null,
  PR11: null, PR12: null,
  // Sair
  SA01: null, SA02: null, SA03: null, SA04: null, SA06: null,
}
