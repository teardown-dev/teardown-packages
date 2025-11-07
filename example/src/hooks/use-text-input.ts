import {useRef, useState} from 'react';

type UseTextInputOptions = {
  initialValue?: string;
  onChange?: (text: string) => void;
};

export const useTextInput = (options: UseTextInputOptions = {}) => {
  const {initialValue = '', onChange} = options;

  const [text, setText] = useState(initialValue);

  const onChangeText = (text: string) => {
    onChange?.(text);
    setText(text);
  };

  return [text, onChangeText] as const;
};
