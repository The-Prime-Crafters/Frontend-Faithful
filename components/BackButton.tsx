import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const WHITE = '#FFFFFF';

interface BackButtonProps {
  onPress?: () => void;
  style?: any;
  iconColor?: string;
  iconSize?: number;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  style, 
  iconColor = WHITE, 
  iconSize = 24 
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.backButton, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <AntDesign 
          name="arrowleft" 
          size={iconSize} 
          color={iconColor} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default BackButton;
