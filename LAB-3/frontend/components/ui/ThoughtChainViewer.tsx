"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface ThoughtChain {
  timestamp: string;
  agent: string;
  user_message: string;
  system_prompt?: string;
  reasoning: string[];
  tool_calls: {
    tool: string;
    parameters: Record<string, any>;
    result?: Record<string, any>;
  }[];
  vulnerability_triggered?: string;
}

interface ThoughtChainViewerProps {
  chain: ThoughtChain;
  isExpanded?: boolean;
}

export function ThoughtChainViewer({ chain, isExpanded: initialExpanded = false }: ThoughtChainViewerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  const isVulnerable = !!chain.vulnerability_triggered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-gray-900/80 border rounded-xl overflow-hidden
        ${isVulnerable ? "border-red-500/50" : "border-gray-700"}
      `}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-mono text-sm">
                {chain.agent.toUpperCase()}
              </span>
              {isVulnerable && (
                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-red-400 text-xs font-mono">
                  {chain.vulnerability_triggered}
                </span>
              )}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(chain.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-gray-400"
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* User Message */}
              <div>
                <div className="text-gray-500 text-xs mb-1 font-mono">USER INPUT:</div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <code className="text-gray-300 text-sm">{chain.user_message}</code>
                </div>
              </div>

              {/* System Prompt (Collapsible) */}
              {chain.system_prompt && (
                <div>
                  <button
                    onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                    className="text-gray-500 text-xs mb-1 font-mono flex items-center gap-1 hover:text-gray-300"
                  >
                    <span>{showSystemPrompt ? "▼" : "▶"}</span>
                    <span>SYSTEM PROMPT {showSystemPrompt ? "(hide)" : "(show)"}</span>
                  </button>
                  <AnimatePresence>
                    {showSystemPrompt && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 overflow-hidden"
                      >
                        <pre className="text-purple-300 text-xs whitespace-pre-wrap font-mono">
                          {chain.system_prompt}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Reasoning Steps */}
              {chain.reasoning.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs mb-2 font-mono">REASONING:</div>
                  <div className="space-y-2">
                    {chain.reasoning.map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`
                          flex items-start gap-2 text-sm
                          ${step.includes("WARNING") || step.includes("⚠️")
                            ? "text-yellow-400"
                            : step.includes("LOOP") || step.includes("OVERWRITTEN")
                            ? "text-red-400"
                            : "text-gray-300"
                          }
                        `}
                      >
                        <span className="text-cyan-500 font-mono">{i + 1}.</span>
                        <span>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Calls */}
              {chain.tool_calls.length > 0 && (
                <div>
                  <div className="text-gray-500 text-xs mb-2 font-mono">TOOL CALLS:</div>
                  <div className="space-y-2">
                    {chain.tool_calls.map((call, i) => (
                      <div
                        key={i}
                        className="bg-gray-800/50 border border-gray-700 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-400 font-mono text-sm">⚙️ {call.tool}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="text-gray-500 mb-1">Parameters:</div>
                            <pre className="text-cyan-300 font-mono">
                              {JSON.stringify(call.parameters, null, 2)}
                            </pre>
                          </div>
                          {call.result && (
                            <div>
                              <div className="text-gray-500 mb-1">Result:</div>
                              <pre className="text-green-300 font-mono">
                                {JSON.stringify(call.result, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vulnerability Indicator */}
              {isVulnerable && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center"
                >
                  <div className="text-red-400 font-bold mb-1">VULNERABILITY EXPLOITED</div>
                  <div className="text-red-300 font-mono text-sm">{chain.vulnerability_triggered}</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
