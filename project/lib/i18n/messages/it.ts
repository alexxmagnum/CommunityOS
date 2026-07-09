import type { MessageTree } from './es'

export const messages: MessageTree = {
  common: {
    reserve: 'Prenota',
    menu: 'Menu',
    events: 'Esperienze',
    tournaments: 'Tornei',
    back: 'Indietro',
    loading: 'Caricamento…',
    pay: 'Paga',
    payNow: 'Paga ora',
    included: 'Incluso',
    demoPayment: 'Pagamento simulato (demo)',
  },
  home: {
    welcome: 'Benvenuto',
    upcoming: 'Prossime esperienze',
    forYou: 'Per te',
    activity: 'Attività recente',
  },
  event: {
    register: 'Iscriviti',
    registered: 'Iscritto',
    waitlist: 'Lista d\'attesa',
    soldOut: 'Esaurito',
    spotsLeft: 'Solo {count} posti',
  },
  reservation: {
    confirm: 'Conferma prenotazione',
    success: 'Prenotazione confermata',
    payToConfirm: 'Paga per confermare',
  },
}
