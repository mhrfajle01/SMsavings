import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { calculateLevel, checkStreakStatus, STREAK_FREEZE_COST } from '../utils/gamification';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processDailyStreak = async (currentProfile) => {
    const now = new Date();
    const lastAction = currentProfile.last_streak_action_at ? new Date(currentProfile.last_streak_action_at) : null;
    const todayStr = now.toISOString().split('T')[0];

    // 1. Check if already acted today
    if (lastAction && lastAction.toISOString().split('T')[0] === todayStr) {
      return currentProfile.streak; // Already acted today
    }

    // 2. Check streak status for breaks
    const streakResult = checkStreakStatus(
      currentProfile.last_streak_date, 
      currentProfile.streak, 
      currentProfile.streak_freeze_count > 0
    );

    let newStreak = currentProfile.streak;
    let freezeUsed = false;

    if (streakResult.status === 'eligible') {
      newStreak = currentProfile.streak + 1;
      toast.success(`Streak Continued: ${newStreak} Days! 🔥`);
    } else if (streakResult.status === 'none') {
      newStreak = 1;
      toast.success('Streak Started! 🔥');
    } else if (streakResult.status === 'broken') {
      newStreak = 1;
      toast.error('Streak Reset! ❌');
    } else if (streakResult.status === 'frozen') {
      newStreak = currentProfile.streak;
      freezeUsed = true;
      toast.success('Streak Freeze used! ❄️');
    }

    // 3. Update DB
    const updates = { 
      streak: newStreak,
      last_streak_date: todayStr,
      last_streak_action_at: now.toISOString()
    };
    if (freezeUsed) updates.streak_freeze_count = currentProfile.streak_freeze_count - 1;

    await supabase.from('profiles').update(updates).eq('id', currentProfile.id);
    return newStreak;
  };

  const addXP = async (amount) => {
    if (!user || !profile) return false;
    
    try {
      // 1. Update XP and Level
      const currentXP = Number(profile.xp) || 0;
      const currentLevel = Number(profile.level) || 1;
      const newXP = currentXP + amount;
      const { level: newLevel } = calculateLevel(newXP);
      
      // 2. Process Streak Logically
      await processDailyStreak(profile);

      const updates = { 
        id: user.id,
        xp: newXP,
        level: newLevel,
        updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setProfile(updatedProfile);
      if (newLevel > currentLevel) {
        toast.success(`Level Up! You are now Level ${newLevel} 🎊`, { duration: 5000 });
      }
      return true;
    } catch (error) {
      console.error('Gamification Error:', error);
      toast.error('অগ্রগতি সেভ করা সম্ভব হয়নি।');
      return false;
    }
  };

  const buyStreakFreeze = async () => {
    if (!profile) return;
    if (profile.xp < STREAK_FREEZE_COST) {
      toast.error(`Not enough XP! Need ${STREAK_FREEZE_COST} XP.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          xp: profile.xp - STREAK_FREEZE_COST,
          streak_freeze_count: (profile.streak_freeze_count || 0) + 1
        })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('Bought a Streak Freeze! ❄️');
      fetchProfile(user.id);
    } catch (error) {
      toast.error('Could not buy Streak Freeze.');
    }
  };

  const signUp = (data) => supabase.auth.signUp(data);
  const signIn = (data) => supabase.auth.signInWithPassword(data);
  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      signUp, signIn, signOut, 
      fetchProfile, addXP, buyStreakFreeze 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
