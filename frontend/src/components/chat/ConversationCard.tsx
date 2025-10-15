import React, { useState } from 'react';
import Link from 'next/link';
import { Conversation } from '@/app/types/chat';
import {
  MessageSquare,
  Calendar,
  ArrowRight,
  Edit2,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/Utils';
import {
  updateConversationTitle,
  deleteConversation,
} from '@/lib/conversationApi';
import { useEscalationStatus } from '@/hooks/useEscalationStatus';
import EscalationBadge from './EscalationBadge';

interface ConversationCardProps {
  conversation: Conversation;
  onTitleUpdate?: (conversationId: string, newTitle: string) => void;
  onDelete?: (conversationId: string) => void;
}

export default function ConversationCard({
  conversation,
  onTitleUpdate,
  onDelete,
}: ConversationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(conversation.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Obtener estado de escalamiento (hooks deben ir antes de cualquier return)
  // Usamos el ID o un string vacío para evitar errores
  const conversationId = conversation?.id || '';
  const { status: escalationStatus } = useEscalationStatus(conversationId);

  // Validar que la conversación tenga la información necesaria
  if (!conversation || !conversation.id || !conversation.title) {
    console.warn('ConversationCard: Invalid conversation data', conversation);
    return null; // No renderizar si falta info crítica
  }

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }
  };

  const handleSaveTitle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editedTitle || editedTitle.trim() === '') {
      return;
    }

    setIsSaving(true);
    try {
      await updateConversationTitle(conversation.id, editedTitle.trim());
      setIsEditing(false);
      if (onTitleUpdate) {
        onTitleUpdate(conversation.id, editedTitle.trim());
      }
    } catch (error) {
      console.error('Error updating title:', error);
      alert('No se pudo actualizar el título');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditedTitle(conversation.title);
    setIsEditing(false);
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar esta conversación? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteConversation(conversation.id);
      if (onDelete) {
        onDelete(conversation.id);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('No se pudo eliminar la conversación');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'block p-6 bg-white rounded-lg border border-gray-200',
        'hover:border-primary hover:shadow-lg transition-all duration-200',
        'group'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Título - Editable */}
          <div className="flex items-center gap-2 mb-2">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:border-primary text-dark"
                  maxLength={100}
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isSaving}
                  className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Guardar"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Cancelar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href={`/chat/${conversation.id}`}
                  className={cn(
                    'flex-1 text-lg font-semibold text-dark',
                    'group-hover:text-primary transition-colors',
                    'truncate cursor-pointer'
                  )}
                >
                  {conversation.title}
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleStartEdit}
                    className="opacity-100 p-1 text-slate-400 hover:text-primary rounded transition-all"
                    title="Editar título"
                    disabled={isDeleting}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all"
                    title="Eliminar conversación"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Último mensaje */}
          {conversation.lastMessage && conversation.lastMessage.trim() && (
            <Link href={`/chat/${conversation.id}`} className="block">
              <p className="text-dark text-sm mb-3 line-clamp-2 cursor-pointer">
                {conversation.lastMessage}
              </p>
            </Link>
          )}

          {/* Metadatos */}
          <div className="flex items-center gap-4 text-sm text-dark">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {conversation.updatedAt
                ? formatDate(conversation.updatedAt)
                : 'Fecha desconocida'}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {typeof conversation.messageCount === 'number'
                ? `${conversation.messageCount + 1} mensajes`
                : 'Sin mensajes'}
            </div>
          </div>

          {/* Badge de estado de escalamiento */}
          {escalationStatus && (
            <div className="mt-2">
              <EscalationBadge status={escalationStatus} />
            </div>
          )}
        </div>

        {/* Icono de navegación */}
        <Link
          href={`/chat/${conversation.id}`}
          className={cn(
            'flex-shrink-0 ml-4',
            'text-dark group-hover:text-primary',
            'transition-all duration-200',
            'group-hover:translate-x-1'
          )}
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
