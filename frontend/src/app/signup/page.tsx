'use client';
import React, { useState, ChangeEvent, FormEvent } from 'react';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Contraseñas no coinciden');
      return;
    }
    console.log('Datos de registro: ', formData);
  };

  return (
    // Contenedor principal que centra la tarjeta de registro en la pantalla
    <main className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
      {/* Tarjeta de Registro */}
      <div className="w-full max-w-md p-8 space-y-8 bg-light rounded-2xl shadow-2xl">
        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-primary">
          Crear Cuenta - Logo
        </h1>

        {/* Formulario */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Campo de Nombre */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-dark mb-1"
            >
              Nombre Completo
            </label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              type="text"
              autoComplete="name"
              required
              className="w-full px-4 py-2 text-dark bg-gray border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA024] placeholder-gray-400"
              placeholder="Tu Nombre"
            />
          </div>

          {/* Campo de Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-dark mb-1"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-2 text-dark bg-gray border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA024] placeholder-gray-400"
              placeholder="tu@email.com"
            />
          </div>

          {/* Campo de Contraseña */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-dark mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2 text-dark bg-gray border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA024] placeholder-gray-400"
              placeholder="••••••••"
            />
          </div>

          {/* Campo de Confirmar Contraseña */}
          <div>
            <label
              htmlFor="confirm-password"
              className="block text-sm font-medium text-dark mb-1"
            >
              Confirmar Contraseña
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2 text-dark bg-gray border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA024] placeholder-gray-400"
              placeholder="••••••••"
            />
          </div>

          {/* Botón de Registro */}
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-secondary rounded-md
           hover:bg-secondary-dark
           focus:outline-none focus:ring-2 focus:ring-offset-2
           focus:ring-offset-secondary-light focus:ring-secondary
           transition-colors duration-300"
          >
            Registrarse
          </button>
        </form>
      </div>
    </main>
  );
}
