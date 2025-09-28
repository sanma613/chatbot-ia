
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Calendar, History, Bell, ChevronsRight, LogOut } from 'lucide-react';
import Image from 'next/image';

// Esto es un placeholder. Idealmente, obtendrías el usuario de una sesión.
const useUser = () => {
    return {
        name: 'Emanuel',
        };
};

const navItems = [
  { name: 'Chatbot', href: '/student', icon: MessageSquare },
  { name: 'Calendario', href: '/student/calendar', icon: Calendar },
  { name: 'Historial', href: '/student/history', icon: History },
  { name: 'Notificaciones', href: '/student/notifications', icon: Bell },
  { name: 'Escalada', href: '/student/escalate', icon: ChevronsRight },
];

const UserAvatarPlaceholder = () => (
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
      E{/*  primer letra del nombre */}
    </div>
);

const NavLink = ({ item }: { item: typeof navItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center py-6 px-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-white shadow-md'
          : 'text-dark hover:bg-gray-200 hover:text-primary'
      }`}
        >
      <item.icon size={20} />
      <span className="ml-4 font-semibold">{item.name}</span>
        </Link>
  );
};

export default function Sidebar() {
  const user = useUser();
  const handleLogout = () => {
    console.log('Cerrando sesión...');
    // Lógica para cerrar sesión
  }

  return (
    <aside className="w-64 flex-shrink-0 bg-white flex flex-col p-4 shadow-lg">
      {/* Logo */}
      <div className="px-2 mb-8">
        <Image
          src="/images/logo_uni.png"
          alt="Logo Unichatbot"
          width={200}
          height={50}
        />
      </div>
      
      {/* Se recorre cada item de la lista del menu */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>
    
      <div className="mt-auto">
        <div className="p-3 flex items-center justify-between bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <UserAvatarPlaceholder />
            <span className="ml-3 font-bold text-dark">{user.name}</span>
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