import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

const ChallengeModal = ({ isOpen, communityId, challengedUserId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserHabits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const fetchUserHabits = async () => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHabits(data || []);
      if (data?.length > 0) {
        setSelectedHabit(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const sendChallenge = async () => {
    if (!selectedHabit || !reminderTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Complete All Fields',
        text: 'Please select a habit and set a reminder time',
        confirmButtonColor: '#043915',
      });
      return;
    }

    setLoading(true);
    try {
      // --- LOGIC FIX: Calculate Target Time ---
      const now = new Date();
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const targetDate = new Date();
      targetDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule it for tomorrow
      if (targetDate <= now) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      // Insert challenge with the calculated target time
      const { error } = await supabase
        .from('challenges')
        .insert([{
          challenger_id: user.id,
          challenged_user_id: challengedUserId,
          habit_id: selectedHabit,
          community_id: communityId,
          status: 'pending',
          completed_at: targetDate.toISOString() // Save scheduled time here
        }]);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Challenge Sent!',
        text: `Challenge set for ${targetDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
        timer: 2000,
        confirmButtonColor: '#043915',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sending challenge:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to send challenge',
        confirmButtonColor: '#043915',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl p-6 pb-32 max-w-md mx-auto max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-dark mb-4">🎯 Send Challenge</h3>

        <div className="mb-4">
          <label className="block text-small font-medium text-dark mb-2">
            Select Habit to Challenge
          </label>
          <select
            value={selectedHabit || ''}
            onChange={(e) => setSelectedHabit(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded text-small focus:outline-none focus:border-primary"
          >
            <option value="">Choose a habit...</option>
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-small font-medium text-dark mb-2">
            Reminder Time
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-small focus:outline-none focus:border-primary"
          />
        </div>

        <p className="text-small text-gray-600 mb-6">
          Set a time. The alarm will ring for BOTH of you at this time. First to stop it wins!
        </p>

        <div className="flex gap-3 sticky bottom-0 bg-white pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-dark rounded font-medium text-small hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={sendChallenge}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded font-medium text-small hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Challenge'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;