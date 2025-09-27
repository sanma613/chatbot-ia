'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ChangeEvent, FormEvent } from 'react';
import { handleError } from '@/lib/errors';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function loginUser(data: FormData) {
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Credenciales inválidas');
      }

      return await res.json();
    } catch (error: unknown) {
      handleError(error);
      throw error;
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await loginUser(formData);
      console.log('Usuario logueado:', result);

      alert('Login exitoso');
      // router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Error en registro:', error);
    }
  };

  return (
    // Contenedor principal que ocupa toda la pantalla y centra el contenido
    <div className="min-h-screen flex items-center justify-center bg-light p-4">
      {/* Tarjeta de Login */}
      <div className="w-full max-w-md p-8 space-y-6 bg-light rounded-2xl shadow-lg">
        {/* Título */}
        <div className="text-center">
          <Image
          src="/images/logo_uni.png" 
          alt="Logo Unichatbot"
          width={300}
          height={100}
          className="mx-auto mb-6"
          />
        </div>

        {/* Formulario de Login */}
        <form className="space-y-6" onSubmit={handleSubmit}>
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
              onChange={handleChange}
              type="email"
              value={formData.email}
              autoComplete="email"
              required
              className="w-full px-4 py-2 bg-gray border border-transparent rounded-md text-dark focus:outline-none focus:ring-2 focus:ring-secondary"
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
              onChange={handleChange}
              value={formData.password}
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-2 bg-gray border border-transparent rounded-md text-dark focus:outline-none focus:ring-2 focus:ring-secondary"
              placeholder="••••••••"
            />
          </div>

          {/* Botón de Login */}
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white bg-secondary rounded-md hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-light focus:ring-secondary transition-colors duration-300"
          >
            Ingresar
          </button>
        </form>
        <p className="w-full text-dark text-center">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
