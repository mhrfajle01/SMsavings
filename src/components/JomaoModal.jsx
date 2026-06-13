import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const JomaoModal = ({ isOpen, onClose, title, children, color = 'primary' }) => {
  const { isDarkMode } = useAppContext();

  // Color mapping for different modal types
  const themes = {
    primary: 'linear-gradient(135deg, #00C896, #3B82F6)',
    danger: 'linear-gradient(135deg, #FF5A5F, #B91C1C)',
    warning: 'linear-gradient(135deg, #FFD166, #F59E0B)',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="jomao-modal-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.95)', // Extremely dark for focus
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="jomao-modal-container"
          style={{
            width: '100%',
            maxWidth: '450px',
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Colorful Header */}
          <div 
            className="p-4 d-flex justify-content-between align-items-center"
            style={{ background: themes[color] || themes.primary, color: 'white' }}
          >
            <h5 className="fw-bold mb-0">{title}</h5>
            <button 
              className="btn btn-link text-white p-0 border-0 outline-none" 
              onClick={onClose}
              style={{ textDecoration: 'none' }}
            >
              <X size={28} />
            </button>
          </div>

          {/* Modal Content Area */}
          <div className="p-4" style={{ backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF' }}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JomaoModal;
