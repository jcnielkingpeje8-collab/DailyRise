import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import ChallengeModal from '../components/ChallengeModal';
import ViewChallengeModal from '../components/ViewChallengeModal';
import Swal from 'sweetalert2';

const Community = () => {
  const { user } = useAuth();
  
  // Changed: Initialize as empty array, we will fetch from DB
  const [communities, setCommunities] = useState([]);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengedUserId, setChallengedUserId] = useState(null);
  const [pendingChallenges, setPendingChallenges] = useState([]);
  const [showViewChallengeModal, setShowViewChallengeModal] = useState(false);
  const [viewChallengeId, setViewChallengeId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommunities();
      fetchJoinedCommunities();
      fetchPendingChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- NEW FUNCTION: Fetch Communities from Database ---
  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('community')
        .select('*')
        .order('id');
      
      if (error) throw error;
      setCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedCommunities = async () => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id);
      setJoinedCommunities(data?.map(m => m.community_id) || []);
    } catch (error) {
      console.error('Error fetching joined communities:', error);
    }
  };

  const fetchPendingChallenges = async () => {
    try {
      const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenged_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setPendingChallenges(data || []);
    } catch (error) {
      console.error('Error fetching pending challenges:', error);
    }
  };

  const joinCommunity = async (communityId) => {
    try {
      // 1. Check if already joined (double safety)
      if (joinedCommunities.includes(communityId)) return;

      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: communityId,
          user_id: user.id,
          role: 'member'
        }]);

      if (error) throw error;

      setJoinedCommunities([...joinedCommunities, communityId]);

      Swal.fire({
        icon: 'success',
        title: 'Joined!',
        text: 'You successfully joined the community',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      console.error('Join error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to join community. Please try again.',
        confirmButtonColor: '#043915',
      });
    }
  };

  const leaveCommunity = async (communityId) => {
    try {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', user.id);

      if (error) throw error;

      setJoinedCommunities(joinedCommunities.filter(id => id !== communityId));

      Swal.fire({
        icon: 'success',
        title: 'Left',
        text: 'You left the community',
        timer: 1500,
        showConfirmButton: false,
        confirmButtonColor: '#043915',
      });
    } catch (error) {
      console.error('Leave error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to leave community',
        confirmButtonColor: '#043915',
      });
    }
  };

  const handleChallenge = (userId) => {
    setChallengedUserId(userId);
    setShowChallengeModal(true);
  };

  const handleViewChallenge = async (userId) => {
    try {
      let { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('challenger_id', user.id)
        .eq('challenged_user_id', userId)
        .neq('status', 'declined')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        const result = await supabase
          .from('challenges')
          .select('*')
          .eq('challenger_id', userId)
          .eq('challenged_user_id', user.id)
          .neq('status', 'declined')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        data = result.data;
      }

      if (data) {
        setViewChallengeId(data.id);
        setShowViewChallengeModal(true);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Not Found',
          text: 'Challenge not found',
          confirmButtonColor: '#043915',
        });
      }
    } catch (error) {
      console.error('Error finding challenge:', error);
    }
  };

  return (
    <Layout>
      <Header title="Community Group" />

      <div className="px-4 py-4 pb-32">
        {/* Desktop Header */}
        <div className="hidden md:block mb-6">
          <h1 className="text-[14px] font-medium font-[Poppins] text-dark">Community Hub</h1>
          <p className="text-[11px] font-[Roboto] text-gray-500">Join groups, compete on leaderboards, and grow together.</p>
        </div>

        {/* Notifications */}
        {pendingChallenges?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <p className="text-[11px] font-[Roboto] text-yellow-900">
              🎯 You have <span className="font-bold">{pendingChallenges?.length}</span> pending challenge{pendingChallenges?.length > 1 ? 's' : ''}!
            </p>
            <button
              onClick={fetchPendingChallenges}
              className="text-[10px] bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1.5 rounded font-medium transition"
            >
              Check Invites
            </button>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="flex justify-between items-center mb-4">
          {selectedCommunity ? (
            <button
              onClick={() => setSelectedCommunity(null)}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to List
            </button>
          ) : (
            <span className="text-[11px] font-medium text-gray-500">All Communities</span>
          )}

          <button
            onClick={() => { fetchCommunities(); fetchPendingChallenges(); }}
            className="text-[11px] font-medium text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : selectedCommunity ? (
          <div className="animate-fade-in">
            <Leaderboard
              communityId={selectedCommunity}
              onChallenge={handleChallenge}
              onViewChallenge={handleViewChallenge}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((community) => {
              const isJoined = joinedCommunities.includes(community.id);
              return (
                <div
                  key={community.id}
                  onClick={() => isJoined && setSelectedCommunity(community.id)}
                  className={`card p-4 border transition-all ${
                    isJoined 
                      ? 'cursor-pointer hover:shadow-md border-primary/20 bg-white' 
                      : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-[14px] font-medium font-[Poppins] text-dark">{community.name}</h3>
                      <p className="text-[11px] font-[Roboto] text-gray-500 mt-1 line-clamp-2">{community.description}</p>
                      
                      {isJoined && (
                        <div className="mt-3 flex items-center gap-1 text-[10px] text-primary font-medium">
                          <span>View Leaderboard</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        isJoined ? leaveCommunity(community.id) : joinCommunity(community.id);
                      }}
                      className={`px-4 py-2 text-[10px] rounded-lg font-medium whitespace-nowrap transition-all shadow-sm ${
                        isJoined
                          ? 'bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-100'
                          : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                      }`}
                    >
                      {isJoined ? 'Leave' : 'Join Group'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChallengeModal
        isOpen={showChallengeModal}
        communityId={selectedCommunity}
        challengedUserId={challengedUserId}
        onClose={() => setShowChallengeModal(false)}
        onSuccess={() => { }}
      />

      <ViewChallengeModal
        isOpen={showViewChallengeModal}
        challengeId={viewChallengeId}
        onClose={() => setShowViewChallengeModal(false)}
      />
    </Layout>
  );
};

export default Community;