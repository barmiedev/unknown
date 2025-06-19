import React, { useEffect, useMemo, useRef } from 'react';
import { View, Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_RINGS = 7;
const POINTS_PER_RING = 60;

interface RippleProps {
  bpm?: number;
  style?: ViewStyle;
}

// Utility functions
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function randomSeed(): number {
  return Math.random() * 1000;
}

function hslToRgb(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// Generate ring path
function generateRingPath(
  centerX: number,
  centerY: number,
  radius: number,
  wobbleStrength: number,
  seed: number,
  morphSeed: number,
  t: number
): string {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < POINTS_PER_RING; i++) {
    const angle = (i / POINTS_PER_RING) * Math.PI * 2;
    const phaseA = seed * 1.7;
    const phaseB = morphSeed * 1.7;
    const freqA = 2 + (Math.floor(seed) % 3);
    const freqB = 2 + (Math.floor(morphSeed) % 3);
    const wobbleA = Math.sin(angle * freqA + phaseA) * wobbleStrength;
    const wobbleB = Math.sin(angle * freqB + phaseB) * wobbleStrength;
    const wobble = lerp(wobbleA, wobbleB, t);
    const r = radius + wobble;

    points.push({
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    });
  }

  // Create smooth path using quadratic curves
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const controlX = (current.x + next.x) / 2;
    const controlY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${controlX} ${controlY}`;
  }
  
  path += ' Z';
  return path;
}

export default function Ripple({ bpm = 120, style }: RippleProps) {
  const animationDuration = (60 / bpm) * 3 * 1000; // Convert to milliseconds
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT / 2;

  // Animation progress
  const progress = useSharedValue(0);
  const scaleProgress = useSharedValue(0);

  // Ring data: [currentSeed, nextSeed, morphProgress] - use refs to avoid state issues
  const ringDataRef = useRef(
    Array.from({ length: NUM_RINGS }, () => [
      randomSeed(),
      randomSeed(),
      0,
    ])
  );

  useEffect(() => {
    // Main morphing animation
    progress.value = withRepeat(
      withTiming(1, { 
        duration: animationDuration,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      }),
      -1,
      false
    );

    // Scale animation
    scaleProgress.value = withRepeat(
      withTiming(1, { 
        duration: animationDuration,
        easing: Easing.bezier(0.4, 0, 0.2, 1)
      }),
      -1,
      false
    );
  }, [animationDuration]);

  // Generate paths for all rings
  const animatedPaths = useDerivedValue(() => {
    const paths: string[] = [];
    
    for (let ringIndex = 0; ringIndex < NUM_RINGS; ringIndex++) {
      const baseRadius = 120 + (ringIndex * 80);
      const wobbleStrength = 24 + (ringIndex * 2);
      const delay = (ringIndex / NUM_RINGS) * 0.3;
      const ringProgress = Math.max(0, Math.min(1, progress.value - delay));
      
      // Get current ring data
      const ringData = ringDataRef.current[ringIndex];
      const [currentSeed, nextSeed] = ringData;
      
      // Generate new seeds when cycle completes (simplified)
      let morphProgress = ringProgress;
      if (ringProgress >= 0.95 && progress.value < 0.1) {
        // Update seeds for next cycle
        ringDataRef.current[ringIndex][0] = ringDataRef.current[ringIndex][1];
        ringDataRef.current[ringIndex][1] = randomSeed();
      }

      const path = generateRingPath(
        centerX,
        centerY,
        baseRadius,
        wobbleStrength,
        currentSeed,
        nextSeed,
        morphProgress
      );
      
      paths.push(path);
    }
    
    return paths;
  }, [progress]);

  // Scale animation style
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scaleProgress.value,
      [0, 0.5, 1],
      [1.0, 1.4, 1.0]
    );
    
    return {
      transform: [{ scale }],
    };
  });

  // Generate colors for rings
  const ringColors = useMemo(() => {
    return Array.from({ length: NUM_RINGS }, (_, i) => {
      const hue = interpolate(i, [0, NUM_RINGS - 1], [210, 270]);
      const lightness = interpolate(i, [0, NUM_RINGS - 1], [60, 20]);
      return hslToRgb(hue, 80, lightness);
    });
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.svgContainer, animatedStyle]}>
        <Svg
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          style={styles.svg}
        >
          {Array.from({ length: NUM_RINGS }, (_, index) => {
            const pathData = animatedPaths.value[index];
            if (!pathData) return null;
            
            return (
              <Path
                key={index}
                d={pathData}
                fill={ringColors[index]}
                fillOpacity={0.12}
                stroke="none"
              />
            );
          })}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    opacity: 0.7,
  },
  svg: {
    position: 'absolute',
  },
});