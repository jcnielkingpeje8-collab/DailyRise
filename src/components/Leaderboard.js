import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useChallenges } from '../hooks/useChallenges';

const Leaderboard = ({ communityId, onChallenge, onViewChallenge }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentChallenges, setSentChallenges] = useState({});
  const { sentChallenges: hookChallenges } = useChallenges(user?.id, communityId);

  useEffect(() => {
    setSentChallenges(hookChallenges);
  }, [hookChallenges]);

  useEffect(() => {
    if (communityId && user?.id) {
      fetchLeaderboard();
      fetchSentChallenges();
      
      const interval = setInterval(fetchSentChallenges, 2000);

      const channel = supabase.channel(`leaderboard-${communityId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'community_leaderboard'
        }, (payload) => {
          if (payload.new?.community_id === communityId) {
            fetchLeaderboard();
          }
        })
        .subscribe();

      return () => {
        clearInterval(interval);
        channel.unsubscribe();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId, user?.id]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('community_leaderboard')
        .select('*')
        .eq('community_id', communityId)
        .order('rank', { ascending: true });

      if (error) throw error;

      // FIX: Deduplicate members based on user_id
      // This prevents the "1 user displaying 5 times" issue
      const uniqueMembers = [];
      const seenIds = new Set();
      
      if (data) {
        data.forEach(member => {
          if (!seenIds.has(member.user_id)) {
            seenIds.add(member.user_id);
            uniqueMembers.push(member);
          }
        });
      }

      setMembers(uniqueMembers);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSentChallenges = async () => {
    try {
      // FIX: Only fetch ACTIVE challenges (pending or accepted).
      // We ignore 'completed' or 'declined' here.
      // This ensures that if a previous challenge is finished, the button resets to "Challenge".
      
      // 1. Where I am the challenger
      const { data: sentData } = await supabase
        .from('challenges')
        .select('challenged_user_id, status')
        .eq('challenger_id', user?.id)
        .in('status', ['pending', 'accepted']);

      // 2. Where I am the challenged user
      const { data: receivedData } = await supabase
        .from('challenges')
        .select('challenger_id, status')
        .eq('challenged_user_id', user?.id)
        .in('status', ['pending', 'accepted']);

      const map = {};
      
      sentData?.forEach(c => {
        map[c.challenged_user_id] = c.status;
      });
      
      receivedData?.forEach(c => {
        map[c.challenger_id] = c.status;
      });
      
      setSentChallenges(map);
    } catch (error) {
      console.error('Error fetching sent challenges:', error);
    }
  };

  const getButtonState = (memberId) => {
    const status = sentChallenges[memberId];
    if (status === 'pending') return 'pending';
    if (status === 'accepted') return 'accepted';
    // If status is undefined (because we filtered out 'completed'), it returns 'default'
    return 'default';
  };

  const handleButtonClick = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'default') {
      onChallenge(memberId);
    } else if (state === 'accepted') {
      onViewChallenge(memberId);
    }
  };

  const getButtonText = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'pending') return '⏳ Pending';
    if (state === 'accepted') return '👁️ View';
    return 'Challenge';
  };

  const getButtonStyle = (memberId) => {
    const state = getButtonState(memberId);
    if (state === 'pending') {
      return 'px-3 py-1 bg-yellow-300 text-dark text-xs rounded font-medium cursor-not-allowed opacity-70';
    }
    if (state === 'accepted') {
      return 'px-3 py-1 bg-green-500 text-white text-xs rounded font-medium hover:bg-green-600';
    }
    return 'px-3 py-1 bg-primary text-white text-xs rounded font-medium hover:bg-primary/90';
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading leaderboard...</div>;
  }

  if (members.length === 0) {
    return <div className="text-center py-8 text-gray-500">No members yet</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-body font-semibold text-dark px-4 mb-3">Community Members</h3>
      {members.map((member) => (
        <div key={member.user_id} className="card flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="w-10 h-10 flex-shrink-0 mr-3">
              {member.image ? (
                <img 
                  src={member.image} 
                  alt={member.firstname} 
                  className="w-full h-full rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {member.firstname ? member.firstname[0].toUpperCase() : '?'}
                </div>
              )}
            </div>

            <div className="ml-0 flex-1">
              <p className="text-body font-medium text-dark">
                {member.firstname} {member.lastname}
              </p>
              <p className="text-small text-gray-500">
                {member.total_points} points
              </p>
            </div>
          </div>
          {member.user_id !== user?.id && (
            <button
              onClick={() => handleButtonClick(member.user_id)}
              disabled={getButtonState(member.user_id) === 'pending'}
              className={getButtonStyle(member.user_id)}
            >
              {getButtonText(member.user_id)}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;