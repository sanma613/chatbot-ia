
import Sidebar from '../components/Sidebar';
import React from 'react';

export default function StudentLayout({children,}: {children: React.ReactNode;}){
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar />
            <main className="flex-1 bg-white">
                {children}
            </main>
        </div>
);
}
