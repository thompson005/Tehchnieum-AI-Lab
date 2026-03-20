"use client";

import { motion } from "framer-motion";

interface ServerLoadGaugeProps {
  load: number; // 0-100
  label?: string;
  status?: "normal" | "warning" | "critical" | "frozen";
  tokens?: number;
  cost?: number;
}

export function ServerLoadGauge({
  load,
  label = "Server Load",
  status = "normal",
  tokens,
  cost,
}: ServerLoadGaugeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "warning":
        return "text-yellow-400";
      case "critical":
        return "text-orange-400";
      case "frozen":
        return "text-red-400";
      default:
        return "text-green-400";
    }
  };

  const getGradient = () => {
    if (load < 50) return "from-green-500 to-green-400";
    if (load < 75) return "from-yellow-500 to-orange-400";
    return "from-orange-500 via-red-500 to-red-400";
  };

  const getGlowColor = () => {
    if (load < 50) return "shadow-green-500/50";
    if (load < 75) return "shadow-yellow-500/50";
    return "shadow-red-500/50";
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-mono">{label}</span>
        <span className={`font-mono font-bold ${getStatusColor()}`}>
          {load.toFixed(0)}%
          {status === "frozen" && (
            <span className="ml-2 text-xs animate-pulse">FROZEN</span>
          )}
        </span>
      </div>

      {/* Gauge Bar */}
      <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(load, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`
            h-full bg-gradient-to-r ${getGradient()}
            ${load >= 100 ? "animate-pulse" : ""}
            shadow-lg ${getGlowColor()}
          `}
        />

        {/* Warning Markers */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-yellow-500/30" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-red-500/30" />

        {/* Scan Line */}
        {status === "frozen" && (
          <motion.div
            className="absolute top-0 h-full w-1 bg-red-500/50"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Status Text */}
      <div className="flex items-center justify-between mt-2 text-xs font-mono">
        <span className="text-gray-500">0%</span>
        <span className={`${getStatusColor()} uppercase`}>{status}</span>
        <span className="text-gray-500">100%</span>
      </div>

      {/* Additional Metrics */}
      {(tokens !== undefined || cost !== undefined) && (
        <div className="mt-4 pt-3 border-t border-gray-700 grid grid-cols-2 gap-3">
          {tokens !== undefined && (
            <div className="text-center">
              <div className="text-gray-500 text-xs">Tokens Used</div>
              <div className="text-orange-400 font-mono font-bold">
                {tokens.toLocaleString()}
              </div>
            </div>
          )}
          {cost !== undefined && (
            <div className="text-center">
              <div className="text-gray-500 text-xs">Est. Cost</div>
              <div className="text-yellow-400 font-mono font-bold">
                ${cost.toFixed(4)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Critical Warning */}
      {status === "frozen" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-2 bg-red-900/30 border border-red-500/50 rounded-lg text-center"
        >
          <span className="text-red-400 text-xs font-mono animate-pulse">
            RESOURCE EXHAUSTION - AGENT UNRESPONSIVE
          </span>
        </motion.div>
      )}
    </div>
  );
}
