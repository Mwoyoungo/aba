"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CometChatSettings } from '@/lib/cometchatSettings';

export interface CometChatSettingsInterface {
  chatFeatures: typeof CometChatSettings.chatFeatures;
  callFeatures: typeof CometChatSettings.callFeatures;
  style: typeof CometChatSettings.style;
  layout: typeof CometChatSettings.layout;
}

interface CometChatContextInterface {
  chatFeatures: typeof CometChatSettings.chatFeatures;
  callFeatures: typeof CometChatSettings.callFeatures;
  styleFeatures: typeof CometChatSettings.style;
  layoutFeatures: typeof CometChatSettings.layout;
  setChatFeatures: React.Dispatch<React.SetStateAction<typeof CometChatSettings.chatFeatures>>;
  setCallFeatures: React.Dispatch<React.SetStateAction<typeof CometChatSettings.callFeatures>>;
  setStyleFeatures: React.Dispatch<React.SetStateAction<typeof CometChatSettings.style>>;
  setLayoutFeatures: React.Dispatch<React.SetStateAction<typeof CometChatSettings.layout>>;
}

const CometChatContext = createContext<CometChatContextInterface | undefined>(undefined);

export const CometChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatFeatures, setChatFeatures] = useState(CometChatSettings.chatFeatures);
  const [callFeatures, setCallFeatures] = useState(CometChatSettings.callFeatures);
  const [styleFeatures, setStyleFeatures] = useState(CometChatSettings.style);
  const [layoutFeatures, setLayoutFeatures] = useState(CometChatSettings.layout);

  return (
    <CometChatContext.Provider value={{
      chatFeatures, callFeatures, styleFeatures, layoutFeatures,
      setChatFeatures, setCallFeatures, setStyleFeatures, setLayoutFeatures,
    }}>
      {children}
    </CometChatContext.Provider>
  );
};

export const useCometChatContext = () => {
  const context = useContext(CometChatContext);
  if (!context) throw new Error('useCometChatContext must be used within a CometChatProvider');
  return context;
};
