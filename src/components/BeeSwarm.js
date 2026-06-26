import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const BEE_COUNT = 18;
const BEE_SIZE = 32;

export default function BeeSwarm({ origin, onDone }) {
  const bees = useRef(
    Array.from({ length: BEE_COUNT }, () => ({
      x: new Animated.Value(origin.x),
      y: new Animated.Value(origin.y),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      endX: Math.random() * (width - 60) + 30,
      endY: Math.random() * (height - 60) + 30,
      duration: 1200 + Math.random() * 1800,
      delay: Math.random() * 400,
    })),
  ).current;

  useEffect(() => {
    const anims = bees.map((b) =>
      Animated.parallel([
        Animated.timing(b.x, { toValue: b.endX, duration: b.duration, delay: b.delay, useNativeDriver: true }),
        Animated.timing(b.y, { toValue: b.endY, duration: b.duration, delay: b.delay, useNativeDriver: true }),
        Animated.timing(b.rotate, { toValue: 360, duration: b.duration, delay: b.delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(b.delay + b.duration * 0.6),
          Animated.timing(b.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),
    );

    Animated.parallel(anims).start(() => onDone?.());
  }, []);

  return (
    <View style={styles.overlay} pointerEvents="none">
      {bees.map((b, i) => (
        <Animated.Image
          key={i}
          source={require('../../assets/bee.png')}
          style={[
            styles.bee,
            {
              transform: [
                { translateX: b.x },
                { translateY: b.y },
                {
                  rotate: b.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: b.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  bee: {
    position: 'absolute',
    width: BEE_SIZE,
    height: BEE_SIZE,
    resizeMode: 'contain',
  },
});
