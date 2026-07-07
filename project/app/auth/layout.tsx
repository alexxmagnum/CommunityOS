import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#0c0f14]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    }>
      {children}
    </Suspense>
  )
}
