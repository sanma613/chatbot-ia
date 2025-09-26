
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Calendar, History, Bell, ChevronsRight, Plus } from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { name: 'Chatbot', href: '/student', icon: MessageSquare },
  { name: 'Calendario', href: '/student/calendar', icon: Calendar },
  { name: 'Historial', href: '/student/history', icon: History },
  { name: 'Notificaciones', href: '/student/notifications', icon: Bell },
  { name: 'Escalada', href: '/student/escalate', icon: ChevronsRight },
];

const UserAvatarPlaceholder = () => (
    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
      U
    </div>
);

const NavLink = ({ item }: { item: typeof navItems[0] }) => {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={`flex items-center p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-200 hover:text-dark'
      }`}
    >
      <item.icon size={20} />
      <span className="ml-4 font-semibold">{item.name}</span>
    </Link>
  );
};

export default function Sidebar() {
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

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.name} item={item} />
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="mt-auto">
        <div className="p-3 flex items-center justify-between bg-gray-100 rounded-lg">
          <div className="flex items-center">
            <UserAvatarPlaceholder />
            <span className="ml-3 font-bold text-dark">Usuario</span>
          </div>
          <button className="text-gray-500 hover:text-primary">
            <Plus size={24} />
          </button>
        </div>
      </div>
    </aside>
  );
}
