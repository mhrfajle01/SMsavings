import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Zap, Target, CreditCard } from 'lucide-react';

const TutorialModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    { title: "স্বাগতম!", desc: "Jomao-তে আপনাকে স্বাগতম! চলুন দেখা যাক কীভাবে সঞ্চয় করবেন।", icon: <Zap size={48} className="text-warning"/> },
    { title: "লক্ষ্য নির্ধারণ", desc: "আপনার স্বপ্ন পূরণের জন্য Goal অপশনে গিয়ে নতুন লক্ষ্য যোগ করুন।", icon: <Target size={48} className="text-primary"/> },
    { title: "খরচের হিসাব", desc: "আপনার প্রতিদিনের খরচ ট্র্যাক করতে Expense অপশন ব্যবহার করুন।", icon: <CreditCard size={48} className="text-danger"/> },
    { title: "লেভেল আপ", desc: "নিয়মিত সঞ্চয় করে লেভেল বাড়ান এবং নতুন থিম আনলক করুন!", icon: <Zap size={48} className="text-success"/> },
  ];

  if (!isOpen) return null;

  return (
    <div className="jomao-modal-overlay" style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', 
        alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-4 border-0 rounded-4"
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <button className="btn btn-link text-muted p-0 position-absolute top-0 end-0 m-3" onClick={onClose}><X/></button>
        <div className="text-center mb-4">
          <div className="mb-3">{steps[step].icon}</div>
          <h4 className="fw-bold">{steps[step].title}</h4>
          <p className="text-muted">{steps[step].desc}</p>
        </div>
        <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted small">{step + 1} / {steps.length}</span>
            {step < steps.length - 1 ? (
                <button className="btn btn-primary rounded-pill" onClick={() => setStep(step + 1)}>পরবর্তী <ArrowRight size={16}/></button>
            ) : (
                <button className="btn btn-success rounded-pill" onClick={onClose}>শুরু করুন</button>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialModal;
