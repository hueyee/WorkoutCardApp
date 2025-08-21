import { Workout } from '../types';

// Configuration interface for API settings
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

// Default API configuration - this should be configurable
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://workoutcardapi.azurewebsites.net/api', // Update with actual Azure Functions URL
  timeout: 10000, // 10 seconds
};

// API response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Network error class
export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

// API Client class
export class WorkoutApiClient {
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update base URL configuration
  updateConfig(config: Partial<ApiConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new NetworkError(
          `API request failed: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timeout');
        }
        throw new NetworkError(`Network error: ${error.message}`);
      }
      
      throw new NetworkError('Unknown network error');
    }
  }

  // Get all workouts for a user
  async getWorkouts(username: string): Promise<Workout[]> {
    try {
      const response = await this.request<ApiResponse<Workout[]>>(
        `/workouts/${encodeURIComponent(username)}`
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new NetworkError(response.error || 'Failed to fetch workouts');
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
  }

  // Create a new workout for a user
  async createWorkout(username: string, workout: Omit<Workout, 'id'>): Promise<Workout> {
    try {
      const response = await this.request<ApiResponse<Workout>>(
        `/workouts/${encodeURIComponent(username)}`,
        {
          method: 'POST',
          body: JSON.stringify(workout),
        }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new NetworkError(response.error || 'Failed to create workout');
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  }

  // Update an existing workout
  async updateWorkout(username: string, workoutId: string, workout: Workout): Promise<Workout> {
    try {
      const response = await this.request<ApiResponse<Workout>>(
        `/workouts/${encodeURIComponent(username)}/${encodeURIComponent(workoutId)}`,
        {
          method: 'PUT',
          body: JSON.stringify(workout),
        }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new NetworkError(response.error || 'Failed to update workout');
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  }

  // Delete a workout
  async deleteWorkout(username: string, workoutId: string): Promise<void> {
    try {
      const response = await this.request<ApiResponse<void>>(
        `/workouts/${encodeURIComponent(username)}/${encodeURIComponent(workoutId)}`,
        {
          method: 'DELETE',
        }
      );
      
      if (!response.success) {
        throw new NetworkError(response.error || 'Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }

  // Bulk update workouts for a user
  async updateAllWorkouts(username: string, workouts: Workout[]): Promise<Workout[]> {
    try {
      const response = await this.request<ApiResponse<Workout[]>>(
        `/workouts/${encodeURIComponent(username)}/bulk`,
        {
          method: 'PUT',
          body: JSON.stringify(workouts),
        }
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      throw new NetworkError(response.error || 'Failed to update workouts');
    } catch (error) {
      console.error('Error updating workouts:', error);
      throw error;
    }
  }

  // Test API connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}

// Default API client instance
export const apiClient = new WorkoutApiClient();