"use client";

import { motion } from "framer-motion";

type AgentStatus = "idle" | "processing" | "selling" | "calculating_primes" | "executing_command" | "resolving_tickets" | "frozen";

interface AgentStatusBadgeProps {
  status: AgentStatus;
  showAnimation?: boolean;
}

const statusConfig: Record<AgentStatus, { label: string; color: string; icon: string; bgColor: string }> = {
  idle: {
    label: "IDLE",
    color: "text-gray-400",
    icon: "⏸",
    bgColor: "bg-gray-500/20",
  },
  processing: {
    label: "PROCESSING",
    color: "text-cyan-400",
    icon: "⚡",
    bgColor: "bg-cyan-500/20",
  },
  selling: {
    label: "SELLING",
    color: "text-green-400",
    icon: "💰",
    bgColor: "bg-green-500/20",
  },
  calculating_primes: {
    label: "CALCULATING PRIMES",
    color: "text-purple-400",
    icon: "🔢",
    bgColor: "bg-purple-500/20",
  },
  executing_command: {
    label: "EXECUTING",
    color: "text-yellow-400",
    icon: "⚙️",
    bgColor: "bg-yellow-500/20",
  },
  resolving_tickets: {
    label: "RESOLVING",
    color: "text-blue-400",
    icon: "🔄",
    bgColor: "bg-blue-500/20",
  },
  frozen: {
    label: "FROZEN",
    color: "text-red-400",
    icon: "🔥",
    bgColor: "bg-red-500/20",
  },
};

export function AgentStatusBadge({ status, showAnimation = true }: AgentStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.idle;

  return (
    <motion.div
      initial={showAnimation ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${config.bgColor} border border-current
        ${config.color} font-mono text-xs
      `}
    >
      <span className={status === "frozen" || status === "calculating_primes" ? "animate-pulse" : ""}>
        {config.icon}
      </span>
      <span className="font-bold">{config.label}</span>
      {(status === "processing" || status === "executing_command" || status === "resolving_tickets") && (
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
