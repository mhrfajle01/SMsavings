import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Chart from 'react-apexcharts';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

const Analytics = () => {
  const { user } = useAuth();
  const [savingsData, setSavingsData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Expenses by Category
      const { data: expData } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('user_id', user.id);
      
      const categoryTotals = expData?.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
      }, {});
      
      setExpenseData(Object.entries(categoryTotals || {}).map(([name, value]) => ({ name, value })));

      // Fetch Goals for comparison
      const { data: goalsData } = await supabase
        .from('goals')
        .select('name, current_amount, target_amount')
        .eq('user_id', user.id);
      
      setSavingsData(goalsData || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const barChartOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: '50%' } },
    colors: ['#00C896'],
    xaxis: { categories: savingsData.map(g => g.name.substring(0, 8) + '...') },
    grid: { borderColor: '#f1f1f1' }
  };

  const pieChartOptions = {
    chart: { type: 'donut' },
    colors: ['#00C896', '#3B82F6', '#FFD166', '#FF5A5F', '#8B5CF6', '#EC4899'],
    labels: expenseData.map(d => d.name),
    legend: { position: 'bottom' },
    plotOptions: { pie: { donut: { size: '75%' } } }
  };

  return (
    <div className="analytics-page">
      <div className="mb-4">
        <h4 className="fw-bold mb-0">আর্থিক বিশ্লেষণ (Analytics)</h4>
        <p className="text-muted small">আপনার আয়-ব্যয় ও সঞ্চয়ের গ্রাফিকাল চিত্র</p>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="row g-4">
          {/* Savings Trends */}
          <div className="col-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card border-0 p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <TrendingUp className="text-primary" />
                <h6 className="fw-bold mb-0">সঞ্চয়ের অগ্রগতি (Goal Progress)</h6>
              </div>
              <Chart 
                options={barChartOptions} 
                series={[{ name: 'জমানো টাকা', data: savingsData.map(g => g.current_amount) }]} 
                type="bar" 
                height={250} 
              />
            </motion.div>
          </div>

          {/* Expense Breakdown */}
          <div className="col-12">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card border-0 p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <PieChartIcon className="text-danger" />
                <h6 className="fw-bold mb-0">খরচের বিন্যাস (Expense Category)</h6>
              </div>
              {expenseData.length > 0 ? (
                <Chart 
                  options={pieChartOptions} 
                  series={expenseData.map(d => d.value)} 
                  type="donut" 
                  height={300} 
                />
              ) : (
                <div className="text-center py-4 text-muted small">কোন খরচের ডেটা পাওয়া যায়নি</div>
              )}
            </motion.div>
          </div>

          {/* Monthly Comparison Summary */}
          <div className="col-12 mb-4">
            <div className="glass-card border-0 p-3 bg-primary bg-opacity-10">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="fw-bold text-primary mb-1">স্মার্ট টিপস 💡</h6>
                  <p className="small text-dark mb-0 opacity-75">আপনার মোট সঞ্চয় আপনার গত মাসের খরচের ৩ গুণ। আপনি দারুণ করছেন!</p>
                </div>
                <div className="bg-white rounded-circle p-2 text-primary shadow-sm">
                  <BarChart3 size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
