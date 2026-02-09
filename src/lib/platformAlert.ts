
import { Alert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

const alert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) => {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    
    // If no buttons or just one button, treat as simple alert
    if (!buttons || buttons.length === 0 || buttons.length === 1) {
      window.alert(text);
      // Execute the single button callback if it exists
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // If multiple buttons, try to map to confirm (OK/Cancel)
    // We assume the last button is "OK" or positive, and others are cancel/negative
    // This is a simplification, but fits `window.confirm`.
    
    const result = window.confirm(text);
    
    if (result) {
      // User clicked OK
      // Find the "positive" button - usually the last one or one without style='cancel'
      const positiveButton = buttons.find(b => b.style !== 'cancel');
      if (positiveButton?.onPress) {
        positiveButton.onPress();
      }
    } else {
      // User clicked Cancel
      const cancelButton = buttons.find(b => b.style === 'cancel');
      if (cancelButton?.onPress) {
        cancelButton.onPress();
      } else if (options?.onDismiss) {
        options.onDismiss();
      }
    }
  } else {
    Alert.alert(title, message, buttons, options);
  }
};

export const PlatformAlert = {
  alert,
};
