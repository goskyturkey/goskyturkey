'use client';

import AdminSidebar from '@/components/AdminSidebar';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../../contexts/AuthContext';
import './admin.css';

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    return (
        <html lang="tr">
            <body>
                <AuthProvider>
                    <div className="admin-wrapper">
                        {isLoginPage ? (
                            children
                        ) : (
                            <div className="admin-layout">
                                <AdminSidebar />
                                <main className="admin-main">
                                    {children}
                                </main>
                            </div>
                        )}
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
