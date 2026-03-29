/**
 * AppContext — Global state for chore chart
 * Design: Adventure Quest — ADHD-friendly chore chart
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  subscribeToChild,
  subscribeToSettings,
  type ChildData,
  type AppSettings,
  type ChildId,
  defaultSettings,
  getDefaultChildData,
} from "@/lib/firebase";

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
      setDeanData(data);
      checkLoaded();
    });
    const unsubEmma = subscribeToChild("emma", (data) => {
      setEmmaData(data);
      checkLoaded();
    });
    const unsubSettings = subscribeToSettings((s) => {
      setSettings(s);
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
