import {useState} from 'react';

export type UseFocusOptions = {
    onFocus?: () => void;
    onBlur?: () => void;
};

export const useFocus = (options: UseFocusOptions = {}) => {

  const [isFocused, setIsFocused] = useState(false);

  const onFocus = () => {
    setIsFocused(true);
    options.onFocus?.();
  }
  const onBlur = () => {
    setIsFocused(false);
    options.onBlur?.();
  }

  return [isFocused, {onFocus, onBlur}] as const;
};
