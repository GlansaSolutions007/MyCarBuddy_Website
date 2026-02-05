import React, { useState, useEffect, useRef } from "react";
import {
    SendHorizontal,
    ChevronDown,
    Bot,
    MoreHorizontal
} from "lucide-react";
import "./AIChatWidget.css";

function AIChatWidget() {
    const [open, setOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        { id: "init", text: "Hello! I am Sudiksha. How can I help you today?", sender: "ai" }
    ]);

    const chatEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    useEffect(() => {
        const openChatFromOutside = () => {
            setOpen(true);
            setClosing(false);
        };

        window.addEventListener("open-ai-chat", openChatFromOutside);

        return () => {
            window.removeEventListener("open-ai-chat", openChatFromOutside);
        };
    }, []);


    const handleSendMessage = async () => {
        const query = inputText.trim();
        if (!query || isTyping) return;

        // Add User Message
        const userMsg = { id: Date.now(), text: query, sender: "user" };
        setMessages((prev) => [...prev, userMsg]);
        setInputText("");
        setIsTyping(true);

        try {
            const response = await fetch("https://ai.mycarbuddy.in/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: query,
                    carMake: null,
                    carModel: null,
                    carYear: null
                }),
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();

            // Add AI Response
            const aiText =
                data.answer ||
                data.message ||
                "I'm sorry, I couldn't process that. Could you try again?";

            const aiMsg = {
                id: Date.now() + 1,
                text: aiText,
                sender: "ai"
            };
            setMessages((prev) => [...prev, aiMsg]);

        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { id: Date.now() + 2, text: "Connection error. Please try again later.", sender: "ai" }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleClose = () => {
        setClosing(true);

        setTimeout(() => {
            setOpen(false);
            setClosing(false);
        }, 300); // must match CSS animation duration
    };

    const handleFabClick = () => {
        if (open) {
            handleClose(); // use animated close
        } else {
            setOpen(true);
        }
    };



    return (
        <>
            <div className="ai-widget-wrapper">
                {/* CHAT WINDOW */}
                {open && (
                    <div className={`ai-chat-panel ${closing ? "closing" : "opening"}`}>

                        <div className="ai-header">
                            {/* LEFT: Close button */}
                            <div className="header-left">
                                <ChevronDown
                                    style={{ cursor: "pointer" }}
                                    onClick={handleClose}
                                />
                            </div>

                            {/* CENTER: Name & subtitle */}
                            <div className="header-center">
                                <h4>Sudiksha</h4>
                                <p>AI Assistant</p>
                            </div>

                            {/* RIGHT: Bot icon */}
                            <div className="header-right">
                                <div className="header-avatar">
                                    <Bot size={26} />
                                </div>
                            </div>
                        </div>

                        <div className="ai-body">
                            {messages.map((m) => (
                                <div key={m.id} className={`bubble ${m.sender === 'ai' ? 'bubble-ai' : 'bubble-user'}`}>
                                    {m.text}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="bubble bubble-ai typing">
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                    <div className="dot"></div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="ai-footer">
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Ask me anything..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    disabled={isTyping}
                                />
                                <button className="send-btn" onClick={handleSendMessage} disabled={!inputText.trim() || isTyping}>
                                    <SendHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="branding">
                            POWERED BY <b>MY CAR BUDDY</b>
                        </div>
                    </div>
                )}

                {/* FAB WITH CURVED BADGE */}
                <div className="fab-container" onClick={handleFabClick}>
                    {!open && (
                        <>
                            <svg className="badge-svg" viewBox="0 0 150 100">
                                <path id="curvePath" fill="transparent" d="M 20,80 Q 55,20 135,50" />
                                <text className="badge-text">
                                    <textPath href="#curvePath">We Are Here!</textPath>
                                </text>
                            </svg>
                            <div className="waving-hand">👋</div>
                        </>
                    )}

                    <div className="ai-fab-main">
                        {open && !closing ? (
                            <ChevronDown size={36} color="white" />
                        ) : (
                            <div className="custom-logo-circle">
                                <div className="smile-draw"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AIChatWidget;