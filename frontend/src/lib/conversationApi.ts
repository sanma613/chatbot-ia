// Frontend API client for conversation management

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export interface CreateConversationResponse {
  conversation_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  rating?: 'up' | 'down' | null;
  rated_at?: string;
  response_type?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  is_escalated: boolean;
  escalated_at?: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  message_count?: number;
  last_message?: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

export interface ChatbotResponse {
  answer: string;
  conversation_id: string;
  user_message_id?: string;
  assistant_message_id?: string;
  escalated?: boolean;
}

/**
 * Create a new conversation
 */
export async function createConversation(): Promise<CreateConversationResponse> {
  const response = await fetch(`${API_URL}/conversations/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  return response.json();
}

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(): Promise<{
  conversations: Conversation[];
  count: number;
}> {
  const response = await fetch(`${API_URL}/conversations/conversations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }

  return response.json();
}

/**
 * Get a specific conversation with its messages
 */
export async function getConversationById(
  conversationId: string
): Promise<ConversationWithMessages> {
  const response = await fetch(
    `${API_URL}/conversations/conversations/${conversationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  return response.json();
}

/**
 * Send a message to the chatbot
 * Handles conversation creation automatically if no conversation_id is provided
 */
export async function sendChatMessage(
  question: string,
  conversationId?: string
): Promise<ChatbotResponse> {
  const response = await fetch(`${API_URL}/chatbot/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      question,
      conversation_id: conversationId || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to send message (${response.status})`;
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Rate a message (thumbs up/down)
 */
export async function rateMessage(
  messageId: string,
  rating: 'up' | 'down'
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_URL}/conversations/messages/${messageId}/rate`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ rating }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to rate message');
  }

  return response.json();
}

/**
 * Escalate a conversation to a human agent
 */
export async function escalateConversation(
  conversationId: string,
  message?: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_URL}/conversations/conversations/${conversationId}/escalate`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to escalate conversation');
  }

  return response.json();
}

/**
 * Add a message to an existing conversation manually
 */
export async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  responseType: string = 'general'
): Promise<{ message_id: string; timestamp: string; success: boolean }> {
  const response = await fetch(
    `${API_URL}/conversations/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        role,
        content,
        response_type: responseType,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to add message');
  }

  return response.json();
}

/**
 * Start a new conversation with initial user message
 * This creates the conversation and stores 2 messages: user, AI response
 * The welcome message is NOT stored - it's added dynamically in the UI
 */
export async function startConversation(
  initialMessage: string
): Promise<ConversationWithMessages> {
  const response = await fetch(`${API_URL}/chatbot/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      question: initialMessage,
      conversation_id: null, // Create new conversation
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.detail || `Failed to start conversation (${response.status})`;
    throw new Error(errorMessage);
  }

  const result = await response.json();

  // Transform response to match ConversationWithMessages interface
  // The backend returns conversation info + messages in a different format
  // We need to fetch the conversation details to get full data
  const conversationId = result.conversation_id;

  // Fetch full conversation data
  const conversationData = await getConversationById(conversationId);

  return conversationData;
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ success: boolean; title: string }> {
  const response = await fetch(
    `${API_URL}/conversations/conversations/${conversationId}/title`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to update title');
  }

  return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(
    `${API_URL}/conversations/conversations/${conversationId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }

  return response.json();
}
