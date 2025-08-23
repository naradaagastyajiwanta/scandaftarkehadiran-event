// Haptic feedback utility functions
// Provides cross-browser haptic feedback using Vibration API

export interface HapticPattern {
  success: number | number[];
  error: number | number[];
  warning: number | number[];
  tap: number | number[];
  scan: number | number[];
}

// Predefined haptic patterns
export const HAPTIC_PATTERNS: HapticPattern = {
  // Success: Short-Long-Short pattern
  success: [50, 30, 100, 30, 50],
  
  // Error: Long buzz
  error: 400,
  
  // Warning: Two quick buzzes
  warning: [100, 50, 100],
  
  // Tap: Very short feedback
  tap: 25,
  
  // Scan: Quick double tap
  scan: [30, 50, 30]
};

/**
 * Check if haptic feedback is supported by the browser
 * @returns boolean indicating haptic support
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
}

/**
 * Trigger haptic feedback with given pattern
 * @param pattern - Vibration pattern (number or array of numbers)
 * @param fallback - Optional fallback function if haptic not supported
 */
export function triggerHaptic(
  pattern: number | number[], 
  fallback?: () => void
): void {
  if (isHapticSupported()) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      fallback?.();
    }
  } else {
    // Call fallback if provided (could be audio feedback, visual animation, etc.)
    fallback?.();
  }
}

/**
 * Predefined haptic feedback functions for common interactions
 */
export const haptic = {
  /**
   * Success haptic feedback - for successful operations
   */
  success: (fallback?: () => void) => {
    triggerHaptic(HAPTIC_PATTERNS.success, fallback);
  },

  /**
   * Error haptic feedback - for errors or failures
   */
  error: (fallback?: () => void) => {
    triggerHaptic(HAPTIC_PATTERNS.error, fallback);
  },

  /**
   * Warning haptic feedback - for warnings or alerts
   */
  warning: (fallback?: () => void) => {
    triggerHaptic(HAPTIC_PATTERNS.warning, fallback);
  },

  /**
   * Tap haptic feedback - for button presses and interactions
   */
  tap: (fallback?: () => void) => {
    triggerHaptic(HAPTIC_PATTERNS.tap, fallback);
  },

  /**
   * Scan haptic feedback - for QR code scanning
   */
  scan: (fallback?: () => void) => {
    triggerHaptic(HAPTIC_PATTERNS.scan, fallback);
  },

  /**
   * Custom haptic feedback with custom pattern
   */
  custom: (pattern: number | number[], fallback?: () => void) => {
    triggerHaptic(pattern, fallback);
  }
};

/**
 * Audio fallback functions for when haptic is not supported
 */
export const audioFallback = {
  /**
   * Play a success beep sound
   */
  success: () => {
    // Create audio context for beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio fallback failed:', error);
    }
  },

  /**
   * Play an error beep sound
   */
  error: () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Audio fallback failed:', error);
    }
  }
};

/**
 * Combine haptic with audio fallback for better cross-platform support
 */
export const feedback = {
  success: () => haptic.success(audioFallback.success),
  error: () => haptic.error(audioFallback.error),
  warning: () => haptic.warning(),
  tap: () => haptic.tap(),
  scan: () => haptic.scan()
};