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
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

// SidebarProps interface
interface SidebarProps {
  unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ unreadCount }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<number | null>(null);
  const navigate = useNavigate();

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
    const interval = setInterval(checkUserStatus, 1000); // Refresh user status every second

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

  // Function to handle sign-out
  const handleSignOut = () => {
    sessionStorage.clear(); // Clear session storage to log out the user
    navigate("/login");
  };

  // Function to handle sign-in
  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div
        className={`sidebar-header flex items-center justify-between p-4 ${isSmallScreen ? "small-screen" : ""
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
          <NavItem
            icon={<FileText size={24} />}
            label="Dashboard"
            collapsed={collapsed}
            onClick={handleDashboardClick}

          />
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
              <div className="mail-icon-container">
                <Mail size={24} />
                {unreadCount > 0 && (
                  <div className="unread-badge">{unreadCount}</div>
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

// Refactored NavItem component for clarity and reusability
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
