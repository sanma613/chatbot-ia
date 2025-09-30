import { Conversation, Message } from '@/app/types/chat';

// Función para generar IDs únicos
const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
};

// Mensajes simulados para la primera conversación
const conversation1Messages: Message[] = [
    {
        id: generateId(),
        content: "Hola, necesito ayuda con mis tareas de matemáticas",
        role: 'user',
        timestamp: new Date('2024-09-28T10:00:00')
    },
    {
        id: generateId(),
        content: "¡Hola! Estaré encantado de ayudarte con matemáticas. ¿Qué tema específico necesitas repasar?",
        role: 'assistant',
        timestamp: new Date('2024-09-28T10:00:30')
    },
    {
        id: generateId(),
        content: "Estoy teniendo problemas con ecuaciones cuadráticas",
        role: 'user',
        timestamp: new Date('2024-09-28T10:01:00')
    },
    {
        id: generateId(),
        content: "Perfecto. Las ecuaciones cuadráticas tienen la forma ax² + bx + c = 0. Te explico paso a paso cómo resolverlas usando la fórmula cuadrática...",
        role: 'assistant',
        timestamp: new Date('2024-09-28T10:01:15')
    }
];

// Mensajes simulados para la segunda conversación
const conversation2Messages: Message[] = [
    {
        id: generateId(),
        content: "¿Puedes ayudarme a entender la fotosíntesis?",
        role: 'user',
        timestamp: new Date('2024-09-27T15:30:00')
    },
    {
        id: generateId(),
        content: "¡Por supuesto! La fotosíntesis es el proceso por el cual las plantas convierten la luz solar en energía química. Te explico cómo funciona:",
        role: 'assistant',
        timestamp: new Date('2024-09-27T15:30:20')
    },
    {
        id: generateId(),
        content: "Interesante, ¿y qué papel juega la clorofila en este proceso?",
        role: 'user',
        timestamp: new Date('2024-09-27T15:32:00')
    },
    {
        id: generateId(),
        content: "Excelente pregunta. La clorofila es el pigmento verde que captura la energía lumínica. Actúa como una 'antena molecular' que absorbe principalmente luz roja y azul...",
        role: 'assistant',
        timestamp: new Date('2024-09-27T15:32:30')
    },
    {
        id: generateId(),
        content: "¿Podrías explicarme las fases de la fotosíntesis?",
        role: 'user',
        timestamp: new Date('2024-09-27T15:35:00')
    }
];

// Datos mock de conversaciones
export const mockConversations: Conversation[] = [
    {
        id: 'conv_001',
        title: 'Ayuda con Matemáticas - Ecuaciones Cuadráticas',
        createdAt: new Date('2024-09-28T10:00:00'),
        updatedAt: new Date('2024-09-28T10:15:00'),
        messageCount: conversation1Messages.length,
        lastMessage: 'Perfecto. Las ecuaciones cuadráticas tienen la forma ax² + bx + c = 0...',
        messages: conversation1Messages
    },
    {
        id: 'conv_002',
        title: 'Biología - Fotosíntesis y Clorofila',
        createdAt: new Date('2024-09-27T15:30:00'),
        updatedAt: new Date('2024-09-27T15:40:00'),
        messageCount: conversation2Messages.length,
        lastMessage: '¿Podrías explicarme las fases de la fotosíntesis?',
        messages: conversation2Messages
    }
];

// Función para obtener todas las conversaciones (simula llamada a API)
export const getChatHistory = (): Promise<Conversation[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockConversations);
        }, 500); // Simula latencia de red
    });
};

// Función para obtener una conversación específica por ID
export const getConversationById = (id: string): Promise<Conversation | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const conversation = mockConversations.find(conv => conv.id === id);
            resolve(conversation || null);
        }, 300);
    });
};