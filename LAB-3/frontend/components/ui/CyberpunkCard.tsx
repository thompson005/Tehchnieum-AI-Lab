"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CyberpunkCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "cyan" | "purple" | "red" | "green" | "yellow" | "orange" | "pink";
  variant?: "default" | "glass" | "solid" | "outline";
  animated?: boolean;
  onClick?: () => void;
}

const glowColors = {
  cyan: "border-cyan-500/30 hover:border-cyan-400 shadow-cyan-500/20 hover:shadow-cyan-500/40",
  purple: "border-purple-500/30 hover:border-purple-400 shadow-purple-500/20 hover:shadow-purple-500/40",
  red: "border-red-500/30 hover:border-red-400 shadow-red-500/20 hover:shadow-red-500/40",
  green: "border-green-500/30 hover:border-green-400 shadow-green-500/20 hover:shadow-green-500/40",
  yellow: "border-yellow-500/30 hover:border-yellow-400 shadow-yellow-500/20 hover:shadow-yellow-500/40",
  orange: "border-orange-500/30 hover:border-orange-400 shadow-orange-500/20 hover:shadow-orange-500/40",
  pink: "border-pink-500/30 hover:border-pink-400 shadow-pink-500/20 hover:shadow-pink-500/40",
};

const variants = {
  default: "bg-gray-900/80 backdrop-blur-sm",
  glass: "bg-gray-900/40 backdrop-blur-xl",
  solid: "bg-gray-900",
  outline: "bg-transparent",
};

export function CyberpunkCard({
  children,
  className = "",
  glowColor = "cyan",
  variant = "default",
  animated = true,
  onClick,
}: CyberpunkCardProps) {
  const Component = animated ? motion.div : "div";
  const animationProps = animated
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: { scale: 1.02, y: -2 },
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <Component
      className={`
        relative rounded-xl border p-6
        ${variants[variant]}
        ${glowColors[glowColor]}
        shadow-lg hover:shadow-xl
        transition-all duration-300
        overflow-hidden
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
      {...animationProps}
    >
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: "scanline 4s linear infinite",
          }}
        />
      </div>

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-current opacity-50" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-current opacity-50" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-current opacity-50" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        @keyframes scanline {
          0% {
            top: -100%;
          }
          100% {
            top: 200%;
          }
        }
      `}</style>
    </Component>
  );
}
