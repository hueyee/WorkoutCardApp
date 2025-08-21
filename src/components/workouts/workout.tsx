import React from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { useWorkouts } from './WorkoutProvider';
import { useBaselines } from '../baselines/BaseLineProvider';
import { calculateWeight } from './WorkoutUtils';
import WorkoutBlock from './WorkoutBlock';
import { RootStackParamList } from '../../App';
import { RouteProp, useRoute } from '@react-navigation/native';

const Workout: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'Workout'>>();
  const { workoutId } = route.params;

  const { workouts, completeCurrentWorkout, failSet } = useWorkouts();
  console.log('Workouts:', workouts);
  const { baselines } = useBaselines();
  const currentWorkout = workouts.find(workout => workout.id === workoutId);

  if (!currentWorkout) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No workouts available.</Text>
      </View>
    );
  }

  return (
    <ScrollView
  style={styles.container}
  contentContainerStyle={styles.contentContainer}
>
  <Text style={styles.header}>{currentWorkout.name}</Text>
  {currentWorkout.blocks.map((block, index) => (
    <WorkoutBlock
      key={index}
      block={block}
      baselines={baselines}
      onFailSet={failSet}
    />
  ))}
  {!currentWorkout.completed && (
    <View style={{ marginBottom: 20 }}>
      <Button title="Mark as Completed" onPress={completeCurrentWorkout} />
    </View>
  )}
</ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  contentContainer: {
    paddingBottom: 40, 
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: 'black'
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    color: 'black'
  },
});

export default Workout;
