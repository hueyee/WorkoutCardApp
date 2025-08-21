# WorkoutCardApp API Integration

This document describes the changes made to integrate the React Native mobile app with the WorkoutCardWebApp backend API.

## Overview

The app has been updated to connect with Azure Functions endpoints for workout data management while maintaining local storage as a fallback mechanism.

## Key Changes Made

### 1. API Client (`src/services/apiClient.ts`)
- Created a comprehensive API client to handle HTTP requests to Azure Functions endpoints
- Supports GET/POST/PUT/DELETE operations for workouts by username
- Includes error handling, timeout management, and network error classification
- Configurable base URL and timeout settings

### 2. User Management (`src/components/user/UserProvider.tsx`)
- New UserProvider component to manage username and API configuration
- Persists user settings to local storage
- Provides context for username validation and API URL configuration

### 3. Updated WorkoutProvider (`src/components/workouts/WorkoutProvider.tsx`)
- Modified to use API client for all CRUD operations
- Maintains local storage as fallback when API is unavailable
- Added loading states, error handling, and offline mode support
- Synchronizes data between API and local cache

### 4. Enhanced Settings (`src/components/settings/SettingsModal.tsx`)
- Added username and API URL configuration fields
- Form validation and save functionality
- Improved UI with scrollable content and better input styling

### 5. Improved Home Screen (`src/components/home/Home.tsx`)
- Added connection status indicators (online/offline)
- User configuration warnings and prompts
- Loading states and error handling
- Pull-to-refresh functionality
- Enhanced visual feedback for workout completion status

### 6. Provider Integration (`src/components/Providers.tsx`)
- Updated to include UserProvider in the component hierarchy
- Proper nesting order: UserProvider → BaselineProvider → WorkoutProvider

## API Endpoints Expected

The app expects the following REST API endpoints:

```
GET    /api/workouts/{username}           - Get all workouts for user
POST   /api/workouts/{username}           - Create new workout for user
PUT    /api/workouts/{username}/{id}      - Update specific workout
DELETE /api/workouts/{username}/{id}      - Delete specific workout
PUT    /api/workouts/{username}/bulk      - Bulk update all workouts
GET    /api/health                        - Health check endpoint
```

## Data Model Compatibility

The app uses the existing `Workout` interface defined in `src/types.tsx`:

```typescript
interface Workout {
  id: string;
  name: string;
  completed: boolean;
  blocks: Block[];
}
```

This ensures compatibility with the existing data structure and the web app.

## Configuration

### Default Settings
- **Default API URL**: `https://workoutcardapi.azurewebsites.net/api`
- **Request Timeout**: 10 seconds
- **Fallback Mode**: Local storage when API unavailable

### User Configuration
Users can configure:
1. **Username**: Required for API authentication and data scoping
2. **API URL**: Custom backend endpoint (optional)

## Error Handling

### Network Errors
- Connection timeouts
- API server errors
- Network unavailability

### Fallback Strategy
1. Try API request first
2. On failure, fall back to local storage
3. Cache successful API responses locally
4. Sync local changes when connection restored

### User Feedback
- Loading indicators during API requests
- Connection status display (online/offline)
- Error alerts with retry options
- Configuration warnings for missing username

## Usage Flow

1. **First Launch**: User prompted to configure username in settings
2. **Normal Operation**: App loads workouts from API, caches locally
3. **Offline Mode**: App uses cached data, queues changes for later sync
4. **Sync**: When connection restored, local changes sync to server

## Benefits

- **Seamless Experience**: Automatic fallback ensures app always works
- **Real-time Sync**: Multiple devices can share workout progress
- **Offline Support**: App remains functional without internet
- **Data Persistence**: Local cache prevents data loss
- **User Control**: Configurable API endpoints for different environments

## Future Enhancements

1. **Conflict Resolution**: Handle data conflicts during sync
2. **Real-time Updates**: WebSocket support for live updates
3. **Authentication**: Add user authentication beyond username
4. **Batch Sync**: Optimize sync process for multiple changes
5. **Cache Management**: Intelligent cache cleanup and storage limits