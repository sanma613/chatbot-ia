'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  History,
  Bell,
  LogOut,
  LucideIcon,
  BookOpen,
} from 'lucide-react';

import { useUser } from '@/hooks/useUser';
import { handleError } from '@/lib/errors';
import { cn } from '@/lib/Utils';

// --- Tipo para items de navegación ---
export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

// --- Items de navegación por defecto (student) ---
const defaultNavItems: NavItem[] = [
  { name: 'Chatbot', href: '/chat', icon: MessageSquare },
  { name: 'Soluciones Rápidas', href: '/soluciones-rapidas', icon: BookOpen },
  { name: 'Calendario', href: '/calendar', icon: Calendar },
  { name: 'Historial', href: '/history', icon: History },
  { name: 'Notificaciones', href: '/notifications', icon: Bell },
];

// --- Avatar de usuario ---
const UserAvatar = ({ fullName }: { fullName?: string }) => {
  const firstLetter = fullName?.charAt(0)?.toUpperCase() || 'U';
  return (
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
      {firstLetter}
    </div>
  );
};

// --- Link de navegación ---
const NavLink = ({ item }: { item: NavItem }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center py-6 px-3 rounded-lg transition-colors',
        isActive
          ? 'bg-primary text-white shadow-md'
          : 'text-dark hover:bg-gray-200 hover:text-primary'
      )}
    >
      <item.icon size={20} />
      <span className="ml-4 font-semibold">{item.name}</span>
    </Link>
  );
};

// --- Sidebar Props ---
interface SidebarProps {
  navItems?: NavItem[];
}

// --- Sidebar ---
export default function Sidebar({ navItems = defaultNavItems }: SidebarProps) {
  const { user, loading } = useUser();
  const router = useRouter();
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Spinner mientras carga el usuario
  if (loading) {
    return;
  }

  // Logout
  const logoutUser = async () => {
    try {
      const res = await fetch(`${url}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error cerrando sesión');
      }

      return await res.json();
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.push('/');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white flex flex-col p-4 shadow-lg">
      {/* Logo */}
      <div className="px-2 mb-8">
        <Image
          src="/images/logo_uni.png"
          alt="Logo Unichatbot"
          width={200}
          height={50}
          style={{ width: '200px', height: 'auto' }}
        />
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>

      {/* Usuario */}
      <div className="mt-auto">
        <div className="p-3 flex items-center justify-between bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <UserAvatar fullName={user?.full_name} />
            <span className="ml-3 font-bold text-dark">
              {user?.full_name || 'Usuario'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-dark hover:text-red-500 transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut size={22} />
          </button>
        </div>
      </div>
    </aside>
  );
}
