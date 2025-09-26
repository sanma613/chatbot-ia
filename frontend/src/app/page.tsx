'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Ballpit from './components/Ballpit'; 

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-light">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-white shadow-md z-10">
        <div className="w-40">
          <Image
            src="/images/logo_uni.png"
            alt="Logo Unichatbot"
            width={280}
            height={80}
          />
        </div>
        <nav>
          <Link
            href="/login"
            className="text-dark font-semibold hover:text-primary mr-4"
          >
          Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className="bg-secondary text-white font-semibold px-4 py-2 rounded-md hover:bg-secondary-dark transition-colors"
          >Registrarse
          </Link>
        </nav>
      </header>

      {/* Hero Section con fondo animado */}
      <main className="flex-grow flex items-center justify-center relative">
        {/* Contenedor para el fondo */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <Ballpit
            // propiedades
            count={50}
            gravity={0}
            colors={[0xFFA024, 0xDEE1E6]}
            friction={1}
            wallBounce={1}
            followCursor={false}
            className="w-full h-full"
          />
        </div>

        {/* Contenido de texto superpuesto */}
        <div className="relative z-10 text-center max-w-2xl mx-auto p-4">
          <h1 className="text-5xl font-bold text-primary mb-4">
            Bienvenido a UniChatbot
          </h1>
          <p className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-dark mb-8">
            Tu asistente inteligente para la vida universitaria. Resuelve dudas,
            organiza tu horario y prepárate para tus exámenes, todo en un solo
            lugar.
          </p>
          <Link
            href="/signup"
            className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-primary-dark transition-colors text-lg"
          >
            Comienza Ahora
          </Link>
        </div>
      </main>
    </div>
  );
}