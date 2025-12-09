import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Layout from '../components/Layout';
import Header from '../components/Header';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import SelectHabitModal from '../components/SelectHabitModal';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [goalsCount, setGoalsCount] = useState(0);
  const [badgesCount, setBadgesCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [userPoints, setUserPoints] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchGoalsAndBadges();
      const savedPoints = localStorage.getItem(`user_points_${user.id}`);
      if (savedPoints) {
        setUserPoints(parseInt(savedPoints));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchHabits = async () => {
    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (habitsError) throw habitsError;
      setHabits(habitsData || []);

      const habitIds = habitsData?.map(h => h.id) || [];
      if (habitIds.length > 0) {
        const { data: logsData, error: logsError } = await supabase
          .from('habit_logs')
          .select('*')
          .in('habit_id', habitIds)
          .eq('log_date', today);

        if (logsError) throw logsError;

        const logsMap = {};
        logsData?.forEach(log => {
          logsMap[log.habit_id] = log;
        });
        setTodayLogs(logsMap);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalsAndBadges = async () => {
    try {
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      const { data: badgesData } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);

      const { data: communitiesData } = await supabase
        .from('community_members')
        .select('*')
        .eq('user_id', user.id);

      const { data: allLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('status', 'done');

      const userCompletedLogs = allLogs?.filter(log => {
        const habit = habits.find(h => h.id === log.habit_id);
        return habit?.user_id === user.id;
      }) || [];

      setGoalsCount(goalsData?.length || 0);
      setBadgesCount(badgesData?.length || 0);
      setCommunityCount(communitiesData?.length || 0);
      setUserPoints(userCompletedLogs.length * 10);
    } catch (error) {
      console.error('Error fetching goals and badges:', error);
    }
  };


  const handleAddHabit = async (habitData) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([{ ...habitData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setHabits([data, ...habits]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const handleUpdateHabit = async (habitId, habitData) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', habitId)
        .select()
        .single();

      if (error) throw error;
      setHabits(habits.map(h => h.id === habitId ? data : h));
      setEditHabit(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);

      if (error) throw error;
      setHabits(habits.filter(h => h.id !== habitId));
      setEditHabit(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const completedCount = Object.values(todayLogs).filter(l => l.status === 'done').length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const formatDate = () => {
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  return (
    <Layout>
      <Header title="Daily Rise" />

      {/* --- DEBUG BOX (REMOVE LATER) --- */}
      <div className="bg-black text-green-400 p-4 mb-4 rounded text-xs font-mono overflow-auto">
        <p><strong>Logged In As:</strong> {user?.email}</p>
        <p><strong>User ID (App):</strong> {user?.id}</p>
        <p><strong>Habits Found:</strong> {habits.length}</p>
        <p><strong>Habit IDs:</strong> {habits.map(h => h.id).join(', ')}</p>
        <button
          onClick={() => console.log('Current User:', user)}
          className="bg-gray-800 text-white px-2 py-1 mt-2 rounded"
        >
          Log User to Console
        </button>
      </div>
      {/* ------------------------------- */}
      <div className="px-4 py-4">
        {/* Desktop Title (Visible only on md screens and up) */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-[14px] font-medium font-[Poppins] text-dark">Dashboard</h1>
            <p className="text-[11px] font-[Roboto] text-gray-500">Welcome back, {user?.firstname || 'User'}!</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-[Roboto] text-gray-500">{getDayName()}</p>
            <p className="text-[14px] font-medium font-[Poppins] text-dark">{formatDate()}</p>
          </div>
        </div>

        {/* Tagline Section */}
        <div className="bg-gradient-to-r from-primary to-green-700 rounded-xl p-6 mb-8 text-white shadow-lg">
          <h1 className="text-[14px] md:text-[18px] font-medium font-[Poppins] mb-1">Level up your life,</h1>
          <p className="text-[11px] md:text-[13px] font-[Roboto]">every single day</p>
          <p className="text-[10px] md:text-[11px] mt-3 opacity-90 font-[Roboto]">Join thousands building better habits together</p>
        </div>

        {/* Mobile Date Header (Hidden on Desktop) */}
        <div className="mb-6 md:hidden">
          <p className="text-[11px] font-[Roboto] text-gray-500">{getDayName()}</p>
          <p className="text-[14px] font-medium font-[Poppins] text-dark">{formatDate()}</p>
        </div>

        {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card hover:shadow-md transition-shadow">
            <p className="text-[11px] font-[Roboto] text-gray-500">Today's Progress</p>
            <p className="text-[18px] font-medium font-[Poppins] text-primary mt-1">{completedCount}/{totalCount}</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-[10px] font-[Roboto] text-gray-400 mt-1">{progressPercent}% Done</p>
          </div>
          <div className="card hover:shadow-md transition-shadow">
            <p className="text-[11px] font-[Roboto] text-gray-500">Badges Earned</p>
            <p className="text-[18px] font-medium font-[Poppins] text-primary mt-1">{badgesCount}</p>
            <p className="text-[10px] font-[Roboto] text-gray-400 mt-1">Achievements</p>
          </div>
          <div className="card hover:shadow-md transition-shadow">
            <p className="text-[11px] font-[Roboto] text-gray-500">Points</p>
            <p className="text-[18px] font-medium font-[Poppins] text-primary mt-1">{userPoints}</p>
            <p className="text-[10px] font-[Roboto] text-gray-400 mt-1">Total Earned</p>
          </div>
          <div className="card hover:shadow-md transition-shadow">
            <p className="text-[11px] font-[Roboto] text-gray-500">Communities</p>
            <p className="text-[18px] font-medium font-[Poppins] text-primary mt-1">{communityCount}</p>
            <p className="text-[10px] font-[Roboto] text-gray-400 mt-1">Groups Joined</p>
          </div>
        </div>

        {/* Main Content Layout: Stack on mobile, Side-by-side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN (Highlights) - On Desktop takes 1/3 width */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <h3 className="text-[14px] font-medium font-[Poppins] text-dark mb-4">Highlights</h3>

            <div className="space-y-4">
              {/* Feature 1: Gamified Progress */}
              <div onClick={() => navigate('/badges')} className="card cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-9 1h18M7 20h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v9a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium font-[Poppins] text-dark">Gamified Progress</p>
                    <p className="text-[10px] font-[Roboto] text-gray-500 mt-1">Earn badges & rewards</p>
                  </div>
                </div>
              </div>

              {/* Feature 2: Goals */}
              <div onClick={() => navigate('/goals')} className="card cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium font-[Poppins] text-dark">Set & Achieve Goals</p>
                    <p className="text-[10px] font-[Roboto] text-gray-500 mt-1">Connect habits to goals</p>
                    {/* Fixed: Added goalsCount usage here */}
                    <p className="text-[10px] font-[Roboto] text-primary mt-1 font-medium">{goalsCount} Goal{goalsCount !== 1 ? 's' : ''} Active</p>
                  </div>
                </div>
              </div>

              {/* Feature 3: Smart Insights */}
              <div onClick={() => navigate('/progress')} className="card cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium font-[Poppins] text-dark">Smart Insights</p>
                    <p className="text-[10px] font-[Roboto] text-gray-500 mt-1">View your progress calendar</p>
                  </div>
                </div>
              </div>

              {/* Feature 4: Community */}
              <div onClick={() => navigate('/community')} className="card cursor-pointer hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium font-[Poppins] text-dark">Community</p>
                    <p className="text-[10px] font-[Roboto] text-gray-500 mt-1">Join groups and compete</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (Habits List) - On Desktop takes 2/3 width */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-medium font-[Poppins] text-dark">My Habits</h2>
              <button
                onClick={() => {
                  setEditHabit(null);
                  setShowAddModal(true);
                }}
                className="px-4 py-2 bg-[#043915] text-white text-[10px] rounded-lg font-medium hover:bg-[#043915]/90 transition-colors shadow-sm font-[Roboto]"
              >
                + Add Habit
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-[11px] font-[Roboto] text-gray-500 mb-4">No habits yet. Start by adding one!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary text-[11px] font-[Roboto]"
                >
                  Create New Habit
                </button>
              </div>
            ) : (
              <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                {habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onEdit={() => {
                      setEditHabit(habit);
                      setShowAddModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddHabitModal
          habit={editHabit}
          onClose={() => {
            setShowAddModal(false);
            setEditHabit(null);
          }}
          onSave={editHabit ? (data) => handleUpdateHabit(editHabit.id, data) : handleAddHabit}
          onDelete={editHabit ? () => handleDeleteHabit(editHabit.id) : null}
        />
      )}

      {showSelectModal && (
        <SelectHabitModal
          onClose={() => setShowSelectModal(false)}
          onSelect={(habit) => {
            setEditHabit(habit);
            setShowSelectModal(false);
            setShowAddModal(true);
          }}
        />
      )}
    </Layout>
  );
};

export default Home;