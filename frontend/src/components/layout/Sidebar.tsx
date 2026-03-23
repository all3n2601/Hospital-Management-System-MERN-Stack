import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import type { AuthUser } from '@/store/authSlice';
import {
  LayoutDashboard, Users, Calendar, FileText, FlaskConical,
  Pill, Package, Award, BarChart3, Settings, LogOut, Menu, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<AuthUser['role']>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'doctor', 'nurse', 'receptionist', 'patient'] },
  { label: 'Patients', href: '/admin/patients', icon: Users, roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { label: 'Billing', href: '/admin/billing', icon: FileText, roles: ['admin', 'receptionist'] },
  { label: 'My Bills', href: '/patient/billing', icon: FileText, roles: ['patient'] },
  { label: 'Lab Orders', href: '/doctor/lab', icon: FlaskConical, roles: ['doctor'] },
  { label: 'Lab Results', href: '/patient/lab', icon: FlaskConical, roles: ['patient'] },
  { label: 'Lab Management', href: '/admin/lab', icon: FlaskConical, roles: ['admin', 'nurse'] },
  { label: 'Prescriptions', href: '/doctor/prescriptions', icon: Pill, roles: ['doctor'] },
  { label: 'Dispensing Queue', href: '/nurse/dispensing', icon: Pill, roles: ['nurse'] },
  { label: 'My Prescriptions', href: '/patient/prescriptions', icon: Pill, roles: ['patient'] },
  { label: 'Pharmacy', href: '/admin/pharmacy', icon: Pill, roles: ['admin'] },
  { label: 'Inventory', href: '/admin/inventory', icon: Package, roles: ['admin', 'nurse'] },
  { label: 'Documents', href: '/documents', icon: Award, roles: ['admin', 'doctor', 'patient'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['admin'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },
];

export function Sidebar() {
  const { user } = usePermissions();
  const { logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className={cn(
      'flex flex-col h-full bg-white dark:bg-gray-900 border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo area */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">HMS</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="p-2 border-t border-border">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        )}
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
