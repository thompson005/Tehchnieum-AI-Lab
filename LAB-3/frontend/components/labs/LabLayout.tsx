"use client";

import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface LabLayoutProps {
  labNumber: string;
  title: string;
  description: string;
  owasp: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  children: ReactNode;
  objectives?: string[];
  hints?: string[];
}

const difficultyColors = {
  Easy: "text-green-400 bg-green-500/20 border-green-500/50",
  Medium: "text-yellow-400 bg-yellow-500/20 border-yellow-500/50",
  Hard: "text-orange-400 bg-orange-500/20 border-orange-500/50",
  Expert: "text-red-400 bg-red-500/20 border-red-500/50",
};

export function LabLayout({
  labNumber,
  title,
  description,
  owasp,
  difficulty,
  children,
  objectives = [],
  hints = [],
}: LabLayoutProps) {
  const [showHints, setShowHints] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,255,255,0.02)_50%,transparent_100%)]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <Link
            href="/labs"
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <span>←</span>
            <span className="font-mono text-sm">Back to Labs</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/labs/flags"
              className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 font-mono text-sm hover:bg-green-500/30 transition-colors"
            >
              🚩 My Flags
            </Link>
          </div>
        </nav>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 rounded-full text-cyan-400 font-mono text-sm">
              {labNumber}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-400 font-mono text-sm">
              {owasp}
            </span>
            <span className={`px-3 py-1 border rounded-full font-mono text-sm ${difficultyColors[difficulty]}`}>
              {difficulty}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-4">
            {title}
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">{description}</p>
        </motion.header>

        {/* Objectives & Hints */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Objectives */}
          {objectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-gray-900/80 border border-gray-700 rounded-xl p-6"
            >
              <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                <span>🎯</span> Objectives
              </h3>
              <ul className="space-y-2">
                {objectives.map((objective, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <span className="text-cyan-500 font-mono">{i + 1}.</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Hints */}
          {hints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/80 border border-yellow-500/30 rounded-xl p-6"
            >
              <button
                onClick={() => setShowHints(!showHints)}
                className="w-full text-lg font-bold text-yellow-400 mb-4 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>💡</span> Hints
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {showHints ? "Hide" : "Show"}
                </span>
              </button>
              {showHints ? (
                <ul className="space-y-2">
                  {hints.map((hint, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-gray-300 text-sm"
                    >
                      <span className="text-yellow-500 font-mono">•</span>
                      <span>{hint}</span>
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  Click to reveal hints (try without first!)
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {children}
        </motion.main>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          <p>ShopSec-AI Security Testbed - For educational purposes only</p>
          <p className="mt-2 font-mono text-xs">
            OWASP Top 10 for LLMs - Offensive AI Research
          </p>
        </footer>
      </div>
    </div>
  );
}
