import { updateSession } from '@/lib/supabase/middleware'
import { rewritePathForCustomDomain, resolveSlugFromHost } from '@/lib/org/resolve-host-tenant'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/a/')) {
    const url = request.nextUrl.clone()
    url.pathname = url.pathname.replace(/^\/a\//, '/o/')
    return NextResponse.redirect(url)
  }

  const slug = resolveSlugFromHost(request.headers.get('host'))
  if (slug) {
    const rewritten = rewritePathForCustomDomain(request.nextUrl.pathname, slug)
    if (rewritten) {
      const url = request.nextUrl.clone()
      url.pathname = rewritten
      return updateSession(new NextRequest(url, request))
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth callback routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
