import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren rol ADMIN o STAFF
const ADMIN_PATHS      = ['/admin']
const ADMIN_ONLY_PATHS = ['/admin/accounting']

// Rutas privadas de cliente (requieren sesión activa, cualquier rol)
const CUSTOMER_PRIVATE_PATHS = ['/mis-ordenes', '/mis-cotizaciones', '/mi-cuenta']

// Si ADMIN/STAFF aterrizan aquí los mandamos al panel admin
const REDIRECT_STAFF_FROM = ['/', '/catalogo', '/productos', '/checkout', '/cotizaciones']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role       = request.cookies.get('user-role')?.value
  const hasSession = request.cookies.get('refresh-token')?.value

  // ── 1. Rutas /admin/* ───────────────────────────────────────────────────────
  if (isAdminPath(pathname)) {
    if (!hasSession) return redirectToLogin(request)
    if (isAdminOnlyPath(pathname) && role !== 'ADMIN')
      return NextResponse.redirect(new URL('/admin', request.url))
    if (role !== 'ADMIN' && role !== 'STAFF') return redirectToLogin(request)
    return NextResponse.next()
  }

  // ── 2. Rutas privadas de cliente ────────────────────────────────────────────
  if (CUSTOMER_PRIVATE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    if (!hasSession) return redirectToLogin(request)
    return NextResponse.next()
  }

  // ── 3. ADMIN/STAFF en páginas públicas → redirigir al panel ─────────────────
  // Saltar si tienen activa la vista previa de tienda (cookie store-preview=1)
  const storePreview = request.cookies.get('store-preview')?.value
  if (
    !storePreview &&
    hasSession &&
    (role === 'ADMIN' || role === 'STAFF') &&
    REDIRECT_STAFF_FROM.some(p => pathname === p || pathname.startsWith(p + '/'))
  ) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAdminOnlyPath(pathname: string) {
  return ADMIN_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    // Admin
    '/admin/:path*',
    // Rutas privadas cliente
    '/mis-ordenes', '/mis-ordenes/:path*',
    '/mis-cotizaciones', '/mis-cotizaciones/:path*',
    '/mi-cuenta',
    // Páginas públicas donde admin no debería estar
    '/',
    '/catalogo', '/catalogo/:path*',
    '/productos/:path*',
    '/checkout', '/checkout/:path*',
    '/cotizaciones/:path*',
  ],
}
