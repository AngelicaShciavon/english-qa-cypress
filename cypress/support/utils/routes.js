// Rotas da aplicação (extraídas do roteador do front-end)
export const ROUTES = {
  auth: '/auth',
  home: '/',
  words: '/words',
  pronunciation: '/pronunciation',
  flashcards: '/flashcards',
  docs: '/docs',
  activatePremium: '/activate-premium',
  admin: '/admin',
  exercises: '/exercises',
}

// Endpoints do backend (Supabase) usados nos cy.intercept
export const API = {
  signIn: '**/auth/v1/token?grant_type=password',
  generateWords: '**/functions/v1/generate-words',
  generatePhrase: '**/functions/v1/generate-pronunciation-phrase',
  flashcards: '**/rest/v1/flashcards*',
  flashcardProgress: '**/rest/v1/user_flashcard_progress*',
}

// Chave onde o Supabase guarda a sessão no localStorage (sb-<projeto>-auth-token)
export const AUTH_STORAGE_KEY = /^sb-.+-auth-token$/
