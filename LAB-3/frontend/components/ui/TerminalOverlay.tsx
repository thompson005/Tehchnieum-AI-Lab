"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TerminalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  command?: string;
  output?: string;
  title?: string;
}

export function TerminalOverlay({
  isOpen,
  onClose,
  command = "ls -la",
  output = "",
  title = "TERMINAL",
}: TerminalOverlayProps) {
  const [displayedOutput, setDisplayedOutput] = useState("");
  const [cursor, setCursor] = useState(true);

  // Typewriter effect for output
  useEffect(() => {
    if (!isOpen || !output) return;

    setDisplayedOutput("");
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < output.length) {
        setDisplayedOutput((prev) => prev + output[index]);
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 5);

    return () => clearInterval(typeInterval);
  }, [isOpen, output]);

  // Cursor blink
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl mx-4"
          >
            {/* Terminal Window */}
            <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl shadow-green-500/20 overflow-hidden">
              {/* Title Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-green-500/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-400" onClick={onClose} />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-green-400 font-mono text-sm">{title}</span>
                <div className="flex items-center gap-2 text-green-400 font-mono text-xs">
                  <span className="animate-pulse">LIVE</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-4 font-mono text-sm max-h-[60vh] overflow-auto bg-gradient-to-b from-gray-900 to-black">
                {/* Command Line */}
                <div className="flex items-center gap-2 mb-2 text-green-300">
                  <span className="text-cyan-400">shopsec@prod-server</span>
                  <span className="text-gray-500">:</span>
                  <span className="text-purple-400">~</span>
                  <span className="text-gray-500">$</span>
                  <span className="text-white ml-1">{command}</span>
                </div>

                {/* Output */}
                <pre className="text-green-300 whitespace-pre-wrap leading-relaxed">
                  {displayedOutput}
                  {cursor && displayedOutput.length < output.length && (
                    <span className="bg-green-400 text-black">_</span>
                  )}
                </pre>

                {/* New Prompt */}
                {displayedOutput.length >= output.length && (
                  <div className="flex items-center gap-2 mt-4 text-green-300">
                    <span className="text-cyan-400">shopsec@prod-server</span>
                    <span className="text-gray-500">:</span>
                    <span className="text-purple-400">~</span>
                    <span className="text-gray-500">$</span>
                    {cursor && <span className="bg-green-400 text-black">_</span>}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-green-500/50 text-xs font-mono text-gray-500">
                <span>SHOPSEC-AI INTERNAL SHELL</span>
                <span className="text-red-400">WARNING: PRODUCTION SERVER</span>
                <span>UTF-8</span>
              </div>
            </div>

            {/* Glitch Effect Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-full h-px bg-green-500/30"
                  initial={{ top: "0%", opacity: 0 }}
                  animate={{
                    top: ["0%", "100%"],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
