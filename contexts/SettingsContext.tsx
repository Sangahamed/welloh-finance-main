import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type LineType = 'monotone' | 'linear' | 'step';

export interface ChartSettings {
  revenueColor: string;
  profitColor: string;
  lineType: LineType;
  showGrid: boolean;
}

interface SettingsContextType {
  settings: ChartSettings;
  updateSettings: (newSettings: Partial<ChartSettings>) => void;
}

const defaultSettings: ChartSettings = {
    revenueColor: '#4f46e5',
    profitColor: '#10b981',
    lineType: 'monotone',
    showGrid: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to get settings from localStorage
const getInitialSettings = (): ChartSettings => {
    try {
        const item = window.localStorage.getItem('chartSettings');
        return item ? { ...defaultSettings, ...JSON.parse(item) } : defaultSettings;
    } catch (error) {
        console.error("Could not parse settings from localStorage", error);
        return defaultSettings;
    }
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ChartSettings>(getInitialSettings);

  useEffect(() => {
    try {
        window.localStorage.setItem('chartSettings', JSON.stringify(settings));
    } catch (error) {
        console.error("Could not save settings to localStorage", error);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<ChartSettings>) => {
    setSettings(prevSettings => ({ ...prevSettings, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};