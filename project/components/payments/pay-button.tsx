'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckout } from '@/lib/payments/create-checkout'
import type { CreateCheckoutInput } from '@/lib/payments/types'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface PayButtonProps {
  input: Omit<CreateCheckoutInput, 'userId'> & { userId: string }
  label?: string
  onPaid?: () => void | Promise<void>
  disabled?: boolean
}

export function PayButton({ input, label, onPaid, disabled }: PayButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    try {
      const result = await createCheckout(input)

      if (result.status === 'free') {
        await onPaid?.()
        return
      }

      if (result.status === 'demo_paid') {
        toast.success('Pago simulado (demo)')
        await onPaid?.()
        return
      }

      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error de pago')
    } finally {
      setLoading(false)
    }
  }

  const total = input.items.reduce((s, i) => s + i.amountCents, 0)
  if (total <= 0) return null

  return (
    <Button onClick={handlePay} disabled={disabled || loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {label ?? 'Pagar ahora'}
    </Button>
  )
}
