import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './components/home/Home';
import Workout from './components/workouts/workout';
import Providers from './components/Providers';

export type RootStackParamList = {
  Home: undefined;
  Workout: { workoutId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Workout" component={Workout} />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  );
};

export default App;
