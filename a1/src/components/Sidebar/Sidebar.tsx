import { Button } from "@/components/ui/button";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  FileText,
  LogIn,
  LogOut,
  Mail,
  FilePenLine,
  AlertCircle,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

// SidebarProps interface
interface SidebarProps {
  notifications: Array<{ is_read: boolean }>;
  onLogout: () => void; // <-- Accept onLogout function as a prop
}

const Sidebar: React.FC<SidebarProps> = ({ notifications, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const navigate = useNavigate();

    // Calculate unread notifications
    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Check if user is logged in and get user role from session storage
  useEffect(() => {
    const checkUserStatus = () => {
      const user = sessionStorage.getItem("user");
      if (user) {
        setIsLoggedIn(true);
        const parsedUser = JSON.parse(user);
        setUserRole(parsedUser.role);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    checkUserStatus();
    // Set up interval to refresh user status every second
    const interval = setInterval(checkUserStatus, 1000);

    // Clean up the interval when the component is unmounted
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Automatically detect screen size and disable expand on small screens
  const handleResize = () => {
    if (window.innerWidth < 768) {
      setCollapsed(true); // Collapse the sidebar on small screens
      setIsSmallScreen(true); // Mark it as small screen
    } else {
      setIsSmallScreen(false); // Re-enable the chevron and collapsing on larger screens
    }
  };

  // Set up event listener for window resize
  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check when the component mounts

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handle sidebar toggle only for larger screens
  const toggleSidebar = useCallback(() => {
    if (!isSmallScreen) {
      setCollapsed((prev) => !prev);
    }
  }, [isSmallScreen]);

  const handleRequestsClick = () => {
    navigate("/MakeRequest");
  };

  const handleDashboardClick = () => {
    navigate("/ViewOverall");
  };

  const handleMyRequestsClick = () => {
    navigate("/MyRequests");
  };

  const handleScheduleClick = () => {
    navigate("/MySchedule");
  };

  const handleMailboxClick = () => {
    navigate("/Mailbox");
  };

  const handleViewRequestsClick = () => {
    navigate("/ManageRequests");
  };


   // Updated sign-out handler to use the provided onLogout prop
   const handleSignOut = () => {
    onLogout(); // Call the onLogout function from props first
    setIsLoggedIn(false);
    setUserRole(null);
    navigate("/login");
  };

  // Function to handle sign-in
  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div
        className={`sidebar-header flex items-center justify-between p-4 ${
          isSmallScreen ? "small-screen" : ""
        }`}
      >
        <h1 className="brand">{isSmallScreen ? "A1" : !collapsed && "A1"}</h1>
        {!isSmallScreen && (
          <Button className="toggle-btn" onClick={toggleSidebar}>
            {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </Button>
        )}
      </div>
      {isLoggedIn && (
        <nav className="sidebar-nav flex flex-col space-y-4 p-4">
          {userRole == 1 && (
          <NavItem
            icon={<FileText size={24} />}
            label="Dashboard"
            collapsed={collapsed}
            onClick={handleDashboardClick}
          />
          )}
          <NavItem
            icon={<FilePenLine size={24} />}
            label="Make Request"
            collapsed={collapsed}
            onClick={handleRequestsClick}
          />
          <NavItem
            icon={<ClipboardList size={24} />}
            label="My Requests"
            collapsed={collapsed}
            onClick={handleMyRequestsClick}
          />
          {userRole !== 2 && (
            <NavItem
              icon={<FileCheck2 size={24} />}
              label="Manage Requests"
              collapsed={collapsed}
              onClick={handleViewRequestsClick}
            />
          )}
          <NavItem
            icon={<Calendar size={24} />}
            label="Schedule"
            collapsed={collapsed}
            onClick={handleScheduleClick}
          />
          <NavItem
            icon={
              <div className="mail-icon-container relative">
                <Mail size={24} />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex">
                    <AlertCircle 
                      size={16} 
                      className="text-red-500 fill-red-500"
                    />
                  </div>
                )}
              </div>
            }
            label="Mailbox"
            collapsed={collapsed}
            onClick={handleMailboxClick}
          />
        </nav>
      )}
      <div className="sign-out flex items-center justify-start space-x-3 p-4 mt-auto">
        <Button
          className="sign-out-btn flex items-center space-x-3"
          onClick={isLoggedIn ? handleSignOut : handleSignIn}
        >
          {isLoggedIn ? <LogOut size={24} /> : <LogIn size={24} />}
          {!collapsed && <span>{isLoggedIn ? "Sign Out" : "Sign In"}</span>}
        </Button>
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  collapsed,
  onClick,
}) => (
  <div
    className="nav-item flex items-center space-x-3 cursor-pointer"
    onClick={onClick}
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </div>
);

export default Sidebar;
