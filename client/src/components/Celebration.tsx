/**
 * Celebration.tsx — Confetti & celebration effects
 * Design: Adventure Quest — instant ADHD-friendly feedback
 */

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Confetti Particle ────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
  rotation: number;
  shape: "circle" | "square" | "star";
}

const COLORS = [
  "#FF4136", "#FF69B4", "#FFD700", "#00C851", "#33B5E5",
  "#AA66CC", "#FF8800", "#2BBBAD",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

// ─── Full-screen Celebration Overlay ─────────────────────────────────────────

interface CelebrationProps {
  show: boolean;
  onDone?: () => void;
  message?: string;
  subMessage?: string;
  emoji?: string;
  primaryColor?: string;
}

export function CelebrationOverlay({
  show,
  onDone,
  message = "Amazing! 🎉",
  subMessage = "You completed all your quests!",
  emoji = "🏆",
  primaryColor = "oklch(0.48 0.22 25)",
}: CelebrationProps) {
  const CELEBRATION_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/celebration-bg-7Xvkc2XmsrZ8RLHFKMNh3q.webp";

  useEffect(() => {
    if (show && onDone) {
      const timer = setTimeout(onDone, 4500);
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <img
            src={CELEBRATION_BG}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <motion.div
            className="relative z-10 text-center px-8 py-10 rounded-3xl"
            style={{
              background: "white",
              border: `4px solid ${primaryColor}`,
              boxShadow: `0 8px 0 ${primaryColor}`,
              maxWidth: "380px",
              width: "90%",
            }}
            initial={{ scale: 0.3, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.3, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="text-8xl mb-4"
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.8, repeat: 3 }}
            >
              {emoji}
            </motion.div>
            <h2
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: "'Fredoka One', sans-serif", color: primaryColor }}
            >
              {message}
            </h2>
            <p
              className="text-lg font-bold text-gray-600 mb-6"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {subMessage}
            </p>
            <motion.div
              className="text-4xl"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ⭐⭐⭐
            </motion.div>
            <p className="text-sm text-gray-400 mt-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Tap anywhere to continue
            </p>
          </motion.div>

          {/* Floating stars */}
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl pointer-events-none"
              style={{
                left: `${randomBetween(5, 95)}%`,
                top: `${randomBetween(5, 95)}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 1, 0],
                y: [0, -60],
                rotate: [0, randomBetween(-180, 180)],
              }}
              transition={{
                duration: 2,
                delay: randomBetween(0, 1.5),
                repeat: Infinity,
                repeatDelay: randomBetween(0.5, 2),
              }}
            >
              {["⭐", "🌟", "✨", "💫"][Math.floor(Math.random() * 4)]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Task Completion Mini-burst ───────────────────────────────────────────────

interface StarBurstProps {
  show: boolean;
  color?: string;
}

export function StarBurst({ show, color = "#FFD700" }: StarBurstProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * 360;
            const distance = randomBetween(30, 60);
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            return (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  fontSize: "1.2rem",
                  zIndex: 10,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x, y, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                exit={{}}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                ⭐
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Category Complete Banner ─────────────────────────────────────────────────

interface CategoryBannerProps {
  show: boolean;
  categoryName: string;
  primaryColor?: string;
}

export function CategoryCompleteBanner({ show, categoryName, primaryColor = "oklch(0.48 0.22 25)" }: CategoryBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-6 left-1/2 z-40 -translate-x-1/2 px-6 py-3 rounded-2xl text-white font-black text-xl shadow-xl"
          style={{
            background: primaryColor,
            border: "3px solid white",
            fontFamily: "'Fredoka One', sans-serif",
            whiteSpace: "nowrap",
          }}
          initial={{ y: -80, scale: 0.5, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: -80, scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          ✅ {categoryName} Complete! 🎉
        </motion.div>
      )}
    </AnimatePresence>
  );
}
