import React, { createContext, useContext, useState } from 'react';

type Module = 'CORE:COMMAND' | 'PlantTalk' | 'AirTrace' | 'SoilSense' | 'RiverPulse' | 'EcoTwin' | 'FireWhisper' | 'PolliNet' | 'GreenKarma' | 'NestGuard' | 'WildPath' | 'WetlandWatch' | 'CarbonMirror';

interface ModuleContextType {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  aggregateData: any;
  setAggregateData: (d: any) => void;
  location: { latitude: number; longitude: number } | null;
  setLocation: (l: { latitude: number; longitude: number } | null) => void;
}

const ModuleContext = createContext<ModuleContextType>({
  activeModule: 'CORE:COMMAND',
  setActiveModule: () => {},
  aggregateData: null,
  setAggregateData: () => {},
  location: null,
  setLocation: () => {},
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<Module>('CORE:COMMAND');
  const [aggregateData, setAggregateData] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule, aggregateData, setAggregateData, location, setLocation }}>
      {children}
    </ModuleContext.Provider>
  );
}

export const useModule = () => useContext(ModuleContext);
