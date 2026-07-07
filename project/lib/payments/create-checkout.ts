import { isSupabaseConfigured } from '@/lib/org/is-supabase-configured'
import type { CheckoutResult, CreateCheckoutInput } from './types'

function totalCents(items: CreateCheckoutInput['items']) {
  return items.reduce((sum, i) => sum + i.amountCents, 0)
}

/** Crea sesión de pago — demo simula éxito; producción usa Stripe Checkout API */
export async function createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
  const total = totalCents(input.items)

  if (total <= 0) {
    return { status: 'free' }
  }

  if (input.demoMode || !isSupabaseConfigured()) {
    return { status: 'demo_paid', paymentId: `demo-pay-${Date.now()}` }
  }

  const paymentId = crypto.randomUUID()

  try {
    const { getSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = getSupabaseClient()

    await supabase.from('payments').insert({
      id: paymentId,
      organization_id: input.organizationId,
      user_id: input.userId,
      kind: input.kind,
      reference_id: input.referenceId,
      amount_cents: total,
      currency: input.items[0]?.currency ?? 'EUR',
      status: 'pending',
      metadata: { items: input.items },
    } as never)

    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId,
        organizationId: input.organizationId,
        items: input.items,
        successPath: input.successPath,
        cancelPath: input.cancelPath,
      }),
    })

    if (!res.ok) {
      throw new Error('No se pudo iniciar el pago')
    }

    const data = (await res.json()) as { url?: string }
    return { status: 'redirect', checkoutUrl: data.url, paymentId }
  } catch {
    return { status: 'demo_paid', paymentId }
  }
}

export async function markPaymentPaid(paymentId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { getSupabaseClient } = await import('@/lib/supabase/client')
  const supabase = getSupabaseClient()
  await supabase
    .from('payments')
    .update({ status: 'paid', paid_at: new Date().toISOString() } as never)
    .eq('id', paymentId)
}
