import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Star, Trophy, Clock, CheckCircle2, PartyPopper } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import JomaoModal from '../components/JomaoModal';
import confetti from 'canvas-confetti';
import { calculateLevel } from '../utils/gamification';

const Challenges = () => {
  const { user, profile, fetchProfile, addXP } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [userChallenges, setUserChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState({});
  
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);

  const { level, progress, xpInCurrentLevel, xpNeededForNextLevel, xpRemaining } = calculateLevel(profile?.xp || 0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchChallenges(), fetchUserChallenges()]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase.from('challenges').select('*');
      if (data && data.length > 0) {
        setChallenges(data);
      } else {
        // Fallback challenges with valid UUID format
        const defaultChallenges = [
          { id: 'c1111111-1111-1111-1111-111111111111', title: 'প্রথম সঞ্চয়', description: 'যেকোনো একটি গোল-এ প্রথম টাকা জমা দিন।', reward_xp: 100, type: 'achievement', requirement: 'first_saving' },
          { id: 'c2222222-2222-2222-2222-222222222222', title: 'মিতব্যয়ী সপ্তাহ', description: 'এক সপ্তাহে ১০০০ টাকার কম খরচ করুন।', reward_xp: 250, type: 'weekly', requirement: 'low_spending' },
          { id: 'c3333333-3333-3333-3333-333333333333', title: 'স্ট্রিক মাস্টার', description: 'টানা ৭ দিন খরচ বা সঞ্চয়ের হিসাব রাখুন।', reward_xp: 500, type: 'achievement', requirement: 'streak_7' },
        ];
        setChallenges(defaultChallenges);
      }
    } catch (error) {
      console.error('Fetch challenges error:', error);
    }
  };

  const fetchUserChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setUserChallenges(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const checkEligibility = async (challenge) => {
    if (!user) return false;
    
    // Check if already claimed
    if (userChallenges.find(uc => uc.challenge_id === challenge.id && uc.status === 'completed')) {
      return 'claimed';
    }

    try {
      if (challenge.requirement === 'first_saving') {
        const { data, count } = await supabase
          .from('goals')
          .select('current_amount', { count: 'exact' })
          .eq('user_id', user.id)
          .gt('current_amount', 0);
        
        return count > 0;
      }
      
      if (challenge.requirement === 'low_spending') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', sevenDaysAgo.toISOString().split('T')[0]);
        
        const total = data?.reduce((acc, exp) => acc + Number(exp.amount), 0) || 0;
        // User passes if total spending in last 7 days is < 1000
        return total < 1000;
      }
      
      if (challenge.requirement === 'streak_7') {
        return (profile?.streak || 0) >= 7;
      }

      return false;
    } catch (error) {
      console.error('Eligibility check failed:', error);
      return false;
    }
  };

  const handleClaim = async (challenge) => {
    setChecking(prev => ({ ...prev, [challenge.id]: true }));
    
    try {
      const isEligible = await checkEligibility(challenge);
      
      if (isEligible === 'claimed') {
        toast.error('আপনি ইতিমধ্যে এই পুরস্কারটি নিয়েছেন!');
        setChecking(prev => ({ ...prev, [challenge.id]: false }));
        return;
      }

      if (!isEligible) {
        toast.error('চ্যালেঞ্জটি এখনো সম্পন্ন হয়নি। শর্তগুলো পূরণ করুন।');
        setChecking(prev => ({ ...prev, [challenge.id]: false }));
        return;
      }

      // Record the claim in DB first
      const { error: claimError } = await supabase
        .from('user_challenges')
        .insert([{
          user_id: user.id,
          challenge_id: challenge.id,
          status: 'completed'
        }]);
      
      if (claimError) {
        console.warn('Could not record claim in DB:', claimError.message);
        // We continue anyway so the user gets XP even if DB seeding is incomplete
      }

      // Add XP
      const success = await addXP(challenge.reward_xp);
      if (success) {
        setEarnedXP(challenge.reward_xp);
        setShowRewardModal(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00C896', '#3B82F6', '#FFD166']
        });
        await fetchUserChallenges();
      } else {
        toast.error('XP যোগ করতে সমস্যা হয়েছে।');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('পুরস্কার নিতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।');
    } finally {
      setChecking(prev => ({ ...prev, [challenge.id]: false }));
    }
  };

  const getStatus = (challengeId) => {
    const uc = userChallenges.find(u => u.challenge_id === challengeId);
    return uc?.status || 'not_started';
  };

  // Dynamic Theme Logic
  const getThemeClass = (lvl) => {
    if (lvl >= 7) return 'theme-lvl7';
    if (lvl >= 6) return 'theme-lvl6';
    if (lvl >= 5) return 'theme-lvl5';
    if (lvl >= 4) return 'theme-lvl4';
    if (lvl >= 3) return 'theme-lvl3';
    if (lvl >= 2) return 'theme-lvl2';
    return 'theme-default';
  };

  const getNextThemeHint = (lvl) => {
    if (lvl < 2) return "Next: Level 2 Slate Vibe";
    if (lvl < 3) return "Next: Level 3 Emerald Vibe";
    if (lvl < 4) return "Next: Level 4 Blue Vibe";
    if (lvl < 5) return "Next: Level 5 Gold Vibe";
    if (lvl < 6) return "Next: Level 6 Purple Vibe";
    if (lvl < 7) return "Next: Level 7 Crimson Vibe";
    return "Legendary Level Reached!";
  };

  return (
    <div className={`challenges-page ${getThemeClass(level)}`}>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">চ্যালেঞ্জ ও পুরস্কার (Challenges)</h4>
        <p className="text-muted small">সঞ্চয় করুন, লেভেল আপ করুন!</p>
      </div>

      {/* User Progress Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="premium-dashboard-card border-0 mb-4 p-4 text-center shadow-lg text-white" 
        style={{ borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
      >
        <div className="d-flex justify-content-center mb-3">
          <motion.div 
            whileHover={{ rotate: 360 }}
            transition={{ duration: 1 }}
            className="bg-white bg-opacity-20 rounded-circle p-3"
          >
            <Trophy size={48} />
          </motion.div>
        </div>
        <motion.h3 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fw-bold mb-1"
        >
          Level {level}
        </motion.h3>
        <p className="small opacity-90 mb-3">{profile?.xp || 0} XP অর্জিত হয়েছে</p>
        <div className="progress bg-white bg-opacity-20 shadow-sm" style={{ height: '14px', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }}>
          <motion.div 
            key={`${level}-${profile?.xp}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="progress-bar bg-white shadow-sm h-100" 
            style={{ minWidth: '2px' }}
          />
        </div>
        <motion.div 
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="d-flex justify-content-between mt-3 small fw-bold"
        >
          <span>{xpInCurrentLevel} XP</span>
          <span>{getNextThemeHint(level)}</span>
        </motion.div>
      </motion.div>

      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <Star size={18} className="text-warning" /> উপলব্ধ চ্যালেঞ্জসমূহ (Available Tasks)
      </h6>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {challenges.map((challenge) => {
            const status = getStatus(challenge.id);
            const isClaimed = status === 'completed';

            return (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card border-0 p-3 d-flex align-items-center justify-content-between shadow-sm ${isClaimed ? 'opacity-75' : ''}`}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className={`rounded-circle p-3 ${isClaimed ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                    {isClaimed ? <CheckCircle2 size={24} /> : (challenge.type === 'weekly' ? <Clock size={24} /> : <Zap size={24} />)}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className={`fw-bold mb-0 ${isClaimed ? 'text-success' : 'text-main'}`}>
                      {challenge.title} {isClaimed && '✅'}
                    </h6>
                    <p className="text-muted small mb-0">{challenge.description}</p>
                    <span className="badge bg-primary bg-opacity-10 text-primary mt-1 fw-bold">+{challenge.reward_xp} XP</span>
                  </div>
                </div>
                <button 
                  className={`btn btn-sm px-3 rounded-pill fw-bold ${isClaimed ? 'btn-outline-success' : 'btn-jomao-primary'}`}
                  onClick={() => !isClaimed && handleClaim(challenge)}
                  disabled={checking[challenge.id] || isClaimed}
                  style={{ minWidth: '100px' }}
                >
                  {checking[challenge.id] ? 'চেকিং...' : (isClaimed ? 'সংগৃহীত' : 'পুরস্কার নিন')}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Badges Section */}
      <h6 className="fw-bold mt-5 mb-3">আপনার ব্যাজসমূহ</h6>
      <div className="row g-3">
        {['সঞ্চয়ী বন্ধু', 'হিসাবী রাজা', 'চ্যালেঞ্জ জয়ী'].map((badge, index) => (
          <div className="col-4 text-center" key={index}>
            <div className="glass-card border-0 p-3 d-flex flex-column align-items-center gap-2 opacity-50 shadow-sm">
              <div className="bg-light rounded-circle p-3 text-muted shadow-inner">
                <Award size={32} />
              </div>
              <span className="small fw-bold text-muted">{badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* REWARD CELEBRATION MODAL */}
      <JomaoModal 
        isOpen={showRewardModal} 
        onClose={() => setShowRewardModal(false)} 
        title="অভিনন্দন! 🎉"
        color="warning"
      >
        <div className="text-center py-3">
          <div className="d-inline-flex bg-warning bg-opacity-10 p-4 rounded-circle mb-4">
            <PartyPopper size={64} className="text-warning" />
          </div>
          <h3 className="fw-bold text-main mb-2">আপনি পুরস্কার জিতেছেন!</h3>
          <p className="text-muted mb-4">আপনি সফলভাবে এই চ্যালেঞ্জটি সম্পন্ন করেছেন এবং <span className="text-primary fw-bold">{earnedXP} XP</span> অর্জন করেছেন।</p>
          
          <div className="glass-card border-0 p-3 bg-light shadow-inner mb-4">
            <h5 className="fw-bold text-primary mb-0">+{earnedXP} XP Added!</h5>
          </div>

          <button 
            className="btn btn-jomao-primary w-100 py-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #FFD166, #F59E0B)' }}
            onClick={() => setShowRewardModal(false)}
          >
            অসাধারণ! দারুণ! 🤩
          </button>
        </div>
      </JomaoModal>
    </div>
  );
};

export default Challenges;
