import React, { createContext, useContext, ReactNode } from 'react';
import { RootStore } from '@stores/RootStore';

const StoreContext = createContext<RootStore | null>(null);

export const useStores = (): RootStore => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStores must be used within StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
  store: RootStore;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children, store }) => {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};
