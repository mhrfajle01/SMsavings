import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, LogOut, Settings, Shield, Bell, Moon, Sun, ChevronRight, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import JomaoModal from '../components/JomaoModal';

const Profile = () => {
  const { user, profile, signOut, fetchProfile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useAppContext();
  const [loading, setLoading] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    full_name: profile?.full_name || '',
    monthly_income: profile?.monthly_income || 0
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          monthly_income: editData.monthly_income
        })
        .eq('id', user.id);
      
      if (error) throw error;
      toast.success('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      fetchProfile(user.id);
      setShowEditModal(false);
    } catch (error) {
      toast.error('আপডেট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success('সফলভাবে লগআউট করা হয়েছে।');
    } catch (error) {
      toast.error('লগআউট করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="mb-4 text-center">
        <div className="position-relative d-inline-block mb-3">
          <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center border border-white border-4 shadow-sm" style={{ width: '100px', height: '100px' }}>
            <User size={50} className="text-primary" />
          </div>
          <button 
            className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-1 border-white border-2"
            onClick={() => {
              setEditData({ full_name: profile?.full_name, monthly_income: profile?.monthly_income });
              setShowEditModal(true);
            }}
          >
            <Settings size={14} />
          </button>
        </div>
        <h4 className="fw-bold mb-1">{profile?.full_name || 'ব্যবহারকারী'}</h4>
        <p className="text-muted small mb-0">{user?.email}</p>
      </div>

      {/* Stats Quick View */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center shadow-sm">
            <h6 className="fw-bold text-primary mb-0">{profile?.level || 1}</h6>
            <span className="text-muted" style={{ fontSize: '10px' }}>লেভেল</span>
          </div>
        </div>
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center shadow-sm">
            <h6 className="fw-bold text-primary mb-0">{profile?.xp || 0}</h6>
            <span className="text-muted" style={{ fontSize: '10px' }}>XP</span>
          </div>
        </div>
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center shadow-sm">
            <h6 className="fw-bold text-primary mb-0">{profile?.streak || 0}</h6>
            <span className="text-muted" style={{ fontSize: '10px' }}>স্ট্রিক</span>
          </div>
        </div>
      </div>

      {/* Settings List */}
      <div className="d-flex flex-column gap-2 mb-4">
        <h6 className="fw-bold px-1 mb-2">সেটিংস (Settings)</h6>
        
        <SettingItem 
          icon={<User size={20} className="text-primary" />} 
          title="প্রোফাইল এডিট" 
          subtitle="আপনার তথ্য পরিবর্তন করুন" 
          onClick={() => {
            setEditData({ full_name: profile?.full_name, monthly_income: profile?.monthly_income });
            setShowEditModal(true);
          }}
        />
        
        <div className="glass-card border-0 p-3 d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-light p-2 rounded-circle">
              {isDarkMode ? <Moon size={20} className="text-warning" /> : <Sun size={20} className="text-warning" />}
            </div>
            <div>
              <h6 className="fw-bold mb-0">ডার্ক মোড</h6>
              <span className="text-muted small">থিম পরিবর্তন করুন</span>
            </div>
          </div>
          <div className="form-check form-switch mb-0">
            <input 
              className="form-check-input shadow-none" 
              type="checkbox" 
              checked={isDarkMode} 
              onChange={toggleDarkMode}
              style={{ cursor: 'pointer', height: '24px', width: '45px' }}
            />
          </div>
        </div>

        <SettingItem 
          icon={<Bell size={20} className="text-info" />} 
          title="নোটিফিকেশন" 
          subtitle="রিমাইন্ডার সেট করুন" 
          onClick={() => toast('শীঘ্রই আসছে!')}
        />
        
        <SettingItem 
          icon={<Shield size={20} className="text-success" />} 
          title="নিরাপত্তা" 
          subtitle="পাসওয়ার্ড পরিবর্তন করুন" 
          onClick={() => toast('শীঘ্রই আসছে!')}
        />
      </div>

      <button 
        className="btn btn-outline-danger w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 fw-bold shadow-sm"
        onClick={handleLogout}
        disabled={loading}
      >
        <LogOut size={20} />
        লগআউট করুন
      </button>

      <div className="text-center mt-4">
        <p className="text-muted" style={{ fontSize: '10px' }}>Jomao App Version 1.0.0 (Production)</p>
      </div>

      {/* EDIT PROFILE MODAL */}
      <JomaoModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        title="প্রোফাইল এডিট করুন 👤"
        color="primary"
      >
        <form onSubmit={handleUpdateProfile}>
          <div className="mb-3">
            <label className="form-label small fw-bold text-main">পুরো নাম</label>
            <input 
              type="text" 
              className="form-control" 
              value={editData.full_name} 
              onChange={e => setEditData({...editData, full_name: e.target.value})} 
              required 
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-bold text-main">মাসিক আয় (Monthly Income)</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-2 border-end-0 fw-bold text-primary">৳</span>
              <input 
                type="number" 
                className="form-control border-start-0" 
                value={editData.monthly_income} 
                onChange={e => setEditData({...editData, monthly_income: e.target.value})} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-jomao-primary w-100 py-3 shadow-lg" 
            disabled={loading}
          >
            {loading ? 'প্রসেসিং...' : 'তথ্য সেভ করুন ✅'}
          </button>
        </form>
      </JomaoModal>
    </div>
  );
};

const SettingItem = ({ icon, title, subtitle, onClick }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className="glass-card border-0 p-3 d-flex align-items-center justify-content-between cursor-pointer mb-2 shadow-sm"
    onClick={onClick}
  >
    <div className="d-flex align-items-center gap-3">
      <div className="bg-light p-2 rounded-circle">
        {icon}
      </div>
      <div>
        <h6 className="fw-bold mb-0 text-main">{title}</h6>
        <span className="text-muted small">{subtitle}</span>
      </div>
    </div>
    <ChevronRight size={18} className="text-muted" />
  </motion.div>
);

export default Profile;
