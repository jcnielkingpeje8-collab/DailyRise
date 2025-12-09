import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Swal from 'sweetalert2';

const Rewards = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [claimedRewards, setClaimedRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
      // Listen for storage changes to update points in real-time
      const handleStorageChange = (e) => {
        if (e.key === `user_points_${user.id}` && e.newValue) {
          setUserPoints(parseInt(e.newValue));
        }
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch habits for context (though not currently displayed)
      await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      // Get points from localStorage (earned via reminders)
      const savedPoints = localStorage.getItem(`user_points_${user.id}`);
      setUserPoints(savedPoints ? parseInt(savedPoints) : 0);

      const claimed = localStorage.getItem(`rewards_${user.id}`);
      setClaimedRewards(claimed ? JSON.parse(claimed) : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const rewards = [
    { id: 'bronze', name: 'Bronze Badge', points: 1000, icon: '🥉', color: 'bg-amber-100' },
    { id: 'silver', name: 'Silver Badge', points: 3000, icon: '🥈', color: 'bg-gray-100' },
    { id: 'gold', name: 'Gold Badge', points: 5000, icon: '🥇', color: 'bg-yellow-100' },
    { id: 'diamond', name: 'Diamond Badge', points: 10000, icon: '💎', color: 'bg-blue-100' },
    { id: 'tshirt', name: 'Signature T-Shirt', points: 2000, icon: '👕', color: 'bg-red-100' },
    { id: 'hoodie', name: 'Premium Hoodie', points: 5000, icon: '🧥', color: 'bg-indigo-100' },
    { id: 'trophy', name: 'Trophy', points: 7500, icon: '🏆', color: 'bg-orange-100' },
  ];

  const claimReward = (reward) => {
    if (userPoints < reward.points) {
      Swal.fire({
        icon: 'error',
        title: 'Not Enough Points',
        text: `You need ${reward.points} points (you have ${userPoints})`,
        confirmButtonColor: '#043915',
      });
      return;
    }

    if (claimedRewards.includes(reward.id)) {
      Swal.fire({
        icon: 'info',
        title: 'Already Claimed',
        text: 'You have already claimed this reward',
        confirmButtonColor: '#043915',
      });
      return;
    }

    const newClaimed = [...claimedRewards, reward.id];
    setClaimedRewards(newClaimed);
    localStorage.setItem(`rewards_${user.id}`, JSON.stringify(newClaimed));

    Swal.fire({
      icon: 'success',
      title: 'Reward Claimed!',
      text: `You claimed ${reward.name}!`,
      timer: 2000,
      confirmButtonColor: '#043915',
    });
  };

  const canClaim = (reward) => {
    return userPoints >= reward.points && !claimedRewards.includes(reward.id);
  };

  return (
    <Layout>
      <Header title="Rewards" />

      <div className="px-4 py-4 pb-32">
        <div className="card mb-6 bg-gradient-to-r from-primary to-primary/80">
          <div className="text-white">
            <p className="text-body">Your Points</p>
            <p className="text-5xl font-bold my-2">{userPoints}</p>
            <p className="text-xs opacity-90">Complete habits to earn more points (+10 per habit)</p>
          </div>
        </div>

        <h3 className="text-subheading font-poppins text-dark mb-4">Available Rewards</h3>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rewards.map((reward) => {
              const claimed = claimedRewards.includes(reward.id);
              const canClaimReward = canClaim(reward);

              return (
                <div
                  key={reward.id}
                  className={`card p-4 ${reward.color} border-2 ${
                    claimed ? 'border-green-300' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{reward.icon}</span>
                      <div>
                        <p className="text-body font-medium text-dark">{reward.name}</p>
                        <p className="text-xs text-gray-500">{reward.points} points</p>
                      </div>
                    </div>
                    <button
                      onClick={() => claimReward(reward)}
                      disabled={!canClaimReward}
                      className={`px-3 py-2 rounded-lg text-body font-medium transition-colors ${
                        claimed
                          ? 'bg-green-100 text-green-600 cursor-default'
                          : canClaimReward
                          ? 'bg-primary text-white hover:bg-primary/90'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? '✓ Claimed' : 'Claim'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {claimedRewards.length > 0 && (
          <div className="mt-6">
            <h3 className="text-subheading font-poppins text-dark mb-4">Your Rewards ({claimedRewards.length})</h3>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-body text-green-800">Great job! You've claimed {claimedRewards.length} reward{claimedRewards.length !== 1 ? 's' : ''}.</p>
              <p className="text-xs text-green-600 mt-2">Keep completing habits to unlock more rewards!</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Rewards;
