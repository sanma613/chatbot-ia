// Hook para verificar y redirigir según rol del usuario
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from './useUser';

type AllowedRole = 'user' | 'agent' | 'admin';

export function useRoleRedirect(allowedRole: AllowedRole) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;

    // Si el usuario no tiene el rol permitido, redirigir a su dashboard
    if (user.role !== allowedRole) {
      console.log(
        `[useRoleRedirect] Usuario con rol ${user.role} intentando acceder a ruta de ${allowedRole}`
      );

      switch (user.role) {
        case 'user':
          console.log('[useRoleRedirect] Redirigiendo a /chat');
          router.replace('/chat');
          break;
        case 'agent':
          console.log('[useRoleRedirect] Redirigiendo a /caso-activo');
          router.replace('/caso-activo');
          break;
        case 'admin':
          console.log('[useRoleRedirect] Redirigiendo a /escalate');
          router.replace('/escalate');
          break;
        default:
          console.log(
            '[useRoleRedirect] Rol desconocido, redirigiendo a login'
          );
          router.replace('/login');
      }
    }
  }, [user, loading, allowedRole, router]);

  return { user, loading };
}
