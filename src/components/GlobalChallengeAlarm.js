import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const GlobalChallengeAlarm = () => {
  const { user } = useAuth();
  
  const [challenges, setChallenges] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [countdown, setCountdown] = useState(60);
  
  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);
  const processedAlarmsRef = useRef(new Set());

  useEffect(() => {
    // Initialize Audio Context on first click
    const enableAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener('click', enableAudio);
    return () => document.removeEventListener('click', enableAudio);
  }, []);

  // Poll for Active Challenges
  useEffect(() => {
    if (!user) return;

    const fetchScheduledChallenges = async () => {
      try {
        const { data } = await supabase
          .from('challenges')
          .select(`*, habit:habits (name)`)
          .or(`challenger_id.eq.${user.id},challenged_user_id.eq.${user.id}`)
          .eq('status', 'accepted')       // LOGIC FIX: Only ring if Accepted
          .not('completed_at', 'is', null);

        setChallenges(data || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
      }
    };

    fetchScheduledChallenges();
    const pollTimer = setInterval(fetchScheduledChallenges, 3000);
    return () => clearInterval(pollTimer);
  }, [user]);

  const playAlarmSound = useCallback(() => {
    if (!audioCtxRef.current) return;
    const playBeep = () => {
      try {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        osc.frequency.value = 800; 
        osc.type = 'square';
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.5);
      } catch (e) { console.error(e); }
    };
    playBeep();
    intervalRef.current = setInterval(playBeep, 1000);
  }, []);

  const triggerAlarm = useCallback((challenge) => {
    console.log("⏰ ALARM MATCHED:", challenge.habit?.name);
    processedAlarmsRef.current.add(challenge.id);
    setActiveAlarm(challenge);
    setCountdown(60);
    playAlarmSound();
  }, [playAlarmSound]);

  const awardPoints = useCallback(async (amount, communityId) => {
    if (!user) return;
    try {
      const { data: existingRecord } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .eq('community_id', communityId)
        .maybeSingle();

      if (existingRecord) {
        await supabase.from('user_points').update({ 
            total_points: parseInt(existingRecord.total_points || 0) + amount,
            updated_at: new Date().toISOString()
          }).eq('id', existingRecord.id);
      } else {
        await supabase.from('user_points').insert({
            user_id: user.id, community_id: communityId, total_points: amount
          });
      }
    } catch (error) { console.error(error); }
  }, [user]);

  const stopAlarm = useCallback(async (isSuccess) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const finishedChallenge = activeAlarm;
    setActiveAlarm(null);
    
    if (isSuccess && finishedChallenge) {
      try {
        await awardPoints(10, finishedChallenge.community_id);
        // Mark as completed so it doesn't fetch again
        await supabase.from('challenges').update({ 
            status: 'completed',
            winner_id: user.id 
          }).eq('id', finishedChallenge.id);
          
        alert(`🎉 Challenge "${finishedChallenge.habit?.name}" Completed! +10 Points!`);
      } catch (err) { console.error(err); }
    }
  }, [activeAlarm, user, awardPoints]);

  // Check Time Match
  useEffect(() => {
    if (activeAlarm) return;

    const checkTime = () => {
      const now = new Date();
      
      challenges.forEach(challenge => {
        if (processedAlarmsRef.current.has(challenge.id)) return;

        const targetTime = new Date(challenge.completed_at);
        const timeDiff = targetTime.getTime() - now.getTime(); 

        // LOGIC FIX: Check if time has just passed (0 to 15 seconds ago)
        // This ensures it pops exactly when time matches
        if (timeDiff <= 0 && timeDiff > -15000) { 
           triggerAlarm(challenge);
        }
      });
    };

    const timer = setInterval(checkTime, 1000);
    return () => clearInterval(timer);
  }, [challenges, activeAlarm, triggerAlarm]);

  if (!activeAlarm) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-red-600/90 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
        <div className="text-6xl mb-4 animate-pulse">🚨</div>
        <h2 className="text-3xl font-black text-red-600 mb-2">CHALLENGE TIME!</h2>
        <p className="text-gray-600 text-lg mb-6">
          <span className="font-bold text-black text-xl block mt-2">
            {activeAlarm.habit?.name}
          </span>
        </p>
        <div className="text-5xl font-mono font-bold text-dark mb-8 border-2 border-gray-100 rounded-lg py-2">
          00:{String(countdown).padStart(2, '0')}
        </div>
        <button 
          onClick={() => stopAlarm(true)}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-xl shadow-lg active:scale-95 transition-all"
        >
          ✅ I DID IT!
        </button>
        <button 
          onClick={() => stopAlarm(false)}
          className="mt-4 text-gray-400 text-sm underline hover:text-gray-600"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default GlobalChallengeAlarm;