import React, { useState, useEffect, useRef } from 'react';
import { copilotAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  History,
  Sparkles,
  User,
  Bot,
  ChevronLeft
} from 'lucide-react';
import './Copilot.css';

function Copilot() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await copilotAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const response = await copilotAPI.getConversation(id);
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.conversation.messages);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setShowHistory(false);
    inputRef.current?.focus();
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await copilotAPI.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message to UI immediately
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      const response = await copilotAPI.chat(
        userMessage,
        currentConversation?.id
      );

      // Add assistant response
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Update current conversation ID if new
      if (!currentConversation) {
        setCurrentConversation({ id: response.data.conversation_id });
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Lo siento, hubo un error. Por favor intenta de nuevo.',
        created_at: new Date().toISOString(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    "Ayudame a redactar un mensaje de primer contacto para un prospecto",
    "Como puedo explicar las ventajas de EFEX vs bancos tradicionales?",
    "Genera una propuesta de valor para un negocio de importaciones",
    "Que requisitos necesito para abrir una cuenta empresarial?"
  ];

  return (
    <div className="copilot-page">
      {/* Sidebar - Conversation History */}
      <aside className={`conversation-sidebar ${showHistory ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>
            <History size={18} />
            Historial
          </h3>
          <button className="close-sidebar" onClick={() => setShowHistory(false)}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <button className="new-chat-btn" onClick={startNewConversation}>
          <Plus size={18} />
          Nueva conversacion
        </button>

        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => loadConversation(conv.id)}
            >
              <MessageSquare size={16} />
              <span className="conv-title">{conv.title}</span>
              <button
                className="delete-conv"
                onClick={(e) => deleteConversation(conv.id, e)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {conversations.length === 0 && (
            <p className="no-conversations">No hay conversaciones anteriores</p>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {showHistory && (
        <div className="sidebar-overlay" onClick={() => setShowHistory(false)} />
      )}

      {/* Main Chat Area */}
      <main className="chat-main">
        {/* Header */}
        <header className="chat-header">
          <button className="history-toggle" onClick={() => setShowHistory(true)}>
            <History size={20} />
          </button>
          <div className="chat-title">
            <Sparkles size={20} className="copilot-icon" />
            <h2>Copiloto EFEX</h2>
          </div>
          <button className="new-chat-btn-mobile" onClick={startNewConversation}>
            <Plus size={20} />
          </button>
        </header>

        {/* Messages */}
        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-icon">🤖</div>
              <h2>Hola! Soy tu Copiloto EFEX</h2>
              <p>
                Estoy aqui para ayudarte a ser mas efectivo como promotor.
                Puedo asistirte con mensajes, propuestas, analisis de clientes y mas.
              </p>

              <div className="suggested-prompts">
                <h4>Prueba preguntarme:</h4>
                <div className="prompts-grid">
                  {suggestedPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="prompt-suggestion"
                      onClick={() => {
                        setInput(prompt);
                        inputRef.current?.focus();
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.role} ${message.error ? 'error' : ''}`}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>
                  <div className="message-content">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message assistant loading">
                  <div className="message-avatar">
                    <Bot size={18} />
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={loading}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={!input.trim() || loading}
            >
              <Send size={20} />
            </button>
          </div>
          <p className="input-hint">
            Powered by Claude Opus 4.5 via AWS Bedrock
          </p>
        </form>
      </main>
    </div>
  );
}

export default Copilot;
