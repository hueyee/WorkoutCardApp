import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import BaselineList from '../baselines/BaselineList';
import Icon from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { useBaselines } from '../baselines/BaseLineProvider';
import { useUser } from '../user/UserProvider';
import { Workout } from '../../types';
import RNBlobUtil from 'react-native-blob-util';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  resetWorkouts: () => void;
  setWorkouts: (workouts: Workout[]) => void;
}

const screenWidth = Dimensions.get('window').width;

const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  resetWorkouts,
  setWorkouts,
}) => {
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const { baselines, setBaselines } = useBaselines();
  const { userConfig, setUsername, setApiUrl } = useUser();
  
  // Local state for form inputs
  const [tempUsername, setTempUsername] = useState('');
  const [tempApiUrl, setTempApiUrl] = useState('');

  // Initialize form with current user config
  useEffect(() => {
    if (userConfig) {
      setTempUsername(userConfig.username || '');
      setTempApiUrl(userConfig.apiUrl || '');
    }
  }, [userConfig, visible]);


  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0, // Slide into the screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth, // Slide out of the screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (event, gestureState) => {
      if (gestureState.dx > 0) {
        slideAnim.setValue(gestureState.dx);
      }
    },
    onPanResponderRelease: (event, gestureState) => {
      if (gestureState.dx > screenWidth / 3) {
        Animated.timing(slideAnim, {
          toValue: screenWidth, // Close modal
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          onClose(); // Notify parent to close modal
        });
      } else {
        Animated.timing(slideAnim, {
          toValue: 0, // Reset position
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!visible) return null;

  // Save user configuration
  const handleSaveUserConfig = async () => {
    try {
      if (tempUsername.trim()) {
        await setUsername(tempUsername.trim());
      }
      if (tempApiUrl.trim()) {
        await setApiUrl(tempApiUrl.trim());
      }
      Alert.alert('Success', 'User configuration saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save user configuration. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.json],
        allowMultiSelection: true,
      });
  
      //console.log('Selected files:', results);
  
      const allWorkouts = [];
  
      for (const result of results) {
        try {
          //console.log('Reading file:', result.uri);
          const fileContent = await RNFS.readFile(result.uri, 'utf8');
          //console.log('Raw file content:', fileContent);
  
          const parsedData = JSON.parse(fileContent);
          if (Array.isArray(parsedData)) {
            // If the file contains an array of workouts, add them all
            allWorkouts.push(...parsedData);
          } else if (typeof parsedData === 'object' && parsedData !== null) {
            // If the file contains a single workout, add it
            allWorkouts.push(parsedData);
          } else {
            throw new Error('Invalid file format: Expected an array or an object');
          }
        } catch (error) {
          console.error(`Error processing file ${result.name}:`, (error as Error).message);
          Alert.alert(
            'Error',
            `Failed to process file "${result.name}". Please ensure it contains valid JSON.`
          );
        }
      }
  
      if (allWorkouts.length > 0) {
        setWorkouts(allWorkouts);
        Alert.alert('Success', `Imported ${allWorkouts.length} workouts successfully!`);
      } else {
        Alert.alert('No Workouts', 'No valid workouts were imported.');
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User canceled the picker');
      } else {
        console.error('Error importing workouts:', error);
        Alert.alert('Error', 'Failed to import workouts. Please try again.');
      }
    }
  };
  
  
    

  return (
    <Modal
      visible={visible}
      animationType="none" // Custom animation; no default animation
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateX: slideAnim }] }]}
          {...panResponder.panHandlers}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPressOut={() => {
              onClose();
            }}
          >
            <Icon name="close" size={30} color="black" />
          </TouchableOpacity>

          <Text style={styles.modalHeader}>Settings</Text>
          
          {/* User Configuration Section */}
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.subheader}>User Configuration</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username:</Text>
              <TextInput
                style={styles.textInput}
                value={tempUsername}
                onChangeText={setTempUsername}
                placeholder="Enter your username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>API URL:</Text>
              <TextInput
                style={styles.textInput}
                value={tempApiUrl}
                onChangeText={setTempApiUrl}
                placeholder="Enter API URL"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPressOut={handleSaveUserConfig}>
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>

            <Text style={styles.subheader}>Baselines</Text>
            <BaselineList
              baselines={baselines}
              onUpdateBaseline={(key: string, value: number) => {
                const updatedBaselines = { ...baselines, [key]: value };
                setBaselines(updatedBaselines);
              }}
            />

            {/* Import Workouts Button */}
            <TouchableOpacity style={styles.modalButton} onPressOut={handleImport}>
              <Text style={styles.modalButtonText}>Import Workouts</Text>
            </TouchableOpacity>

            {/* Reset Workouts Button */}
            <TouchableOpacity style={styles.resetButton} onPressOut={resetWorkouts}>
              <Text style={styles.resetButtonText}>Reset Workouts</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dim background
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '80%', // Adjust modal width as needed
    backgroundColor: 'white',
    padding: 20,
    justifyContent: 'flex-start', // Changed to flex-start to accommodate scroll
  },
  scrollContent: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1, // Ensure it stays on top
  },
  modalHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40, // Add top margin to account for close button
    textAlign: 'center',
    color: 'black'
  },
  subheader: {
    fontSize: 20,
    marginVertical: 10,
    color: 'black'
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: 'black',
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'black',
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#6b6bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#ff6b6b', // Red background for reset
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'stretch', // Make it span the width
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SettingsModal;
