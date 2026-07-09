import type { MessageTree } from './es'

export const messages: MessageTree = {
  common: {
    reserve: 'Book',
    menu: 'Menu',
    events: 'Experiences',
    tournaments: 'Tournaments',
    back: 'Back',
    loading: 'Loading…',
    pay: 'Pay',
    payNow: 'Pay now',
    included: 'Included',
    demoPayment: 'Simulated payment (demo)',
  },
  home: {
    welcome: 'Welcome',
    upcoming: 'Upcoming experiences',
    forYou: 'For you',
    activity: 'Recent activity',
  },
  event: {
    register: 'Register',
    registered: 'Registered',
    waitlist: 'Join waitlist',
    soldOut: 'Sold out',
    spotsLeft: 'Only {count} left',
  },
  reservation: {
    confirm: 'Confirm booking',
    success: 'Booking confirmed',
    payToConfirm: 'Pay to confirm',
  },
}
