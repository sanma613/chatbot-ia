// frontend/src/hooks/useUser.ts
'use client';

import { useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'agent' | 'admin';
}

export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const url = process.env.NEXT_PUBLIC_BACKEND_URL;
        const res = await fetch(`${url}/auth/me`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('No se pudo obtener el usuario');
        }

        const data = await res.json();
        setUser(data?.user);
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};
