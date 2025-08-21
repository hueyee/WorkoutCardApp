import React from 'react';
import { BaselineProvider } from './baselines/BaseLineProvider';
import { WorkoutProvider } from './workouts/WorkoutProvider';
import { UserProvider } from './user/UserProvider';

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <UserProvider>
      <BaselineProvider>
        <WorkoutProvider>
          {children}
        </WorkoutProvider>
      </BaselineProvider>
    </UserProvider>
  );
};

export default Providers;
