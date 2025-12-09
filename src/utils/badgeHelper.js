import { supabase } from '../lib/supabaseClient';

export const checkAndAwardBadges = async (userId) => {
  try {
    // Get all habit logs for the user
    const { data: allLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('status', 'done');

    // Get completed habits from last 7 days for "7 Day Streak"
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDayLogs = allLogs?.filter(log => new Date(log.log_date) >= sevenDaysAgo) || [];

    // Get completed habits from last 30 days for "30 Day Master"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDayLogs = allLogs?.filter(log => new Date(log.log_date) >= thirtyDaysAgo) || [];

    // Check existing badges
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const existingBadgeIds = existingBadges?.map(b => b.badge_id) || [];

    // Badge 1: First Step (1 completed habit)
    if (sevenDayLogs.length >= 1 && !existingBadgeIds.includes(1)) {
      await supabase
        .from('user_badges')
        .insert([{ badge_id: 1, user_id: userId, earned_at: new Date() }]);
    }

    // Badge 2: Week Warrior (7+ completed habits in 7 days)
    if (sevenDayLogs.length >= 7 && !existingBadgeIds.includes(2)) {
      await supabase
        .from('user_badges')
        .insert([{ badge_id: 2, user_id: userId, earned_at: new Date() }]);
    }

    // Badge 3: 30 Day Master (20+ completed habits in 30 days)
    if (thirtyDayLogs.length >= 20 && !existingBadgeIds.includes(3)) {
      await supabase
        .from('user_badges')
        .insert([{ badge_id: 3, user_id: userId, earned_at: new Date() }]);
    }

    // Badge 4: Consistency Champion (50+ total completed habits)
    const totalCompleted = allLogs?.length || 0;
    if (totalCompleted >= 50 && !existingBadgeIds.includes(4)) {
      await supabase
        .from('user_badges')
        .insert([{ badge_id: 4, user_id: userId, earned_at: new Date() }]);
    }
  } catch (error) {
    console.error('Error checking badges:', error);
  }
};
