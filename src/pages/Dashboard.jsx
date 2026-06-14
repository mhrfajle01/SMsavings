import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, CreditCard, Award, ChevronRight, Plus, Flame } from 'lucide-react';
import Chart from 'react-apexcharts';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { calculateLevel } from '../utils/gamification';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [goals, setGoals] = useState([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  const { level, progress } = calculateLevel(profile?.xp || 0);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setGoals(goalsData || []);
      
      // Calculate Total Saved
      const total = goalsData?.reduce((acc, goal) => acc + Number(goal.current_amount), 0) || 0;
      setTotalSaved(total);

      // Fetch Current Month Expenses
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0]);
      
      const totalExpense = expenseData?.reduce((acc, exp) => acc + Number(exp.amount), 0) || 0;
      setMonthlyExpense(totalExpense);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    chart: { type: 'radialBar', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '70%' },
        track: { background: '#e7e7e7', strokeWidth: '97%' },
        dataLabels: {
          name: { show: false },
          value: { offsetY: -2, fontSize: '22px', fontWeight: 'bold' }
        }
      }
    },
    colors: ['#00C896'],
    labels: ['Savings Progress'],
  };

  const overallProgress = goals.length > 0 
    ? (goals.reduce((acc, g) => acc + (g.current_amount / g.target_amount), 0) / goals.length) * 100
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="dashboard-container"
    >
      {/* Welcome Header */}
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h4 className="fw-bold mb-0">আসসালামু আলাইকুম, {profile?.full_name?.split(' ')[0] || 'বন্ধু'}! 👋</h4>
          <div className="d-flex align-items-center gap-2 mt-1">
            <span className="badge bg-warning text-dark fw-bold" style={{ fontSize: '10px' }}>LEVEL {level}</span>
            <div className="jomao-progress" style={{ width: '100px', height: '6px', overflow: 'hidden' }}>
              <motion.div 
                key={`${level}-${profile?.xp}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="jomao-progress-bar xp-progress h-100" 
              />
            </div>
          </div>
        </div>
        {profile?.streak > 0 && (
          <div className="streak-badge">
            <Flame size={14} fill="currentColor" />
            {profile.streak}
          </div>
        )}
      </div>

      {/* Main Savings Card */}
      <div className="glass-card mb-4 overflow-hidden position-relative border-0 shadow-sm">
        <div className="row align-items-center">
          <div className="col-7">
            <h6 className="text-muted small fw-bold text-uppercase mb-1">মোট সঞ্চয় (Total Saved)</h6>
            <h2 className="fw-bold text-primary mb-2">৳{totalSaved.toLocaleString()}</h2>
            <div className="d-flex align-items-center gap-1 text-success small">
              <TrendingUp size={14} />
              <span>গত মাসের চেয়ে ১০% বেশি</span>
            </div>
          </div>
          <div className="col-5 text-center">
            <Chart 
              options={{
                ...chartOptions,
                plotOptions: {
                  ...chartOptions.plotOptions,
                  radialBar: {
                    ...chartOptions.plotOptions.radialBar,
                    track: { background: 'var(--border-color)', strokeWidth: '97%' },
                    dataLabels: {
                      ...chartOptions.plotOptions.radialBar.dataLabels,
                      value: { ...chartOptions.plotOptions.radialBar.dataLabels.value, color: 'var(--text-main)' }
                    }
                  }
                }
              }} 
              series={[Math.round(overallProgress)]} 
              type="radialBar" 
              height={180} 
            />
            <p className="small fw-bold text-muted mt-n3">লক্ষ্যের {Math.round(overallProgress)}%</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <div className="glass-card p-3 border-0 h-100">
            <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-2 d-inline-block mb-2">
              <CreditCard size={20} />
            </div>
            <h6 className="text-muted small mb-1">এই মাসের খরচ</h6>
            <h5 className="fw-bold mb-0">৳{monthlyExpense.toLocaleString()}</h5>
          </div>
        </div>
        <div className="col-6">
          <div className="glass-card p-3 border-0 h-100">
            <div className="bg-warning bg-opacity-10 text-warning rounded-3 p-2 d-inline-block mb-2">
              <Award size={20} />
            </div>
            <h6 className="text-muted small mb-1">সেভিংস স্ট্রিক</h6>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold mb-0">{profile?.streak || 0} দিন</h5>
              {profile?.streak > 0 && <Flame size={18} className="text-danger" fill="#FF5A5F" />}
            </div>
            {profile?.streak_freeze_count > 0 && (
              <p className="text-info mb-0" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                ❄️ {profile.streak_freeze_count} Freeze Active
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Goals Section */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">বর্তমান লক্ষ্যমাত্রা (Goals)</h5>
        <Link to="/goals" className="text-primary text-decoration-none small fw-bold d-flex align-items-center">
          সব দেখুন <ChevronRight size={16} />
        </Link>
      </div>

      {goals.length > 0 ? (
        <div className="d-flex flex-column gap-3 mb-4">
          {goals.slice(0, 3).map((goal) => (
            <motion.div 
              key={goal.id}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-3 border-0 d-flex align-items-center gap-3"
            >
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                <Target size={24} />
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between mb-1">
                  <h6 className="fw-bold mb-0 text-main">{goal.name}</h6>
                  <span className="small text-muted">{Math.round((goal.current_amount / goal.target_amount) * 100)}%</span>
                </div>
                <div className="jomao-progress">
                  <div 
                    className="jomao-progress-bar" 
                    style={{ width: `${(goal.current_amount / goal.target_amount) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-4 text-center border-0 mb-4">
          <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
            <Target size={32} className="text-muted" />
          </div>
          <h6 className="fw-bold">কোন লক্ষ্য সেট করা নেই</h6>
          <p className="text-muted small mb-3">আপনার প্রথম সেভিংস গোল সেট করুন আজই!</p>
          <Link to="/goals" className="btn btn-jomao-primary btn-sm">
            নতুন লক্ষ্য যোগ করুন <Plus size={16} />
          </Link>
        </div>
      )}

      {/* Daily Motivation Card */}
      <div className="glass-card border-0 p-3" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', color: 'white' }}>
        <h6 className="fw-bold mb-1">আজকের টিপস 💡</h6>
        <p className="small mb-0 opacity-90">লেভেল ৫ এ পৌঁছালে নতুন অ্যাপ থিম আনলক হবে! নিয়মিত সঞ্চয় করুন আর লেভেল আপ করুন।</p>
      </div>
    </motion.div>
  );
};

export default Dashboard;
