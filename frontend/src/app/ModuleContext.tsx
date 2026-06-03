import React, { createContext, useContext, useState } from 'react';

type Module = 'CORE:COMMAND' | 'PlantTalk' | 'AirTrace' | 'SoilSense' | 'RiverPulse' | 'EcoTwin' | 'FireWhisper' | 'PolliNet' | 'GreenKarma' | 'NestGuard' | 'WildPath' | 'WetlandWatch' | 'CarbonMirror';

interface ModuleContextType {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  aggregateData: any;
  setAggregateData: (d: any) => void;
  location: { latitude: number; longitude: number } | null;
  setLocation: (l: { latitude: number; longitude: number } | null) => void;
  imageUri: string | null;
  setImageUri: (u: string | null) => void;
  analysisResult: any;
  setAnalysisResult: (r: any) => void;
  soilPh: string;
  setSoilPh: (v: string) => void;
  soilMoisture: string;
  setSoilMoisture: (v: string) => void;
  soilResult: any;
  setSoilResult: (r: any) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  insights: Insight[];
  setInsights: (i: Insight[]) => void;
}

export interface Insight {
  id: string;
  level: 'critical' | 'warning' | 'info';
  module: string;
  title: string;
  message: string;
}

const ModuleContext = createContext<ModuleContextType>({} as ModuleContextType);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<Module>('CORE:COMMAND');
  const [aggregateData, setAggregateData] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [soilPh, setSoilPh] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [soilResult, setSoilResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  return (
    <ModuleContext.Provider value={{
      activeModule, setActiveModule,
      aggregateData, setAggregateData,
      location, setLocation,
      imageUri, setImageUri,
      analysisResult, setAnalysisResult,
      soilPh, setSoilPh,
      soilMoisture, setSoilMoisture,
      soilResult, setSoilResult,
      isLoading, setIsLoading,
      insights, setInsights,
    }}>
      {children}
    </ModuleContext.Provider>
  );
}

export const useModule = () => useContext(ModuleContext);
