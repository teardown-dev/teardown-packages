import {FlattenedTokens} from './types';

export const flattenTokens = <T extends {[key: string]: any}>(
  tokenGroups: T,
  prefix = '',
): FlattenedTokens => {
  // Flattens the token groups into a single object
  return Object.entries(tokenGroups).reduce(
    (result, [groupKey, groupValue]) => {
      if ('light' in groupValue) {
        const newKey = [prefix, groupKey].filter(Boolean).join('-');

        // Merge the combined tokens with the accumulated result
        return {
          ...result,
          [newKey]: groupValue,
        };
      }

      const newPrefix = [prefix, groupKey].filter(Boolean).join('-');
      // Recursively flatten the nested token group
      return {
        ...result,
        ...flattenTokens(groupValue, newPrefix),
      };
    },
    {},
  );
};

export const generateTailwindTokensForReactNative = (
  flattenedTokens: FlattenedTokens,
  theme: 'light' | 'dark',
) => {
  const tokens: Record<string, Record<string, string>> = {
    backgroundColor: {},
    textColor: {},
    borderColor: {},
    outlineColor: {},
  };

  Object.keys(flattenedTokens).forEach(key => {
    const value = flattenedTokens[key][theme];

    if (key.includes('surface')) {
      tokens.backgroundColor[key.replace(/-default/g, '')] = value;
    } else if (key.includes('foreground')) {
      tokens.textColor[key.replace(/-default/g, '')] = value;
    } else if (key.includes('border')) {
      tokens.borderColor[key.replace(/border-|-border/g, '')] = value;
      tokens.outlineColor[key.replace(/border-|-border/g, '')] = value;
    }
  });

  return tokens;
};
