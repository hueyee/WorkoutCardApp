import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useWorkouts } from '../workouts/WorkoutProvider';
import { useUser } from '../user/UserProvider';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import SettingsModal from '../settings/SettingsModal';
import { useBaselines } from '../baselines/BaseLineProvider';

const Home: React.FC = () => {
  const { workouts, saveWorkouts, isLoading, error, isOnline, refreshWorkouts, clearError } = useWorkouts();
  const { userConfig, hasValidUser } = useUser();
  const { baselines, setBaselines } = useBaselines();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();

  const [isModalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          {/* Connection Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#ff6b6b' }]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          
          {/* Settings Button */}
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.settingsButton}>
            <Icon name="menu-outline" size={30} color="black" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, isOnline]);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error',
        error,
        [
          { text: 'Dismiss', onPress: clearError },
          { text: 'Retry', onPress: refreshWorkouts },
        ]
      );
    }
  }, [error]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWorkouts();
    setRefreshing(false);
  };

  const resetWorkouts = async () => {
    Alert.alert(
      'Reset Workouts',
      'Are you sure you want to reset all workouts to incomplete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const resetWorkouts = workouts.map((workout) => ({ ...workout, completed: false }));
              await saveWorkouts(resetWorkouts);
              Alert.alert('Success', 'Workouts have been reset to incomplete.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset workouts. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openWorkout = (workoutId: string) => {
    console.log('Navigating to workout:', workoutId); 
    navigation.navigate('Workout', { workoutId }); 
  };


  return (
    <View style={styles.container}>
      {/* User Configuration Warning */}
      {!hasValidUser && (
        <View style={styles.warningContainer}>
          <Icon name="warning-outline" size={24} color="#ff6b6b" />
          <Text style={styles.warningText}>
            Please configure your username in settings to sync workouts with the server.
          </Text>
          <TouchableOpacity style={styles.configureButton} onPress={() => setModalVisible(true)}>
            <Text style={styles.configureButtonText}>Configure</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* User Info */}
      {hasValidUser && (
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>User: {userConfig?.username}</Text>
          <Text style={styles.connectionStatus}>
            Status: {isOnline ? 'Connected' : 'Offline Mode'}
          </Text>
        </View>
      )}

      <Text style={styles.subheader}>Workouts</Text>
      
      {/* Loading Indicator */}
      {isLoading && !refreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6b6bff" />
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      )}

      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#6b6bff']}
            tintColor="#6b6bff"
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="fitness-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No workouts available.</Text>
            {hasValidUser && (
              <TouchableOpacity style={styles.refreshButton} onPress={refreshWorkouts}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.workout}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>
                {item.name}
              </Text>
              {item.completed && (
                <Icon name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
            <Button title="View Workout" onPress={() => openWorkout(item.id)} />
          </View>
        )}
      />

      <SettingsModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        resetWorkouts={resetWorkouts}
        setWorkouts={saveWorkouts}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'black',
  },
  settingsButton: {
    padding: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    color: '#856404',
    fontSize: 14,
  },
  configureButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  configureButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  userInfoContainer: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userInfoText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  connectionStatus: {
    color: '#2e7d32',
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: '#6b6bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  subheader: {
    fontSize: 20,
    marginVertical: 10,
    color: 'black',
    fontWeight: '600',
  },
  workout: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6b6bff',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutName: {
    fontSize: 16,
    color: 'black',
    fontWeight: '500',
    flex: 1,
  },
});

export default Home;
