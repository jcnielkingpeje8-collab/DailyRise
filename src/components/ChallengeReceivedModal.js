import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';

const ChallengeReceivedModal = ({ isOpen, challengeId, onClose, onRespond }) => {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (isOpen && challengeId) {
      fetchChallenge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, challengeId]);

  const fetchChallenge = async () => {
    try {
      const { data: challengeData } = await supabase
        .from('challenges')
        .select(`
          id,
          status,
          created_at,
          challenger_id,
          habit_id,
          community_id,
          habits:habit_id (name),
          challenger:challenger_id (firstname, lastname, image, age, gender)
        `)
        .eq('id', challengeId)
        .single();

      setChallenge(challengeData);
    } catch (error) {
      console.error('Error fetching challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... existing imports ...
  const handleAccept = async () => {
    setResponding(true);
    try {
      // LOGIC FIX: Do NOT update 'completed_at'. Keep the scheduled time set by the challenger.
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'accepted' })
        .eq('id', challengeId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Challenge Accepted!',
        text: 'Get ready for the alarm!', // Updated text
        timer: 1500,
        confirmButtonColor: '#043915',
      });

      onRespond?.();
      onClose();
    } catch (error) {
      // ... existing error handling ...
    } finally {
      setResponding(false);
    }
  };
  // ... rest of the file ...

  const handleDecline = async () => {
    setResponding(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (error) throw error;

      Swal.fire({
        icon: 'info',
        title: 'Challenge Declined',
        text: 'You declined the challenge',
        timer: 1500,
        confirmButtonColor: '#043915',
      });

      onRespond?.();
      onClose();
    } catch (error) {
      console.error('Error declining challenge:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to decline challenge',
        confirmButtonColor: '#043915',
      });
    } finally {
      setResponding(false);
    }
  };

  if (!isOpen) return null;
  if (loading) return null;
  if (!challenge) return null;

  const challengerName = `${challenge.challenger?.firstname} ${challenge.challenger?.lastname}`;
  const habitName = challenge.habits?.name || 'Unknown Habit';
  const userAge = challenge.challenger?.age || 'N/A';
  const userGender = challenge.challenger?.gender || 'N/A';
  const userImage = challenge.challenger?.image;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
        {/* Header Background */}
        <div className="bg-gradient-to-r from-primary to-primary/80 h-24"></div>

        {/* Profile Card */}
        <div className="px-6 pb-6 -mt-12 relative">
          {/* Profile Image */}
          <div className="flex justify-center mb-4">
            <img
              src={userImage || 'https://via.placeholder.com/100?text=User'}
              alt={challengerName}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          </div>

          {/* User Info */}
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-dark">{challengerName}</h3>
            <div className="flex justify-center gap-4 mt-2">
              <p className="text-small text-gray-600">
                <span className="font-semibold">Age:</span> {userAge}
              </p>
              <p className="text-small text-gray-600">
                <span className="font-semibold">Gender:</span> {userGender}
              </p>
            </div>
          </div>

          {/* Challenge Details */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-small text-blue-900 mb-2">
              🎯 <span className="font-semibold">{challengerName}</span> challenged you to:
            </p>
            <p className="text-base font-bold text-primary text-center">
              "{habitName}"
            </p>
          </div>

          {/* Reward Info */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-3 mb-5">
            <p className="text-small text-yellow-900 text-center">
              ✨ Complete this habit to earn <span className="font-bold text-yellow-700">25 Points</span>!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              disabled={responding}
              className="flex-1 px-4 py-2 bg-gray-100 text-dark rounded-lg font-medium text-small hover:bg-gray-200 disabled:opacity-50 transition"
            >
              {responding ? 'Processing...' : '👋 Decline'}
            </button>
            <button
              onClick={handleAccept}
              disabled={responding}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium text-small hover:bg-primary/90 disabled:opacity-50 transition shadow-md"
            >
              {responding ? 'Processing...' : '✨ Accept'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeReceivedModal;
