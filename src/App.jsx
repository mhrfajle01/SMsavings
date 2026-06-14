import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Goals = lazy(() => import('./pages/Goals'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Challenges = lazy(() => import('./pages/Challenges'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status" />
        </div>
      }>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
          
          {/* Protected App Routes */}
          <Route path="/" element={user ? <MainLayout><Dashboard /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/goals" element={user ? <MainLayout><Goals /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/expenses" element={user ? <MainLayout><Expenses /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/challenges" element={user ? <MainLayout><Challenges /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/analytics" element={user ? <MainLayout><Analytics /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <MainLayout><Profile /></MainLayout> : <Navigate to="/login" />} />
          <Route path="/admin-vault" element={user ? <MainLayout><Admin /></MainLayout> : <Navigate to="/login" />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
