import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <div className="admin-layout">
            {/* Mobile Header */}
            <header className="mobile-header">
                <h1 style={{ color: 'var(--primary)', fontSize: '20px', fontWeight: 'bold' }}>Eliotel</h1>
                <button
                    onClick={toggleSidebar}
                    style={{ background: 'none', border: 'none', padding: '8px' }}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
                onClick={closeSidebar}
            />

            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

            <main className="main-content">
                <div className="animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
