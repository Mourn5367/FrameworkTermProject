"use client";

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 리사이즈 상태
  const [chatSize, setChatSize] = useState({ width: 500, height: 700 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 리사이즈 시작
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: chatSize.width,
      height: chatSize.height,
    });

    // 리사이즈 방향 저장
    (e.currentTarget as HTMLElement).dataset.direction = direction;
  };

  // 리사이즈 중
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const target = document.querySelector('[data-direction]') as HTMLElement;
      const direction = target?.dataset.direction || '';

      let newWidth = chatSize.width;
      let newHeight = chatSize.height;

      if (direction.includes('left')) {
        newWidth = Math.max(400, resizeStart.width - (e.clientX - resizeStart.x));
      }
      if (direction.includes('top')) {
        newHeight = Math.max(500, resizeStart.height - (e.clientY - resizeStart.y));
      }
      if (direction.includes('right')) {
        newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(500, resizeStart.height + (e.clientY - resizeStart.y));
      }

      // 최대 크기 제한
      newWidth = Math.min(800, newWidth);
      newHeight = Math.min(900, newHeight);

      setChatSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, chatSize, resizeStart]);

  // 메시지 전송
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 브라우저의 현재 호스트에 맞춰서 API URL 생성
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiUrl = `http://${currentHost}:8000/api/chat`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: input,
        }),
      });

      if (!response.ok) {
        throw new Error('채팅 요청 실패');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('채팅 에러:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키로 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 12px rgba(61, 184, 158, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            transition: 'all 0.3s ease',
            zIndex: 1000,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(61, 184, 158, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(61, 184, 158, 0.3)';
          }}
          aria-label="챗봇 열기"
        >
          💬
        </button>
      )}

      {/* 채팅창 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: `${chatSize.width}px`,
            height: `${chatSize.height}px`,
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden',
            cursor: isResizing ? 'nwse-resize' : 'default',
          }}
        >
          {/* 리사이즈 핸들 (상단 좌측) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              cursor: 'nwse-resize',
              zIndex: 1001,
            }}
          />

          {/* 리사이즈 핸들 (상단 우측) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'nesw-resize',
              zIndex: 1001,
            }}
          />

          {/* 리사이즈 핸들 (하단 좌측) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '20px',
              height: '20px',
              cursor: 'nesw-resize',
              zIndex: 1001,
            }}
          />

          {/* 리사이즈 핸들 (하단 우측) */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              cursor: 'nwse-resize',
              zIndex: 1001,
            }}
          />

          {/* 헤더 */}
          <div
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
              던파 인사이트 챗봇
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
              aria-label="챗봇 닫기"
            >
              ×
            </button>
          </div>

          {/* 메시지 영역 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: '#F5F7FA',
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  color: '#666',
                  marginTop: '2rem',
                }}
              >
                <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: '0.5rem' }}>👋</p>
                <p style={{ fontSize: 'var(--font-size-sm)' }}>던파에 대해 무엇이든 물어보세요!</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: message.role === 'user' ? 'var(--primary)' : 'white',
                    color: message.role === 'user' ? 'white' : '#333',
                    fontSize: 'var(--font-size-sm)',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
                    boxShadow: message.role === 'assistant' ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  }}
                >
                  {message.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: 'white',
                    color: '#666',
                    fontSize: 'var(--font-size-sm)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <span style={{ display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }}>
                    답변을 생성하는 중...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #E0E0E0',
              background: 'white',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
              }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #E0E0E0',
                  borderRadius: '8px',
                  fontSize: 'var(--font-size-sm)',
                  resize: 'none',
                  height: '60px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: input.trim() && !isLoading ? 'var(--primary)' : '#CCCCCC',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                }}
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스타일 */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          margin: 0.5rem 0;
          font-weight: 600;
        }

        .markdown-content h1 {
          font-size: 1.25rem;
        }

        .markdown-content h2 {
          font-size: 1.1rem;
        }

        .markdown-content h3 {
          font-size: 1rem;
        }

        .markdown-content p {
          margin: 0.5rem 0;
        }

        .markdown-content ul,
        .markdown-content ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }

        .markdown-content li {
          margin: 0.25rem 0;
        }

        .markdown-content code {
          background: rgba(61, 184, 158, 0.1);
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .markdown-content pre {
          background: #f5f5f5;
          padding: 0.75rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .markdown-content pre code {
          background: none;
          padding: 0;
        }

        .markdown-content strong {
          font-weight: 700;
          color: var(--primary);
        }

        .markdown-content em {
          font-style: italic;
        }

        .markdown-content a {
          color: var(--primary);
          text-decoration: underline;
        }

        .markdown-content blockquote {
          border-left: 3px solid var(--primary);
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: #666;
        }

        .markdown-content hr {
          border: none;
          border-top: 1px solid #E0E0E0;
          margin: 1rem 0;
        }
      `}</style>
    </>
  );
}
