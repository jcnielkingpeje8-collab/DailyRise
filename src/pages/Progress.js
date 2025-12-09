import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

// Helper to parse YYYY-MM-DD from DB into a local Date object
const parseLocalLogDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
  }
  const parts = dateStr.split('-');
  if (parts.length < 3) return new Date();
  
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
};

// Helper to format a Date object into YYYY-MM-DD string for DB querying
const formatDateForDB = (date) => {
  // Create a new date to avoid mutating the original
  const d = new Date(date);
  // Adjust for timezone offset to ensure we get the correct local date part
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const Progress = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  
  const [weeklyStats, setWeeklyStats] = useState({ completed: 0, missed: 0, total: 0 });
  const [dailyStats, setDailyStats] = useState({ completed: 0, missed: 0, total: 0 });

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentMonth]);

  useEffect(() => {
    if (habits.length > 0) {
      calculateStats(logs, habits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, habits, selectedDay, currentMonth]);

  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      setHabits(habitsData || []);

      if (habitsData && habitsData.length > 0) {
        // Calculate start and end of month
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

        // Fetch logs using the FIXED date formatter
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*')
          .in('habit_id', habitsData.map(h => h.id))
          .gte('log_date', formatDateForDB(startOfMonth))
          .lte('log_date', formatDateForDB(endOfMonth));

        setLogs(logsData || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getSelectedDate = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDay);
  };

  const calculateStats = (logsData, habitsData) => {
    const anchorDate = getSelectedDate();
    const anchorDateStr = formatDateForDB(anchorDate); // Use string comparison for accuracy

    // --- DAILY STATS ---
    const dayLogs = logsData.filter(log => {
        // Compare string parts directly to avoid timezone confusion
        return log.log_date === anchorDateStr;
    });
    
    const dailyCompleted = dayLogs.filter(l => l.status === 'done').length;
    const dailyMissed = dayLogs.filter(l => l.status === 'missed').length;
    const dailyTotal = habitsData.length;
    
    setDailyStats({ completed: dailyCompleted, missed: dailyMissed, total: dailyTotal });

    // --- WEEKLY STATS ---
    const startOfWeek = new Date(anchorDate);
    startOfWeek.setDate(anchorDate.getDate() - anchorDate.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);
    
    const weekLogs = logsData.filter(log => {
      const logDate = parseLocalLogDate(log.log_date);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    const weeklyCompleted = weekLogs.filter(l => l.status === 'done').length;
    const weeklyMissed = weekLogs.filter(l => l.status === 'missed').length;
    const weeklyTotal = habitsData.length * 7; 

    setWeeklyStats({ completed: weeklyCompleted, missed: weeklyMissed, total: weeklyTotal });
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= days; i++) {
      daysArray.push(i);
    }
    return daysArray;
  };

  const getLogForDay = (day) => {
    if (!day) return null;
    
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateForDB(dateToCheck);
    
    if (selectedHabit) {
      return logs.find(l => l.habit_id === selectedHabit && l.log_date === dateStr);
    }
    
    const dayLogs = logs.filter(l => l.log_date === dateStr);
    const done = dayLogs.filter(l => l.status === 'done').length;
    const missed = dayLogs.filter(l => l.status === 'missed').length;
    
    if (done > missed) return { status: 'done' };
    if (missed > done) return { status: 'missed' };
    if (dayLogs.length > 0) return { status: 'partial' };
    return null;
  };

  const getDayStatusColor = (log) => {
    if (!log) return 'bg-gray-100';
    switch (log.status) {
      case 'done': return 'bg-primary text-white';
      case 'missed': return 'bg-red-400 text-white';
      case 'partial': return 'bg-yellow-400 text-white';
      default: return 'bg-gray-100';
    }
  };

  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
    setCurrentMonth(newMonth);
    // Adjust selected day if new month has fewer days
    const daysInNewMonth = new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0).getDate();
    if (selectedDay > daysInNewMonth) {
      setSelectedDay(daysInNewMonth);
    }
  };

  const calculateStreak = () => {
    // Basic streak calculation
    const anchorDate = getSelectedDate();
    let streak = 0;
    let currentDate = new Date(anchorDate);

    // Loop backwards up to 365 days
    for(let i=0; i<365; i++) {
        const dateStr = formatDateForDB(currentDate);
        const dayLogs = logs.filter(l => l.log_date === dateStr && l.status === 'done');
        
        if (dayLogs.length === 0) break; 
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }
    return streak;
  };

  const weeklySuccessRate = weeklyStats.total > 0 
    ? Math.round((weeklyStats.completed / weeklyStats.total) * 100) 
    : 0;

  const selectedDayLogs = useMemo(() => {
    const targetDateStr = formatDateForDB(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDay));
    return logs.filter(log => log.log_date === targetDateStr);
  }, [logs, currentMonth, selectedDay]);

  const formattedSelectedDate = getSelectedDate().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Layout>
      <Header title="Progress" />
      
      <div className="px-4 py-4 pb-24">
        {/* Desktop Header */}
        <div className="hidden md:block mb-6">
          <h1 className="text-[14px] font-medium font-[Poppins] text-dark">Analytics & Progress</h1>
          <p className="text-[11px] font-[Roboto] text-gray-500">Track your consistency over time</p>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card text-center py-4 bg-white shadow-sm border border-gray-100">
            <p className="text-[18px] text-primary font-medium font-[Poppins]">{calculateStreak()}</p>
            <p className="text-[10px] text-gray-500 font-[Roboto]">Day Streak</p>
          </div>
          <div className="card text-center py-4 bg-white shadow-sm border border-gray-100">
            <p className="text-[18px] text-primary font-medium font-[Poppins]">{weeklySuccessRate}%</p>
            <p className="text-[10px] text-gray-500 font-[Roboto]">Weekly Rate</p>
          </div>
          <div className="card text-center py-4 bg-white shadow-sm border border-gray-100">
            <p className="text-[18px] text-primary font-medium font-[Poppins]">{dailyStats.completed}/{dailyStats.total}</p>
            <p className="text-[10px] text-gray-500 font-[Roboto]">Done Today</p>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
                <div className="card mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-[14px] font-medium font-[Poppins]">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
                    <button onClick={() => changeMonth(1)} className="p-2 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>

                  <div className="mb-4 overflow-x-auto hide-scrollbar">
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedHabit(null)} className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${!selectedHabit ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>All Habits</button>
                      {habits.map((habit) => (
                        <button key={habit.id} onClick={() => setSelectedHabit(habit.id)} className={`px-3 py-1.5 rounded-full text-[10px] whitespace-nowrap transition-all ${selectedHabit === habit.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>{habit.name}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (<div key={i} className="text-[10px] text-gray-400 py-1 font-[Roboto]">{day}</div>))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth().map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="bg-transparent"></div>;
                      const log = getLogForDay(day);
                      const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
                      const isSelected = day === selectedDay;
                      
                      return (
                        <button
                          key={`day-${day}`}
                          onClick={() => setSelectedDay(day)}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-medium transition-all ${getDayStatusColor(log)} ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''} ${isSelected ? 'ring-2 ring-dark ring-offset-2' : ''} cursor-pointer hover:opacity-80`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
                <div className="card">
                  <h3 className="text-[14px] font-medium font-[Poppins] mb-4">Weekly Summary</h3>
                  {weeklyStats.completed === 0 && weeklyStats.missed === 0 ? (
                      <p className="text-[11px] text-gray-500 text-center py-3">No data for this week</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-gray-600">Completed</span>
                          <span className="text-[11px] font-medium text-primary">{Math.round((weeklyStats.completed / (weeklyStats.completed + weeklyStats.missed || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${(weeklyStats.completed / (weeklyStats.completed + weeklyStats.missed || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] text-gray-600">Missed</span>
                          <span className="text-[11px] font-medium text-orange-500">{Math.round((weeklyStats.missed / (weeklyStats.completed + weeklyStats.missed || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(weeklyStats.missed / (weeklyStats.completed + weeklyStats.missed || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card">
                    <h3 className="text-[14px] font-medium font-[Poppins] mb-3">Activity for {formattedSelectedDate}</h3>
                    {selectedDayLogs.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">No activity recorded.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedDayLogs.map((log, idx) => {
                                const habit = habits.find(h => h.id === log.habit_id);
                                const isDone = log.status === 'done';
                                return (
                                    <div key={`${log.id}-${idx}`} className={`flex items-center gap-3 p-3 rounded-lg border ${isDone ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDone ? 'bg-primary text-white' : 'bg-red-500 text-white'}`}>
                                            {isDone ? '✓' : '✗'}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-medium text-dark">{habit?.name}</p>
                                            <p className="text-[10px] text-gray-500">{isDone ? 'Completed' : 'Missed'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Progress;