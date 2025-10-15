// Componente de redirección basada en rol
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';

export default function RoleBasedRedirect() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Redirigir según el rol del usuario
    switch (user.role) {
      case 'user':
        router.push('/chat');
        break;
      case 'agent':
        router.push('/caso-activo');
        break;
      case 'admin':
        router.push('/escalate');
        break;
      default:
        router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-lg text-gray-700">Redirigiendo...</span>
    </div>
  );
}
