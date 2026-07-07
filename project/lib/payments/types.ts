export type PaymentKind = 'reservation' | 'event_registration'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface CheckoutLineItem {
  label: string
  amountCents: number
  currency: string
}

export interface CreateCheckoutInput {
  organizationId: string
  userId: string
  kind: PaymentKind
  referenceId: string
  items: CheckoutLineItem[]
  successPath: string
  cancelPath: string
  demoMode?: boolean
}

export interface CheckoutResult {
  status: 'demo_paid' | 'redirect' | 'free'
  checkoutUrl?: string
  paymentId?: string
}
