import { useState, useEffect, useCallback } from 'react';

/**
 * useTimer - Custom hook for tracking elapsed time during search operations
 * Provides elapsed time, estimated remaining time, and segment timing
 */
export function useTimer(isActive, startTime, estimatedDuration = 40) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(estimatedDuration);
  
  useEffect(() => {
    let interval;
    
    if (isActive && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);
        
        // Dynamically extend estimated time if exceeded
        if (elapsed >= estimatedTime - 5) {
          setEstimatedTime(prev => prev + 15);
        }
      }, 1000);
    } else if (!isActive) {
      // Keep final elapsed time when stopped
    }
    
    return () => clearInterval(interval);
  }, [isActive, startTime, estimatedTime]);
  
  const reset = useCallback(() => {
    setElapsedTime(0);
    setEstimatedTime(estimatedDuration);
  }, [estimatedDuration]);
  
  const remainingTime = Math.max(0, estimatedTime - elapsedTime);
  
  return {
    elapsedTime,
    estimatedTime,
    remainingTime,
    reset,
    setEstimatedTime
  };
}

/**
 * useSegmentTimer - Track timing for individual segments/phases
 */
export function useSegmentTimer(initialSegments = ['pinterest', 'analysis', 'search']) {
  const [segmentTimes, setSegmentTimes] = useState(() => {
    const initial = {};
    initialSegments.forEach(seg => {
      initial[seg] = { startTime: null, endTime: null, elapsed: 0 };
    });
    return initial;
  });
  
  const startSegment = useCallback((segmentId) => {
    setSegmentTimes(prev => ({
      ...prev,
      [segmentId]: { ...prev[segmentId], startTime: Date.now(), elapsed: 0 }
    }));
  }, []);
  
  const endSegment = useCallback((segmentId) => {
    setSegmentTimes(prev => {
      const segment = prev[segmentId];
      if (!segment?.startTime) return prev;
      
      const elapsed = Math.floor((Date.now() - segment.startTime) / 1000);
      return {
        ...prev,
        [segmentId]: { ...segment, endTime: Date.now(), elapsed }
      };
    });
  }, []);
  
  const updateSegmentElapsed = useCallback((segmentId) => {
    setSegmentTimes(prev => {
      const segment = prev[segmentId];
      if (!segment?.startTime || segment.endTime) return prev;
      
      return {
        ...prev,
        [segmentId]: {
          ...segment,
          elapsed: Math.floor((Date.now() - segment.startTime) / 1000)
        }
      };
    });
  }, []);
  
  const reset = useCallback(() => {
    const initial = {};
    initialSegments.forEach(seg => {
      initial[seg] = { startTime: null, endTime: null, elapsed: 0 };
    });
    setSegmentTimes(initial);
  }, [initialSegments]);
  
  const getTotalElapsed = useCallback(() => {
    return Object.values(segmentTimes).reduce((sum, seg) => sum + (seg.elapsed || 0), 0);
  }, [segmentTimes]);
  
  return {
    segmentTimes,
    startSegment,
    endSegment,
    updateSegmentElapsed,
    reset,
    getTotalElapsed,
    setSegmentTimes
  };
}

export default useTimer;
