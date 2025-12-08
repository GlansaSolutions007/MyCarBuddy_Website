import React, { useState, useEffect } from "react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [rules, setRules] = useState("");

 // Load rules.txt from public folder
useEffect(() => {
  fetch("/MyCarBuddy.txt")
    .then((res) => res.text())
    .then((text) => {
      setRules(text);
      console.log("Rules loaded:", text);
    })
    .catch((err) => {
      console.error("Error loading rules.txt:", err);
    });
}, []);

  const groqApiKey = process.env.REACT_APP_GROQ_API_KEY; // replace with your key

  

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    const prompt = `${rules}\n\nSystem: Answer the user's question based on the rules provided. Use clear paragraphs. Do not answer unrelated questions.\n\nUser: ${input}`;

    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: "system", content: prompt || "You are My Car Buddy AI Assistant. Only answer about car services, bookings, and FAQs. If user asks unrelated, politely redirect." },
              { role: "user", content: input }
            ],
            temperature: 0,
            // max_tokens: 200,

            top_p: 1,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage =
        data.choices?.[0]?.message?.content ||
        "⚠️ Sorry, I couldn't get a response.";

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: botMessage },
        ]);
        setIsTyping(false);
      }, 800);
    } catch (error) {
      console.error("Error fetching from Groq API:", error);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Sorry, something went wrong." },
        ]);
        setIsTyping(false);
      }, 800);
    }
  };

  return (
    <div>
      {/* Floating Button */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 9999,
        }}
      >
        <button
          onClick={handleToggle}
          style={{
            background: "#e67711",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "50px",
            height: "50px",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          {isOpen ? "×" : "💬"}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "20px",
            width: "320px",
            height: "420px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#e67711",
              color: "white",
              padding: "10px",
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              textAlign: "center",
            }}
          >
            🚗 CarBuddy Chat
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              fontSize: "14px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "10px",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    background:
                      msg.role === "user" ? "#e67711" : "#f1f0f0",
                    color: msg.role === "user" ? "#fff" : "#000",
                  }}
                >
                  {msg.content}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ fontStyle: "italic", color: "gray" }}>
                Bot is typing...
              </div>
            )}
          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              borderTop: "1px solid #ccc",
              padding: "5px",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "8px",
                fontSize: "14px",
              }}
              placeholder="Type your message..."
            />
            <button
              onClick={handleSend}
              style={{
                background: "#e67711",
                color: "#fff",
                border: "none",
                padding: "8px 12px",
                cursor: "pointer",
                borderRadius: "5px",
              }}
            >
               ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
