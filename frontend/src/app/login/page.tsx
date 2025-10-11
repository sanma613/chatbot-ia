'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, FormEvent } from 'react';
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Obtener la URL de redirección si existe
  const redirectUrl = searchParams.get('redirect') || '/chat';
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  async function loginUser(data: FormData) {
    try {
      const res = await fetch(`${url}/auth/login`, {
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
      throw error;
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const result = await loginUser(formData);
      console.log('Usuario logueado:', result);

      showSuccess(
        '¡Bienvenido!',
        'Has iniciado sesión correctamente. Serás redirigido en unos momentos.'
      );

      // Redirigir después de mostrar el mensaje de éxito
      setTimeout(() => {
        router.push(redirectUrl);
      }, 2000);
    } catch (error: unknown) {
      console.error('Error en login:', error);

      // Mostrar error personalizado según el tipo
      if (error instanceof Error) {
        showError(
          'Error de Autenticación',
          error.message === 'Credenciales inválidas'
            ? 'El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos e intenta nuevamente.'
            : 'Ocurrió un problema al iniciar sesión. Por favor, intenta nuevamente.'
        );
      } else {
        showError(
          'Error Inesperado',
          'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'
        );
      }
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

      {/* Toast de Notificación */}
      {toast && (
        <Toast
          isVisible={toast.isVisible}
          onClose={hideToast}
          type={toast.type}
          title={toast.title}
          message={toast.message}
        />
      )}
    </div>
  );
}
