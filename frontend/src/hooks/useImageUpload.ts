import { useState } from 'react';

interface UploadImageParams {
  conversationId: string;
  image: File;
  content?: string;
}

interface UploadImageResponse {
  success: boolean;
  message: {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    image_url: string;
    response_type: string;
    timestamp: string;
  };
  image_url: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async ({
    conversationId,
    image,
    content = '',
  }: UploadImageParams): Promise<UploadImageResponse | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      if (content) {
        formData.append('content', content);
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/messages/send-with-image/${conversationId}`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al subir imagen');
      }

      const data: UploadImageResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error uploading image:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, error };
}
