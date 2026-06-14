import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, CreditCard, Award, BarChart3, User, LogOut, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { calculateLevel } from '../utils/gamification';

const MainLayout = ({ children }) => {
  const { signOut, profile } = useAuth();
  const [announcement, setAnnouncement] = useState('');
  const { level } = calculateLevel(profile?.xp || 0);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data } = await supabase
        .from('admin_config')
        .select('value')
        .eq('key', 'global_announcement')
        .single();
      if (data && data.value) setAnnouncement(data.value);
    } catch (e) {
      // Silence config errors
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Global Announcement */}
      {announcement && (
        <div className="bg-primary overflow-hidden position-relative shadow-sm" style={{ height: '36px', background: 'linear-gradient(90deg, var(--primary-color), var(--secondary-color))' }}>
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{ 
              repeat: Infinity, 
              duration: 30, 
              ease: "linear" 
            }}
            className="text-nowrap text-white small fw-bold d-flex align-items-center h-100"
          >
            <span className="mx-4 d-flex align-items-center gap-2">
              <Bell size={14} className="opacity-75" /> {announcement}
            </span>
          </motion.div>
        </div>
      )}
      
      {/* Top Navbar */}
      <nav className="navbar glass-card sticky-top m-2 py-2 px-3 border-0 rounded-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <NavLink to="/" className="navbar-brand jomao-gradient-text fw-bold fs-4 m-0">
            Jomao
          </NavLink>
          
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <p className="m-0 small fw-bold text-dark">{profile?.full_name || 'ব্যবহারকারী'}</p>
              <p className="m-0 text-muted" style={{ fontSize: '10px' }}>Level {level} • {profile?.xp || 0} XP</p>
            </div>
            <NavLink 
              to="/profile"
              className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center text-decoration-none"
              style={{ width: '40px', height: '40px' }}
            >
              <User size={20} className="text-primary" />
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container pb-5 mb-5 pt-2">
        {children}
      </main>

      {/* Bottom Navigation (Mobile Friendly) */}
      <div className="fixed-bottom p-3">
        <div className="glass-card py-2 px-1 d-flex justify-content-around align-items-center rounded-pill border-0 shadow-lg">
          <NavIcon to="/" icon={<Home size={22} />} label="Home" />
          <NavIcon to="/goals" icon={<Target size={22} />} label="Goals" />
          <NavIcon to="/expenses" icon={<CreditCard size={22} />} label="Costs" />
          <NavIcon to="/challenges" icon={<Award size={22} />} label="Task" />
          <NavIcon to="/analytics" icon={<BarChart3 size={22} />} label="Stats" />
        </div>
      </div>
    </div>
  );
};

const NavIcon = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `d-flex flex-column align-items-center text-decoration-none transition-all ${
        isActive ? 'text-primary scale-110' : 'text-muted opacity-75'
      }`
    }
  >
    {icon}
    <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: '600' }}>{label}</span>
  </NavLink>
);

export default MainLayout;
