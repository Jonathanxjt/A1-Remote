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
  FilePenLine,  // Adding a new icon for "My Request"
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

  // Handle navigation to the request page
  const handleRequestsClick = () => {
    navigate("/MakeRequest");
  };

  // Handle navigation to the My Request page
  const handleMyRequestsClick = () => {
    navigate("/MyRequests"); // Navigate to the MyRequest page
  };

  // Handle navigation to the schedule page
  const handleScheduleClick = () => {
    navigate("/MySchedule");
  };

  // Handle navigation to the mailbox page
  const handleMailboxClick = () => {
    navigate("/Mailbox"); // Navigate to the Mailbox page
  };

  // Handle navigation to the view requests page
  const handleViewRequestsClick = () => {
    navigate("/ManageRequests"); // Navigate to the View Requests page
  };

  // Function to handle sign-out
  const handleSignOut = () => {
    sessionStorage.clear(); // Clear session storage to log out the user
    navigate("/login"); // Redirect to login page
  };

  // Function to handle sign-in
  const handleSignIn = () => {
    navigate("/login"); // Redirect to login page
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Sidebar header with brand and toggle button */}
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

      {/* Navigation items, only shown if the user is logged in */}
      {isLoggedIn && (
        <nav className="sidebar-nav flex flex-col space-y-4 p-4">
          <NavItem
            icon={<FileText size={24} />}
            label="Dashboard"
            collapsed={collapsed}
          />
          <NavItem
            icon={<FilePenLine size={24} />}
            label="Make Request"
            collapsed={collapsed}
            onClick={handleRequestsClick}
          />
          {/* Add new "My Request" item */}
          <NavItem
            icon={<ClipboardList size={24} />} // Use the List icon from Lucide for My Requests
            label="My Requests"
            collapsed={collapsed}
            onClick={handleMyRequestsClick}  // Navigate to /MyRequest
          />
          {/* Only show View Requests if user role is not '2' */}
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

          {/* Mailbox navigation item with unread count badge */}
          <NavItem
            icon={
              <div className="mail-icon-container">
                <Mail size={24} />
                {/* Display unread badge if there are unread emails */}
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

      {/* Sign in/out button, always visible */}
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
  icon: React.ReactNode; // Icon to be displayed for the navigation item
  label: string; // Label of the navigation item
  collapsed: boolean; // Whether the sidebar is collapsed or not
  onClick?: () => void; // Optional click handler for the navigation item
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
    {/* Show label only if the sidebar is not collapsed */}
    {!collapsed && <span>{label}</span>}
  </div>
);

export default Sidebar;
