import React, { useEffect, useRef, useState } from "react";
import { chatWithAI } from "../../api/ai";
import "./Chatbot.css";

const INITIAL_MESSAGE =
  "Hello! I'm your MediTracker AI Assistant. Ask me about medications, reminders, side effects, or schedules.";

const normalizeAiText = (value) => {
  if (!value) {
    return "I'm here to help with your medication questions.";
  }

  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/â€¢|Ã¢â‚¬Â¢|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢/g, "•")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const extractAiText = (payload) => {
  if (payload?.reply) {
    return normalizeAiText(payload.reply);
  }

  if (typeof payload?.response === "string") {
    return normalizeAiText(payload.response);
  }

  if (payload?.response?.response) {
    return normalizeAiText(payload.response.response);
  }

  if (payload?.message) {
    return normalizeAiText(payload.message);
  }

  if (payload?.text) {
    return normalizeAiText(payload.text);
  }

  if (typeof payload === "string") {
    return normalizeAiText(payload);
  }

  return normalizeAiText("");
};

const MessageBody = ({ text }) => {
  const blocks = text.split("\n\n").filter(Boolean);

  return (
    <div className="message-body">
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const isBulletList = lines.every((line) => /^[-•]\s+/.test(line));
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line));
        const isHeading = lines.length === 1 && /:$/.test(lines[0]);

        if (isHeading) {
          return (
            <p key={`${block}-${index}`} className="message-heading">
              {lines[0]}
            </p>
          );
        }

        if (isBulletList || isNumberedList) {
          return (
            <ul key={`${block}-${index}`} className="message-list">
              {lines.map((line) => (
                <li key={line}>{line.replace(/^([-•]|\d+\.)\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${index}`} className="message-paragraph">
            {lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
};

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      text: INITIAL_MESSAGE,
      sender: "ai",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    if (!chatMessagesRef.current) return;
    chatMessagesRef.current.scrollTo({
      top: chatMessagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || loading) {
      return;
    }

    const userMessage = {
      text: message,
      sender: "user",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithAI(message);
      const aiMessage = {
        text: extractAiText(response),
        sender: "ai",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      let errorText = "I'm having trouble connecting right now. Please try again.";

      if (error.response?.status === 404) {
        errorText = "The AI assistant is currently unavailable.";
      } else if (error.response?.status === 401) {
        errorText = "Please log in again to use the AI assistant.";
      } else if (error.message?.toLowerCase().includes("timeout")) {
        errorText = "The AI assistant took too long to respond. Please try a shorter question.";
      }

      setMessages((prev) => [
        ...prev,
        {
          text: errorText,
          sender: "ai",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h3>AI Assistant</h3>
        <small>Ask about medications, reminders, side effects, or schedules</small>
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((message, index) => (
          <div key={`${message.sender}-${index}-${message.time}`} className={`message ${message.sender}`}>
            <div className="message-content">
              <MessageBody text={message.text} />
            </div>
            <div className="message-time">{message.time}</div>
          </div>
        ))}

        {loading ? (
          <div className="message ai">
            <div className="message-content typing">
              <span className="typing-label">Thinking</span>
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask a medication question..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()} className="send-button">
          {loading ? "..." : "Send"}
        </button>
      </div>

      <div className="chatbot-footer">
        <small>AI responses are informational. Consult a healthcare professional for medical advice.</small>
      </div>
    </div>
  );
};

export default Chatbot;
