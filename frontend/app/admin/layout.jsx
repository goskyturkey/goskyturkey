'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import './admin.css';

export default function AdminLayout({ children }) {
    return (
        <AuthProvider>
            <div className="admin-wrapper">
                {children}
            </div>
        </AuthProvider>
    );
}
