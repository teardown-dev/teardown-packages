




### Install:

- NativeWind
  - https://www.nativewind.dev/quick-starts/react-native-cli
- React Native SVG 
  - https://www.npmjs.com/package/react-native-svg
- React Native Safe Area Context
  - https://www.npmjs.com/package/react-native-safe-area-context
- React Native Gesture Handler 
  - https://www.npmjs.com/package/react-native-gesture-handler

  
### 1. 
```bash
bun add nativewind@^4.0.1 react-native-reanimated tailwindcss
```
### 2.
```bash
bunx pod-install
```
### 3. Setup Tailwind
```bash
bunx tailwindcss init
```
Then add in the nativewind preset and your content paths to the tailwind.config.js file.

The example app uses the following tailwind.config.js file with source code located in the ./src folder.
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'], // <--- Add this line
  presets: [require('nativewind/preset')], // <--- Add this line
  theme: {
    extend: {},
  },
  plugins: [],
};
```
### 4. Update babel config
```javascript
module.exports = {
    presets: ['<existing presets>', 'nativewind/babel'], // <--- Add nativewind/babel to your presets
};
```
### 5. Update metro config
```javascript
const { withNativeWind } = require('nativewind/metro') // <--- Add this line

module.exports = withNativeWind(config, { input: './global.css' }) // <--- Replace with your global css file
```

### 6. Update index.js
```javascript
import './globals.css'; // <--- Import your global css file
```

### 7. Update App.tsx
```javascript
import { TeardownContainer } from '@teardown/react-native'; // <--- Add this line

// Wrap your app in the TeardownContainer
// This should be the first component in your app. 
export const App = () => {
  return (
    <TeardownContainer>
      {/* Your app code here */}
    </TeardownContainer>
  );
};
```

### 8. Add typescript support
Add this into a file called `nativewind-env.d.ts` in your project root.
```typescript
/// <reference types="nativewind/types" />
```
