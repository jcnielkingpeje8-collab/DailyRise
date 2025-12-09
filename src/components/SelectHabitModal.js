import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

const SelectHabitModal = ({ onClose, onSelect }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHabit = (habit) => {
    onSelect(habit);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-white to-gray-50">
          <div>
            <h2 className="text-heading font-poppins text-dark">Select Habit</h2>
            <p className="text-xs text-gray-500 mt-1">Choose a habit to track today</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : habits.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-body font-medium text-gray-600 mb-1">No habits yet</p>
              <p className="text-xs text-gray-500">Create your first habit to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.map((habit, index) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleSelectHabit(habit)}
                  className="w-full p-4 rounded-xl border border-gray-200 text-left hover:border-primary hover:bg-primary/5 transition-all active:bg-primary/10 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-body font-semibold text-dark group-hover:text-primary transition-colors">{habit.name}</h3>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded mr-2">{habit.category}</span>
                        <span className="inline-block px-2 py-1 bg-gray-100 rounded">{habit.frequency}</span>
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 px-6 py-4 space-y-2">
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-body font-medium hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectHabitModal;
