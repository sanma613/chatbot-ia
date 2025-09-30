import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedRoutes = [
    '/chat',
    '/calendar', 
    '/history',
    '/notifications',
    '/escalate'
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Verificar si la ruta necesita protección
    const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(route)
    );
    
    // Si no es una ruta protegida, continuar
    if (!isProtectedRoute) {
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

    // Verificar si el token es válido haciendo una petición al backend
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await fetch(`${backendUrl}/auth/me`, {
            method: 'GET',
            headers: {
                'Cookie': request.headers.get('cookie') || '',
                'Content-Type': 'application/json'
            }
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

        // Token válido, continuar
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