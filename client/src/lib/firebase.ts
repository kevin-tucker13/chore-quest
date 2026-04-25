/**
 * Firebase Configuration & Data Service
 * ======================================
 * Design: Adventure Quest — ADHD-friendly chore chart for Dean & Emma
 *
 * Data model v2: supports daily/weekly task types, recurring tasks,
 * completion timestamps, and bulk clear.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

// ─── Firebase Config ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB93FRDgE2UbmuPNAVRnHxi7BOUqOGftmE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chore-quest-7617f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chore-quest-7617f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chore-quest-7617f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "132152615162",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:132152615162:web:fb30c66b93be0d954e2943",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChildId = "dean" | "emma";
export type TaskFrequency = "daily" | "weekly";

export interface ChoreTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
  frequency: TaskFrequency;   // "daily" resets every day, "weekly" resets every week
  recurring: boolean;         // if true, task reappears automatically after reset
  lastResetDate?: string | null; // ISO date — tracks when this daily task was last reset
}

export interface ChoreCategory {
  id: string;
  title: string;
  emoji: string;
  tasks: ChoreTask[];
  order: number;
  frequency: TaskFrequency;   // category-level frequency (all tasks inherit this)
}

export interface AboveBeyondEntry {
  id: string;
  description: string;
  submittedBy: "child" | "parent";
  approved: boolean;
  starsAwarded: number;
  createdAt: string;
  approvedAt?: string | null;
}

export interface WeeklyReward {
  title: string;
  description: string;
  starsRequired: number;
  earned: boolean;
}

export interface WeekHistoryEntry {
  weekStart: string;
  stars: number;
  completed: boolean;
}

export interface ChildData {
  id: ChildId;
  name: string;
  totalStars: number;
  weekStartDate: string;
  lastDailyResetDate: string; // ISO date — tracks when daily tasks were last reset
  categories: ChoreCategory[];
  aboveBeyond: AboveBeyondEntry[];
  weeklyReward: WeeklyReward;
  weekCompleted: boolean;
  streak: number;
  starHistory: WeekHistoryEntry[];
}

export interface AppSettings {
  parentPin: string;
  weekStartDay: number;
  familyCode?: string;
}

// ─── Initialise Firebase ──────────────────────────────────────────────────────

let app: ReturnType<typeof initializeApp>;
let db: ReturnType<typeof getFirestore>;
let isDemo = false;

export function initFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    isDemo = firebaseConfig.apiKey === "demo-api-key";
    return { success: true, isDemo };
  } catch (e) {
    console.error("Firebase init failed:", e);
    isDemo = true;
    return { success: false, isDemo: true };
  }
}

export function getIsDemo() {
  return isDemo;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/** Format an ISO timestamp to a friendly time string e.g. "7:43am" */
export function formatCompletedAt(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

/** Format an ISO timestamp to date + time e.g. "Mon 21 Apr at 7:43am" */
export function formatCompletedAtFull(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    + " at " + d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ─── Default Data ─────────────────────────────────────────────────────────────

export function getDefaultChildData(childId: ChildId): ChildData {
  const name = childId === "dean" ? "Dean" : "Emma";
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];
  const todayStr = todayISO();

  return {
    id: childId,
    name,
    totalStars: 0,
    weekStartDate: weekStart,
    lastDailyResetDate: todayStr,
    categories: [
      {
        id: "morning",
        title: "Morning Routine",
        emoji: "🌅",
        order: 0,
        frequency: "daily",
        tasks: [
          { id: "m1", title: "Get dressed", completed: false, completedAt: null, frequency: "daily", recurring: true },
          { id: "m2", title: "Brush teeth", completed: false, completedAt: null, frequency: "daily", recurring: true },
          { id: "m3", title: "Eat breakfast", completed: false, completedAt: null, frequency: "daily", recurring: true },
          { id: "m4", title: "Wash face", completed: false, completedAt: null, frequency: "daily", recurring: true },
        ],
      },
      {
        id: "bedroom",
        title: "Tidy Bedroom",
        emoji: "🛏️",
        order: 1,
        frequency: "weekly",
        tasks: [
          { id: "b1", title: "Make the bed", completed: false, completedAt: null, frequency: "weekly", recurring: true },
          { id: "b2", title: "Put clothes away", completed: false, completedAt: null, frequency: "weekly", recurring: true },
          { id: "b3", title: "Tidy toys off the floor", completed: false, completedAt: null, frequency: "weekly", recurring: true },
          { id: "b4", title: "Put dirty clothes in the basket", completed: false, completedAt: null, frequency: "weekly", recurring: true },
        ],
      },
      {
        id: "helping",
        title: "Helping Out",
        emoji: "🤝",
        order: 2,
        frequency: "weekly",
        tasks: [
          { id: "h1", title: "Set the table for dinner", completed: false, completedAt: null, frequency: "weekly", recurring: true },
          { id: "h2", title: "Help clear the table", completed: false, completedAt: null, frequency: "weekly", recurring: true },
        ],
      },
    ],
    aboveBeyond: [],
    streak: 0,
    starHistory: [],
    weeklyReward: {
      title: "Weekly Reward",
      description: "Extra tablet time on Friday + £1 pocket money",
      starsRequired: 20,
      earned: false,
    },
    weekCompleted: false,
  };
}

export const defaultSettings: AppSettings = {
  parentPin: "130615",
  weekStartDay: 1,
  familyCode: "6643",
};

// ─── Local Storage Fallback (Demo / Offline Mode) ─────────────────────────────

const LS_PREFIX = "chorechart_";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

// ─── Daily Reset Logic ────────────────────────────────────────────────────────

/**
 * Check if daily tasks need resetting (new day since last reset).
 * Returns updated ChildData if a reset was needed, or null if no change.
 */
export function applyDailyResetIfNeeded(data: ChildData): ChildData | null {
  const today = todayISO();
  if (data.lastDailyResetDate === today) return null; // already reset today

  // Reset only daily tasks (recurring ones reset to incomplete, non-recurring stay as-is)
  const updatedCategories = data.categories.map((cat) => {
    if (cat.frequency !== "daily") return cat;
    return {
      ...cat,
      tasks: cat.tasks.map((task) => {
        if (!task.recurring) return task;
        return { ...task, completed: false, completedAt: null };
      }),
    };
  });

  return {
    ...data,
    categories: updatedCategories,
    lastDailyResetDate: today,
    // Recalculate weekCompleted — only weekly tasks count toward weekly completion
    weekCompleted: checkWeeklyComplete(updatedCategories),
  };
}

/** Check if all weekly tasks are complete */
function checkWeeklyComplete(categories: ChoreCategory[]): boolean {
  const weeklyTasks = categories
    .filter((c) => c.frequency === "weekly")
    .flatMap((c) => c.tasks);
  if (weeklyTasks.length === 0) return false;
  return weeklyTasks.every((t) => t.completed);
}

/** Count stars: daily tasks = 1 star each, weekly tasks = 2 stars each */
export function calculateStars(categories: ChoreCategory[]): number {
  let stars = 0;
  for (const cat of categories) {
    for (const task of cat.tasks) {
      if (task.completed) {
        stars += cat.frequency === "weekly" ? 2 : 1;
      }
    }
  }
  return stars;
}

// ─── Data Access Functions ────────────────────────────────────────────────────

/** Subscribe to a child's data in real-time */
export function subscribeToChild(
  childId: ChildId,
  callback: (data: ChildData) => void
): () => void {
  if (isDemo || !db) {
    const data = lsGet<ChildData>(`child_${childId}`, getDefaultChildData(childId));
    callback(data);
    const interval = setInterval(() => {
      const updated = lsGet<ChildData>(`child_${childId}`, getDefaultChildData(childId));
      callback(updated);
    }, 1000);
    return () => clearInterval(interval);
  }

  const docRef = doc(db, "children", childId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as ChildData);
    } else {
      const defaultData = getDefaultChildData(childId);
      setDoc(docRef, defaultData);
      callback(defaultData);
    }
  });
}

/** Subscribe to app settings */
export function subscribeToSettings(
  callback: (settings: AppSettings) => void
): () => void {
  if (isDemo || !db) {
    const settings = lsGet<AppSettings>("settings", defaultSettings);
    callback(settings);
    const interval = setInterval(() => {
      callback(lsGet<AppSettings>("settings", defaultSettings));
    }, 1000);
    return () => clearInterval(interval);
  }

  const docRef = doc(db, "settings", "app");
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as AppSettings);
    } else {
      setDoc(docRef, defaultSettings);
      callback(defaultSettings);
    }
  });
}

/** Update a child's full data */
export async function updateChildData(childId: ChildId, data: Partial<ChildData>) {
  if (isDemo || !db) {
    const current = lsGet<ChildData>(`child_${childId}`, getDefaultChildData(childId));
    lsSet(`child_${childId}`, { ...current, ...data });
    return;
  }
  const docRef = doc(db, "children", childId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, data as any);
}

/** Mark a task as complete/incomplete */
export async function toggleTask(
  childId: ChildId,
  categoryId: string,
  taskId: string,
  completed: boolean,
  currentData: ChildData
) {
  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.id !== categoryId) return cat;
    return {
      ...cat,
      tasks: cat.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        };
      }),
    };
  });

  const totalStars = calculateStars(updatedCategories);
  const allWeeklyComplete = checkWeeklyComplete(updatedCategories);

  await updateChildData(childId, {
    categories: updatedCategories,
    totalStars,
    weekCompleted: allWeeklyComplete,
  });

  const allTasks = updatedCategories.flatMap((c) => c.tasks);
  const completedTasks = allTasks.filter((t) => t.completed).length;
  return { totalStars, allComplete: allWeeklyComplete, completedTasks, totalTasks: allTasks.length };
}

/** Add a new category */
export async function addCategory(
  childId: ChildId,
  category: Omit<ChoreCategory, "id">,
  currentData: ChildData
) {
  const id = `cat_${Date.now()}`;
  const newCategory: ChoreCategory = { ...category, id };
  await updateChildData(childId, {
    categories: [...currentData.categories, newCategory],
  });
  return newCategory;
}

/** Update a category */
export async function updateCategory(
  childId: ChildId,
  categoryId: string,
  updates: Partial<ChoreCategory>,
  currentData: ChildData
) {
  const updatedCategories = currentData.categories.map((cat) =>
    cat.id === categoryId ? { ...cat, ...updates } : cat
  );
  await updateChildData(childId, { categories: updatedCategories });
}

/** Delete a category */
export async function deleteCategory(
  childId: ChildId,
  categoryId: string,
  currentData: ChildData
) {
  const updatedCategories = currentData.categories.filter((cat) => cat.id !== categoryId);
  await updateChildData(childId, { categories: updatedCategories });
}

/** Add a task to a category */
export async function addTask(
  childId: ChildId,
  categoryId: string,
  taskTitle: string,
  frequency: TaskFrequency,
  recurring: boolean,
  currentData: ChildData
) {
  const cat = currentData.categories.find((c) => c.id === categoryId);
  const newTask: ChoreTask = {
    id: `task_${Date.now()}`,
    title: taskTitle,
    completed: false,
    completedAt: null,
    frequency: frequency || cat?.frequency || "daily",
    recurring,
  };
  const updatedCategories = currentData.categories.map((c) => {
    if (c.id !== categoryId) return c;
    return { ...c, tasks: [...c.tasks, newTask] };
  });
  await updateChildData(childId, { categories: updatedCategories });
}

/** Delete a task */
export async function deleteTask(
  childId: ChildId,
  categoryId: string,
  taskId: string,
  currentData: ChildData
) {
  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.id !== categoryId) return cat;
    return { ...cat, tasks: cat.tasks.filter((t) => t.id !== taskId) };
  });
  await updateChildData(childId, { categories: updatedCategories });
}

/** Bulk clear — reset ALL tasks to incomplete for a child */
export async function clearAllTasks(childId: ChildId, currentData: ChildData) {
  const clearedCategories = currentData.categories.map((cat) => ({
    ...cat,
    tasks: cat.tasks.map((task) => ({
      ...task,
      completed: false,
      completedAt: null,
    })),
  }));
  await updateChildData(childId, {
    categories: clearedCategories,
    totalStars: 0,
    weekCompleted: false,
  });
}

/** Clear only daily tasks */
export async function clearDailyTasks(childId: ChildId, currentData: ChildData) {
  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.frequency !== "daily") return cat;
    return {
      ...cat,
      tasks: cat.tasks.map((task) => ({ ...task, completed: false, completedAt: null })),
    };
  });
  const totalStars = calculateStars(updatedCategories);
  await updateChildData(childId, {
    categories: updatedCategories,
    totalStars,
    lastDailyResetDate: todayISO(),
  });
}

/** Submit an above & beyond entry (from child) */
export async function submitAboveBeyond(
  childId: ChildId,
  description: string,
  currentData: ChildData
) {
  const entry: AboveBeyondEntry = {
    id: `ab_${Date.now()}`,
    description,
    submittedBy: "child",
    approved: false,
    starsAwarded: 0,
    createdAt: new Date().toISOString(),
  };
  await updateChildData(childId, {
    aboveBeyond: [...currentData.aboveBeyond, entry],
  });
}

/** Award above & beyond (from parent) */
export async function awardAboveBeyond(
  childId: ChildId,
  entryId: string,
  stars: number,
  currentData: ChildData
) {
  const updatedAB = currentData.aboveBeyond.map((entry) => {
    if (entry.id !== entryId) return entry;
    return { ...entry, approved: true, starsAwarded: stars, approvedAt: new Date().toISOString() };
  });
  await updateChildData(childId, {
    aboveBeyond: updatedAB,
    totalStars: currentData.totalStars + stars,
  });
}

/** Add above & beyond entry from parent */
export async function addParentAboveBeyond(
  childId: ChildId,
  description: string,
  stars: number,
  currentData: ChildData
) {
  const entry: AboveBeyondEntry = {
    id: `ab_${Date.now()}`,
    description,
    submittedBy: "parent",
    approved: true,
    starsAwarded: stars,
    createdAt: new Date().toISOString(),
    approvedAt: new Date().toISOString(),
  };
  await updateChildData(childId, {
    aboveBeyond: [...currentData.aboveBeyond, entry],
    totalStars: currentData.totalStars + stars,
  });
}

/** Reject an above & beyond entry */
export async function rejectAboveBeyond(
  childId: ChildId,
  entryId: string,
  currentData: ChildData
) {
  const updatedAB = currentData.aboveBeyond.filter((e) => e.id !== entryId);
  await updateChildData(childId, { aboveBeyond: updatedAB });
}

/** Update weekly reward */
export async function updateWeeklyReward(
  childId: ChildId,
  reward: WeeklyReward,
  _currentData: ChildData
) {
  await updateChildData(childId, { weeklyReward: reward });
}

/** Reset week — archives current week to history, resets all tasks, updates streak */
export async function resetWeek(childId: ChildId, currentData: ChildData) {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];
  const todayStr = todayISO();

  // Reset all tasks (recurring ones reset, non-recurring stay)
  const resetCategories = currentData.categories.map((cat) => ({
    ...cat,
    tasks: cat.tasks.map((task) => {
      if (!task.recurring) return task;
      return { ...task, completed: false, completedAt: null };
    }),
  }));

  const historyEntry: WeekHistoryEntry = {
    weekStart: currentData.weekStartDate,
    stars: currentData.totalStars,
    completed: currentData.weekCompleted,
  };
  const existingHistory = currentData.starHistory || [];
  const newHistory = [historyEntry, ...existingHistory].slice(0, 8);

  const prevStreak = currentData.streak || 0;
  const newStreak = currentData.weekCompleted ? prevStreak + 1 : 0;

  await updateChildData(childId, {
    categories: resetCategories,
    totalStars: 0,
    weekStartDate: weekStart,
    lastDailyResetDate: todayStr,
    weekCompleted: false,
    aboveBeyond: [],
    weeklyReward: { ...currentData.weeklyReward, earned: false },
    streak: newStreak,
    starHistory: newHistory,
  });
}

/** Update app settings */
export async function updateSettings(settings: Partial<AppSettings>) {
  if (isDemo || !db) {
    const current = lsGet<AppSettings>("settings", defaultSettings);
    lsSet("settings", { ...current, ...settings });
    return;
  }
  const docRef = doc(db, "settings", "app");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(docRef, settings as any);
}

/** Initialise child data if not exists */
export async function ensureChildData(childId: ChildId) {
  if (isDemo || !db) {
    const existing = lsGet<ChildData | null>(`child_${childId}`, null);
    if (!existing) {
      lsSet(`child_${childId}`, getDefaultChildData(childId));
    }
    return;
  }
  const docRef = doc(db, "children", childId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, getDefaultChildData(childId));
  }
}

/** Initialise settings if not exists */
export async function ensureSettings() {
  if (isDemo || !db) {
    const existing = lsGet<AppSettings | null>("settings", null);
    if (!existing) {
      lsSet("settings", defaultSettings);
    }
    return;
  }
  const docRef = doc(db, "settings", "app");
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, defaultSettings);
  }
}
