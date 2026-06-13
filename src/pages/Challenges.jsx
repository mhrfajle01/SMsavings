import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Star, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Challenges = () => {
  const { user, profile, fetchProfile } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      // For this demo, we'll provide some static challenges if the DB is empty
      const { data, error } = await supabase.from('challenges').select('*');
      if (data && data.length > 0) {
        setChallenges(data);
      } else {
        // Fallback/Default Challenges
        setChallenges([
          { id: '1', title: 'প্রথম সঞ্চয়', description: 'যেকোনো একটি গোল-এ প্রথম টাকা জমা দিন।', reward_xp: 100, type: 'achievement' },
          { id: '2', title: 'মিতব্যয়ী সপ্তাহ', description: 'এক সপ্তাহে ১০০০ টাকার কম খরচ করুন।', reward_xp: 250, type: 'weekly' },
          { id: '3', title: 'স্ট্রিক মাস্টার', description: 'টানা ৭ দিন খরচ বা সঞ্চয়ের হিসাব রাখুন।', reward_xp: 500, type: 'achievement' },
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (xp) => {
    try {
      const newXp = (profile?.xp || 0) + xp;
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      const { error } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success(`${xp} XP অর্জন করেছেন!`);
      fetchProfile(user.id);
    } catch (error) {
      toast.error('পুরস্কার নিতে সমস্যা হচ্ছে।');
    }
  };

  return (
    <div className="challenges-page">
      <div className="mb-4">
        <h4 className="fw-bold mb-0">চ্যালেঞ্জ ও পুরস্কার (Challenges)</h4>
        <p className="text-muted small">সঞ্চয় করুন, লেভেল আপ করুন!</p>
      </div>

      {/* User Progress Card */}
      <div className="glass-card border-0 mb-4 p-4 text-center" style={{ background: 'linear-gradient(135deg, #00C896 0%, #3B82F6 100%)', color: 'white' }}>
        <div className="d-flex justify-content-center mb-3">
          <div className="bg-white bg-opacity-20 rounded-circle p-3">
            <Trophy size={48} />
          </div>
        </div>
        <h3 className="fw-bold mb-1">Level {profile?.level || 1}</h3>
        <p className="small opacity-90 mb-3">{profile?.xp || 0} XP অর্জিত হয়েছে</p>
        <div className="progress bg-white bg-opacity-20" style={{ height: '10px', borderRadius: '5px' }}>
          <div 
            className="progress-bar bg-white" 
            style={{ width: `${((profile?.xp || 0) % 1000) / 10}%` }} 
          />
        </div>
        <p className="small mt-2 mb-0">পরবর্তী লেভেল এর জন্য {1000 - ((profile?.xp || 0) % 1000)} XP বাকি</p>
      </div>

      <h6 className="fw-bold mb-3">উপলব্ধ চ্যালেঞ্জসমূহ</h6>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {challenges.map((challenge) => (
            <motion.div 
              whileHover={{ scale: 1.01 }}
              key={challenge.id}
              className="glass-card border-0 p-3 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle p-2">
                  {challenge.type === 'weekly' ? <Clock size={24} /> : <Zap size={24} />}
                </div>
                <div>
                  <h6 className="fw-bold mb-0">{challenge.title}</h6>
                  <p className="text-muted small mb-0">{challenge.description}</p>
                  <span className="badge bg-primary bg-opacity-10 text-primary mt-1">+{challenge.reward_xp} XP</span>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-jomao-primary"
                onClick={() => claimReward(challenge.reward_xp)}
              >
                পুরস্কার নিন
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Badges Section */}
      <h6 className="fw-bold mt-5 mb-3">আপনার ব্যাজসমূহ</h6>
      <div className="row g-3">
        {['সঞ্চয়ী বন্ধু', 'হিসাবী রাজা', 'চ্যালেঞ্জ জয়ী'].map((badge, index) => (
          <div className="col-4 text-center" key={index}>
            <div className="glass-card border-0 p-3 d-flex flex-column align-items-center gap-2 opacity-50">
              <div className="bg-light rounded-circle p-3 text-muted">
                <Award size={32} />
              </div>
              <span className="small fw-bold text-muted">{badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Challenges;
