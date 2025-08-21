import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workout } from '../../types';
import { loadFromStorage, saveToStorage } from '../../utils/storage';
import { updateAllBaselines, adjustSingleBaseline } from '../baselines/BaselineUtils';
import { useBaselines } from '../baselines/BaseLineProvider';
import { useUser } from '../user/UserProvider';
import { workouts as defaultWorkouts } from './workoutsData';
import { apiClient, NetworkError } from '../../services/apiClient';

const WORKOUT_STORAGE_KEY = 'workoutCompletion';

interface WorkoutContextType {
    workouts: Workout[];
    currentWorkoutIndex: number;
    isLoading: boolean;
    error: string | null;
    isOnline: boolean;
    setCurrentWorkoutIndex: (index: number) => void; 
    saveWorkouts: (updateWorksouts: Workout[]) => Promise<void>;
    completeCurrentWorkout: () => Promise<void>;
    failSet: (exerciseName: string) => Promise<void>;
    refreshWorkouts: () => Promise<void>;
    clearError: () => void;
  }
  

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const { baselines, setBaselines } = useBaselines();
  const { userConfig, hasValidUser } = useUser();


  // Configure API client when user config changes
  useEffect(() => {
    if (userConfig?.apiUrl) {
      apiClient.updateConfig({ baseUrl: userConfig.apiUrl });
    }
  }, [userConfig?.apiUrl]);

  // Load Workouts
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!hasValidUser || !userConfig?.username) {
        // If no valid user, load default workouts
        setWorkouts(defaultWorkouts);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch from API first
        const apiWorkouts = await apiClient.getWorkouts(userConfig.username);
        setWorkouts(apiWorkouts);
        setIsOnline(true);
        
        // Cache the API data locally
        await saveToStorage(WORKOUT_STORAGE_KEY, apiWorkouts);
      } catch (apiError) {
        console.warn('API fetch failed, falling back to local storage:', apiError);
        setIsOnline(false);
        
        try {
          // Fallback to local storage
          const storedWorkouts = await loadFromStorage<Workout[]>(WORKOUT_STORAGE_KEY);
          if (storedWorkouts && storedWorkouts.length > 0) {
            setWorkouts(storedWorkouts);
          } else {
            setWorkouts(defaultWorkouts);
          }
        } catch (storageError) {
          console.error('Local storage fallback failed:', storageError);
          setError('Failed to load workouts. Using default workouts.');
          setWorkouts(defaultWorkouts);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWorkouts();
  }, [hasValidUser, userConfig?.username]);

  

  const saveWorkouts = async (updatedWorkouts: Workout[]) => {
    setIsLoading(true);
    setError(null);

    try {
      // Always save to local storage first as immediate fallback
      await saveToStorage(WORKOUT_STORAGE_KEY, updatedWorkouts);
      setWorkouts(updatedWorkouts);

      // If we have a valid user, try to sync with API
      if (hasValidUser && userConfig?.username && isOnline) {
        try {
          await apiClient.updateAllWorkouts(userConfig.username, updatedWorkouts);
          setIsOnline(true);
        } catch (apiError) {
          console.warn('API sync failed:', apiError);
          setIsOnline(false);
          setError('Changes saved locally. Will sync when connection is restored.');
        }
      }
    } catch (error) {
      console.error('Failed to save workouts:', error);
      setError('Failed to save workouts. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeCurrentWorkout = async () => {
    const updatedWorkouts = workouts.map((workout, index) =>
      index === currentWorkoutIndex ? { ...workout, completed: true } : workout
    );

    await saveWorkouts(updatedWorkouts);

    if (currentWorkoutIndex < workouts.length - 1) {
      setCurrentWorkoutIndex(currentWorkoutIndex + 1);
    } else {
      const updatedBaselines = updateAllBaselines(baselines); 
      setBaselines(updatedBaselines);
      setCurrentWorkoutIndex(0);
    }
  };

  const failSet = async (exerciseName: string) => {
    const updatedBaselines = adjustSingleBaseline(baselines, exerciseName); 
    setBaselines(updatedBaselines);
    await completeCurrentWorkout();
  };

  const refreshWorkouts = async () => {
    if (!hasValidUser || !userConfig?.username) {
      setError('Please configure your username in settings');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const apiWorkouts = await apiClient.getWorkouts(userConfig.username);
      setWorkouts(apiWorkouts);
      setIsOnline(true);
      
      // Update local cache
      await saveToStorage(WORKOUT_STORAGE_KEY, apiWorkouts);
    } catch (error) {
      console.error('Failed to refresh workouts:', error);
      setIsOnline(false);
      setError('Failed to refresh workouts from server');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const updateWorkoutIndex = (index: number) => {
    setCurrentWorkoutIndex(index);
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        currentWorkoutIndex,
        isLoading,
        error,
        isOnline,
        setCurrentWorkoutIndex: updateWorkoutIndex,
        saveWorkouts,
        completeCurrentWorkout,
        failSet,
        refreshWorkouts,
        clearError,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkouts = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkouts must be used within a WorkoutProvider');
  }
  return context;
};
