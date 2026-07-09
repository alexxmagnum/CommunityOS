export const messages = {
  common: {
    reserve: 'Reservar',
    menu: 'Carta',
    events: 'Experiencias',
    tournaments: 'Torneos',
    back: 'Volver',
    loading: 'Cargando…',
    pay: 'Pagar',
    payNow: 'Pagar ahora',
    included: 'Incluido',
    demoPayment: 'Pago simulado (demo)',
  },
  home: {
    welcome: 'Bienvenido',
    upcoming: 'Próximas experiencias',
    forYou: 'Para ti',
    activity: 'Actividad reciente',
  },
  event: {
    register: 'Inscribirse',
    registered: 'Inscrito',
    waitlist: 'Lista de espera',
    soldOut: 'Completo',
    spotsLeft: 'Solo quedan {count}',
  },
  reservation: {
    confirm: 'Confirmar reserva',
    success: 'Reserva confirmada',
    payToConfirm: 'Pagar para confirmar',
  },
} as const

export type MessageTree = {
  common: Record<string, string>
  home: Record<string, string>
  event: Record<string, string>
  reservation: Record<string, string>
}

export type Messages = typeof messages
