import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Calendar,
  Settings,
  Clipboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "./Sidebar.css"; // Import the separate CSS file

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <h1 className="brand">{!collapsed && "A1"}</h1>
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-item">
          <FileText size={24} />
          {!collapsed && <span>Dashboard</span>}
        </div>

        <div className="nav-item">
          <Clipboard size={24} />
          {!collapsed && <span>Requests</span>}
        </div>

        <div className="nav-item">
          <Calendar size={24} />
          {!collapsed && <span>Schedule</span>}
        </div>

        <div className="nav-item">
          <Settings size={24} />
          {!collapsed && <span>Settings</span>}
        </div>
      </nav>

      <div className="sign-out">
        <Button className="sign-out-btn">
          <LogOut size={24} />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
