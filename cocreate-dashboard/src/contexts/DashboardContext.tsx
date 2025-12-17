import { createContext, useContext, ReactNode } from 'react';
import { Selection } from '../types/global';
import { useDashboard } from '../hooks/useDashboard';

interface DashboardContextType {
  annotations: ReturnType<typeof useDashboard>['annotations'];
  executiveSummary: ReturnType<typeof useDashboard>['executiveSummary'];
  demographics: ReturnType<typeof useDashboard>['demographics'];
  feedbackFilters: ReturnType<typeof useDashboard>['feedbackFilters'];
  csvImport: ReturnType<typeof useDashboard>['csvImport'];
  search: ReturnType<typeof useDashboard>['search'];
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
  activeSelection: Selection | null;
}

export const DashboardProvider = ({ children, activeSelection }: DashboardProviderProps) => {
  const dashboard = useDashboard(activeSelection);

  return (
    <DashboardContext.Provider value={dashboard}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
};
