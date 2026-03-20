"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface FlagCaptureProps {
  flag: string;
  labName?: string;
  vulnerability?: string;
  onClose?: () => void;
}

export function FlagCapture({ flag, labName, vulnerability, onClose }: FlagCaptureProps) {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(flag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <>
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3"
                initial={{
                  top: "50%",
                  left: "50%",
                  scale: 0,
                }}
                animate={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
                style={{
                  background: ["#00ff88", "#ff00ff", "#00ffff", "#ffff00", "#ff6600"][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-br from-gray-900 via-green-900/20 to-gray-900 border-2 border-green-500 rounded-2xl p-8 max-w-lg mx-4 shadow-2xl shadow-green-500/30"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-green-500/20 rounded-2xl blur-xl" />

        {/* Content */}
        <div className="relative">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="text-6xl mb-4"
            >
              🚩
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400"
            >
              FLAG CAPTURED!
            </motion.h2>
            {labName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 mt-2"
              >
                {labName}
              </motion.p>
            )}
          </div>

          {/* Flag Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/80 border border-green-500/50 rounded-xl p-4 mb-4"
          >
            <div className="flex items-center justify-between">
              <code className="text-green-400 font-mono text-sm break-all">
                {flag}
              </code>
              <button
                onClick={copyToClipboard}
                className="ml-3 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-xs hover:bg-green-500/30 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </motion.div>

          {/* Vulnerability Info */}
          {vulnerability && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-gray-400 mb-4"
            >
              <span className="text-red-400 font-mono">{vulnerability}</span>
              <span className="mx-2">exploited successfully</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-3"
          >
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg font-bold text-black hover:opacity-80 transition-opacity"
            >
              Continue Hacking
            </button>
          </motion.div>
        </div>

        {/* Scan Lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-full h-px bg-green-500/20"
              animate={{
                top: ["-10%", "110%"],
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
