import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/storage';

const USERNAME_STORAGE_KEY = 'userConfiguration';

// User configuration interface
export interface UserConfig {
  username: string;
  apiUrl?: string;
}

// User context interface
interface UserContextType {
  userConfig: UserConfig | null;
  isLoading: boolean;
  setUsername: (username: string) => Promise<void>;
  setApiUrl: (apiUrl: string) => Promise<void>;
  clearUserConfig: () => Promise<void>;
  hasValidUser: boolean;
}

// Default user configuration
const defaultUserConfig: UserConfig = {
  username: '',
  apiUrl: 'https://workoutcardapi.azurewebsites.net/api',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user configuration on mount
  useEffect(() => {
    const loadUserConfig = async () => {
      try {
        setIsLoading(true);
        const storedConfig = await loadFromStorage<UserConfig>(USERNAME_STORAGE_KEY);
        
        if (storedConfig && storedConfig.username) {
          setUserConfig(storedConfig);
        } else {
          // Set default config if none exists
          setUserConfig({ ...defaultUserConfig });
        }
      } catch (error) {
        console.error('Error loading user configuration:', error);
        setUserConfig({ ...defaultUserConfig });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserConfig();
  }, []);

  // Save user configuration to storage
  const saveUserConfig = async (config: UserConfig) => {
    try {
      await saveToStorage(USERNAME_STORAGE_KEY, config);
      setUserConfig(config);
    } catch (error) {
      console.error('Error saving user configuration:', error);
      throw new Error('Failed to save user configuration');
    }
  };

  // Set username
  const setUsername = async (username: string) => {
    if (!userConfig) return;
    
    const updatedConfig = {
      ...userConfig,
      username: username.trim(),
    };
    
    await saveUserConfig(updatedConfig);
  };

  // Set API URL
  const setApiUrl = async (apiUrl: string) => {
    if (!userConfig) return;
    
    const updatedConfig = {
      ...userConfig,
      apiUrl: apiUrl.trim(),
    };
    
    await saveUserConfig(updatedConfig);
  };

  // Clear user configuration
  const clearUserConfig = async () => {
    try {
      const clearedConfig = { ...defaultUserConfig };
      await saveUserConfig(clearedConfig);
    } catch (error) {
      console.error('Error clearing user configuration:', error);
      throw new Error('Failed to clear user configuration');
    }
  };

  // Check if user has valid configuration
  const hasValidUser = Boolean(userConfig?.username && userConfig.username.trim().length > 0);

  const contextValue: UserContextType = {
    userConfig,
    isLoading,
    setUsername,
    setApiUrl,
    clearUserConfig,
    hasValidUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use user context
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};