import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Home, BarChart3, Settings, Shield, MapPin, FileText, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
  onShowMap?: () => void;
  onShowReport?: () => void;
}

export function Sidebar({ isOpen, onClose, currentPage, onNavigate, onShowMap, onShowReport }: SidebarProps) {
  const { user } = useAuth();

  const navigation = [
    { name: 'Feed', icon: Home, page: 'userFeed', show: true },
    { name: 'Create Report', icon: PlusCircle, page: 'createReport', show: true, action: onShowReport },
    { name: 'View Map', icon: MapPin, page: 'viewMap', show: true, action: onShowMap },
    { name: 'My Reports', icon: FileText, page: 'myReports', show: user?.role !== 'admin' },
    { name: 'Admin Dashboard', icon: Shield, page: 'adminDashboard', show: user?.role === 'admin' },
    { name: 'Settings', icon: Settings, page: 'settings', show: true },
  ];

  const isAdmin = currentPage === 'adminDashboard';

  const handleNavigate = (page: string, action?: () => void) => {
    if (action) {
      action();
    } else {
      onNavigate(page);
    }
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
      )}

      {/* Sidebar - Mobile Optimized */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-out will-change-transform',
          isAdmin ? 'bg-admin-gradient-dark text-white shadow-xl' : 'bg-white shadow-xl',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={cn('p-4 border-b', isAdmin ? 'border-white/10' : 'border-gray-200')}>
          <h3 className={cn('text-lg font-semibold', isAdmin ? 'text-white' : 'text-gray-900')}>Menu</h3>
        </div>
        
        <nav className="mt-4 space-y-2 px-3 pb-6">
          {navigation.map((item) => {
            if (!item.show) return null;
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => handleNavigate(item.page, item.action)}
                className={cn(
                  'w-full justify-start px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg',
                  isAdmin
                    ? cn('bg-transparent text-white/90 hover:bg-white/10', isActive && 'bg-white/15 text-white')
                    : cn('text-gray-700 hover:bg-gray-100', isActive && 'bg-gray-100 text-gray-900')
                )}
              >
                <Icon className={cn('mr-3', isAdmin ? 'text-white' : 'text-gray-600')} size={18} />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
