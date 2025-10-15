import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación de usuario (estudiante)
const userRoutes = ['/chat', '/calendar', '/history', '/notifications'];

// Rutas que requieren permisos de agente de soporte
const agentRoutes = ['/caso-activo', '/solicitudes'];

// Rutas que requieren permisos de administrador
const adminRoutes = ['/escalate', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar el tipo de ruta
  const isUserRoute = userRoutes.some((route) => pathname.startsWith(route));

  const isAgentRoute = agentRoutes.some((route) => pathname.startsWith(route));

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Si no es ninguna ruta protegida, continuar
  if (!isUserRoute && !isAgentRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Intentar obtener el token de las cookies
  const token = request.cookies.get('session')?.value;

  // Si no hay token, redirigir a login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar si el token es válido y obtener el rol del usuario
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Si es 401 (token expirado/inválido), mostrar página 401
      if (response.status === 401) {
        const unauthorizedUrl = new URL('/401', request.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
      // Para otros errores, redirigir a login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Obtener el rol del usuario
    const data = await response.json();
    const userRole = data?.user?.role;

    console.log('[Middleware] Pathname:', pathname);
    console.log('[Middleware] User role:', userRole);
    console.log('[Middleware] isUserRoute:', isUserRoute);
    console.log('[Middleware] isAgentRoute:', isAgentRoute);
    console.log('[Middleware] isAdminRoute:', isAdminRoute);

    // Verificar permisos según el rol y la ruta
    if (isUserRoute && userRole !== 'user') {
      // Ruta de usuario pero el usuario tiene otro rol -> redirigir a su panel
      if (userRole === 'agent') {
        const agentUrl = new URL('/caso-activo', request.url);
        return NextResponse.redirect(agentUrl);
      }
      if (userRole === 'admin') {
        const adminUrl = new URL('/escalate', request.url);
        return NextResponse.redirect(adminUrl);
      }
      // Si no tiene rol reconocido, mostrar 401
      const unauthorizedUrl = new URL('/401', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    if (isAgentRoute && userRole !== 'agent') {
      // Ruta de agente pero el usuario tiene otro rol -> redirigir a su panel
      if (userRole === 'user') {
        const userUrl = new URL('/chat', request.url);
        return NextResponse.redirect(userUrl);
      }
      if (userRole === 'admin') {
        const adminUrl = new URL('/escalate', request.url);
        return NextResponse.redirect(adminUrl);
      }
      // Si no tiene rol reconocido, mostrar 401
      const unauthorizedUrl = new URL('/401', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    if (isAdminRoute && userRole !== 'admin') {
      // Ruta de admin pero el usuario tiene otro rol -> redirigir a su panel
      if (userRole === 'user') {
        const userUrl = new URL('/chat', request.url);
        return NextResponse.redirect(userUrl);
      }
      if (userRole === 'agent') {
        const agentUrl = new URL('/caso-activo', request.url);
        return NextResponse.redirect(agentUrl);
      }
      // Si no tiene rol reconocido, mostrar 401
      const unauthorizedUrl = new URL('/401', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // Token válido y rol correcto, continuar
    return NextResponse.next();
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    // En caso de error, redirigir a login por seguridad
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Configuración del middleware - especificar en qué rutas aplicar
export const config = {
  matcher: [
    /*
     * Aplicar middleware a todas las rutas excepto:
     * - api (rutas de API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
