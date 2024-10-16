import React, {useState} from 'react';
import {Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import RequestPage from './pages/RequestPage/request';
import Login from './pages/Login/Login';
import NotFound from './pages/NotFound';
import MySchedule from './pages/MySchedule/MySchedule';
import Home from './pages/Home';
import Footer from './components/footer.tsx';
import ViewRequests from './pages/ViewRequests/ViewRequests';
import Mailbox from './pages/Mailbox/Mailbox.tsx';
import './App.css';


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

  const unreadEmailsCount = emails.filter(email => email.status === "unread").length;

  return (
    <div className="maincontainer"> {/* ensures that the sidebar does not cover the main-content */}
      <Sidebar unreadCount = {unreadEmailsCount}/> 
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Default route */}
          <Route path="/login" element={<Login />} /> {/* Login route */}
          <Route path="/requestpage" element={<RequestPage />} /> {/*requestPage route */}
          <Route path="/MySchedule" element={<MySchedule />} /> {/*myschedule route */}
          <Route path="/ViewRequests" element={<ViewRequests />} /> {/*viewrequests route */}
          <Route path="/Mailbox" element={<Mailbox emails={emails} setEmails={setEmails}/>}/>
          <Route path="*" element={<NotFound />} /> {/* 404 route */}
        </Routes>
        <Footer/>
      </div>
    </div>
  );
};

export default App;