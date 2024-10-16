import React from 'react';
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
  
  return (
    <div className="maincontainer"> {/* ensures that the sidebar does not cover the main-content */}
      <Sidebar /> 
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Default route */}
          <Route path="/login" element={<Login />} /> {/* Login route */}
          <Route path="/requestpage" element={<RequestPage />} /> {/*requestPage route */}
          <Route path="/MySchedule" element={<MySchedule />} /> {/*myschedule route */}
          <Route path="/ViewRequests" element={<ViewRequests />} /> {/*viewrequests route */}
          <Route path="/Mailbox" element = {<Mailbox/>} />
          <Route path="*" element={<NotFound />} /> {/* 404 route */}
        </Routes>
        <Footer/>
      </div>
    </div>
  );
};

export default App;