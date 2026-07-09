import type { MessageTree } from './es'

export const messages: MessageTree = {
  common: {
    reserve: 'Reservieren',
    menu: 'Speisekarte',
    events: 'Erlebnisse',
    tournaments: 'Turniere',
    back: 'Zurück',
    loading: 'Laden…',
    pay: 'Bezahlen',
    payNow: 'Jetzt bezahlen',
    included: 'Inklusive',
    demoPayment: 'Simulierte Zahlung (Demo)',
  },
  home: {
    welcome: 'Willkommen',
    upcoming: 'Kommende Erlebnisse',
    forYou: 'Für Sie',
    activity: 'Letzte Aktivität',
  },
  event: {
    register: 'Anmelden',
    registered: 'Angemeldet',
    waitlist: 'Warteliste',
    soldOut: 'Ausgebucht',
    spotsLeft: 'Nur noch {count}',
  },
  reservation: {
    confirm: 'Reservierung bestätigen',
    success: 'Reservierung bestätigt',
    payToConfirm: 'Zur Bestätigung bezahlen',
  },
}
