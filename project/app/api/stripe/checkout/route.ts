import { NextResponse } from 'next/server'

/** Placeholder Stripe Checkout — requiere STRIPE_SECRET_KEY en producción */
export async function POST(request: Request) {
  const body = await request.json()
  const stripeKey = process.env.STRIPE_SECRET_KEY

  if (!stripeKey || stripeKey.includes('placeholder')) {
    return NextResponse.json(
      {
        error: 'Stripe no configurado',
        hint: 'Define STRIPE_SECRET_KEY y crea precios en el dashboard de Stripe',
        received: body.paymentId,
      },
      { status: 501 }
    )
  }

  // Integración real: stripe.checkout.sessions.create({ ... })
  return NextResponse.json({
    url: body.successPath ?? '/',
    message: 'Conectar @stripe/stripe-js y sessions.create aquí',
  })
}
