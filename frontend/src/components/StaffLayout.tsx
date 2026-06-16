import React from 'react';
import { MenuItem, Order, OrderStatus } from '../types';

interface StaffLayoutProps {
  children: React.ReactNode;
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  onLogout: () => void;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ 
  children, 
  activeScreen, 
  onScreenChange,
  onLogout
}) => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div>
          <div className="sidebar-title">Backoffice Control</div>
          <nav className="role-nav">
            <button 
              className={`nav-item ${activeScreen === 'kitchen' ? 'active' : ''}`}
              onClick={() => onScreenChange('kitchen')}
            >
              <div className="nav-item-left">
                <span className="nav-icon">👨‍🍳</span>
                <span>Kitchen Monitor</span>
              </div>
            </button>
            <button 
              className={`nav-item ${activeScreen === 'dispatch' ? 'active' : ''}`}
              onClick={() => onScreenChange('dispatch')}
            >
              <div className="nav-item-left">
                <span className="nav-icon">🛵</span>
                <span>Dispatch Queue</span>
              </div>
            </button>
            <button 
              className={`nav-item ${activeScreen === 'menu-editor' ? 'active' : ''}`}
              onClick={() => onScreenChange('menu-editor')}
            >
              <div className="nav-item-left">
                <span className="nav-icon">📋</span>
                <span>Menu Management</span>
              </div>
            </button>
          </nav>
        </div>
        
        <div style={{ padding: '16px' }}>
          <button className="btn-reset" onClick={onLogout} style={{ width: '100%', justifyContent: 'center' }}>
            🚪 Exit Backoffice
          </button>
        </div>
      </aside>

      <main className="main-display">
        <header className="app-header">
          <div className="brand-section">
            <div className="brand-logo">🌌 AETHERIA</div>
            <div className="brand-tagline">Staff Operating System</div>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default StaffLayout;
