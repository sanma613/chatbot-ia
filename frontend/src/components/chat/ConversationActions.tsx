import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/Utils';

export default function ConversationActions() {
    return (
        <div className="p-4 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between items-center">
                <span className="text-sm text-dark">
                    Conversación finalizada
                </span>
                <Link
                    href="/chat"
                    className={cn(
                        "px-4 py-2 bg-primary text-white rounded-lg",
                        "hover:bg-primary-dark transition-colors",
                        "text-sm font-medium"
                    )}
                >
                    Continuar en Chat
                </Link>
            </div>
        </div>
    );
}