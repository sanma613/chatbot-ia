'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

// Esto es un placeholder. Idealmente, obtendrías el usuario de una sesión.
const useUser = () => {
    return {
        name: 'Emmanuel', // Nombre de ejemplo
        };
};

export default function Navbar() {
    const user = useUser();

    const handleLogout = () => {
    // Lógica para cerrar la sesión del usuario
        console.log('Cerrando sesión...');

    };

return (
    <header className="w-full p-4 flex justify-between items-center bg-white shadow-md z-10">
      {/* Logo */}
    <Link href="/">
        <div className="w-40 cursor-pointer">
            <Image
            src="/images/logo_uni.png"
            alt="Logo Unichatbot"
            width={280}
            height={80}
            />
        </div>
    </Link>

      {/* Información de Usuario y Cerrar Sesión */}
    <div className="flex items-center gap-4">
        <span className="font-semibold text-dark hidden sm:inline">
            {user.name}
        </span>
        <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-500 font-semibold px-3 py-2 rounded-lg hover:bg-red-100/50 transition-colors"
        aria-label="Cerrar sesión"
        >
        <LogOut size={20} />
        <span className="hidden md:inline">Cerrar Sesión</span>
        </button>
    </div>
    </header>
  );
}