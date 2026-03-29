/**
 * Firebase Configuration & Data Service
 * ======================================
 * Design: Adventure Quest — ADHD-friendly chore chart for Dean & Emma
 *
 * This file initialises Firebase and exports all data access functions.
 * The app uses Firestore for real-time sync between parent and child devices.
 *
 * MIGRATION NOTE (Heart Internet):
 * If you need to migrate to Heart Internet hosting, replace this file with
 * a PHP/MySQL REST API client. The function signatures remain the same —
 * only the implementation changes. See MIGRATION.md for full instructions.
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
// Replace these values with your own Firebase project config.
// See README.md for instructions on creating a free Firebase project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChildId = "dean" | "emma";

export interface ChoreTask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string | null;
}

export interface ChoreCategory {
  id: string;
  title: string;
  emoji: string;
  tasks: ChoreTask[];
  order: number;
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

export interface ChildData {
  id: ChildId;
  name: string;
  totalStars: number;
  weekStartDate: string; // ISO date string
  categories: ChoreCategory[];
  aboveBeyond: AboveBeyondEntry[];
  weeklyReward: WeeklyReward;
  weekCompleted: boolean;
}

export interface AppSettings {
  parentPin: string;
  weekStartDay: number; // 0 = Sunday, 1 = Monday
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

// ─── Default Data ─────────────────────────────────────────────────────────────

export function getDefaultChildData(childId: ChildId): ChildData {
  const name = childId === "dean" ? "Dean" : "Emma";
  const today = new Date();
  // Get Monday of current week
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];

  return {
    id: childId,
    name,
    totalStars: 0,
    weekStartDate: weekStart,
    categories: [
      {
        id: "morning",
        title: "Morning Routine",
        emoji: "🌅",
        order: 0,
        tasks: [
          { id: "m1", title: "Get dressed", completed: false, completedAt: null },
          { id: "m2", title: "Brush teeth", completed: false, completedAt: null },
          { id: "m3", title: "Eat breakfast", completed: false, completedAt: null },
          { id: "m4", title: "Wash face", completed: false, completedAt: null },
        ],
      },
      {
        id: "bedroom",
        title: "Tidy Bedroom",
        emoji: "🛏️",
        order: 1,
        tasks: [
          { id: "b1", title: "Make the bed", completed: false, completedAt: null },
          { id: "b2", title: "Put clothes away", completed: false, completedAt: null },
          { id: "b3", title: "Tidy toys off the floor", completed: false, completedAt: null },
          { id: "b4", title: "Put dirty clothes in the basket", completed: false, completedAt: null },
        ],
      },
      {
        id: "helping",
        title: "Helping Out",
        emoji: "🤝",
        order: 2,
        tasks: [
          { id: "h1", title: "Set the table for dinner", completed: false, completedAt: null },
          { id: "h2", title: "Help clear the table", completed: false, completedAt: null },
          { id: "h3", title: "Feed the pet (if applicable)", completed: false, completedAt: null },
        ],
      },
    ],
    aboveBeyond: [],
    weeklyReward: {
      title: "Weekly Reward",
      description: childId === "dean"
        ? "Extra tablet time on Friday + £1 pocket money"
        : "Extra tablet time on Friday + £1 pocket money",
      starsRequired: 20,
      earned: false,
    },
    weekCompleted: false,
  };
}

export const defaultSettings: AppSettings = {
  parentPin: "130615",
  weekStartDay: 1,
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

// ─── Data Access Functions ────────────────────────────────────────────────────

/** Subscribe to a child's data in real-time */
export function subscribeToChild(
  childId: ChildId,
  callback: (data: ChildData) => void
): () => void {
  if (isDemo || !db) {
    // Use localStorage in demo mode
    const data = lsGet<ChildData>(`child_${childId}`, getDefaultChildData(childId));
    callback(data);
    // Poll localStorage for changes (for demo multi-tab support)
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

  // Calculate new star total
  const totalTasks = updatedCategories.flatMap((c) => c.tasks).length;
  const completedTasks = updatedCategories.flatMap((c) => c.tasks).filter((t) => t.completed).length;
  const starsPerTask = 1;
  const totalStars = completedTasks * starsPerTask;

  const allComplete = completedTasks === totalTasks;

  await updateChildData(childId, {
    categories: updatedCategories,
    totalStars,
    weekCompleted: allComplete,
  });

  return { totalStars, allComplete, completedTasks, totalTasks };
}

/** Add a new category */
export async function addCategory(childId: ChildId, category: Omit<ChoreCategory, "id">, currentData: ChildData) {
  const id = `cat_${Date.now()}`;
  const newCategory: ChoreCategory = { ...category, id };
  await updateChildData(childId, {
    categories: [...currentData.categories, newCategory],
  });
  return newCategory;
}

/** Update a category */
export async function updateCategory(childId: ChildId, categoryId: string, updates: Partial<ChoreCategory>, currentData: ChildData) {
  const updatedCategories = currentData.categories.map((cat) =>
    cat.id === categoryId ? { ...cat, ...updates } : cat
  );
  await updateChildData(childId, { categories: updatedCategories });
}

/** Delete a category */
export async function deleteCategory(childId: ChildId, categoryId: string, currentData: ChildData) {
  const updatedCategories = currentData.categories.filter((cat) => cat.id !== categoryId);
  await updateChildData(childId, { categories: updatedCategories });
}

/** Add a task to a category */
export async function addTask(childId: ChildId, categoryId: string, taskTitle: string, currentData: ChildData) {
  const newTask: ChoreTask = {
    id: `task_${Date.now()}`,
    title: taskTitle,
    completed: false,
    completedAt: null,
  };
  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.id !== categoryId) return cat;
    return { ...cat, tasks: [...cat.tasks, newTask] };
  });
  await updateChildData(childId, { categories: updatedCategories });
}

/** Delete a task */
export async function deleteTask(childId: ChildId, categoryId: string, taskId: string, currentData: ChildData) {
  const updatedCategories = currentData.categories.map((cat) => {
    if (cat.id !== categoryId) return cat;
    return { ...cat, tasks: cat.tasks.filter((t) => t.id !== taskId) };
  });
  await updateChildData(childId, { categories: updatedCategories });
}

/** Submit an above & beyond entry (from child) */
export async function submitAboveBeyond(childId: ChildId, description: string, currentData: ChildData) {
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
    return {
      ...entry,
      approved: true,
      starsAwarded: stars,
      approvedAt: new Date().toISOString(),
    };
  });
  const bonusStars = stars;
  await updateChildData(childId, {
    aboveBeyond: updatedAB,
    totalStars: currentData.totalStars + bonusStars,
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
export async function rejectAboveBeyond(childId: ChildId, entryId: string, currentData: ChildData) {
  const updatedAB = currentData.aboveBeyond.filter((e) => e.id !== entryId);
  await updateChildData(childId, { aboveBeyond: updatedAB });
}

/** Update weekly reward */
export async function updateWeeklyReward(childId: ChildId, reward: WeeklyReward, currentData: ChildData) {
  await updateChildData(childId, { weeklyReward: reward });
}

/** Reset week (parent action) */
export async function resetWeek(childId: ChildId, currentData: ChildData) {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const weekStart = monday.toISOString().split("T")[0];

  const resetCategories = currentData.categories.map((cat) => ({
    ...cat,
    tasks: cat.tasks.map((task) => ({
      ...task,
      completed: false,
      completedAt: null,
    })),
  }));

  await updateChildData(childId, {
    categories: resetCategories,
    totalStars: 0,
    weekStartDate: weekStart,
    weekCompleted: false,
    aboveBeyond: [],
    weeklyReward: { ...currentData.weeklyReward, earned: false },
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
