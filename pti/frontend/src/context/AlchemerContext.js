import React, { createContext, useState, useContext } from 'react';

// Create the context
const AlchemerContext = createContext();

// Create a provider component
export const AlchemerProvider = ({ children }) => {
  const [projectId, setProjectId] = useState('');
  
  // You could add more related state or functions here
  
  const value = {
    projectId,
    setProjectId
  };
  
  return (
    <AlchemerContext.Provider value={value}>
      {children}
    </AlchemerContext.Provider>
  );
};

// Custom hook to use the Alchemer context
export const useAlchemer = () => {
  const context = useContext(AlchemerContext);
  if (context === undefined) {
    throw new Error('useAlchemer must be used within an AlchemerProvider');
  }
  return context;
};

export default AlchemerContext;