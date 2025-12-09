import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Badges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: allBadges } = await supabase
        .from('badges')
        .select('*')
        .order('points_required', { ascending: true });

      const { data: earned } = await supabase
        .from('user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', user.id);

      setBadges(allBadges || []);
      setUserBadges(earned || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasEarned = (badgeId) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const getEarnedDate = (badgeId) => {
    const earned = userBadges.find(ub => ub.badge_id === badgeId);
    if (!earned) return null;
    return new Date(earned.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const earnedCount = userBadges.length;

  return (
    <Layout>
      <Header title="Badges" />
      
      <div className="px-4 py-4 pb-32">
        <div className="card mb-6 bg-gradient-to-r from-primary to-primary/80">
          <div className="text-white">
            <p className="text-small">Badges Earned</p>
            <p className="text-5xl font-bold my-2">{earnedCount}</p>
            <p className="text-body">out of {badges.length} total</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : badges.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-9 1h18M7 20h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v9a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-body text-gray-500">No badges available yet</p>
          </div>
        ) : (
          <div>
            <h3 className="text-subheading font-poppins text-dark mb-4">All Badges</h3>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => {
                const earned = hasEarned(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`card text-center p-4 transition-all ${
                      earned ? 'bg-green-50 border border-green-200' : 'opacity-60'
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h4 className="text-body font-medium text-gray-800">{badge.name}</h4>
                    <p className="text-xs text-gray-500 mt-2">{badge.points_required} pts</p>
                    {earned && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Earned {getEarnedDate(badge.id)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Badges;
