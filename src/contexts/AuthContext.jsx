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
      
      // Auto-check streak for BREAKS only (doesn't increment automatically)
      const streakResult = checkStreakStatus(
        data.last_streak_date, 
        data.streak, 
        data.streak_freeze_count > 0
      );

      // Only update if it's broken or needs a freeze (prevents automatic increments on load)
      if (streakResult.status === 'broken' || streakResult.status === 'frozen') {
        const updates = {
          streak: streakResult.newStreak,
          last_streak_date: streakResult.status === 'frozen' 
            ? new Date().toISOString().split('T')[0] // Maintain streak by updating date
            : data.last_streak_date // Keep old date if broken (resetting to 0)
        };

        if (streakResult.useFreeze) {
          updates.streak_freeze_count = data.streak_freeze_count - 1;
          toast.success('Streak Freeze used! ❄️');
        }

        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();
        
        if (!updateError) {
          setProfile(updatedProfile);
          return updatedProfile;
        }
      }
      
      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addXP = async (amount) => {
    if (!user || !profile) return false;
    
    try {
      // 1. Calculate XP and Level
      const currentXP = Number(profile.xp) || 0;
      const currentLevel = Number(profile.level) || 1;
      const newXP = currentXP + amount;
      const { level: newLevel } = calculateLevel(newXP);
      
      // 2. Logical Streak Increment
      // Check if we should increment streak (once per day when an action is performed)
      const streakStatus = checkStreakStatus(
        profile.last_streak_date, 
        profile.streak, 
        false // Freeze already handled in fetchProfile
      );

      let newStreak = profile.streak;
      let newStreakDate = profile.last_streak_date;

      if (streakStatus.status === 'eligible') {
        // Yesterday was last update, increment today
        newStreak = profile.streak + 1;
        newStreakDate = new Date().toISOString().split('T')[0];
        toast.success(`Streak Continued: ${newStreak} Days! 🔥`);
      } else if (!profile.last_streak_date || profile.streak === 0) {
        // First time or starting fresh after break
        newStreak = 1;
        newStreakDate = new Date().toISOString().split('T')[0];
        toast.success('Streak Started! 🔥');
      }

      const updates = { 
        id: user.id,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
        last_streak_date: newStreakDate,
        updated_at: new Date().toISOString()
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .upsert(updates)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      if (updatedProfile) {
        setProfile(updatedProfile);
        if (newLevel > currentLevel) {
          toast.success(`Level Up! You are now Level ${newLevel} 🎊`, { duration: 5000 });
        }
        return true;
      }
      return false;
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
