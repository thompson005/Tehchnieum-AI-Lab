"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  htmlContent?: string;
  timestamp: Date;
  metadata?: {
    agent?: string;
    flag?: string;
    vulnerability?: string;
    status?: string;
  };
}

interface ChatInterfaceProps {
  agentName: string;
  agentDescription?: string;
  endpoint: string;
  glowColor?: "cyan" | "purple" | "red" | "green" | "yellow" | "orange" | "pink";
  onResponse?: (response: any) => void;
  suggestedPrompts?: string[];
}

const colorClasses = {
  cyan: {
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    bg: "bg-cyan-500/20",
    glow: "shadow-cyan-500/20",
  },
  purple: {
    border: "border-purple-500/30",
    text: "text-purple-400",
    bg: "bg-purple-500/20",
    glow: "shadow-purple-500/20",
  },
  red: {
    border: "border-red-500/30",
    text: "text-red-400",
    bg: "bg-red-500/20",
    glow: "shadow-red-500/20",
  },
  green: {
    border: "border-green-500/30",
    text: "text-green-400",
    bg: "bg-green-500/20",
    glow: "shadow-green-500/20",
  },
  yellow: {
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    bg: "bg-yellow-500/20",
    glow: "shadow-yellow-500/20",
  },
  orange: {
    border: "border-orange-500/30",
    text: "text-orange-400",
    bg: "bg-orange-500/20",
    glow: "shadow-orange-500/20",
  },
  pink: {
    border: "border-pink-500/30",
    text: "text-pink-400",
    bg: "bg-pink-500/20",
    glow: "shadow-pink-500/20",
  },
};

export function ChatInterface({
  agentName,
  agentDescription,
  endpoint,
  glowColor = "cyan",
  onResponse,
  suggestedPrompts = [],
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [capturedFlag, setCapturedFlag] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const colors = colorClasses[glowColor];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, user_id: "demo_user" }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || "No response",
        htmlContent: data.html_content,
        timestamp: new Date(),
        metadata: {
          agent: data.agent,
          flag: data.flag,
          vulnerability: data.thought_chain?.vulnerability_triggered,
          status: data.status,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.flag) {
        setCapturedFlag(data.flag);
      }

      if (onResponse) {
        onResponse(data);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "Error connecting to agent service",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900/80 rounded-xl border ${colors.border} overflow-hidden`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b ${colors.border} bg-gray-800/50`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${colors.bg} animate-pulse`} />
            <div>
              <h3 className={`font-bold ${colors.text}`}>{agentName}</h3>
              {agentDescription && (
                <p className="text-gray-500 text-xs">{agentDescription}</p>
              )}
            </div>
          </div>
          {capturedFlag && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`px-3 py-1 ${colors.bg} ${colors.border} border rounded-full text-xs font-mono ${colors.text}`}
            >
              FLAG CAPTURED
            </motion.div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-cyan-500/20 border border-cyan-500/30"
                    : message.role === "system"
                    ? "bg-red-500/20 border border-red-500/30"
                    : `${colors.bg} border ${colors.border}`
                }`}
              >
                <p className="text-gray-200 text-sm whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Render HTML content if present */}
                {message.htmlContent && (
                  <div
                    className="mt-4"
                    dangerouslySetInnerHTML={{ __html: message.htmlContent }}
                  />
                )}

                {/* Show flag if captured */}
                {message.metadata?.flag && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-2 bg-green-900/30 border border-green-500/30 rounded text-green-400 text-xs font-mono"
                  >
                    {message.metadata.flag}
                  </motion.div>
                )}

                {/* Vulnerability indicator */}
                {message.metadata?.vulnerability && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-red-400 text-xs font-mono">
                      Vulnerability: {message.metadata.vulnerability}
                    </span>
                  </div>
                )}

                <div className="text-gray-600 text-xs mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className={`${colors.bg} border ${colors.border} rounded-lg p-4`}>
              <div className="flex space-x-2">
                <div className={`w-2 h-2 ${colors.bg} rounded-full animate-bounce`} />
                <div className={`w-2 h-2 ${colors.bg} rounded-full animate-bounce delay-100`} />
                <div className={`w-2 h-2 ${colors.bg} rounded-full animate-bounce delay-200`} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {suggestedPrompts.length > 0 && messages.length === 0 && (
        <div className={`px-4 pb-4 border-t ${colors.border}`}>
          <p className="text-gray-500 text-xs mb-2 mt-3">Try these attack vectors:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className={`px-3 py-1.5 ${colors.bg} ${colors.border} border rounded-full text-xs ${colors.text} hover:opacity-80 transition-opacity`}
              >
                {prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${colors.border} bg-gray-800/50`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Enter your message..."
            className={`flex-1 bg-gray-900 border ${colors.border} rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:${colors.border} text-sm font-mono`}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading}
            className={`px-6 py-2 ${colors.bg} ${colors.border} border rounded-lg ${colors.text} font-bold text-sm hover:opacity-80 transition-opacity disabled:opacity-50`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
