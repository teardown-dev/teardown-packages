#include <jni.h>
#include "teardown-react-native.h"

extern "C"
JNIEXPORT jdouble JNICALL
Java_com_teardown_reactnative_ReactNativeModule_nativeMultiply(JNIEnv *env, jclass type, jdouble a, jdouble b) {
    return teardown_reactnative::multiply(a, b);
}
