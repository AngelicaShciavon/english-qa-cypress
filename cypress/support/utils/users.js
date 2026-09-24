// Credenciais ficam em cypress.env.json; aqui definimos apenas os perfis e permissões.
export const USER_PROFILES = [
  { id: 'premium', emailKey: 'premiumEmail', passwordKey: 'premiumPassword', hasPremium: true, canLogin: true },
  { id: 'free', emailKey: 'freeEmail', passwordKey: 'freePassword', hasPremium: false, canLogin: true },
  { id: 'admin', emailKey: 'adminEmail', passwordKey: 'adminPassword', hasPremium: true, canLogin: true },
  { id: 'unconfirmed', emailKey: 'unconfirmedEmail', passwordKey: 'unconfirmedPassword', hasPremium: false, canLogin: false },
]

// Somente estes perfis podem executar cenarios que exigem uma sessao autenticada.
export const AUTHENTICATED_PROFILES = USER_PROFILES.filter((profile) => profile.canLogin)
