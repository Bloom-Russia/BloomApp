import { RootStore } from '@stores';
import React, { createContext, ReactNode, useContext } from 'react';

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
