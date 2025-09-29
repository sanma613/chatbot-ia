'use client';
import { handleError } from '@/lib/errors';
import { useRouter } from 'next/navigation';
import React, { useState, ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useNotification } from '@/hooks/useNotification';
import NotificationModal from '@/components/modals/NotificationModal';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  const router = useRouter();
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  async function registerUser(data: SignupFormData) {
    try {
      const res = await fetch(`${url}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          full_name: data.name,
          role: data.role,
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error registrando usuario');
      }

      return await res.json(); // { message: "Usuario creado correctamente" }
    } catch (error: unknown) {
      handleError(error);
      throw error;
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validaciones del formulario
    if (formData.password !== formData.confirmPassword) {
      showError(
        'Error de validación',
        'Las contraseñas no coinciden. Por favor verifica que ambas contraseñas sean idénticas.'
      );
      return;
    }

    if (formData.password.length < 6) {
      showError(
        'Contraseña muy corta',
        'La contraseña debe tener al menos 6 caracteres para garantizar la seguridad de tu cuenta.'
      );
      return;
    }

    if (!formData.name.trim()) {
      showError(
        'Campo requerido',
        'El nombre completo es obligatorio. Por favor ingresa tu nombre.'
      );
      return;
    }

    try {
      await registerUser(formData);
      showSuccess(
        '¡Registro exitoso!',
        'Tu cuenta ha sido creada correctamente. Serás redirigido al login para iniciar sesión.'
      );
      
      // Redirigir después de un breve delay para que el usuario vea la notificación
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: unknown) {
      console.error('Error en registro:', error);
      showError(
        'Error de registro',
        'No se pudo crear tu cuenta. Por favor verifica tus datos e intenta nuevamente.'
      );
    }
  };

  return (
    // Contenedor principal que centra la tarjeta de registro en la pantalla
    <main className="flex items-center justify-center min-h-screen bg-[#F5F5F5]">
      {/* Tarjeta de Registro */}
      <div className="w-full max-w-md p-5 space-y-8 bg-light rounded-2xl shadow-2xl">
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
        <h1 className="text-xl font-bold text-center text-primary">
          Crear Cuenta
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
      
      {/* Modal de Notificación */}
      {notification && notification.isOpen && (
        <NotificationModal
          isOpen={true}
          onClose={hideNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
      )}
    </main>
  );
}
