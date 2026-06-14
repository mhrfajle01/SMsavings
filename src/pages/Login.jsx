import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn({ email, password });
      if (error) throw error;
      toast.success('স্বাগতম! আপনি সফলভাবে লগইন করেছেন।');
      navigate('/');
    } catch (error) {
      toast.error(error.message === 'Invalid login credentials' 
        ? 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।' 
        : error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 py-5">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-100" 
        style={{ maxWidth: '400px' }}
      >
        <div className="text-center mb-4">
          <h2 className="jomao-gradient-text fw-bold mb-1">Jomao (জমাও)</h2>
          <p className="text-muted small">স্মার্ট সঞ্চয় শুরু হোক এখান থেকেই</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label small fw-semibold">ইমেইল (Email)</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-muted">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                className="form-control border-start-0 ps-0" 
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="mb-4 position-relative">
            <label className="form-label small fw-semibold">পাসওয়ার্ড (Password)</label>
            <div className="input-group">
              <span className="input-group-text bg-transparent border-end-0 text-muted">
                <Lock size={18} />
              </span>
              <input 
                type={showPwd ? "text" : "password"} 
                className="form-control border-start-0 ps-0" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                style={{ paddingRight: '45px' }}
              />
            </div>
            {password.length > 0 && (
              <button 
                type="button"
                className="btn position-absolute end-0 top-50 translate-middle-y text-muted border-0 shadow-none me-2"
                onClick={() => setShowPwd(!showPwd)}
                style={{ zIndex: 10, width: '40px', marginTop: '12px' }}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-jomao-primary w-100 d-flex align-items-center justify-content-center gap-2 mb-3"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
            লগইন করুন
          </button>
        </form>

        <div className="text-center">
          <p className="text-muted small">
            অ্যাকাউন্ট নেই? <Link to="/signup" className="text-primary fw-semibold text-decoration-none">সাইনআপ করুন</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
