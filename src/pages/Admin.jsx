import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Database, Users, Target, CreditCard, Save, Trash2, Lock, Unlock, RefreshCcw, Search, Settings, Eye, EyeOff, Download, TrendingUp, AlertCircle, ToggleLeft, Activity, Flame } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculateLevel } from '../utils/gamification';
import toast from 'react-hot-toast';

const AdminVault = () => {
  const { user, profile, fetchProfile } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('profiles');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ users: 0, savings: 0, expenses: 0 });
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // App Config State
  const [appConfig, setAppConfig] = useState({
    announcement: '',
    maintenance_mode: false,
    streak_freeze_cost: 500
  });

  // Initial Check for local password (fallback)
  const [currentMasterPassword, setCurrentMasterPassword] = useState('jomao-master-2026');

  useEffect(() => {
    fetchRemoteConfig();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: goalsData } = await supabase.from('goals').select('current_amount');
      const { data: expensesData } = await supabase.from('expenses').select('amount');

      const totalSavings = goalsData?.reduce((acc, g) => acc + Number(g.current_amount), 0) || 0;
      const totalExpenses = expensesData?.reduce((acc, e) => acc + Number(e.amount), 0) || 0;

      setStats({
        users: userCount || 0,
        savings: totalSavings,
        expenses: totalExpenses
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAppConfig = async () => {
    try {
      const { data: configs } = await supabase.from('admin_config').select('*');
      if (configs) {
        const configMap = {};
        configs.forEach(c => configMap[c.key] = c.value);
        setAppConfig({
          announcement: configMap.global_announcement || '',
          maintenance_mode: configMap.maintenance_mode === 'true',
          streak_freeze_cost: parseInt(configMap.streak_freeze_cost) || 500
        });
      }
    } catch (err) {
      console.error('Error fetching app config:', err);
    }
  };

  const updateAppConfig = async (key, value) => {
    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({ key, value: String(value) });
      
      if (error) throw error;
      toast.success(`Config Updated: ${key} ✅`);
      fetchAppConfig();
    } catch (error) {
      toast.error('Failed to update config');
    }
  };

  const fetchRemoteConfig = async () => {
    try {
      const { data: config, error } = await supabase
        .from('admin_config')
        .select('value')
        .eq('key', 'master_password')
        .single();
      
      if (config) {
        setCurrentMasterPassword(config.value);
      }
    } catch (e) {
      console.warn('Remote config not found, using default');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === currentMasterPassword) {
      setIsAuthenticated(true);
      toast.success('Master Access Enabled 🔓');
      fetchTableData('profiles');
      fetchStats();
    } else {
      toast.error('Access Denied: Incorrect Password');
      setPassword('');
    }
  };

  const fetchTableData = async (table) => {
    setLoading(true);
    setData([]); // Clear old data to show loading state
    if (table === 'config') {
      await fetchAppConfig();
      setLoading(false);
      setActiveTab('config');
      return;
    }
    try {
      console.log(`Vault: Fetching ${table}...`);
      
      // SUPER ROBUST FETCH: Try sorting first, if it fails, get raw data
      let response;
      
      try {
        const sortCol = table === 'profiles' ? 'updated_at' : 'created_at';
        response = await supabase
          .from(table)
          .select('*')
          .order(sortCol, { ascending: false });
      } catch (orderErr) {
        console.warn('Order failed, retrying raw...');
      }

      if (!response || response.error) {
        response = await supabase.from(table).select('*');
      }

      if (response.error) throw response.error;
      
      console.log(`Vault: Received ${response.data?.length || 0} rows`);
      setData(response.data || []);
      setActiveTab(table);
    } catch (error) {
      console.error('Master Vault Error:', error);
      toast.error(`Fetch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jomao_export_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success('CSV Exported! 📥');
  };

  const updateEntry = async (table, id, updates) => {
    try {
      const { error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Record Updated ✅');
      fetchTableData(table);
      if (table === 'profiles' && id === user.id) fetchProfile(user.id);
    } catch (error) {
      toast.error('Update Failed');
    }
  };

  const deleteEntry = async (table, id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Record Deleted 🗑️');
      fetchTableData(table);
    } catch (error) {
      toast.error('Delete Failed');
    }
  };

  const handleChangePassword = async () => {
    if (!newMasterPassword || newMasterPassword.length < 6) {
      toast.error('Password too short (min 6 chars)');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_config')
        .upsert({ key: 'master_password', value: newMasterPassword });
      
      if (error) throw error;
      
      setCurrentMasterPassword(newMasterPassword);
      toast.success('Master Password Changed! 🔐');
      setNewMasterPassword('');
      setShowSettings(false);
    } catch (error) {
      toast.error('Failed to update password in DB');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="vh-100 d-flex align-items-center justify-content-center p-4 bg-dark bg-opacity-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-5 text-center shadow-lg border-0 bg-white" 
          style={{ maxWidth: '400px', width: '100%', borderRadius: '32px' }}
        >
          <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-inline-block mb-4 shadow-sm">
            <Lock size={48} />
          </div>
          <h3 className="fw-bold mb-2">Master Vault</h3>
          <p className="text-muted small mb-4">Enter system credentials to proceed.</p>
          
          <form onSubmit={handleLogin}>
            <div className="position-relative mb-3">
              <input 
                type={showPwd ? "text" : "password"} 
                className="form-control text-center py-3 rounded-4 shadow-sm border-2" 
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{ fontSize: '18px', letterSpacing: showPwd ? '0' : '4px' }}
              />
              <button 
                type="button"
                className="btn position-absolute end-0 top-50 translate-middle-y text-muted border-0 shadow-none"
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button className="btn btn-jomao-primary w-100 py-3 rounded-4 shadow-lg d-flex align-items-center justify-content-center gap-2">
              <Unlock size={20} /> Unlock Vault
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="admin-container pb-5"
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <Shield className="text-primary" /> Master Database UI
          </h4>
          <p className="text-muted small">System Node: <span className="text-success fw-bold">Online</span></p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm rounded-circle p-2 shadow-sm" onClick={() => { fetchStats(); fetchRemoteConfig(); }}>
            <RefreshCcw size={20} className="text-muted" />
          </button>
          <button className="btn btn-light btn-sm rounded-circle p-2 shadow-sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={20} className={showSettings ? 'text-primary' : 'text-muted'} />
          </button>
          <button className="btn btn-outline-danger btn-sm px-3 rounded-pill fw-bold" onClick={() => setIsAuthenticated(false)}>
            Lock
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="glass-card p-3 border-0 bg-primary bg-opacity-10">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary text-white p-2 rounded-3"><Users size={24} /></div>
              <div>
                <h6 className="text-muted small mb-0">Total Users</h6>
                <h4 className="fw-bold mb-0">{stats.users}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card p-3 border-0 bg-success bg-opacity-10">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success text-white p-2 rounded-3"><Target size={24} /></div>
              <div>
                <h6 className="text-muted small mb-0">Platform Savings</h6>
                <h4 className="fw-bold mb-0">৳{stats.savings.toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="glass-card p-3 border-0 bg-danger bg-opacity-10">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-danger text-white p-2 rounded-3"><CreditCard size={24} /></div>
              <div>
                <h6 className="text-muted small mb-0">Platform Expenses</h6>
                <h4 className="fw-bold mb-0">৳{stats.expenses.toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card border-0 p-4 shadow-sm bg-primary bg-opacity-5 rounded-4">
              <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <Lock size={16} /> Update Master Password
              </h6>
              <div className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control rounded-3" 
                  placeholder="New Password" 
                  value={newMasterPassword}
                  onChange={(e) => setNewMasterPassword(e.target.value)}
                />
                <button className="btn btn-jomao-primary px-4 rounded-3" onClick={handleChangePassword}>
                  Save
                </button>
              </div>
              <p className="text-muted small mt-2 mb-0">Password must be at least 6 characters.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Tabs */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2 no-scrollbar">
        <TabButton active={activeTab === 'profiles'} icon={<Users size={18}/>} label="Profiles" onClick={() => fetchTableData('profiles')} />
        <TabButton active={activeTab === 'goals'} icon={<Target size={18}/>} label="Goals" onClick={() => fetchTableData('goals')} />
        <TabButton active={activeTab === 'expenses'} icon={<CreditCard size={18}/>} label="Expenses" onClick={() => fetchTableData('expenses')} />
        <TabButton active={activeTab === 'config'} icon={<Settings size={18}/>} label="App Config" onClick={() => fetchTableData('config')} />
      </div>

      {/* Search Bar & Actions */}
      <div className="d-flex gap-2 mb-4">
        <div className="glass-card border-0 p-2 flex-grow-1 shadow-sm rounded-4">
          <div className="input-group">
            <span className="input-group-text bg-transparent border-0"><Search size={18} className="text-muted" /></span>
            <input 
              type="text" 
              className="form-control border-0 shadow-none bg-transparent" 
              placeholder={`Search ${activeTab}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {activeTab !== 'config' && (
          <button className="btn btn-light rounded-4 px-3 shadow-sm d-flex align-items-center gap-2 fw-bold" onClick={exportToCSV}>
            <Download size={18} /> <span className="d-none d-md-inline">Export</span>
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="glass-card border-0 p-0 overflow-hidden shadow-lg rounded-4 bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted small">Accessing Supabase Tables...</p>
          </div>
        ) : activeTab === 'config' ? (
          <div className="p-4">
            <h6 className="fw-bold mb-4 d-flex align-items-center gap-2">
              <Settings size={20} className="text-primary" /> Global Application Configuration
            </h6>
            
            <div className="row g-4">
              <div className="col-12">
                <label className="small fw-bold text-muted mb-2">Global Announcement Banner</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><AlertCircle size={18} /></span>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter text for global notification..." 
                    value={appConfig.announcement}
                    onChange={(e) => setAppConfig({...appConfig, announcement: e.target.value})}
                  />
                  <button className="btn btn-primary" onClick={() => updateAppConfig('global_announcement', appConfig.announcement)}>Update</button>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 border rounded-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-0">Maintenance Mode</h6>
                    <p className="small text-muted mb-0">Disables non-admin access to the app.</p>
                  </div>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      role="switch" 
                      checked={appConfig.maintenance_mode}
                      onChange={(e) => updateAppConfig('maintenance_mode', e.target.checked)}
                      style={{ width: '3rem', height: '1.5rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 border rounded-3">
                  <h6 className="fw-bold mb-2">Streak Freeze Cost</h6>
                  <div className="d-flex gap-2">
                    <input 
                      type="number" 
                      className="form-control" 
                      value={appConfig.streak_freeze_cost}
                      onChange={(e) => setAppConfig({...appConfig, streak_freeze_cost: e.target.value})}
                    />
                    <button className="btn btn-outline-primary" onClick={() => updateAppConfig('streak_freeze_cost', appConfig.streak_freeze_cost)}>Save</button>
                  </div>
                </div>
              </div>

              <div className="col-12">
                <div className="p-3 bg-light rounded-3">
                  <h6 className="fw-bold mb-1 small text-uppercase text-muted">System Health</h6>
                  <div className="d-flex gap-4 mt-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                      <span className="small">Database: Connected</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                      <span className="small">Storage: Optimal</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-success rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                      <span className="small">Auth Service: Active</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-warning bg-opacity-10 border border-warning border-opacity-20 rounded-3">
                    <p className="small mb-0 text-dark">
                      <TrendingUp size={14} className="me-1" /> 
                      <strong>Pro Tip:</strong> If users see "Email rate limit", go to <b>Supabase Dashboard &gt; Authentication &gt; Settings</b> and disable "Confirm Email" for faster testing, or connect <b>Resend/SendGrid</b> SMTP to remove limits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-5">
             <Database size={48} className="text-muted opacity-20 mb-3" />
             <h6 className="fw-bold text-muted">No Data Found</h6>
             <p className="text-muted small">Table might be empty or RLS is blocking access.</p>
             <button className="btn btn-sm btn-light mt-2" onClick={() => fetchTableData(activeTab)}>Retry Fetch</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 border-0 small fw-bold">ID / Identity</th>
                  {activeTab === 'profiles' && <>
                    <th className="py-3 border-0 small fw-bold text-center">XP / Lvl</th>
                    <th className="py-3 border-0 small fw-bold text-center">Streak</th>
                    <th className="py-3 border-0 small fw-bold text-end px-4">Management</th>
                  </>}
                  {activeTab === 'goals' && <>
                    <th className="py-3 border-0 small fw-bold">Name</th>
                    <th className="py-3 border-0 small fw-bold">Progress</th>
                    <th className="py-3 border-0 small fw-bold text-end px-4">Actions</th>
                  </>}
                  {activeTab === 'expenses' && <>
                    <th className="py-3 border-0 small fw-bold text-center">Category</th>
                    <th className="py-3 border-0 small fw-bold text-center">Amount</th>
                    <th className="py-3 border-0 small fw-bold text-end px-4">Actions</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {data.filter(item => JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                  <tr key={item.id} className="border-bottom border-light hover-row">
                    <td className="px-4 py-3">
                      <div className="small fw-bold text-main">{item.full_name || item.name || 'Unknown User'}</div>
                      <div className="text-muted font-monospace" style={{ fontSize: '9px' }}>{item.id}</div>
                    </td>
                    
                    {activeTab === 'profiles' && <>
                      <td className="py-3 text-center">
                        <span className="badge bg-warning text-dark me-1">Lvl {calculateLevel(item.xp || 0).level}</span>
                        <span className="small fw-bold">{item.xp} XP</span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-1">
                          <span className="fw-bold">{item.streak}</span>
                          <Shield size={12} className="text-primary" />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex gap-1 justify-content-end align-items-center">
                          {/* XP Set */}
                          <div className="input-group input-group-sm" style={{ width: '90px' }}>
                            <input 
                              id={`xp-${item.id}`}
                              type="number" 
                              className="form-control form-control-sm px-1 text-center" 
                              placeholder="XP"
                              defaultValue={item.xp}
                            />
                          </div>

                          {/* Streak Set */}
                          <div className="input-group input-group-sm" style={{ width: '80px' }}>
                            <input 
                              id={`streak-${item.id}`}
                              type="number" 
                              className="form-control form-control-sm px-1 text-center" 
                              placeholder="Day"
                              defaultValue={item.streak}
                            />
                          </div>
                          
                          <button 
                            className="btn btn-sm btn-primary p-1 rounded-2" 
                            title="Save Changes" 
                            onClick={() => {
                              const xpVal = parseInt(document.getElementById(`xp-${item.id}`).value) || 0;
                              const streakVal = parseInt(document.getElementById(`streak-${item.id}`).value) || 0;
                              const { level: newLevel } = calculateLevel(xpVal);
                              
                              updateEntry('profiles', item.id, { 
                                xp: xpVal, 
                                level: newLevel,
                                streak: streakVal,
                                last_streak_date: new Date().toISOString().split('T')[0]
                              });
                            }}
                          >
                            <Save size={16} />
                          </button>
                          
                          <button className="btn btn-sm btn-outline-danger p-1 rounded-2" title="Delete User" onClick={() => deleteEntry('profiles', item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>}

                    {activeTab === 'goals' && <>
                      <td className="py-3"><span className="small fw-bold">{item.name}</span></td>
                      <td className="py-3">
                        <div className="input-group input-group-sm" style={{ width: '150px' }}>
                          <input 
                            id={`goal-curr-${item.id}`}
                            type="number" 
                            className="form-control text-center px-1" 
                            defaultValue={item.current_amount}
                          />
                          <span className="input-group-text p-1">/</span>
                          <input 
                            id={`goal-target-${item.id}`}
                            type="number" 
                            className="form-control text-center px-1" 
                            defaultValue={item.target_amount}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button 
                            className="btn btn-sm btn-primary p-1 rounded-2" 
                            onClick={() => {
                              const curr = document.getElementById(`goal-curr-${item.id}`).value;
                              const target = document.getElementById(`goal-target-${item.id}`).value;
                              updateEntry('goals', item.id, { 
                                current_amount: parseFloat(curr), 
                                target_amount: parseFloat(target),
                                is_completed: parseFloat(curr) >= parseFloat(target)
                              });
                            }}
                          >
                            <Save size={16} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger p-1 rounded-2" onClick={() => deleteEntry('goals', item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>}

                    {activeTab === 'expenses' && <>
                      <td className="py-3 text-center">
                        <select 
                          id={`exp-cat-${item.id}`}
                          className="form-select form-select-sm" 
                          defaultValue={item.category}
                        >
                          <option value="Food">Food</option>
                          <option value="Transport">Transport</option>
                          <option value="Shopping">Shopping</option>
                          <option value="Bills">Bills</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Health">Health</option>
                          <option value="Others">Others</option>
                        </select>
                      </td>
                      <td className="py-3 text-center">
                        <input 
                          id={`exp-amt-${item.id}`}
                          type="number" 
                          className="form-control form-control-sm text-center fw-bold text-danger" 
                          defaultValue={item.amount}
                        />
                      </td>
                      <td className="py-3 px-4 text-end">
                        <div className="d-flex gap-2 justify-content-end">
                          <button 
                            className="btn btn-sm btn-primary p-1 rounded-2" 
                            onClick={() => {
                              const cat = document.getElementById(`exp-cat-${item.id}`).value;
                              const amt = document.getElementById(`exp-amt-${item.id}`).value;
                              updateEntry('expenses', item.id, { 
                                category: cat, 
                                amount: parseFloat(amt)
                              });
                            }}
                          >
                            <Save size={16} />
                          </button>
                          <button className="btn btn-sm btn-outline-danger p-1 rounded-2" onClick={() => deleteEntry('expenses', item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 glass-card border-0 text-center opacity-70" style={{ border: '1px dashed var(--border-color)' }}>
         <p className="text-muted font-monospace" style={{ fontSize: '10px' }}>
           <Database size={12} className="me-1" />
           DATA NODE: {window.location.hostname} • SSL: AES-256
         </p>
      </div>
    </motion.div>
  );
};

const TabButton = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`btn d-flex align-items-center gap-2 px-4 py-2 rounded-pill fw-bold transition-all ${
      active ? 'btn-primary shadow-lg scale-105' : 'btn-light text-muted'
    }`}
    style={{ minWidth: 'fit-content' }}
  >
    {icon} {label}
  </button>
);

export default AdminVault;
