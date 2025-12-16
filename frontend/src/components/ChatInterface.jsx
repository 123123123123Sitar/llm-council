import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  isLoading,
}) {
  const [input, setInput] = useState('');
  const [images, setImages] = useState([]); // Array of base64 strings
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, images]); // Scroll when images change too

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || images.length > 0) && !isLoading) {
      onSendMessage(input, images);
      setInput('');
      setImages([]);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    e.target.value = null;
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <h2>Start a conversation</h2>
            <p>Ask a question to consult the LLM Council</p>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    {msg.images && msg.images.length > 0 && (
                      <div className="message-images">
                        {msg.images.map((img, i) => (
                          <img key={i} src={img} alt="User upload" />
                        ))}
                      </div>
                    )}
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">LLM Council</div>

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Consulting the council...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        {images.length > 0 && (
          <div className="image-preview-area">
            {images.map((img, index) => (
              <div key={index} className="image-preview-item">
                <img src={img} alt="Preview" />
                <button
                  className="remove-image-btn"
                  onClick={() => removeImage(index)}
                >×</button>
              </div>
            ))}
          </div>
        )}

        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            multiple
            accept="image/*"
          />
          <button
            type="button"
            className="attach-button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach images"
            disabled={isLoading}
          >
            📎
          </button>

          <textarea
            className="message-input"
            placeholder="Ask your question... (Shift+Enter for new line, Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1} // Auto-resize would be better but simple for now
          />
          <button
            type="submit"
            className="send-button"
            disabled={(!input.trim() && images.length === 0) || isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
