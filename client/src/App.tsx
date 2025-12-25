import { Switch, Route, Redirect } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { CreatePost } from "@/components/feed/create-post";
import { MapView } from "@/components/feed/map-view";
import LoginPage from "@/pages/login";
import UserFeedPage from "@/pages/user-feed";
import MyReportsPage from "@/pages/my-reports";
import AdminDashboardPage from "@/pages/admin-dashboard-enhanced";
import NotFound from "@/pages/not-found";
import { MaintenanceIssue, User } from "@shared/schema";
import "leaflet/dist/leaflet.css";

function AuthenticatedApp() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("userFeed");
  const [showMapSheet, setShowMapSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);

  // Fetch issues for map panel
  const { data: issues } = useQuery<(MaintenanceIssue & { reporter: User })[]>({
    queryKey: ["/api/issues"],
    enabled: showMapSheet, // Only fetch when map is shown
  });

  // Set default page based on user role
  useEffect(() => {
    if (user?.role === "admin") {
      setCurrentPage("adminDashboard");
    } else {
      setCurrentPage("userFeed");
    }
  }, [user?.role]);

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "userFeed":
        return <UserFeedPage onOpenMap={() => setShowMapSheet(true)} onOpenReport={() => setShowReportSheet(true)} />;
      case "adminDashboard":
        return user.role === "admin" ? (
          <AdminDashboardPage />
        ) : (
          <UserFeedPage onOpenMap={() => setShowMapSheet(true)} onOpenReport={() => setShowReportSheet(true)} />
        );
      case "myReports":
        return <MyReportsPage />;
      case "settings":
        return (
          <div className="flex items-center justify-center h-[calc(100vh-4rem)] px-4">
            <div className="text-center">
              <p className="text-gray-500 text-lg">Settings page coming soon</p>
            </div>
          </div>
        );
      default:
        return <UserFeedPage onOpenMap={() => setShowMapSheet(true)} onOpenReport={() => setShowReportSheet(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onShowMap={() => {
          setShowMapSheet(true);
          setSidebarOpen(false);
        }}
        onShowReport={() => {
          setShowReportSheet(true);
          setSidebarOpen(false);
        }}
      />

      <main className="pb-4">
        {renderCurrentPage()}
      </main>

      {/* Map Sheet */}
      <Sheet open={showMapSheet} onOpenChange={setShowMapSheet}>
        <SheetContent side="left" className="w-full p-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex-shrink-0 bg-white z-10 relative">
              <button
                onClick={() => setShowMapSheet(false)}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close map"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold">Issue Map</h2>
              <p className="text-sm text-gray-600">View all reported issues on the map</p>
            </div>
            <div className="flex-1 relative">
              <MapView issues={issues} />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Report Sheet */}
      <Sheet open={showReportSheet} onOpenChange={setShowReportSheet}>
        <SheetContent side="right" className="w-full p-0 overflow-y-auto">
          <div className="p-4 relative">
            <button
              onClick={() => setShowReportSheet(false)}
              className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              aria-label="Close report form"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <CreatePost />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
