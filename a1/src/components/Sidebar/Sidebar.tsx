import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Calendar,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css"; // Assuming you have some CSS for base styling

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleRequestsClick = () => {
    navigate("/requestpage");
  };

  const handleScheduleClick = () => {
    navigate("/MySchedule");
  };

  // Function to handle sign-out
  const handleSignOut = () => {
    // Clear all session storage
    sessionStorage.clear();
    
    // Redirect the user to the login page
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header flex items-center justify-between p-4">
        <h1 className="brand">{!collapsed && "A1"}</h1>
        <Button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </Button>
      </div>

      <nav className="sidebar-nav flex flex-col space-y-4 p-4">
        {/* Dashboard */}
        <div className="nav-item flex items-center space-x-3 cursor-pointer">
          <FileText size={24} />
          {!collapsed && <span>Dashboard</span>}
        </div>

        {/* Requests */}
        <div className="nav-item flex items-center space-x-3 cursor-pointer" onClick={handleRequestsClick}>
          <Clipboard size={24} />
          {!collapsed && <span>Requests</span>}
        </div>

        {/* Schedule */}
        <div className="nav-item flex items-center space-x-3 cursor-pointer" onClick={handleScheduleClick}>
          <Calendar size={24} />
          {!collapsed && <span>Schedule</span>}
        </div>
      </nav>

      <div className="sign-out flex items-center justify-start space-x-3 p-4 mt-auto">
        {/* Sign-out button */}
        <Button className="sign-out-btn flex items-center space-x-3" onClick={handleSignOut}>
          <LogOut size={24} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
