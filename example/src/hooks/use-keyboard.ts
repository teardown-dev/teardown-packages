import {Keyboard} from 'react-native';
import {useEffect, useState} from 'react';

export const useKeyboard = () => {
  const [isKeyboardShown, setIsKeyboardShown] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardShown(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardWillHide',
      e => {
        setIsKeyboardShown(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return [isKeyboardShown] as const;
};
