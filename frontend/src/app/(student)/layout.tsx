import Sidebar from '@/components/Sidebar';
import ProtectedRoute from '@/components/ProtectedRoute';
import React from 'react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar />
        <main className="flex-1 bg-white">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
