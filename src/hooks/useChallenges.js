import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useChallenges = (userId, communityId) => {
  const [sentChallenges, setSentChallenges] = useState({});
  const [receivedChallenges, setReceivedChallenges] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial sent challenges
    fetchSentChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchSentChallenges = async () => {
    try {
      const map = {};

      // Fetch challenges where user is the challenger
      const { data: sentData } = await supabase
        .from('challenges')
        .select('challenged_user_id, status')
        .eq('challenger_id', userId)
        .neq('status', 'declined');

      sentData?.forEach(c => {
        map[c.challenged_user_id] = c.status;
      });

      // Fetch challenges where user is being challenged
      const { data: receivedData } = await supabase
        .from('challenges')
        .select('challenger_id, status')
        .eq('challenged_user_id', userId)
        .neq('status', 'declined');

      receivedData?.forEach(c => {
        map[c.challenger_id] = c.status;
      });

      setSentChallenges(map);
    } catch (error) {
      console.error('Error fetching sent challenges:', error);
    }
  };

  return {
    sentChallenges,
    receivedChallenges,
    setReceivedChallenges
  };
};
