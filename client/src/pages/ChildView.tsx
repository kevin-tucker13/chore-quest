/**
 * ChildView.tsx — Child's Quest Board
 * =====================================
 * Design: Adventure Quest — ADHD-friendly, bold, gamified
 * Dean: crimson/gold knight theme
 * Emma: hot pink/rose gymnast theme
 * Features: categorised tasks, progress, star count, above & beyond submission
 */

import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, ChevronDown, ChevronUp, Send, Trophy, Sparkles } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { toggleTask, submitAboveBeyond, type ChildId, type ChoreCategory } from "@/lib/firebase";
import { CelebrationOverlay, CategoryCompleteBanner } from "@/components/Celebration";
import { toast } from "sonner";

const DEAN_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/dean-hero-ConP7q2C5kv5fVogmBHkU9.webp";
const EMMA_HERO = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030679542/63ctKYhMVD6hQmjq4oSgF8/emma-hero-h3B49Jx7PECLYoWAjmgTSU.webp";

interface Props {
  childId: ChildId;
}

// ─── Theme Config ─────────────────────────────────────────────────────────────

const THEMES = {
  dean: {
    primary: "oklch(0.48 0.22 25)",
    primaryDark: "oklch(0.35 0.22 25)",
    primaryLight: "oklch(0.92 0.06 25)",
    accent: "oklch(0.82 0.18 85)",
    bg: "linear-gradient(160deg, oklch(0.97 0.02 25) 0%, oklch(0.94 0.03 30) 100%)",
    heroImg: DEAN_HERO,
    heroAlt: "Dean the Knight",
    emoji: "⚔️",
    questWord: "Quest",
    completionEmoji: "🏆",
    completionMsg: "Quest Complete!",
    completionSub: "You're a true knight, Dean!",
    categoryBg: "oklch(0.95 0.04 25)",
    categoryBorder: "oklch(0.78 0.12 25)",
    taskDone: "oklch(0.92 0.06 25)",
    checkBg: "oklch(0.48 0.22 25)",
    progressGradient: "linear-gradient(90deg, oklch(0.48 0.22 25), oklch(0.72 0.18 75))",
    abBg: "oklch(0.96 0.03 50)",
    abBorder: "oklch(0.75 0.15 50)",
  },
  emma: {
    primary: "oklch(0.58 0.24 0)",
    primaryDark: "oklch(0.44 0.24 0)",
    primaryLight: "oklch(0.94 0.06 0)",
    accent: "oklch(0.82 0.18 85)",
    bg: "linear-gradient(160deg, oklch(0.97 0.02 0) 0%, oklch(0.95 0.03 350) 100%)",
    heroImg: EMMA_HERO,
    heroAlt: "Emma the Gymnast",
    emoji: "🎀",
    questWord: "Challenge",
    completionEmoji: "🌟",
    completionMsg: "All Done!",
    completionSub: "You're a star, Emma! ✨",
    categoryBg: "oklch(0.96 0.04 0)",
    categoryBorder: "oklch(0.78 0.14 0)",
    taskDone: "oklch(0.95 0.05 0)",
    checkBg: "oklch(0.58 0.24 0)",
    progressGradient: "linear-gradient(90deg, oklch(0.58 0.24 0), oklch(0.82 0.18 85))",
    abBg: "oklch(0.97 0.02 350)",
    abBorder: "oklch(0.78 0.12 350)",
  },
};

// ─── Task Item ────────────────────────────────────────────────────────────────

interface TaskItemProps {
  task: { id: string; title: string; completed: boolean };
  theme: typeof THEMES.dean;
  onToggle: (taskId: string, completed: boolean) => void;
  disabled?: boolean;
}

function TaskItem({ task, theme, onToggle, disabled }: TaskItemProps) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleToggle = () => {
    if (disabled) return;
    const newCompleted = !task.completed;
    if (newCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 600);
    }
    onToggle(task.id, newCompleted);
  };

  return (
    <motion.div
      layout
      className="relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer select-none"
      style={{
        background: task.completed ? theme.taskDone : "white",
        border: `2px solid ${task.completed ? theme.primary : "oklch(0.90 0.01 80)"}`,
        transition: "background 0.3s, border-color 0.3s",
      }}
      onClick={handleToggle}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Checkbox */}
      <motion.div
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{
          width: "2.75rem",
          height: "2.75rem",
          border: `3px solid ${task.completed ? theme.primary : "oklch(0.80 0.02 80)"}`,
          background: task.completed ? theme.primary : "white",
        }}
        animate={justCompleted ? { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="text-white text-xl font-black"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Task title */}
      <span
        className="flex-1 text-lg font-bold"
        style={{
          fontFamily: "'Nunito', sans-serif",
          color: task.completed ? theme.primaryDark : "oklch(0.25 0.02 60)",
          textDecoration: task.completed ? "line-through" : "none",
          opacity: task.completed ? 0.7 : 1,
        }}
      >
        {task.title}
      </span>

      {/* Star pop on completion */}
      <AnimatePresence>
        {justCompleted && (
          <motion.span
            className="absolute right-4 text-2xl pointer-events-none"
            initial={{ scale: 0, y: 0, opacity: 1 }}
            animate={{ scale: [0, 1.8, 1], y: -30, opacity: [1, 1, 0] }}
            exit={{}}
            transition={{ duration: 0.6 }}
          >
            ⭐
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: ChoreCategory;
  theme: typeof THEMES.dean;
  onToggleTask: (categoryId: string, taskId: string, completed: boolean) => void;
  justCompletedCategoryId: string | null;
}

function CategorySection({ category, theme, onToggleTask, justCompletedCategoryId }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = category.tasks.filter(t => t.completed).length;
  const total = category.tasks.length;
  const allDone = completedCount === total && total > 0;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <motion.div
      layout
      className="rounded-2xl overflow-hidden"
      style={{
        border: `3px solid ${allDone ? theme.primary : theme.categoryBorder}`,
        boxShadow: allDone ? `0 4px 0 ${theme.primary}` : `0 4px 0 ${theme.categoryBorder}`,
        background: allDone ? theme.categoryBg : "white",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Category Header */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
        style={{ background: allDone ? theme.categoryBg : "white" }}
      >
        <span className="text-3xl">{category.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-xl font-bold truncate"
              style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}
            >
              {category.title}
            </h3>
            {allDone && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xl"
              >
                ✅
              </motion.span>
            )}
          </div>
          {/* Mini progress */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full" style={{ background: "oklch(0.90 0.01 80)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: theme.progressGradient }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <span
              className="text-sm font-bold flex-shrink-0"
              style={{ color: theme.primary, fontFamily: "'Nunito', sans-serif" }}
            >
              {completedCount}/{total}
            </span>
          </div>
        </div>
        <div style={{ color: theme.primary }}>
          {expanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
        </div>
      </button>

      {/* Task List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2">
              {category.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  theme={theme}
                  onToggle={(taskId, completed) => onToggleTask(category.id, taskId, completed)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Above & Beyond Section ───────────────────────────────────────────────────

interface AboveBeyondSectionProps {
  childId: ChildId;
  theme: typeof THEMES.dean;
  aboveBeyond: ReturnType<typeof useAppContext>["deanData"]["aboveBeyond"];
  currentData: ReturnType<typeof useAppContext>["deanData"];
}

function AboveBeyondSection({ childId, theme, aboveBeyond, currentData }: AboveBeyondSectionProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await submitAboveBeyond(childId, text.trim(), currentData);
      setText("");
      toast.success("Sent to your parent! 🌟 They'll review it soon.");
    } catch {
      toast.error("Oops! Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const approvedEntries = aboveBeyond.filter(e => e.approved);
  const pendingEntries = aboveBeyond.filter(e => !e.approved && e.submittedBy === "child");

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `3px solid ${theme.abBorder}`,
        boxShadow: `0 4px 0 ${theme.abBorder}`,
        background: theme.abBg,
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-6 h-6" style={{ color: theme.primary }} />
          <h3
            className="text-xl font-bold"
            style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}
          >
            Above & Beyond!
          </h3>
        </div>
        <p
          className="text-sm font-semibold text-gray-500 mb-4"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          Done something extra special? Tell your parent!
        </p>

        {/* Approved entries */}
        {approvedEntries.length > 0 && (
          <div className="mb-4 flex flex-col gap-2">
            {approvedEntries.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "white", border: `2px solid ${theme.primary}` }}
              >
                <span className="text-2xl">🌟</span>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ fontFamily: "'Nunito', sans-serif", color: theme.primaryDark }}>
                    {entry.description}
                  </p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {entry.submittedBy === "parent" ? "Awarded by parent" : "Approved!"} · +{entry.starsAwarded} ⭐
                  </p>
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg font-black text-sm"
                  style={{ background: theme.accent, color: "oklch(0.25 0.05 60)", fontFamily: "'Fredoka One', sans-serif" }}
                >
                  +{entry.starsAwarded} ⭐
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pending entries */}
        {pendingEntries.map(entry => (
          <div
            key={entry.id}
            className="flex items-center gap-3 p-3 rounded-xl mb-2"
            style={{ background: "white", border: "2px dashed oklch(0.80 0.02 80)" }}
          >
            <span className="text-2xl">⏳</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-600" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {entry.description}
              </p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Waiting for parent to approve...
              </p>
            </div>
          </div>
        ))}

        {/* Submit box */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="What did you do? 😊"
            className="flex-1 rounded-xl px-4 py-3 text-base font-semibold outline-none"
            style={{
              border: `2px solid ${theme.categoryBorder}`,
              fontFamily: "'Nunito', sans-serif",
              background: "white",
            }}
            maxLength={120}
          />
          <motion.button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="flex items-center justify-center rounded-xl px-4 py-3 font-bold text-white"
            style={{
              background: text.trim() ? theme.primary : "oklch(0.80 0.01 80)",
              border: `2px solid ${text.trim() ? theme.primaryDark : "oklch(0.75 0.01 80)"}`,
              minWidth: "3.5rem",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ChildView ───────────────────────────────────────────────────────────

export default function ChildView({ childId }: Props) {
  const [, navigate] = useLocation();
  const { deanData, emmaData } = useAppContext();
  const childData = childId === "dean" ? deanData : emmaData;
  const theme = THEMES[childId];

  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompletedCategoryId, setJustCompletedCategoryId] = useState<string | null>(null);
  const [categoryBannerName, setCategoryBannerName] = useState("");
  const [showCategoryBanner, setShowCategoryBanner] = useState(false);
  const [prevWeekCompleted, setPrevWeekCompleted] = useState(childData.weekCompleted);

  // Detect week completion
  if (childData.weekCompleted && !prevWeekCompleted) {
    setPrevWeekCompleted(true);
    setShowCelebration(true);
  }
  if (!childData.weekCompleted && prevWeekCompleted) {
    setPrevWeekCompleted(false);
  }

  const allTasks = childData.categories.flatMap(c => c.tasks);
  const completedTasks = allTasks.filter(t => t.completed).length;
  const totalTasks = allTasks.length;
  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const starsRequired = childData.weeklyReward.starsRequired;
  const starsProgress = Math.min((childData.totalStars / starsRequired) * 100, 100);

  const handleToggleTask = useCallback(
    async (categoryId: string, taskId: string, completed: boolean) => {
      const result = await toggleTask(childId, categoryId, taskId, completed, childData);

      // Check if this category just became complete
      if (completed) {
        const cat = childData.categories.find(c => c.id === categoryId);
        if (cat) {
          const updatedTasks = cat.tasks.map(t => t.id === taskId ? { ...t, completed } : t);
          const catAllDone = updatedTasks.every(t => t.completed);
          if (catAllDone) {
            setJustCompletedCategoryId(categoryId);
            setCategoryBannerName(cat.title);
            setShowCategoryBanner(true);
            setTimeout(() => {
              setShowCategoryBanner(false);
              setJustCompletedCategoryId(null);
            }, 2500);
          }
        }
      }

      // Check week completion
      if (result?.allComplete && !childData.weekCompleted) {
        setTimeout(() => setShowCelebration(true), 600);
      }
    },
    [childId, childData]
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: theme.bg }}
    >
      {/* ─── Category Complete Banner ─────────────────────────────────────── */}
      <CategoryCompleteBanner
        show={showCategoryBanner}
        categoryName={categoryBannerName}
        primaryColor={theme.primary}
      />

      {/* ─── Week Complete Celebration ────────────────────────────────────── */}
      <CelebrationOverlay
        show={showCelebration}
        onDone={() => setShowCelebration(false)}
        message={theme.completionMsg}
        subMessage={theme.completionSub}
        emoji={theme.completionEmoji}
        primaryColor={theme.primary}
      />

      {/* ─── Hero Header ──────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})` }}
      >
        <img
          src={theme.heroImg}
          alt={theme.heroAlt}
          className="w-full object-cover opacity-80"
          style={{ maxHeight: "200px", objectPosition: "center 20%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 flex items-center gap-1 px-3 py-2 rounded-xl text-white font-bold"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "2px solid rgba(255,255,255,0.4)",
            fontFamily: "'Nunito', sans-serif",
            backdropFilter: "blur(4px)",
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Name + Stars */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div>
            <h1
              className="text-4xl text-white drop-shadow-lg"
              style={{ fontFamily: "'Fredoka One', sans-serif", textShadow: "0 3px 6px rgba(0,0,0,0.5)" }}
            >
              {theme.emoji} {childData.name}'s Quests
            </h1>
          </div>
          <motion.div
            className="star-badge px-4 py-2 rounded-2xl flex items-center gap-2"
            animate={childData.totalStars > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.4 }}
          >
            <Star className="w-5 h-5 fill-current" style={{ color: "oklch(0.55 0.18 75)" }} />
            <span className="text-2xl font-black" style={{ fontFamily: "'Fredoka One', sans-serif" }}>
              {childData.totalStars}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ─── Overall Progress ─────────────────────────────────────────────── */}
      <div className="container pt-5 pb-2">
        <div
          className="rounded-2xl p-4"
          style={{
            background: "white",
            border: `3px solid ${theme.categoryBorder}`,
            boxShadow: `0 4px 0 ${theme.categoryBorder}`,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-black text-lg"
              style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}
            >
              Overall Progress
            </span>
            <span
              className="font-black text-lg"
              style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primary }}
            >
              {completedTasks}/{totalTasks} tasks
            </span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              style={{ background: theme.progressGradient }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Reward progress */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Trophy className="w-4 h-4" style={{ color: "oklch(0.68 0.18 75)" }} />
                <span className="text-sm font-bold text-gray-600" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  {childData.weeklyReward.title}
                </span>
              </div>
              <span className="text-sm font-black" style={{ color: "oklch(0.55 0.18 75)", fontFamily: "'Fredoka One', sans-serif" }}>
                {childData.totalStars}/{starsRequired} ⭐
              </span>
            </div>
            <div className="progress-track" style={{ height: "0.75rem" }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, oklch(0.82 0.18 85), oklch(0.72 0.18 75))",
                  width: `${starsProgress}%`,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
              🎁 {childData.weeklyReward.description}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Category List ────────────────────────────────────────────────── */}
      <div className="container py-4 flex flex-col gap-4">
        {childData.categories
          .slice()
          .sort((a, b) => a.order - b.order)
          .map(category => (
            <CategorySection
              key={category.id}
              category={category}
              theme={theme}
              onToggleTask={handleToggleTask}
              justCompletedCategoryId={justCompletedCategoryId}
            />
          ))}

        {childData.categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p
              className="text-xl font-bold text-gray-400"
              style={{ fontFamily: "'Fredoka One', sans-serif" }}
            >
              No quests yet!
            </p>
            <p className="text-gray-400 mt-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Ask your parent to add some chores.
            </p>
          </div>
        )}

        {/* ─── Above & Beyond ───────────────────────────────────────────── */}
        <AboveBeyondSection
          childId={childId}
          theme={theme}
          aboveBeyond={childData.aboveBeyond}
          currentData={childData}
        />

        {/* Week complete banner */}
        {childData.weekCompleted && (
          <motion.div
            className="rounded-2xl p-5 text-center"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.primaryDark})`,
              border: "3px solid white",
              boxShadow: `0 6px 0 ${theme.primaryDark}`,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-5xl mb-2">🏆</div>
            <h3
              className="text-2xl text-white font-bold mb-1"
              style={{ fontFamily: "'Fredoka One', sans-serif" }}
            >
              All Quests Complete!
            </h3>
            <p className="text-white/90 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
              You've earned your reward: {childData.weeklyReward.description}
            </p>
          </motion.div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
