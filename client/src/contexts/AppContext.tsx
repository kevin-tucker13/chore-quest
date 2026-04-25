/**
 * AppContext — Global state for chore chart
 * Design: Adventure Quest — ADHD-friendly chore chart
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  subscribeToChild,
  subscribeToSettings,
  applyDailyResetIfNeeded,
  updateChildData,
  type ChildData,
  type AppSettings,
  type ChildId,
  defaultSettings,
  getDefaultChildData,
} from "@/lib/firebase";
import { syncFamilyCodeFromSettings } from "@/components/FamilyGate";

interface AppContextType {
  deanData: ChildData;
  emmaData: ChildData;
  settings: AppSettings;
  isLoading: boolean;
  isParentAuthenticated: boolean;
  authenticateParent: (pin: string) => boolean;
  logoutParent: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [deanData, setDeanData] = useState<ChildData>(getDefaultChildData("dean"));
  const [emmaData, setEmmaData] = useState<ChildData>(getDefaultChildData("emma"));
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isParentAuthenticated, setIsParentAuthenticated] = useState(false);

  useEffect(() => {
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 3) setIsLoading(false);
    };

    const unsubDean = subscribeToChild("dean", (data) => {
      // Apply daily reset if a new day has started since last reset
      const resetData = applyDailyResetIfNeeded(data);
      if (resetData) {
        // Save the reset back to Firebase/localStorage, then use reset data
        updateChildData("dean", resetData);
        setDeanData(resetData);
      } else {
        setDeanData(data);
      }
      checkLoaded();
    });
    const unsubEmma = subscribeToChild("emma", (data) => {
      const resetData = applyDailyResetIfNeeded(data);
      if (resetData) {
        updateChildData("emma", resetData);
        setEmmaData(resetData);
      } else {
        setEmmaData(data);
      }
      checkLoaded();
    });
    const unsubSettings = subscribeToSettings((s) => {
      setSettings(s);
      // Sync the family access code from Firebase to localStorage on this device
      syncFamilyCodeFromSettings(s.familyCode);
      checkLoaded();
    });

    return () => {
      unsubDean();
      unsubEmma();
      unsubSettings();
    };
  }, []);

  const authenticateParent = useCallback(
    (pin: string): boolean => {
      if (pin === settings.parentPin) {
        setIsParentAuthenticated(true);
        return true;
      }
      return false;
    },
    [settings.parentPin]
  );

  const logoutParent = useCallback(() => {
    setIsParentAuthenticated(false);
  }, []);

  return (
    <AppContext.Provider
      value={{
        deanData,
        emmaData,
        settings,
        isLoading,
        isParentAuthenticated,
        authenticateParent,
        logoutParent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
