import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2'; // Import SweetAlert
import Layout from '../components/Layout';
import Header from '../components/Header';
import ViewChallengeModal from '../components/ViewChallengeModal';

const alarmSounds = [
  { id: 'beep', name: '🎵 Classic Beep', frequency: 800 },
  { id: 'bell', name: '🔔 Sweet Bell', frequency: 1000 },
  { id: 'chime', name: '🎐 Gentle Chime', frequency: 600 },
  { id: 'alarm', name: '🚨 Loud Alarm', frequency: 1200 },
  { id: 'tone', name: '📈 Rising Tone', frequency: 700 },
];

const Notifications = () => {
  const { user } = useAuth();
  
  // --- STATE MANAGEMENT ---
  const [habits, setHabits] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [challenges, setChallenges] = useState([]);
  
  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);

  // Reminder/Alarm Form States
  const [selectedHabit, setSelectedHabit] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [selectedAlarm, setSelectedAlarm] = useState('beep');
  const [isPrefilledChallenge, setIsPrefilledChallenge] = useState(false);
  const [prefilledHabitName, setPrefilledHabitName] = useState('');
  
  // Alarm Playing States
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmCountdown, setAlarmCountdown] = useState(0);
  const [currentAlarmReminder, setCurrentAlarmReminder] = useState(null);
  const [alarmIntervalId, setAlarmIntervalId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchChallenges();
      checkForPrefilled();
    }
    checkNotificationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- FETCH DATA FUNCTIONS ---
  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      setHabits(habitsData || []);

      const storedReminders = localStorage.getItem(`reminders_${user.id}`);
      if (storedReminders) {
        setReminders(JSON.parse(storedReminders));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          habit:habits (name),
          challenger:users!challenger_id (firstname, lastname, image),
          challengee:users!challenged_user_id (firstname, lastname, image)
        `)
        .or(`challenger_id.eq.${user.id},challenged_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    }
  };

  // --- REUSABLE FUNCTION: AWARD POINTS ---
  const awardPoints = async (amount = 10) => {
    if (!user) return;
    
    try {
      const { data: pointsRecords, error: fetchError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      if (pointsRecords && pointsRecords.length > 0) {
        for (const record of pointsRecords) {
          await supabase
            .from('user_points')
            .update({ 
              total_points: (record.total_points || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.id);
        }
      }

      const currentLocal = parseInt(localStorage.getItem(`user_points_${user.id}`) || '0');
      const newLocal = currentLocal + amount;
      localStorage.setItem(`user_points_${user.id}`, newLocal.toString());
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: `user_points_${user.id}`,
        newValue: newLocal.toString(),
      }));

    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  // --- HELPER FUNCTIONS ---
  const checkForPrefilled = () => {
    const prefilled = localStorage.getItem('prefillReminder');
    if (prefilled) {
      const data = JSON.parse(prefilled);
      setSelectedHabit(data.habitId?.toString() || '');
      setReminderTime(data.reminderTime || '09:00');
      setIsPrefilledChallenge(true);
      
      const habit = habits.find(h => h.id === data.habitId);
      setPrefilledHabitName(habit?.name || 'Unknown Habit');
      
      setShowAddModal(true);
      localStorage.removeItem('prefillReminder');
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const addReminder = () => {
    if (!selectedHabit || !reminderTime) return;

    const habit = habits.find(h => h.id === parseInt(selectedHabit));
    const newReminder = {
      id: Date.now() + Math.random(),
      habitId: parseInt(selectedHabit),
      habitName: habit?.name || 'Unknown',
      time: reminderTime,
      alarmSound: selectedAlarm,
      enabled: true,
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
    
    setShowAddModal(false);
    setSelectedHabit('');
    setReminderTime('09:00');
    setSelectedAlarm('beep');
    setIsPrefilledChallenge(false);
    setPrefilledHabitName('');

    scheduleNotification(newReminder);
  };

  useEffect(() => {
    if (reminders.length > 0) {
      reminders.forEach(reminder => {
        if (reminder.enabled) {
          scheduleNotification(reminder);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationPermission]);

  const toggleReminder = (reminderId) => {
    const updatedReminders = reminders.map(r => 
      r.id === reminderId ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
  };

  const deleteReminder = (reminderId) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    setReminders(updatedReminders);
    localStorage.setItem(`reminders_${user.id}`, JSON.stringify(updatedReminders));
  };

  // --- ALARM LOGIC ---
  const playAlarmSound = (alarmType = 'beep', duration = 0.5) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      const alarm = alarmSounds.find(a => a.id === alarmType) || alarmSounds[0];
      oscillator.frequency.value = alarm.frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio context error:', error);
    }
  };

  // --- UPDATED STOP ALARM FUNCTION ---
  const stopAlarm = async (isWin = true) => {
    // 1. Stop the Sound immediately
    setIsAlarmRinging(false);
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      setAlarmIntervalId(null);
    }
    setTimeout(() => setCurrentAlarmReminder(null), 100);

    if (user && currentAlarmReminder && isWin) {
      try {
        const today = new Date().toISOString().split('T')[0];

        // 2. Insert into habit_logs
        const { error: logError } = await supabase
          .from('habit_logs')
          .insert([
            {
              habit_id: currentAlarmReminder.habitId,
              log_date: today,
              status: 'done',
              notes: 'Completed via Alarm'
            }
          ]);

        if (logError) throw logError;

        // 3. Award Points
        await awardPoints(10);

        // 4. Check for Challenges
        try {
          const { data: challenges } = await supabase
            .from('challenges')
            .select('id')
            .eq('habit_id', currentAlarmReminder.habitId)
            .eq('status', 'completed')
            .is('winner_id', null)
            .maybeSingle();

          if (challenges) {
            await supabase
              .from('challenges')
              .update({ winner_id: user.id })
              .eq('id', challenges.id);
          }
        } catch (error) {
          console.error('Error checking for challenges:', error);
        }

        // 5. SUCCESS ALERT
        Swal.fire({
          title: 'Habit Completed!',
          text: `You marked "${currentAlarmReminder.habitName}" as done and earned 10 points!`,
          icon: 'success',
          confirmButtonColor: '#043915',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error processing alarm completion:', error);
        
        // 6. ERROR ALERT
        Swal.fire({
          title: 'Error Saving Progress',
          text: 'We could not save your habit log. Please check your internet connection.',
          icon: 'error',
          confirmButtonColor: '#d33',
        });
      }
    }
  };

  useEffect(() => {
    if (isAlarmRinging && alarmCountdown > 0) {
      const timer = setTimeout(() => setAlarmCountdown(alarmCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isAlarmRinging && alarmCountdown === 0) {
      stopAlarm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAlarmRinging, alarmCountdown]);

  const scheduleNotification = (reminder) => {
    if (!reminder.enabled) return;

    const [hours, minutes] = reminder.time.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      const alarmType = reminder.alarmSound || 'beep';
      setCurrentAlarmReminder(reminder);
      setIsAlarmRinging(true);
      setAlarmCountdown(60);
      
      const playAlarmContinuously = () => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => playAlarmSound(alarmType, 0.4), i * 500);
        }
      };
      
      playAlarmContinuously();
      const alarmInterval = setInterval(playAlarmContinuously, 1500);
      setAlarmIntervalId(alarmInterval);
      
      if (notificationPermission === 'granted' && 'Notification' in window) {
        new Notification('DailyRise Reminder ⏰', {
          body: `Time to complete: ${reminder.habitName}`,
          icon: '/logo192.png',
        });
      }
    }, delay);
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' };
      case 'accepted': return { color: 'bg-blue-100 text-blue-800', label: 'In Progress' };
      case 'completed': return { color: 'bg-green-100 text-green-800', label: 'Completed' };
      case 'declined': return { color: 'bg-red-100 text-red-800', label: 'Declined' };
      default: return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  return (
    <Layout>
      <Header title="Notifications" />
      
      <div className="px-4 py-4 pb-32">
        {/* Desktop Title */}
        <h1 className="hidden md:block text-[14px] font-medium font-[Poppins] text-dark mb-6">Alerts & Notifications</h1>

        {notificationPermission !== 'granted' && (
          <div className="card mb-4 bg-yellow-50 border border-yellow-200">
             <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-subheading text-yellow-800">Enable Notifications</h3>
                <button onClick={requestNotificationPermission} className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-[10px] font-medium font-[Roboto]">Enable</button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- SECTION 1: MY REMINDERS --- */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-medium font-[Poppins] text-dark">My Reminders</h2>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-[11px] font-[Roboto] text-primary hover:text-primary-dark transition-colors">
                <span className="text-lg">+</span> Add New
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-[11px] font-[Roboto] text-gray-400">No reminders set.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="card hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reminder.enabled ? 'bg-primary' : 'bg-gray-200'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[14px] font-medium font-[Poppins] text-dark">{reminder.habitName}</h3>
                        <p className="text-[11px] font-[Roboto] text-gray-500">{formatTime(reminder.time)}</p>
                      </div>
                      <button onClick={() => toggleReminder(reminder.id)} className={`w-10 h-5 rounded-full ${reminder.enabled ? 'bg-primary' : 'bg-gray-300'} relative transition-colors`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${reminder.enabled ? 'left-5' : 'left-0.5'}`}></div>
                      </button>
                      <button onClick={() => deleteReminder(reminder.id)} className="text-gray-400 hover:text-red-500 ml-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* --- SECTION 2: MY CHALLENGES --- */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-medium font-[Poppins] text-dark">My Challenges</h2>
              <button onClick={fetchChallenges} className="text-[10px] font-[Roboto] text-gray-500 hover:text-primary">Refresh</button>
            </div>

            {challenges.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                <p className="text-[11px] font-[Roboto] text-gray-400">No active challenges.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => {
                  const isChallenger = challenge.challenger_id === user.id;
                  const opponent = isChallenger ? challenge.challengee : challenge.challenger;
                  const statusInfo = getStatusDetails(challenge.status);
                  
                  return (
                    <div 
                      key={challenge.id} 
                      className="card cursor-pointer hover:shadow-md transition-all"
                      onClick={() => {
                        setSelectedChallengeId(challenge.id);
                        setShowViewChallengeModal(true);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100">
                          {opponent?.image ? (
                            <img src={opponent.image} alt="User" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                              {opponent?.firstname?.[0] || '?'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-medium font-[Poppins] text-dark truncate">
                            Vs. {opponent?.firstname}
                          </h3>
                          <p className="text-[10px] font-[Roboto] text-gray-500 truncate">
                            {challenge.habit?.name}
                          </p>
                        </div>
                        
                        <span className={`text-[10px] px-2 py-1 rounded-full font-medium font-[Roboto] ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- ADD REMINDER MODAL (Responsive) --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)}></div>

          <div className="bg-white w-full max-h-[85vh] md:max-w-sm rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col z-10 shadow-2xl animate-slide-up md:animate-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-[14px] font-medium font-[Poppins] text-dark">Add Reminder</h2>
                <p className="text-[10px] text-gray-500 font-[Roboto] mt-0.5">Set a daily alert for your habit</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-1.5 bg-white rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shadow-sm border border-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-2">Select Habit</label>
                  {isPrefilledChallenge ? (
                    <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-gray-700 font-medium flex items-center gap-2">
                       <span className="text-primary">🎯</span> {prefilledHabitName}
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        value={selectedHabit} 
                        onChange={(e) => setSelectedHabit(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-white"
                      >
                        <option value="">Choose a habit...</option>
                        {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                   <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-2">Reminder Time</label>
                   <div className="relative">
                      <input 
                        type="time" 
                        value={reminderTime} 
                        onChange={(e) => setReminderTime(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[14px] text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                      />
                   </div>
                </div>

                <div>
                   <label className="block text-[11px] font-medium font-[Roboto] text-gray-600 mb-2">Alarm Sound</label>
                   <div className="grid grid-cols-1 gap-2">
                      {alarmSounds.map((sound) => (
                        <div 
                          key={sound.id}
                          onClick={() => {
                            setSelectedAlarm(sound.id);
                            // Optional: Preview sound here if desired
                          }}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                            selectedAlarm === sound.id 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-[13px] font-[Roboto] text-dark">{sound.name}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAlarm === sound.id ? 'border-primary' : 'border-gray-300'}`}>
                             {selectedAlarm === sound.id && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-2 border-t border-gray-50 bg-white">
                <button 
                  onClick={addReminder} 
                  disabled={!selectedHabit} 
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-medium text-[11px] font-[Roboto] hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                >
                    Set Reminder
                </button>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-full mt-3 py-3 text-gray-500 text-[11px] font-medium font-[Roboto] hover:text-dark transition-colors"
                >
                  Cancel
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Alarm Modal */}
      {isAlarmRinging && currentAlarmReminder && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-auto text-center shadow-2xl animate-bounce-slight">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse ring-8 ring-red-50/50">
               <span className="text-4xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold font-[Poppins] text-dark mb-2">It's Time!</h2>
            <p className="text-[14px] font-[Roboto] text-gray-500 mb-8">
              Complete your habit: <br/>
              <span className="text-dark font-medium text-lg mt-1 block">{currentAlarmReminder.habitName}</span>
            </p>
            <button 
              onClick={() => stopAlarm(true)} 
              className="w-full py-4 bg-red-500 text-white rounded-xl font-bold text-[14px] font-[Poppins] hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-200"
            >
              STOP ALARM (+10 PTS)
            </button>
          </div>
        </div>
      )}

      <ViewChallengeModal 
        isOpen={showViewChallengeModal}
        challengeId={selectedChallengeId}
        onClose={() => setShowViewChallengeModal(false)}
      />
    </Layout>
  );
};

export default Notifications;