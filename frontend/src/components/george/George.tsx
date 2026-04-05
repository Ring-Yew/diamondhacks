"use client";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { useTripStore } from "@/store/tripStore";
import { georgeApi } from "@/lib/api";
import type { ChatMessage } from "@/types";

export function George() {
  const { isGeorgeOpen, setGeorgeOpen, georgeMessages, addGeorgeMessage, clearGeorgeMessages, tripInput } = useTripStore();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clearGeorgeMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [georgeMessages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    addGeorgeMessage(userMsg);
    setIsTyping(true);

    try {
      const reply = await georgeApi.chat([...georgeMessages, userMsg], tripInput);
      addGeorgeMessage(reply);
    } catch {
      addGeorgeMessage({
        id: Date.now().toString() + "_err",
        role: "assistant",
        content: "Oops, something went wrong. Try again!",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isGeorgeOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="w-80 bg-[#0f1628] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
            style={{ height: "440px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-lg">🍄</div>
                <div>
                  <div className="text-white font-semibold text-sm">George</div>
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Travel assistant
                  </div>
                </div>
              </div>
              <button onClick={() => setGeorgeOpen(false)} className="text-white/50 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {georgeMessages.length === 0 && (
                <div className="text-center mt-8 px-4">
                  <div className="text-4xl mb-3">🍄</div>
                  <p className="text-white/60 font-medium text-sm">Hi, I&apos;m George!</p>
                  <p className="text-white/30 text-xs mt-1 leading-relaxed">
                    Ask me about your trip, get a packing list, or just chat about travel.
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center mt-4">
                    {["Make me a packing list", "Visa requirements?", "Weather tips"].map((s) => (
                      <button key={s} onClick={() => setInput(s)}
                        className="text-xs bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-lg hover:text-white hover:border-white/20 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {georgeMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs mr-1.5 shrink-0 mt-0.5">🍄</div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-sm"
                      : "bg-white/[0.06] border border-white/[0.08] text-white/80 rounded-bl-sm"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs shrink-0">🍄</div>
                  <div className="bg-white/[0.06] border border-white/[0.08] px-3 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/[0.07] p-3 flex gap-2 shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask George anything…"
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors"
              />
              <button onClick={sendMessage} disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 disabled:opacity-40 text-white rounded-xl p-2 transition-all"
              >
                {isTyping ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar button */}
      <motion.button
        onClick={() => setGeorgeOpen(!isGeorgeOpen)}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="relative w-14 h-14 focus:outline-none"
        title="Chat with George"
      >
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform">
          🍄
        </div>
        {!isGeorgeOpen && (
          <span className="absolute -top-1 -right-1 bg-green-400 w-3.5 h-3.5 rounded-full border-2 border-[#0a0f1e] flex items-center justify-center">
            <Sparkles size={7} className="text-white" />
          </span>
        )}
      </motion.button>
    </div>
  );
}
