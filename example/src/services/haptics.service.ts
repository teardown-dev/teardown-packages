import * as Haptics from 'expo-haptics';
import {Platform} from 'react-native';

export const HapticsService = {
  triggerImpact(style: 'light' | 'medium' | 'heavy') {
    if (Platform.OS === 'web') {
      return;
    }

    const impactStyle = this.getImpactStyle(style);

    void Haptics.impactAsync(impactStyle);
  },

  triggerSelection() {
    if (Platform.OS === 'web') {
      return;
    }
    void Haptics.selectionAsync();
  },

  triggerNotification(type: 'success' | 'warning' | 'error') {
    if (Platform.OS === 'web') {
      return;
    }
    const notificationType = this.getNotificationType(type);

    void Haptics.notificationAsync(notificationType);
  },

  getImpactStyle(style: 'light' | 'medium' | 'heavy') {
    switch (style) {
      case 'light':
        return Haptics.ImpactFeedbackStyle.Light;
      case 'medium':
        return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy':
        return Haptics.ImpactFeedbackStyle.Heavy;
    }
  },

  getNotificationType(type: 'success' | 'warning' | 'error') {
    switch (type) {
      case 'success':
        return Haptics.NotificationFeedbackType.Success;
      case 'warning':
        return Haptics.NotificationFeedbackType.Warning;
      case 'error':
        return Haptics.NotificationFeedbackType.Error;
    }
  },
};
