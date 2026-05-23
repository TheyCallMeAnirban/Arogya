import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, X, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { ChatMessage } from "../types";

export default function AIAdvisor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "model",
      content: `Hello! I am your **Arogya AI Clinical Advisor**. 

I can assist you with understanding complex clinical conditions, explaining recommended diagnostic tests like ECG or Coronary Angiography, analyzing specialist profiles, and breaking down estimated healthcare cost packages in India.

*Please note: My insights are for informational, decision-support purposes only. Always consult a certified medical practitioner for formal diagnosis.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;

    const userText = inputMsg.trim();
    setInputMsg("");
    setHasError(false);

    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(1).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to request advice from the assistant server.");
      }

      const data = await response.json();

      const newBotMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "model",
        content: data.reply || "No reply available.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      console.error(err);
      setHasError(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          content: "System Warning: Connection timeout. Unable to secure response from backend. Please double check that server services are initialized.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* AI Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        id="ai-advisor-fab"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-brand-saffron to-brand-green flex items-center justify-center text-slate-950 shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 transition-all z-40 pulse-badge cursor-pointer outline-none border-none"
        title="Consult Arogya AI Companion"
      >
        <Bot className="w-6 h-6 text-slate-950" />
      </button>

      {/* Slide-out Companion Chat Panel */}
      {isOpen && (
        <div
          id="ai-advisor-panel"
          className="fixed bottom-24 right-6 w-[380px] h-[550px] max-w-[calc(100vw-32px)] glass-panel text-[#0D2E27] rounded-2xl flex flex-col shadow-2xl z-50 overflow-hidden fade-in"
        >
          {/* Panel Header */}
          <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-200/80 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/30 text-brand-green">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-brand-green flex items-center gap-1.5">
                  Arogya Assistant
                  <Sparkles className="w-3.5 h-3.5 text-brand-saffron" />
                </h3>
                <span className="text-[10px] text-brand-green/80 font-bold font-mono uppercase tracking-wider block">
                  Online Medical Support
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="text-slate-500 hover:text-brand-green transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Scroll Box */}
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40"
          >
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                      isUser
                        ? "bg-brand-green text-white rounded-tr-none font-bold"
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-none"
                    }`}
                  >
                    {/* Simplified markdown preview */}
                    <div className="whitespace-pre-line prose prose-xs">
                      {m.content.split("**").map((part, i) => {
                        // Bold parsing
                        if (i % 2 === 1) {
                          return <strong key={i} className={isUser ? "text-white underline font-bold" : "text-brand-saffron-dark font-extrabold"}>{part}</strong>;
                        }
                        return part;
                      })}
                    </div>
                    {/* Timestamp */}
                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        isUser ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[10px] font-bold font-mono tracking-wide text-brand-green uppercase">
                    Analyzing clinical query...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Query Assist Chips */}
          <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 flex gap-1.5 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => {
                setInputMsg("Explain NABH clinical certification requirements.");
              }}
              type="button"
              className="px-2.5 py-1 text-[9px] bg-white hover:bg-brand-green/10 border border-slate-200 text-brand-green font-bold rounded-full cursor-pointer"
            >
              NABH QA
            </button>
            <button
              onClick={() => {
                setInputMsg("What are standard heart stent package items?");
              }}
              type="button"
              className="px-2.5 py-1 text-[9px] bg-white hover:bg-brand-green/10 border border-slate-200 text-brand-green font-bold rounded-full cursor-pointer"
            >
              Cost Breakdowns
            </button>
            <button
              onClick={() => {
                setInputMsg("Who are top critical cardiologists?");
              }}
              type="button"
              className="px-2.5 py-1 text-[9px] bg-white hover:bg-brand-green/10 border border-slate-200 text-brand-green font-bold rounded-full cursor-pointer"
            >
              Specialist Rosters
            </button>
          </div>

          {/* Panel Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask about diagnostics, costs, or consult pathways..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-brand-green font-semibold focus:outline-none focus:border-brand-green placeholder-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || isLoading}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                inputMsg.trim() && !isLoading
                  ? "bg-brand-green text-white hover:scale-105"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
