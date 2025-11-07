const ReactNative = require('./NativeReactNative').default;

export function multiply(a: number, b: number): number {
  return ReactNative.multiply(a, b);
}
