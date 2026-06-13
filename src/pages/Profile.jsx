import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, LogOut, Settings, Shield, Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useAppContext();
  const [loading, setLoading] = useState(false);

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
          <button className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-1 border-white border-2">
            <Settings size={14} />
          </button>
        </div>
        <h4 className="fw-bold mb-1">{profile?.full_name || 'ব্যবহারকারী'}</h4>
        <p className="text-muted small mb-0">{user?.email}</p>
      </div>

      {/* Stats Quick View */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center">
            <h6 className="fw-bold text-primary mb-0">{profile?.level || 1}</h6>
            <span className="text-muted" style={{ fontSize: '10px' }}>লেভেল</span>
          </div>
        </div>
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center">
            <h6 className="fw-bold text-primary mb-0">{profile?.xp || 0}</h6>
            <span className="text-muted" style={{ fontSize: '10px' }}>XP</span>
          </div>
        </div>
        <div className="col-4">
          <div className="glass-card border-0 p-2 text-center">
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
        />
        
        <div className="glass-card border-0 p-3 d-flex align-items-center justify-content-between">
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
              className="form-check-input" 
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
        />
        
        <SettingItem 
          icon={<Shield size={20} className="text-success" />} 
          title="নিরাপত্তা" 
          subtitle="পাসওয়ার্ড পরিবর্তন করুন" 
        />
      </div>

      <button 
        className="btn btn-outline-danger w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 fw-bold"
        onClick={handleLogout}
        disabled={loading}
      >
        <LogOut size={20} />
        লগআউট করুন
      </button>

      <div className="text-center mt-4">
        <p className="text-muted" style={{ fontSize: '10px' }}>Jomao App Version 1.0.0 (Production)</p>
      </div>
    </div>
  );
};

const SettingItem = ({ icon, title, subtitle }) => (
  <motion.div 
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
    className="glass-card border-0 p-3 d-flex align-items-center justify-content-between cursor-pointer"
  >
    <div className="d-flex align-items-center gap-3">
      <div className="bg-light p-2 rounded-circle">
        {icon}
      </div>
      <div>
        <h6 className="fw-bold mb-0">{title}</h6>
        <span className="text-muted small">{subtitle}</span>
      </div>
    </div>
    <ChevronRight size={18} className="text-muted" />
  </motion.div>
);

export default Profile;
