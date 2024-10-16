import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Calendar,
  Clipboard,
  Mail,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

// SidebarProps interface
interface SidebarProps {
  unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ unreadCount }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const navigate = useNavigate();

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
    navigate("/requestpage");
  };

  const handleScheduleClick = () => {
    navigate("/MySchedule");
  };

  const handleMailboxClick = () => {
    navigate("/Mailbox"); // Navigate to the Mailbox page
  };

  const handleViewRequestsClick = () => {
    navigate("/ViewRequests"); // Navigate to the View Requests page
  };

  // Function to handle sign-out
  const handleSignOut = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className={`sidebar-header flex items-center justify-between p-4 ${isSmallScreen ? "small-screen" : ""}`}>
        <h1 className="brand">{isSmallScreen ? "A1" : !collapsed && "A1"}</h1>
        {!isSmallScreen && (
          <Button className="toggle-btn" onClick={toggleSidebar}>
            {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </Button>
        )}
      </div>

      <nav className="sidebar-nav flex flex-col space-y-4 p-4">
        <NavItem icon={<FileText size={24} />} label="Dashboard" collapsed={collapsed} />
        <NavItem
          icon={<Clipboard size={24} />}
          label="Make Request"
          collapsed={collapsed}
          onClick={handleRequestsClick}
        />
        {/* New View Requests navigation item */}
        <NavItem
          icon={<Eye size={24} />}
          label="View Requests"
          collapsed={collapsed}
          onClick={handleViewRequestsClick}
        />
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

      <div className="sign-out flex items-center justify-start space-x-3 p-4 mt-auto">
        <Button className="sign-out-btn flex items-center space-x-3" onClick={handleSignOut}>
          <LogOut size={24} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};

// Refactored NavItem for clarity and reusability
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, collapsed, onClick }) => (
  <div className="nav-item flex items-center space-x-3 cursor-pointer" onClick={onClick}>
    {icon}
    {!collapsed && <span>{label}</span>}
  </div>
);

export default Sidebar;
