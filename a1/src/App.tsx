import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Footer from "./components/footer.tsx";
import NotificationSocket from "./components/NotificationSocket.js";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home";
import Login from "./pages/Login/Login"; // Ensure Login is imported here
import Mailbox from "./pages/Mailbox/Mailbox.tsx";
import ManageRequests from "./pages/ManageRequests/ManageRequests.tsx";
import MyRequests from "./pages/MyRequests/MyRequests";
import MySchedule from "./pages/MySchedule/MySchedule";
import NotFound from "./pages/NotFound";
import RequestPage from "./pages/RequestPage/RequestPage.tsx";
import ViewOverall from "./pages/ViewOverall/ViewOverall.tsx";
import { useNavigate } from "react-router-dom";

const App: React.FC = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();  
  // Update notification count based on unread notifications
  const notificationCount = notifications.length;

  const [staffId, setStaffId] = useState(null);

  // Function to handle login/logout changes
  const handleStorageChange = () => {
    const id = sessionStorage.getItem("staff_id");
    setStaffId(id);
  };

  // Function to update staffId when user logs in
  const handleLogin = (newStaffId) => {
    sessionStorage.setItem("staff_id", newStaffId); // Save to session storage
    setStaffId(newStaffId); // Update state in App
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setStaffId(null);
  };

  useEffect(() => {
    // Fetch staff ID from session storage when the app loads
    const id = sessionStorage.getItem("staff_id");
    if (id) {
      setStaffId(id); // Set staff ID if available
    }
    else
    {
      navigate("/login");
    }
    // Listen for storage changes (e.g., login/logout across tabs)
    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener when component unmounts
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="maincontainer">
      {/* ensures that the sidebar does not cover the main-content */}
      <Sidebar notifications={notifications} onLogout={handleLogout} />
      <div className="main-content">
        {/* Conditionally render NotificationWebSocket only when logged in */}
        {staffId && (
          <NotificationSocket
            staffId={staffId}
            setNotifications={setNotifications}
          />
        )}
        <ToastContainer />

        {/* Routes for different pages */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* Default route */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />{" "}
          {/* Pass the handleLogin function to Login */}
          <Route path="/MakeRequest" element={<RequestPage />} />{" "}
          {/* RequestPage route */}
          <Route path="/ViewOverall" element={<ViewOverall />} />{" "}
          {/* Overall route */}
          <Route path="/MySchedule" element={<MySchedule />} />{" "}
          {/* MySchedule route */}
          <Route path="/ManageRequests" element={<ManageRequests />} />{" "}
          {/* ManageRequests route */}
          <Route path="/MyRequests" element={<MyRequests />} />{" "}
          {/* MyRequests route */}
          <Route
            path="/Mailbox"
            element={
              <Mailbox
                notifications={notifications}
                setNotifications={setNotifications}
              />
            }
          />
          <Route path="*" element={<NotFound />} /> {/* 404 route */}
        </Routes>

        {/* Footer for the app */}
        <Footer />
      </div>
    </div>
  );
};

export default App;
