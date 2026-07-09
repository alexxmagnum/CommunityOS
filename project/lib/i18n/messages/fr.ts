import type { MessageTree } from './es'

export const messages: MessageTree = {
  common: {
    reserve: 'Réserver',
    menu: 'Carte',
    events: 'Expériences',
    tournaments: 'Tournois',
    back: 'Retour',
    loading: 'Chargement…',
    pay: 'Payer',
    payNow: 'Payer maintenant',
    included: 'Inclus',
    demoPayment: 'Paiement simulé (démo)',
  },
  home: {
    welcome: 'Bienvenue',
    upcoming: 'Prochaines expériences',
    forYou: 'Pour vous',
    activity: 'Activité récente',
  },
  event: {
    register: "S'inscrire",
    registered: 'Inscrit',
    waitlist: "Liste d'attente",
    soldOut: 'Complet',
    spotsLeft: 'Plus que {count}',
  },
  reservation: {
    confirm: 'Confirmer la réservation',
    success: 'Réservation confirmée',
    payToConfirm: 'Payer pour confirmer',
  },
}
