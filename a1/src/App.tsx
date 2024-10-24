import React, { useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/footer.tsx";
import Sidebar from "./components/Sidebar/Sidebar";
import Home from "./pages/Home";
import Login from "./pages/Login/Login";
import Mailbox from "./pages/Mailbox/Mailbox.tsx";
import MySchedule from "./pages/MySchedule/MySchedule";
import NotFound from "./pages/NotFound";
import RequestPage from "./pages/RequestPage/RequestPage.tsx";
import ManageRequests from "./pages/ManageRequests/ManageRequests.tsx";
import MyRequests from "./pages/MyRequests/MyRequests";
import NotificationPolling from "./components/NotificationPolling.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  const [emails, setEmails] = useState([
    {
      email_id: 1,
      subject: "WFH Request for 10-11-24 Approved",
      date: "2024-10-15",
      status: "unread",
    },
    {
      email_id: 2,
      subject: "WFH Request for 11-11-24 Rejected",
      date: "2024-10-14",
      status: "read",
    },
    {
      email_id: 3,
      subject: "WFH on 13-11-24 Revoked",
      date: "2024-10-13",
      status: "unread",
    },
    {
      email_id: 4,
      subject: "WFH Request for 14-11-24 Approved",
      date: "2024-10-12",
      status: "read",
    },
  ]);

  const unreadEmailsCount = emails.filter(
    (email) => email.status === "unread"
  ).length;

  const [staffId, setStaffId] = useState(null);

  useEffect(() => {
    // Fetch staff ID from session storage when the app loads
    const id = sessionStorage.getItem("staff_id");
    if (id) {
      setStaffId(id); // Set staff ID if available
    }
  }, []);

  return (
    <div className="maincontainer">
      {/* ensures that the sidebar does not cover the main-content */}
      <Sidebar unreadCount={unreadEmailsCount} />
      <div className="main-content">
        {/* Always render NotificationPolling and ToastContainer */}
        {staffId && <NotificationPolling staffId={staffId} />}
        <ToastContainer />
        
        {/* Routes for different pages */}
        <Routes>
          <Route path="/" element={<Home />} /> {/* Default route */}
          <Route path="/login" element={<Login />} /> {/* Login route */}
          <Route path="/MakeRequest" element={<RequestPage />} /> {/* RequestPage route */}
          <Route path="/MySchedule" element={<MySchedule />} /> {/* MySchedule route */}
          <Route path="/ManageRequests" element={<ManageRequests />} /> {/* ManageRequests route */}
          <Route path="/MyRequests" element={<MyRequests />} /> {/* MyRequests route */}
          <Route
            path="/Mailbox"
            element={<Mailbox emails={emails} setEmails={setEmails} />}
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
