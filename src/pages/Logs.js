import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Logs = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: habitsData } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      setHabits(habitsData || []);

      if (habitsData && habitsData.length > 0) {
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('*, habits(name, category)')
          .in('habit_id', habitsData.map(h => h.id))
          .order('log_date', { ascending: false })
          .limit(100);

        setLogs(logsData || []);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (logId) => {
    try {
      const { error } = await supabase
        .from('habit_logs')
        .update({ notes: noteInput })
        .eq('id', logId);

      if (error) throw error;

      setLogs(logs.map(l => l.id === logId ? { ...l, notes: noteInput } : l));
      setEditingLog(null);
      setNoteInput('');
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const groupLogsByDate = () => {
    const filteredLogs = selectedHabit 
      ? logs.filter(l => l.habit_id === selectedHabit)
      : logs;

    const grouped = {};
    filteredLogs.forEach(log => {
      const date = log.log_date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
        );
      case 'missed':
        return (
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
        );
    }
  };

  const groupedLogs = groupLogsByDate();

  return (
    <Layout>
      <Header title="Habit Logs" />
      
      <div className="px-4 py-4 pb-32">
        <div className="hidden md:block mb-6 border-b border-gray-100 pb-4">
          <h1 className="text-[14px] font-medium font-[Poppins] text-dark">History & Logs</h1>
          <p className="text-[11px] font-[Roboto] text-gray-500">Review your past activity</p>
        </div>

        <div className="max-w-3xl mx-auto">
            <div className="mb-6 overflow-x-auto hide-scrollbar">
              <div className="flex gap-2">
                <button onClick={() => setSelectedHabit(null)} className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all font-[Roboto] ${!selectedHabit ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All Habits</button>
                {habits.map((habit) => (
                  <button key={habit.id} onClick={() => setSelectedHabit(habit.id)} className={`px-3 py-1.5 rounded-full text-[11px] whitespace-nowrap transition-all font-[Roboto] ${selectedHabit === habit.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{habit.name}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : Object.keys(groupedLogs).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-[11px] text-gray-500 font-[Roboto]">No logs found for this selection.</p>
                {habits.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-2">Mark a habit as done on the Home screen to see it here.</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedLogs).map(([date, dateLogs]) => (
                  <div key={date} className="animate-fade-in">
                    <h3 className="text-[12px] font-medium font-[Poppins] text-gray-500 mb-3 sticky top-0 bg-gray-50 py-2 z-10">{formatDate(date)}</h3>
                    <div className="space-y-2">
                      {dateLogs.map((log) => (
                        <div key={log.id} className="card hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(log.status)}
                            <div className="flex-1">
                              <h4 className="text-[13px] font-medium text-dark font-[Poppins]">{log.habits?.name || 'Unknown Habit'}</h4>
                              <p className="text-[10px] text-gray-400 capitalize font-[Roboto]">{log.status}</p>
                              {/* Existing note editing logic */}
                              {editingLog === log.id ? (
                                <div className="mt-2 bg-gray-50 p-2 rounded-lg">
                                  <textarea
                                    value={noteInput}
                                    onChange={(e) => setNoteInput(e.target.value)}
                                    placeholder="Add a note..."
                                    className="w-full p-2 text-[11px] border border-gray-200 rounded bg-white resize-none focus:outline-none focus:border-primary"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 mt-2 justify-end">
                                    <button onClick={() => { setEditingLog(null); setNoteInput(''); }} className="text-[10px] text-gray-500 hover:text-dark px-3 py-1">Cancel</button>
                                    <button onClick={() => handleUpdateNote(log.id)} className="bg-primary text-white text-[10px] px-3 py-1 rounded hover:bg-primary/90">Save</button>
                                  </div>
                                </div>
                              ) : log.notes ? (
                                <p className="text-[11px] text-gray-600 mt-2 cursor-pointer hover:text-primary transition-colors bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200" onClick={() => { setEditingLog(log.id); setNoteInput(log.notes); }}>{log.notes}</p>
                              ) : (
                                <button onClick={() => { setEditingLog(log.id); setNoteInput(''); }} className="text-[10px] text-primary mt-1 hover:underline font-medium">+ Add note</button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </Layout>
  );
};

export default Logs;