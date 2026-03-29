/**
 * Home.tsx — Adventure Quest Landing Page
 * =========================================
 * Design: Adventure Quest — bold, chunky, ADHD-friendly
 * Shows character selection for Dean and Emma + parent access
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Star, Settings, Flame, TrendingUp } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Tooltip, Cell } from "recharts";
import type { ChildData } from "@/lib/firebase";
import { useAppContext } from "@/contexts/AppContext";

// ─── Mini Star History Chart ──────────────────────────────────────────────────
function StarHistoryChart({ data, color }: { data: ChildData["starHistory"]; color: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-12 rounded-xl" style={{ background: "oklch(0.95 0.01 80)" }}>
        <span className="text-xs font-semibold text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>Complete a week to see history!</span>
      </div>
    );
  }
  // Reverse so oldest is on the left
  const chartData = [...data].reverse().map((w, i) => ({
    week: `W${i + 1}`,
    stars: w.stars,
    completed: w.completed,
  }));
  return (
    <div style={{ height: 48 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }} barSize={14}>
          <Tooltip
            formatter={(v: number) => [`${v} ⭐`, "Stars"]}
            contentStyle={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, borderRadius: 8 }}
            cursor={{ fill: "oklch(0.92 0.01 80)" }}
          />
          <Bar dataKey="stars" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.completed ? color : "oklch(0.82 0.04 80)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const HOME_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/home-hero-NNTwsXpMHSmrLybwUxxinC.webp";
const DEAN_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/dean-hero-ConP7q2C5kv5fVogmBHkU9.webp";
const EMMA_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/emma-hero-h3B49Jx7PECLYoWAjmgTSU.webp";

export default function Home() {
  const [, navigate] = useLocation();
  const { deanData, emmaData, isLoading } = useAppContext();

  const deanProgress = deanData.categories.length > 0
    ? Math.round((deanData.categories.flatMap(c => c.tasks).filter(t => t.completed).length /
        Math.max(deanData.categories.flatMap(c => c.tasks).length, 1)) * 100)
    : 0;

  const emmaProgress = emmaData.categories.length > 0
    ? Math.round((emmaData.categories.flatMap(c => c.tasks).filter(t => t.completed).length /
        Math.max(emmaData.categories.flatMap(c => c.tasks).length, 1)) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, oklch(0.97 0.02 80) 0%, oklch(0.94 0.03 60) 100%)" }}>

      {/* ─── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.28 0.04 260) 0%, oklch(0.22 0.04 240) 100%)" }}>
        <img
          src={HOME_HERO}
          alt="Dean and Emma's Adventure"
          className="w-full object-cover"
          style={{ maxHeight: "280px", objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white text-center">
          <h1 className="text-4xl md:text-5xl text-white drop-shadow-lg" style={{ fontFamily: "'Fredoka One', sans-serif", textShadow: "0 3px 6px rgba(0,0,0,0.5)" }}>
            ⭐ Chore Quest! ⭐
          </h1>
          <p className="text-white/90 font-bold text-lg mt-1" style={{ fontFamily: "'Nunito', sans-serif", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
            Complete your quests, earn your rewards!
          </p>
        </div>
      </div>

      {/* ─── Character Select ─────────────────────────────────────────────── */}
      <div className="flex-1 container py-8">
        <h2 className="text-center text-2xl font-bold text-gray-600 mb-6" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
          Who's playing today?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Dean Card */}
          <motion.button
            onClick={() => navigate("/dean")}
            className="quest-card theme-dean overflow-hidden text-left w-full"
            style={{ borderColor: "oklch(0.68 0.18 25)", boxShadow: "0 6px 0 oklch(0.55 0.18 25)" }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.48 0.22 25), oklch(0.38 0.22 25))", height: "160px" }}>
              <img
                src={DEAN_HERO}
                alt="Dean the Knight"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {deanData.weekCompleted && (
                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-sm font-black" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  🏆 DONE!
                </div>
              )}
              {(deanData.streak || 0) > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black text-white" style={{ background: "oklch(0.65 0.20 50)", fontFamily: "'Fredoka One', sans-serif" }}>
                  <Flame className="w-3 h-3" />
                  {deanData.streak}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-3xl font-bold text-white" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.35 0.22 25)" }}>
                  Dean
                </h3>
                <div className="star-badge px-3 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" style={{ color: "oklch(0.55 0.18 75)" }} />
                  <span className="font-black text-lg" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    {isLoading ? "..." : deanData.totalStars}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="progress-track theme-dean">
                <div
                  className="progress-fill"
                  style={{ width: `${deanProgress}%`, background: "linear-gradient(90deg, oklch(0.48 0.22 25), oklch(0.72 0.18 75))" }}
                />
              </div>
              <p className="text-sm font-bold mt-2" style={{ color: "oklch(0.55 0.12 25)", fontFamily: "'Nunito', sans-serif" }}>
                {deanProgress}% of quests complete!
              </p>
              {/* Star history mini-chart */}
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3" style={{ color: "oklch(0.55 0.12 25)" }} />
                  <span className="text-xs font-bold" style={{ color: "oklch(0.55 0.12 25)", fontFamily: "'Nunito', sans-serif" }}>Weekly Stars</span>
                </div>
                <StarHistoryChart data={deanData.starHistory || []} color="oklch(0.48 0.22 25)" />
              </div>
            </div>
          </motion.button>

          {/* Emma Card */}
          <motion.button
            onClick={() => navigate("/emma")}
            className="quest-card theme-emma overflow-hidden text-left w-full"
            style={{ borderColor: "oklch(0.68 0.2 0)", boxShadow: "0 6px 0 oklch(0.55 0.2 0)" }}
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.58 0.24 0), oklch(0.44 0.24 0))", height: "160px" }}>
              <img
                src={EMMA_HERO}
                alt="Emma the Gymnast"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              {emmaData.weekCompleted && (
                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 rounded-full px-3 py-1 text-sm font-black" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                  🏆 DONE!
                </div>
              )}
              {(emmaData.streak || 0) > 0 && (
                <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black text-white" style={{ background: "oklch(0.65 0.20 50)", fontFamily: "'Fredoka One', sans-serif" }}>
                  <Flame className="w-3 h-3" />
                  {emmaData.streak}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-3xl font-bold" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.42 0.24 0)" }}>
                  Emma
                </h3>
                <div className="star-badge px-3 py-1 rounded-xl flex items-center gap-1">
                  <Star className="w-4 h-4 fill-current" style={{ color: "oklch(0.55 0.18 75)" }} />
                  <span className="font-black text-lg" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
                    {isLoading ? "..." : emmaData.totalStars}
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="progress-track theme-emma">
                <div
                  className="progress-fill"
                  style={{ width: `${emmaProgress}%`, background: "linear-gradient(90deg, oklch(0.58 0.24 0), oklch(0.82 0.18 85))" }}
                />
              </div>
              <p className="text-sm font-bold mt-2" style={{ color: "oklch(0.52 0.14 0)", fontFamily: "'Nunito', sans-serif" }}>
                {emmaProgress}% of quests complete!
              </p>
              {/* Star history mini-chart */}
              <div className="mt-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3" style={{ color: "oklch(0.52 0.14 0)" }} />
                  <span className="text-xs font-bold" style={{ color: "oklch(0.52 0.14 0)", fontFamily: "'Nunito', sans-serif" }}>Weekly Stars</span>
                </div>
                <StarHistoryChart data={emmaData.starHistory || []} color="oklch(0.58 0.24 0)" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Parent Access */}
        <div className="mt-8 text-center">
          <motion.button
            onClick={() => navigate("/parent")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white"
            style={{
              background: "linear-gradient(135deg, oklch(0.35 0.04 260), oklch(0.28 0.04 240))",
              border: "3px solid oklch(0.28 0.04 240)",
              boxShadow: "0 4px 0 oklch(0.22 0.04 240)",
              fontFamily: "'Fredoka One', sans-serif",
              fontSize: "1.1rem"
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97, y: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Settings className="w-5 h-5" />
            Parent Dashboard
          </motion.button>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <div className="text-center py-4 text-sm text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>
        Week starts Monday · Stars reset each week
      </div>
    </div>
  );
}
