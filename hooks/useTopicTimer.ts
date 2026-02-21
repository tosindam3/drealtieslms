import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../lib/apiClient';

interface TopicTimeTrackingResponse {
    success: boolean;
    time_spent_seconds: number;
    is_eligible_for_completion: boolean;
    time_remaining_seconds: number;
    min_time_required_seconds: number;
    is_completed: boolean;
}

interface UseTopicTimerReturn {
    timeSpent: number;
    isEligible: boolean;
    timeRemaining: number;
    isCompleted: boolean;
    minTimeRequired: number;
}

/**
 * Hook to track time spent on a topic and determine completion eligibility
 * Sends heartbeat to backend every 30 seconds
 * Updates local eligibility check every second for immediate feedback
 */
export const useTopicTimer = (topicId: string | null): UseTopicTimerReturn => {
    const [timeSpent, setTimeSpent] = useState(0);
    const [isEligible, setIsEligible] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [minTimeRequired, setMinTimeRequired] = useState(120);

    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const accumulatedTimeRef = useRef<number>(0); // Track accumulated time from server

    useEffect(() => {
        if (!topicId) {
            // Reset when no topic selected
            setTimeSpent(0);
            setIsEligible(false);
            setTimeRemaining(0);
            setIsCompleted(false);
            accumulatedTimeRef.current = 0;
            return;
        }

        // Start timer
        startTimeRef.current = Date.now();

        // Update local timer every second
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const totalTime = accumulatedTimeRef.current + elapsed;
                setTimeSpent(totalTime);
                
                // Update eligibility locally for immediate feedback
                const remaining = Math.max(0, minTimeRequired - totalTime);
                setTimeRemaining(remaining);
                setIsEligible(totalTime >= minTimeRequired && !isCompleted);
            }
        }, 1000);

        // Send heartbeat to backend every 30 seconds
        heartbeatIntervalRef.current = setInterval(async () => {
            if (startTimeRef.current) {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const totalTime = accumulatedTimeRef.current + elapsed;
                try {
                    const response: TopicTimeTrackingResponse = await apiClient.post(
                        `/api/topics/${topicId}/track-time`,
                        { time_spent: totalTime }
                    );

                    // Update from server response
                    accumulatedTimeRef.current = response.time_spent_seconds;
                    setIsEligible(response.is_eligible_for_completion);
                    setTimeRemaining(response.time_remaining_seconds);
                    setIsCompleted(response.is_completed);
                    setMinTimeRequired(response.min_time_required_seconds);
                    
                    // Reset start time for next interval
                    startTimeRef.current = Date.now();
                } catch (error) {
                    console.error('Failed to track topic time:', error);
                }
            }
        }, 30000); // 30 seconds

        // Initial heartbeat
        (async () => {
            try {
                const response: TopicTimeTrackingResponse = await apiClient.post(
                    `/api/topics/${topicId}/track-time`,
                    { time_spent: 0 }
                );

                accumulatedTimeRef.current = response.time_spent_seconds;
                setIsEligible(response.is_eligible_for_completion);
                setTimeRemaining(response.time_remaining_seconds);
                setIsCompleted(response.is_completed);
                setMinTimeRequired(response.min_time_required_seconds);
                setTimeSpent(response.time_spent_seconds);
            } catch (error) {
                console.error('Failed to initialize topic timer:', error);
            }
        })();

        // Cleanup
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            startTimeRef.current = null;
        };
    }, [topicId, minTimeRequired, isCompleted]);

    return {
        timeSpent,
        isEligible,
        timeRemaining,
        isCompleted,
        minTimeRequired
    };
};
