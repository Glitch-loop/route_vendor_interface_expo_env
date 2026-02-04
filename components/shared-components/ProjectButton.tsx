import React from 'react';
import { Pressable, Text, ViewStyle, StyleProp } from 'react-native';
import tw from 'twrnc';

type ButtonVariant = 'primary' | 'success' | 'warning' | 'indigo' | 'danger' | 'neutral';

interface ButtonProps {
  title: string;
  onPress: () => void;
  buttonVariant?: ButtonVariant;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: string;
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, { normal: string; pressed: string; text: string }> = {
  primary: { normal: 'bg-blue-400', pressed: 'bg-blue-500', text: 'text-black' },
  success: { normal: 'bg-green-500', pressed: 'bg-green-600', text: 'text-black' },
  warning: { normal: 'bg-orange-500', pressed: 'bg-orange-600', text: 'text-black' },
  indigo: { normal: 'bg-indigo-400', pressed: 'bg-indigo-500', text: 'text-black' },
  danger: { normal: 'bg-red-600', pressed: 'bg-red-700', text: 'text-black' },
  neutral: { normal: 'bg-gray-300', pressed: 'bg-gray-400', text: 'text-black' },
};

const ProjectButton: React.FC<ButtonProps> = (
    { 
        title, 
        onPress = () => {}, 
        buttonVariant = 'primary', 
        buttonStyle, 
        textStyle,
        disabled = false 
    }
    ) => {
  const classes = variantClasses[buttonVariant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyle,
        tw`${pressed ? classes.pressed : classes.normal}`,
        disabled ? tw`opacity-60` : null,
      ]}
      onPress={onPress}
    >
      <Text style={textStyle === undefined ? tw`text-sm text-center ${classes.text}` : tw`${textStyle} ${classes.text}`}>
        {title}
        </Text>
    </Pressable>
  );
};

export default ProjectButton;
