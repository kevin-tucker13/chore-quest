/**
 * FamilyGate.tsx — Family Access Code Screen
 * ============================================
 * Protects the entire app behind a family access code.
 * Once entered correctly the device remembers it via localStorage,
 * so the family only need to type it once per device.
 *
 * Default code: 6643 (changeable from Parent Dashboard settings)
 * localStorage keys:
 *   FAMILY_GATE_UNLOCKED  — "true" when this device has been unlocked
 *   FAMILY_ACCESS_CODE    — custom code set by parent (overrides default)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_CODE = "6643";
const STORAGE_UNLOCKED = "FAMILY_GATE_UNLOCKED";
export const STORAGE_CODE_KEY = "FAMILY_ACCESS_CODE";

/**
 * Returns the current family access code.
 * Priority: localStorage override (set by parent) > DEFAULT_CODE
 * The parent dashboard also syncs this to Firebase settings so it
 * propagates to all devices on next visit.
 */
export function getFamilyCode(): string {
  try {
    return localStorage.getItem(STORAGE_CODE_KEY) || DEFAULT_CODE;
  } catch {
    return DEFAULT_CODE;
  }
}

/**
 * Sync the family code from Firebase settings into localStorage.
 * Called by AppContext when settings load.
 */
export function syncFamilyCodeFromSettings(code: string | undefined): void {
  if (!code) return;
  try {
    // Only update if the stored code differs (don't overwrite a parent's local change)
    const current = localStorage.getItem(STORAGE_CODE_KEY);
    if (!current || current === DEFAULT_CODE) {
      localStorage.setItem(STORAGE_CODE_KEY, code);
    }
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function isFamilyUnlocked(): boolean {
  return localStorage.getItem(STORAGE_UNLOCKED) === "true";
}

export function lockFamily(): void {
  localStorage.removeItem(STORAGE_UNLOCKED);
}

interface FamilyGateProps {
  children: React.ReactNode;
}

export default function FamilyGate({ children }: FamilyGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  // On mount, check if this device is already unlocked
  useEffect(() => {
    if (isFamilyUnlocked()) {
      setUnlocked(true);
    }
    setChecked(true);
  }, []);

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    setError("");

    if (next.length === 4 || next.length === 6) {
      // Try to match after a brief pause so the last digit shows
      setTimeout(() => {
        const code = getFamilyCode();
        if (next === code) {
          localStorage.setItem(STORAGE_UNLOCKED, "true");
          setUnlocked(true);
        } else if (next.length >= code.length) {
          setShake(true);
          setError("Wrong code — try again!");
          setPin("");
          setTimeout(() => setShake(false), 500);
        }
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError("");
  };

  // Don't render anything until we've checked localStorage
  if (!checked) return null;

  if (unlocked) return <>{children}</>;

  const codeLength = getFamilyCode().length;
  const dots = Array.from({ length: codeLength });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: "linear-gradient(160deg, oklch(0.18 0.04 260) 0%, oklch(0.12 0.06 240) 100%)",
      }}
    >
      {/* Stars background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: "white",
              opacity: Math.random() * 0.5 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.6, 0.1] }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-xs"
      >
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-3"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            ⭐
          </motion.div>
          <h1
            className="text-4xl text-white mb-1"
            style={{ fontFamily: "'Fredoka One', sans-serif" }}
          >
            Chore Quest!
          </h1>
          <p
            className="text-white/60 text-sm font-semibold"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Enter your family code to continue
          </p>
        </div>

        {/* PIN dots */}
        <motion.div
          className="flex justify-center gap-4 mb-6"
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {dots.map((_, i) => (
            <motion.div
              key={i}
              className="w-5 h-5 rounded-full border-2"
              style={{
                borderColor: "oklch(0.75 0.15 60)",
                background: i < pin.length ? "oklch(0.75 0.15 60)" : "transparent",
              }}
              animate={i < pin.length ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.15 }}
            />
          ))}
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm font-bold mb-4"
              style={{ color: "oklch(0.72 0.22 25)", fontFamily: "'Nunito', sans-serif" }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, idx) => {
            if (key === "") return <div key={idx} />;
            return (
              <motion.button
                key={idx}
                onClick={() => key === "⌫" ? handleDelete() : handleDigit(key)}
                className="aspect-square rounded-2xl text-2xl font-black flex items-center justify-center"
                style={{
                  background: key === "⌫"
                    ? "oklch(0.28 0.04 260)"
                    : "oklch(0.25 0.04 260)",
                  color: key === "⌫" ? "oklch(0.75 0.15 60)" : "white",
                  border: "2px solid oklch(0.35 0.04 260)",
                  fontFamily: "'Fredoka One', sans-serif",
                  boxShadow: "0 4px 0 oklch(0.15 0.04 260)",
                }}
                whileTap={{ scale: 0.92, y: 2, boxShadow: "0 2px 0 oklch(0.15 0.04 260)" }}
                whileHover={{ background: "oklch(0.32 0.06 260)" }}
              >
                {key}
              </motion.button>
            );
          })}
        </div>

        <p
          className="text-center text-white/30 text-xs mt-8"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          This device will remember your code
        </p>
      </motion.div>
    </div>
  );
}
