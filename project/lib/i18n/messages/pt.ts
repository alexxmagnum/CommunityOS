import type { MessageTree } from './es'

export const messages: MessageTree = {
  common: {
    reserve: 'Reservar',
    menu: 'Ementa',
    events: 'Experiências',
    tournaments: 'Torneios',
    back: 'Voltar',
    loading: 'A carregar…',
    pay: 'Pagar',
    payNow: 'Pagar agora',
    included: 'Incluído',
    demoPayment: 'Pagamento simulado (demo)',
  },
  home: {
    welcome: 'Bem-vindo',
    upcoming: 'Próximas experiências',
    forYou: 'Para si',
    activity: 'Atividade recente',
  },
  event: {
    register: 'Inscrever-se',
    registered: 'Inscrito',
    waitlist: 'Lista de espera',
    soldOut: 'Esgotado',
    spotsLeft: 'Só restam {count}',
  },
  reservation: {
    confirm: 'Confirmar reserva',
    success: 'Reserva confirmada',
    payToConfirm: 'Pagar para confirmar',
  },
}
