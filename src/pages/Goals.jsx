import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Search, MoreVertical, Trash2, Edit3, CheckCircle2, X } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target_amount: '', category: 'General', deadline: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      toast.error('লক্ষ্যগুলো লোড করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('goals').insert([{
        ...newGoal,
        user_id: user.id,
        current_amount: 0,
      }]);
      if (error) throw error;
      toast.success('নতুন লক্ষ্য যোগ করা হয়েছে!');
      setShowModal(false);
      setNewGoal({ name: '', target_amount: '', category: 'General', deadline: '' });
      fetchGoals();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateGoalProgress = async (goalId, current, target, amountToAdd) => {
    const newAmount = Number(current) + Number(amountToAdd);
    try {
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount, is_completed: newAmount >= target })
        .eq('id', goalId);
      
      if (error) throw error;
      
      if (newAmount >= target) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00C896', '#3B82F6', '#FFD166']
        });
        toast.success('অভিনন্দন! আপনি লক্ষ্য পূরণ করেছেন! 🎉');
      } else {
        toast.success('সঞ্চয় সফল হয়েছে!');
      }
      fetchGoals();
    } catch (error) {
      toast.error('আপডেট করা সম্ভব হয়নি।');
    }
  };

  const deleteGoal = async (id) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই লক্ষ্যটি ডিলিট করতে চান?')) return;
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      toast.success('লক্ষ্যটি মুছে ফেলা হয়েছে।');
      fetchGoals();
    } catch (error) {
      toast.error('ডিলিট করা সম্ভব হয়নি।');
    }
  };

  return (
    <div className="goals-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">আমার লক্ষ্যসমূহ (Goals)</h4>
          <p className="text-muted small">আপনার স্বপ্ন পূরণের যাত্রা ট্র্যাকিং করুন</p>
        </div>
        <button 
          className="btn btn-jomao-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> <span className="d-none d-sm-inline">নতুন লক্ষ্য</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : goals.length > 0 ? (
        <div className="row g-3">
          {goals.map((goal) => (
            <div className="col-12 col-md-6" key={goal.id}>
              <motion.div 
                layout
                className={`glass-card border-0 p-3 h-100 ${goal.is_completed ? 'bg-success bg-opacity-10' : ''}`}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className={`p-2 rounded-circle ${goal.is_completed ? 'bg-success text-white' : 'bg-primary bg-opacity-10 text-primary'}`}>
                      {goal.is_completed ? <CheckCircle2 size={24} /> : <Target size={24} />}
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">{goal.name}</h6>
                      <span className="badge bg-light text-dark small">{goal.category}</span>
                    </div>
                  </div>
                  <div className="dropdown">
                    <button className="btn btn-link text-muted p-0" data-bs-toggle="dropdown">
                      <MoreVertical size={20} />
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                      <li><button className="dropdown-item small d-flex align-items-center gap-2" onClick={() => deleteGoal(goal.id)}><Trash2 size={16} className="text-danger" /> ডিলিট করুন</button></li>
                    </ul>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1 small">
                    <span className="text-muted">অগ্রগতি</span>
                    <span className="fw-bold">৳{goal.current_amount} / ৳{goal.target_amount}</span>
                  </div>
                  <div className="jomao-progress">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                      className="jomao-progress-bar" 
                    />
                  </div>
                </div>

                {!goal.is_completed && (
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary btn-sm flex-grow-1 py-2 rounded-3"
                      onClick={() => {
                        const amount = prompt('কত টাকা জমা করতে চান?');
                        if (amount && !isNaN(amount)) updateGoalProgress(goal.id, goal.current_amount, goal.target_amount, amount);
                      }}
                    >
                      + টাকা যোগ করুন
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-5 text-center border-0">
          <Target size={48} className="text-muted mb-3 opacity-50" />
          <h5>এখনো কোন লক্ষ্য যোগ করেননি</h5>
          <p className="text-muted mb-4">আপনার সঞ্চয় যাত্রা শুরু করতে প্রথম লক্ষ্যটি যোগ করুন।</p>
          <button className="btn btn-jomao-primary" onClick={() => setShowModal(true)}>
            নতুন লক্ষ্য যোগ করুন
          </button>
        </div>
      )}

      {/* Create Goal Modal (Simplified for brevity, usually use a separate component) */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-backdrop show d-flex align-items-center justify-content-center p-3" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border-0 w-100" 
              style={{ maxWidth: '450px' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0">নতুন লক্ষ্য তৈরি করুন</h5>
                <button className="btn btn-link text-muted p-0" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateGoal}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">লক্ষ্যের নাম</label>
                  <input type="text" className="form-control" placeholder="যেমন: নতুন ফোন কেনা" required value={newGoal.name} onChange={e => setNewGoal({...newGoal, name: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">টাকার পরিমাণ (৳)</label>
                  <input type="number" className="form-control" placeholder="যেমন: ২০০০০" required value={newGoal.target_amount} onChange={e => setNewGoal({...newGoal, target_amount: e.target.value})} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold">ক্যাটাগরি</label>
                  <select className="form-select" value={newGoal.category} onChange={e => setNewGoal({...newGoal, category: e.target.value})}>
                    <option>General</option>
                    <option>Gadget</option>
                    <option>Travel</option>
                    <option>Education</option>
                    <option>Emergency</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-jomao-primary w-100 py-3" disabled={isSubmitting}>
                  {isSubmitting ? 'প্রসেসিং...' : 'লক্ষ্যটি সেভ করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Goals;
