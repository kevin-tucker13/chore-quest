/**
 * ParentDashboard.tsx — Parent Control Centre
 * =============================================
 * Design: Adventure Quest — clean, functional, trustworthy
 * Features:
 *  - PIN protection (130615)
 *  - Manage chore categories & tasks for each child
 *  - Set weekly rewards
 *  - Award / reject above & beyond entries
 *  - Reset week
 *  - Change PIN
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Edit2, Check, X, Star, Trophy,
  RefreshCw, Settings, ChevronDown, ChevronUp, Award, Shield, Lock
} from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import {
  addCategory, updateCategory, deleteCategory,
  addTask, deleteTask,
  updateWeeklyReward, resetWeek,
  awardAboveBeyond, rejectAboveBeyond, addParentAboveBeyond,
  updateSettings,
  type ChildId, type ChoreCategory
} from "@/lib/firebase";
import { toast } from "sonner";

// ─── PIN Entry Screen ─────────────────────────────────────────────────────────

function PinEntry({ onSuccess }: { onSuccess: () => void }) {
  const { authenticateParent } = useAppContext();
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const [, navigate] = useLocation();

  const handleDigit = (d: string) => {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      setTimeout(() => {
        if (authenticateParent(next)) {
          onSuccess();
        } else {
          setShake(true);
          setPin("");
          setTimeout(() => setShake(false), 500);
          toast.error("Wrong PIN! Try again.");
        }
      }, 150);
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, oklch(0.25 0.04 260) 0%, oklch(0.18 0.04 240) 100%)" }}
    >
      <motion.div
        className="w-full max-w-sm"
        animate={shake ? { x: [-12, 12, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1
            className="text-4xl text-white mb-2"
            style={{ fontFamily: "'Fredoka One', sans-serif" }}
          >
            Parent Area
          </h1>
          <p className="text-white/70 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Enter your PIN to continue
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: "1.25rem",
                height: "1.25rem",
                background: i < pin.length ? "oklch(0.82 0.18 85)" : "rgba(255,255,255,0.2)",
                border: "2px solid rgba(255,255,255,0.3)",
              }}
              animate={i < pin.length ? { scale: [0.8, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((key, i) => (
            <motion.button
              key={i}
              onClick={() => key === "⌫" ? handleDelete() : key !== "" ? handleDigit(key) : undefined}
              className="rounded-2xl py-5 text-2xl font-black"
              style={{
                background: key === "" ? "transparent" : "rgba(255,255,255,0.12)",
                color: "white",
                border: key === "" ? "none" : "2px solid rgba(255,255,255,0.2)",
                fontFamily: "'Fredoka One', sans-serif",
                visibility: key === "" ? "hidden" : "visible",
              }}
              whileTap={key !== "" ? { scale: 0.9 } : {}}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              {key}
            </motion.button>
          ))}
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 w-full py-3 rounded-2xl text-white/60 font-bold"
          style={{ fontFamily: "'Nunito', sans-serif" }}
        >
          ← Back to home
        </button>
      </motion.div>
    </div>
  );
}

// ─── Child Tab Panel ──────────────────────────────────────────────────────────

interface ChildPanelProps {
  childId: ChildId;
}

const CHILD_THEMES = {
  dean: {
    primary: "oklch(0.48 0.22 25)",
    primaryDark: "oklch(0.35 0.22 25)",
    light: "oklch(0.95 0.04 25)",
    border: "oklch(0.78 0.12 25)",
    emoji: "⚔️",
  },
  emma: {
    primary: "oklch(0.58 0.24 0)",
    primaryDark: "oklch(0.44 0.24 0)",
    light: "oklch(0.96 0.04 0)",
    border: "oklch(0.78 0.14 0)",
    emoji: "🎀",
  },
};

function ChildPanel({ childId }: ChildPanelProps) {
  const { deanData, emmaData } = useAppContext();
  const childData = childId === "dean" ? deanData : emmaData;
  const theme = CHILD_THEMES[childId];

  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newCatTitle, setNewCatTitle] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📋");
  const [addingCat, setAddingCat] = useState(false);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = useState("");
  const [editCatEmoji, setEditCatEmoji] = useState("");
  const [rewardTitle, setRewardTitle] = useState(childData.weeklyReward.title);
  const [rewardDesc, setRewardDesc] = useState(childData.weeklyReward.description);
  const [rewardStars, setRewardStars] = useState(String(childData.weeklyReward.starsRequired));
  const [savingReward, setSavingReward] = useState(false);
  const [abText, setAbText] = useState("");
  const [abStars, setAbStars] = useState("3");
  const [addingAb, setAddingAb] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleAddCategory = async () => {
    if (!newCatTitle.trim()) return;
    try {
      await addCategory(childId, {
        title: newCatTitle.trim(),
        emoji: newCatEmoji,
        tasks: [],
        order: childData.categories.length,
      }, childData);
      setNewCatTitle("");
      setNewCatEmoji("📋");
      setAddingCat(false);
      toast.success("Category added!");
    } catch {
      toast.error("Failed to add category.");
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Delete this category and all its tasks?")) return;
    await deleteCategory(childId, catId, childData);
    toast.success("Category deleted.");
  };

  const handleSaveEditCat = async (catId: string) => {
    await updateCategory(childId, catId, { title: editCatTitle, emoji: editCatEmoji }, childData);
    setEditingCat(null);
    toast.success("Updated!");
  };

  const handleAddTask = async (catId: string) => {
    const title = newTaskInputs[catId]?.trim();
    if (!title) return;
    await addTask(childId, catId, title, childData);
    setNewTaskInputs(prev => ({ ...prev, [catId]: "" }));
    toast.success("Task added!");
  };

  const handleDeleteTask = async (catId: string, taskId: string) => {
    await deleteTask(childId, catId, taskId, childData);
  };

  const handleSaveReward = async () => {
    setSavingReward(true);
    try {
      await updateWeeklyReward(childId, {
        title: rewardTitle,
        description: rewardDesc,
        starsRequired: parseInt(rewardStars) || 20,
        earned: childData.weeklyReward.earned,
      }, childData);
      toast.success("Reward updated!");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSavingReward(false);
    }
  };

  const handleAddAboveBeyond = async () => {
    if (!abText.trim()) return;
    setAddingAb(true);
    try {
      await addParentAboveBeyond(childId, abText.trim(), parseInt(abStars) || 3, childData);
      setAbText("");
      setAbStars("3");
      toast.success(`Awarded to ${childData.name}! 🌟`);
    } catch {
      toast.error("Failed to award.");
    } finally {
      setAddingAb(false);
    }
  };

  const handleApproveAb = async (entryId: string, stars: number) => {
    await awardAboveBeyond(childId, entryId, stars, childData);
    toast.success("Approved! Stars awarded. ⭐");
  };

  const handleRejectAb = async (entryId: string) => {
    await rejectAboveBeyond(childId, entryId, childData);
    toast.info("Entry removed.");
  };

  const handleResetWeek = async () => {
    if (!confirm(`Reset ${childData.name}'s week? This clears all progress and stars.`)) return;
    setResetting(true);
    try {
      await resetWeek(childId, childData);
      toast.success(`${childData.name}'s week has been reset!`);
    } catch {
      toast.error("Failed to reset.");
    } finally {
      setResetting(false);
    }
  };

  const pendingAb = childData.aboveBeyond.filter(e => !e.approved && e.submittedBy === "child");

  return (
    <div className="flex flex-col gap-5">

      {/* ─── Stats Summary ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: theme.light, border: `3px solid ${theme.border}` }}
      >
        <div>
          <p className="text-sm font-bold text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>Total Stars</p>
          <p className="text-3xl font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primary }}>
            {childData.totalStars} ⭐
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>Tasks Done</p>
          <p className="text-3xl font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primary }}>
            {childData.categories.flatMap(c => c.tasks).filter(t => t.completed).length}/
            {childData.categories.flatMap(c => c.tasks).length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>Status</p>
          <p className="text-xl font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: childData.weekCompleted ? "oklch(0.55 0.18 145)" : theme.primary }}>
            {childData.weekCompleted ? "✅ Done!" : "🔄 In Progress"}
          </p>
        </div>
      </div>

      {/* ─── Above & Beyond Pending Approvals ──────────────────────────────── */}
      {pendingAb.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "oklch(0.98 0.04 85)", border: "3px solid oklch(0.82 0.18 85)", boxShadow: "0 4px 0 oklch(0.72 0.18 75)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5" style={{ color: "oklch(0.55 0.18 75)" }} />
            <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.35 0.15 60)" }}>
              Above & Beyond — Needs Approval ({pendingAb.length})
            </h3>
          </div>
          {pendingAb.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-white mb-2">
              <span className="text-xl">🌟</span>
              <p className="flex-1 font-semibold text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {entry.description}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map(s => (
                  <motion.button
                    key={s}
                    onClick={() => handleApproveAb(entry.id, s)}
                    className="px-2 py-1 rounded-lg text-sm font-black text-white"
                    style={{ background: "oklch(0.55 0.18 145)" }}
                    whileTap={{ scale: 0.9 }}
                  >
                    +{s}⭐
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => handleRejectAb(entry.id)}
                  className="p-1 rounded-lg"
                  style={{ background: "oklch(0.92 0.05 25)" }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" style={{ color: "oklch(0.48 0.22 25)" }} />
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Award Above & Beyond (Parent-initiated) ───────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "white", border: `3px solid ${theme.border}`, boxShadow: `0 4px 0 ${theme.border}` }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5" style={{ color: theme.primary }} />
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}>
            Award Above & Beyond
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Recognise great behaviour — this will show on {childData.name}'s screen immediately!
        </p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={abText}
            onChange={e => setAbText(e.target.value)}
            placeholder={`What did ${childData.name} do? 😊`}
            className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold outline-none"
            style={{ border: `2px solid ${theme.border}`, fontFamily: "'Nunito', sans-serif" }}
            maxLength={120}
          />
          <select
            value={abStars}
            onChange={e => setAbStars(e.target.value)}
            className="rounded-xl px-2 py-2 font-bold text-sm outline-none"
            style={{ border: `2px solid ${theme.border}`, fontFamily: "'Fredoka One', sans-serif", color: theme.primary }}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} ⭐</option>
            ))}
          </select>
        </div>
        <motion.button
          onClick={handleAddAboveBeyond}
          disabled={!abText.trim() || addingAb}
          className="w-full py-2 rounded-xl font-black text-white"
          style={{
            background: abText.trim() ? theme.primary : "oklch(0.80 0.01 80)",
            fontFamily: "'Fredoka One', sans-serif",
            fontSize: "1rem",
          }}
          whileTap={{ scale: 0.97 }}
        >
          Award {abStars} ⭐ to {childData.name}!
        </motion.button>
      </div>

      {/* ─── Chore Categories ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "white", border: `3px solid ${theme.border}`, boxShadow: `0 4px 0 ${theme.border}` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}>
            Chore Categories
          </h3>
          <motion.button
            onClick={() => setAddingCat(a => !a)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-white text-sm"
            style={{ background: theme.primary, fontFamily: "'Fredoka One', sans-serif" }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" /> Add Category
          </motion.button>
        </div>

        {/* Add category form */}
        <AnimatePresence>
          {addingCat && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="flex gap-2 p-3 rounded-xl" style={{ background: theme.light, border: `2px solid ${theme.border}` }}>
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={e => setNewCatEmoji(e.target.value)}
                  className="w-12 text-center rounded-lg px-1 py-2 text-xl outline-none"
                  style={{ border: `2px solid ${theme.border}` }}
                  maxLength={2}
                />
                <input
                  type="text"
                  value={newCatTitle}
                  onChange={e => setNewCatTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddCategory()}
                  placeholder="Category name..."
                  className="flex-1 rounded-xl px-3 py-2 font-semibold outline-none"
                  style={{ border: `2px solid ${theme.border}`, fontFamily: "'Nunito', sans-serif" }}
                />
                <button onClick={handleAddCategory} className="p-2 rounded-xl text-white" style={{ background: theme.primary }}>
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => setAddingCat(false)} className="p-2 rounded-xl" style={{ background: "oklch(0.92 0.01 80)" }}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category list */}
        <div className="flex flex-col gap-3">
          {childData.categories.map(cat => (
            <div
              key={cat.id}
              className="rounded-xl overflow-hidden"
              style={{ border: `2px solid ${theme.border}` }}
            >
              {/* Category header */}
              <div
                className="flex items-center gap-2 p-3"
                style={{ background: theme.light }}
              >
                {editingCat === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editCatEmoji}
                      onChange={e => setEditCatEmoji(e.target.value)}
                      className="w-10 text-center rounded-lg px-1 py-1 text-lg outline-none"
                      style={{ border: `2px solid ${theme.border}` }}
                      maxLength={2}
                    />
                    <input
                      type="text"
                      value={editCatTitle}
                      onChange={e => setEditCatTitle(e.target.value)}
                      className="flex-1 rounded-lg px-2 py-1 font-semibold outline-none text-sm"
                      style={{ border: `2px solid ${theme.border}`, fontFamily: "'Nunito', sans-serif" }}
                    />
                    <button onClick={() => handleSaveEditCat(cat.id)} className="p-1 rounded-lg text-white" style={{ background: theme.primary }}>
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingCat(null)} className="p-1 rounded-lg" style={{ background: "oklch(0.90 0.01 80)" }}>
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="flex-1 font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: theme.primaryDark }}>
                      {cat.title}
                    </span>
                    <span className="text-sm font-bold text-gray-400" style={{ fontFamily: "'Nunito', sans-serif" }}>
                      {cat.tasks.length} tasks
                    </span>
                    <button
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditCatTitle(cat.title);
                        setEditCatEmoji(cat.emoji);
                      }}
                      className="p-1 rounded-lg"
                      style={{ background: "white" }}
                    >
                      <Edit2 className="w-4 h-4" style={{ color: theme.primary }} />
                    </button>
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      className="p-1 rounded-lg"
                      style={{ background: "white" }}
                    >
                      {expandedCat === cat.id
                        ? <ChevronUp className="w-4 h-4 text-gray-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 rounded-lg"
                      style={{ background: "oklch(0.95 0.04 25)" }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: "oklch(0.48 0.22 25)" }} />
                    </button>
                  </>
                )}
              </div>

              {/* Task list */}
              <AnimatePresence>
                {expandedCat === cat.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 flex flex-col gap-2 bg-white">
                      {cat.tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.97 0.005 80)" }}>
                          <span className="flex-1 text-sm font-semibold text-gray-700" style={{ fontFamily: "'Nunito', sans-serif" }}>
                            {task.completed ? "✅ " : "⬜ "}{task.title}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(cat.id, task.id)}
                            className="p-1 rounded-lg"
                            style={{ background: "oklch(0.95 0.04 25)" }}
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: "oklch(0.48 0.22 25)" }} />
                          </button>
                        </div>
                      ))}
                      {/* Add task */}
                      <div className="flex gap-2 mt-1">
                        <input
                          type="text"
                          value={newTaskInputs[cat.id] || ""}
                          onChange={e => setNewTaskInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && handleAddTask(cat.id)}
                          placeholder="Add a task..."
                          className="flex-1 rounded-lg px-3 py-2 text-sm font-semibold outline-none"
                          style={{ border: `2px solid ${theme.border}`, fontFamily: "'Nunito', sans-serif" }}
                        />
                        <button
                          onClick={() => handleAddTask(cat.id)}
                          className="p-2 rounded-lg text-white"
                          style={{ background: theme.primary }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {childData.categories.length === 0 && (
            <p className="text-center text-gray-400 py-4 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
              No categories yet. Add one above!
            </p>
          )}
        </div>
      </div>

      {/* ─── Weekly Reward ──────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "white", border: `3px solid oklch(0.78 0.18 85)`, boxShadow: "0 4px 0 oklch(0.68 0.18 75)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5" style={{ color: "oklch(0.55 0.18 75)" }} />
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.35 0.15 60)" }}>
            Weekly Reward
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={rewardTitle}
            onChange={e => setRewardTitle(e.target.value)}
            placeholder="Reward title"
            className="rounded-xl px-3 py-2 font-semibold outline-none text-sm"
            style={{ border: "2px solid oklch(0.82 0.12 85)", fontFamily: "'Nunito', sans-serif" }}
          />
          <input
            type="text"
            value={rewardDesc}
            onChange={e => setRewardDesc(e.target.value)}
            placeholder="e.g. Extra tablet time on Friday + £1 pocket money"
            className="rounded-xl px-3 py-2 font-semibold outline-none text-sm"
            style={{ border: "2px solid oklch(0.82 0.12 85)", fontFamily: "'Nunito', sans-serif" }}
          />
          <div className="flex gap-2 items-center">
            <label className="text-sm font-bold text-gray-600" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Stars required:
            </label>
            <input
              type="number"
              value={rewardStars}
              onChange={e => setRewardStars(e.target.value)}
              min={1}
              max={100}
              className="w-20 rounded-xl px-3 py-2 font-black outline-none text-center"
              style={{ border: "2px solid oklch(0.82 0.12 85)", fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.55 0.18 75)" }}
            />
            <span className="text-lg">⭐</span>
          </div>
          <motion.button
            onClick={handleSaveReward}
            disabled={savingReward}
            className="py-2 rounded-xl font-black text-white"
            style={{ background: "linear-gradient(135deg, oklch(0.82 0.18 85), oklch(0.72 0.18 75))", fontFamily: "'Fredoka One', sans-serif" }}
            whileTap={{ scale: 0.97 }}
          >
            {savingReward ? "Saving..." : "Save Reward ⭐"}
          </motion.button>
        </div>
      </div>

      {/* ─── Reset Week ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "oklch(0.97 0.01 25)", border: "3px solid oklch(0.82 0.12 25)", boxShadow: "0 4px 0 oklch(0.72 0.12 25)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-5 h-5" style={{ color: "oklch(0.48 0.22 25)" }} />
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.35 0.22 25)" }}>
            Reset Week
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Clears all completed tasks and resets stars to 0 for a new week.
        </p>
        <motion.button
          onClick={handleResetWeek}
          disabled={resetting}
          className="w-full py-2 rounded-xl font-black text-white"
          style={{ background: "oklch(0.48 0.22 25)", fontFamily: "'Fredoka One', sans-serif" }}
          whileTap={{ scale: 0.97 }}
        >
          {resetting ? "Resetting..." : `🔄 Reset ${childData.name}'s Week`}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────

function SettingsPanel() {
  const { settings } = useAppContext();
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSavePin = async () => {
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs don't match!");
      return;
    }
    setSaving(true);
    try {
      await updateSettings({ parentPin: newPin });
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN updated! Remember to write it down.");
    } catch {
      toast.error("Failed to save PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-2xl p-4"
        style={{ background: "white", border: "3px solid oklch(0.78 0.04 260)", boxShadow: "0 4px 0 oklch(0.65 0.04 260)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5" style={{ color: "oklch(0.35 0.04 260)" }} />
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.25 0.04 260)" }}>
            Change Parent PIN
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Current PIN is hidden for security. Enter a new 6-digit PIN below.
        </p>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            inputMode="numeric"
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="New 6-digit PIN"
            className="rounded-xl px-3 py-2 font-bold outline-none text-center text-xl tracking-widest"
            style={{ border: "2px solid oklch(0.78 0.04 260)", fontFamily: "'Fredoka One', sans-serif", letterSpacing: "0.3em" }}
          />
          <input
            type="password"
            inputMode="numeric"
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Confirm new PIN"
            className="rounded-xl px-3 py-2 font-bold outline-none text-center text-xl tracking-widest"
            style={{ border: "2px solid oklch(0.78 0.04 260)", fontFamily: "'Fredoka One', sans-serif", letterSpacing: "0.3em" }}
          />
          <motion.button
            onClick={handleSavePin}
            disabled={saving || newPin.length !== 6}
            className="py-2 rounded-xl font-black text-white"
            style={{
              background: newPin.length === 6 ? "oklch(0.35 0.04 260)" : "oklch(0.80 0.01 80)",
              fontFamily: "'Fredoka One', sans-serif",
            }}
            whileTap={{ scale: 0.97 }}
          >
            {saving ? "Saving..." : "Save New PIN 🔒"}
          </motion.button>
        </div>
        <div
          className="mt-4 p-3 rounded-xl"
          style={{ background: "oklch(0.96 0.02 80)", border: "2px solid oklch(0.88 0.02 80)" }}
        >
          <p className="text-xs text-gray-500 font-semibold" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <strong>To change the PIN in code:</strong> Open <code>client/src/lib/firebase.ts</code> and find <code>parentPin: "130615"</code> in the <code>defaultSettings</code> object. Change it to your preferred 6-digit PIN. This only affects new installs — existing data uses the PIN stored in Firebase/localStorage.
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: "white", border: "3px solid oklch(0.78 0.04 260)", boxShadow: "0 4px 0 oklch(0.65 0.04 260)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5" style={{ color: "oklch(0.35 0.04 260)" }} />
          <h3 className="text-lg font-black" style={{ fontFamily: "'Fredoka One', sans-serif", color: "oklch(0.25 0.04 260)" }}>
            Firebase Setup
          </h3>
        </div>
        <p className="text-sm text-gray-500" style={{ fontFamily: "'Nunito', sans-serif" }}>
          This app uses Firebase for real-time sync between devices. To connect your own Firebase project, add these environment variables to a <code>.env</code> file in the project root:
        </p>
        <pre
          className="mt-3 p-3 rounded-xl text-xs overflow-x-auto"
          style={{ background: "oklch(0.12 0.02 260)", color: "oklch(0.85 0.02 80)", fontFamily: "monospace" }}
        >
{`VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id`}
        </pre>
        <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
          Without these, the app runs in demo mode using browser localStorage (works on one device only).
        </p>
      </div>
    </div>
  );
}

// ─── Main ParentDashboard ─────────────────────────────────────────────────────

export default function ParentDashboard() {
  const [, navigate] = useLocation();
  const { isParentAuthenticated, logoutParent } = useAppContext();
  const [authenticated, setAuthenticated] = useState(isParentAuthenticated);
  const [activeTab, setActiveTab] = useState<"dean" | "emma" | "settings">("dean");

  const sendReminder = trpc.notifications.sendReminder.useMutation({
    onSuccess: ({ sent }) => {
      if (sent) {
        toast.success("Reminder sent to your device! 📨");
      } else {
        toast.error("Could not send reminder right now.");
      }
    },
    onError: () => toast.error("Failed to send reminder."),
  });

  if (!authenticated) {
    return <PinEntry onSuccess={() => setAuthenticated(true)} />;
  }

  const tabs = [
    { id: "dean" as const, label: "Dean", emoji: "⚔️", color: "oklch(0.48 0.22 25)" },
    { id: "emma" as const, label: "Emma", emoji: "🎀", color: "oklch(0.58 0.24 0)" },
    { id: "settings" as const, label: "Settings", emoji: "⚙️", color: "oklch(0.35 0.04 260)" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, oklch(0.97 0.01 260) 0%, oklch(0.94 0.02 240) 100%)" }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 py-4"
        style={{
          background: "linear-gradient(135deg, oklch(0.28 0.04 260), oklch(0.22 0.04 240))",
          borderBottom: "3px solid oklch(0.35 0.04 260)",
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-white/80 font-bold"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            <ArrowLeft className="w-5 h-5" /> Home
          </button>
          <h1
            className="text-2xl text-white"
            style={{ fontFamily: "'Fredoka One', sans-serif" }}
          >
            🛡️ Parent Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => sendReminder.mutate({ message: "" })}
              disabled={sendReminder.isPending}
              className="flex items-center gap-1 text-white/80 text-xs font-bold px-2 py-1 rounded-lg"
              style={{ background: "oklch(0.42 0.12 50)", fontFamily: "'Nunito', sans-serif" }}
              whileTap={{ scale: 0.95 }}
              title="Send a reminder notification to your device"
            >
              {sendReminder.isPending ? "⏳" : "📨"} Remind
            </motion.button>
            <button
              onClick={() => { logoutParent(); setAuthenticated(false); }}
              className="text-white/60 text-sm font-bold"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Lock 🔒
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-[73px] z-10 px-4 py-3" style={{ background: "oklch(0.97 0.01 260)" }}>
        <div className="max-w-2xl mx-auto flex gap-2">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1 py-3 rounded-2xl font-black text-sm"
              style={{
                background: activeTab === tab.id ? tab.color : "white",
                color: activeTab === tab.id ? "white" : "oklch(0.45 0.02 60)",
                border: `3px solid ${activeTab === tab.id ? tab.color : "oklch(0.88 0.01 80)"}`,
                boxShadow: activeTab === tab.id ? `0 3px 0 ${tab.color}` : "0 3px 0 oklch(0.82 0.01 80)",
                fontFamily: "'Fredoka One', sans-serif",
                fontSize: "0.95rem",
              }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.emoji} {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────────────────── */}
      <div className="flex-1 container py-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "dean" && <ChildPanel childId="dean" />}
            {activeTab === "emma" && <ChildPanel childId="emma" />}
            {activeTab === "settings" && <SettingsPanel />}
          </motion.div>
        </AnimatePresence>
        <div className="h-8" />
      </div>
    </div>
  );
}
