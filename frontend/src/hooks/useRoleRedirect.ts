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
      switch (user.role) {
        case 'user':
          router.replace('/chat');
          break;
        case 'agent':
          router.replace('/caso-activo');
          break;
        case 'admin':
          router.replace('/escalate');
          break;
        default:
          router.replace('/login');
      }
    }
  }, [user, loading, allowedRole, router]);

  return { user, loading };
}
