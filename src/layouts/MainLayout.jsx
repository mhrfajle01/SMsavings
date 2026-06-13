import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Target, CreditCard, Award, BarChart3, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = ({ children }) => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Top Navbar */}
      <nav className="navbar glass-card sticky-top m-2 py-2 px-3 border-0 rounded-4">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <NavLink to="/" className="navbar-brand jomao-gradient-text fw-bold fs-4 m-0">
            Jomao
          </NavLink>
          
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-sm-block">
              <p className="m-0 small fw-bold text-dark">{profile?.full_name || 'ব্যবহারকারী'}</p>
              <p className="m-0 text-muted" style={{ fontSize: '10px' }}>Level {profile?.level || 1} • {profile?.xp || 0} XP</p>
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
