import { useState, useEffect, useRef, memo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import apiService from '../services/apiService';
import './AIGuide.css';

// Memoized Typewriter Component for smooth output
const TypewriterMessage = memo(({ text, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + text[index]);
                setIndex(prev => prev + 1);
            }, 15); // Adjust speed here
            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [index, text, onComplete]);

    // Simple Markdown-to-HTML like formatting
    const formatText = (raw) => {
        return raw.split('\n').map((line, i) => {
            // Bold
            let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Inline code
            formattedLine = formattedLine.replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');

            // Unordered list
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return <li key={i} dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s/, '') }} />;
            }
            // Ordered list
            if (/^\d+\.\s/.test(line.trim())) {
                return <li key={i} className="ordered-li" dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s/, '') }} />;
            }

            return <p key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} />;
        });
    };

    return <div className="formatted-message">{formatText(displayedText)}</div>;
});

const AIGuide = () => {
    const { currentProject } = useProject();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your AI Guide. ✨ I'm here to act as your mentor, guide, and developer assistant. I can help you understand the tool, clarify SDLC doubts, or tell you what to do next in your project. How can I help you today?", isNew: false }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);

    // Draggable state
    const [position, setPosition] = useState({
        x: window.innerWidth - 180,
        y: window.innerHeight - 80
    });
    const [isDragging, setIsDragging] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen, isLoading]);

    // DRAG LOGIC
    const onMouseDown = (e) => {
        if (isOpen) return;
        setIsDragging(true);
        setHasDragged(false);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
    };

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasDragged(true);
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.initialX + dx)),
                y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.initialY + dy))
            });
        };
        const onMouseUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await apiService.askGuide(currentProject?._id, userMessage);
            if (response.data && response.data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.data.response, isNew: true }]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('[AIGuide] Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now. Please try again later! 🛠️", isNew: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`ai-guide-wrapper ${isOpen ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
            style={!isOpen ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' } : {}}
        >
            {/* Floating Toggle Button */}
            <button
                className="ai-guide-toggle"
                onMouseDown={onMouseDown}
                onClick={() => {
                    if (!hasDragged) setIsOpen(!isOpen);
                }}
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6L18 18" />
                    </svg>
                ) : (
                    <div className="toggle-content">
                        <span className="ai-icon">✨</span>
                        <span className="ai-label">AI Guide</span>
                    </div>
                )}
            </button>

            {/* Chat Container */}
            <div className="ai-guide-container">
                <div className="ai-guide-header">
                    <div className="header-info">
                        <span className="status-dot online"></span>
                        <h4>AI Assistant & Mentor</h4>
                    </div>
                    <button className="close-chat" onClick={() => setIsOpen(false)}>×</button>
                </div>

                <div className="ai-chat-body">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.role === 'assistant' && msg.isNew ? (
                                    <TypewriterMessage
                                        text={msg.content}
                                        onComplete={() => {
                                            // Optional: update the message state to stop "new" status
                                            // But for now, simple is better
                                        }}
                                    />
                                ) : (
                                    <div className="formatted-message">
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-message assistant">
                            <div className="message-bubble typing">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <form className="ai-chat-footer" onSubmit={handleSend}>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={!input.trim() || isLoading}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AIGuide;
