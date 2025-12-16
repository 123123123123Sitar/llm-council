/**
 * API client for the LLM Council backend.
 */

const API_BASE = import.meta.env.DEV ? 'http://localhost:8001' : '';

export const api = {
  /**
   * List all conversations.
   */
  async listConversations() {
    const response = await fetch(`${API_BASE}/api/conversations`);
    if (!response.ok) {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.detail || 'Failed to list conversations');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }
    return response.json();
  },

  /**
   * Create a new conversation.
   */
  async createConversation() {
    const response = await fetch(`${API_BASE}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.detail || 'Failed to create conversation');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }
    return response.json();
  },

  /**
   * Get a specific conversation.
   */
  async getConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );
    if (!response.ok) {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.detail || 'Failed to get conversation');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content, images = []) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, images }),
      }
    );
    if (!response.ok) {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.detail || 'Failed to send message');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }
    return response.json();
  },

  /**
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {string[]} [images] - Optional array of base64 image strings
   * @param {function} onChunk - Callback function for each event
   * @returns {Promise<void>}
   */
  async sendMessageStream(conversationId, content, images, onChunk) {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/message/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, images }),
    });

    if (!response.ok) {
      let errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Server error');
      } catch (e) {
        throw new Error(`Server Error (${response.status}): ${errorText}`);
      }
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onChunk(data);
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  },

  async deleteConversation(id) {
    const response = await fetch(`${API_BASE}/api/conversations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete conversation');
    return await response.json();
  },
};

export default api;
