'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useConversation } from '@/hooks/useConversation';
import {
    ConversationHeader,
    MessageContainer,
    LoadingState,
    ErrorState
} from '@/components/chat';

export default function ConversationPage() {
    const params = useParams();
    const conversationId = params?.id as string;
    
    const { conversation, loading, error } = useConversation(conversationId);

    if (loading) {
        return <LoadingState />;
    }

    if (error || !conversation) {
        return <ErrorState error={error || 'Conversación no encontrada'} />;
    }

    return (
        <div className="h-screen overflow-hidden flex flex-col">
            <div className="max-w-4xl mx-auto p-6 flex flex-col h-full gap-6">
                <ConversationHeader conversation={conversation} />
                <div className="flex-1 min-h-0">
                    <MessageContainer messages={conversation.messages} />
                </div>
            </div>
        </div>
    );
}