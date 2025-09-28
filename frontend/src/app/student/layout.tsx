
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar'
import React from 'react';

export default function StudentLayout({children,}: {children: React.ReactNode;}){
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto">
                    <div className="flex-1 bg-white rounded-2xl shadow-lg">
                        {children}
                    </div>
                </main>
            </div>
        </div>
);
}
