import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, Trash2, X, Filter } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import JomaoModal from '../components/JomaoModal';

const Expenses = () => {
  const { user, addXP } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', category: 'Food', note: '', date: new Date().toISOString().split('T')[0] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      toast.error('খরচগুলো লোড করা সম্ভব হয়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('expenses').insert([{
        ...newExpense,
        user_id: user.id
      }]);
      if (error) throw error;
      toast.success('খরচ যোগ করা হয়েছে!');
      addXP(5); // Consistency reward for logging expense
      setShowModal(false);
      setNewExpense({ amount: '', category: 'Food', note: '', date: new Date().toISOString().split('T')[0] });
      fetchExpenses();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteId, setDeleteId] = useState(null);

  const deleteExpense = async () => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', deleteId);
      if (error) throw error;
      toast.success('খরচ মুছে ফেলা হয়েছে।');
      setDeleteId(null);
      fetchExpenses();
    } catch (error) {
      toast.error('ডিলিট করা সম্ভব হয়নি।');
    }
  };

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Others'];

  return (
    <div className="expenses-page">
      {/* Delete Confirmation Modal */}
      <JomaoModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="খরচ মুছে ফেলুন 🗑️"
        color="danger"
      >
        <div className="text-center">
          <p className="mb-4">আপনি কি নিশ্চিত যে এই হিসাবটি মুছে ফেলতে চান?</p>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary w-50" onClick={() => setDeleteId(null)}>বাতিল</button>
            <button className="btn btn-danger w-50" onClick={deleteExpense}>মুছে ফেলুন</button>
          </div>
        </div>
      </JomaoModal>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">খরচের হিসাব (Expenses)</h4>
          <p className="text-muted small">আপনার প্রতিদিনের খরচের হিসাব রাখুন</p>
        </div>
        <button 
          className="btn btn-jomao-primary d-flex align-items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} /> <span className="d-none d-sm-inline">খরচ যোগ করুন</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : expenses.length > 0 ? (
        <div className="d-flex flex-column gap-3">
          {expenses.map((expense) => (
            <motion.div 
              layout
              key={expense.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-3 border-0 d-flex align-items-center justify-content-between"
            >
              <div className="d-flex align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-main">{expense.note || expense.category}</h6>
                  <div className="d-flex gap-2 align-items-center">
                    <span className="text-muted small">{new Date(expense.date).toLocaleDateString('bn-BD')}</span>
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-normal" style={{ fontSize: '10px' }}>{expense.category}</span>
                  </div>
                </div>
              </div>
              <div className="text-end d-flex align-items-center gap-3">
                <h6 className="fw-bold text-danger mb-0">-৳{expense.amount}</h6>
                <button className="btn btn-link text-muted p-0" onClick={() => setDeleteId(expense.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-5 text-center border-0">
          <CreditCard size={48} className="text-muted mb-3 opacity-50" />
          <h5>কোন খরচের হিসাব নেই</h5>
          <p className="text-muted mb-4">আপনার খরচের হিসাব রাখতে 'খরচ যোগ করুন' বাটনে ক্লিক করুন।</p>
          <button className="btn btn-jomao-primary" onClick={() => setShowModal(true)}>
            খরচ যোগ করুন
          </button>
        </div>
      )}

      {/* REFACTORED COLORFUL MODAL */}
      <JomaoModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title="নতুন খরচ যোগ করুন 💸"
        color="danger"
      >
        <form onSubmit={handleAddExpense}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-main">টাকার পরিমাণ (৳)</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-2 border-end-0 text-danger fw-bold">৳</span>
              <input 
                type="number" 
                className="form-control border-start-0" 
                placeholder="যেমন: ৫০০" 
                required 
                value={newExpense.amount} 
                onChange={e => setNewExpense({...newExpense, amount: e.target.value})} 
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-main">ক্যাটাগরি</label>
            <select 
              className="form-select" 
              value={newExpense.category} 
              onChange={e => setNewExpense({...newExpense, category: e.target.value})}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat} 🏷️</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-bold text-main">তারিখ</label>
            <input 
              type="date" 
              className="form-control" 
              required 
              value={newExpense.date} 
              onChange={e => setNewExpense({...newExpense, date: e.target.value})} 
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-main">নোট (ঐচ্ছিক)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="যেমন: দুপুরের খাবার" 
              value={newExpense.note} 
              onChange={e => setNewExpense({...newExpense, note: e.target.value})} 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-jomao-primary w-100 py-3 shadow-lg" 
            style={{ background: 'linear-gradient(135deg, var(--danger-color), #B91C1C)' }} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'প্রসেসিং...' : 'খরচ সেভ করুন ✅'}
          </button>
        </form>
      </JomaoModal>
    </div>
  );
};

export default Expenses;
