import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import RequestPage from './pages/RequestPage/request';
import Home from './pages/Home'; // Import the Home component
import './App.css';

const App: React.FC = () => {
  return (
    <div className="maincontainer"> {/* ensures that the sidebar does not cover the main-content */}
      <Sidebar /> 
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} /> {/* Default route */}
          <Route path="/requestpage" element={<RequestPage />} /> {/*requestPage route */}
          {/* Add other routes here */}
        </Routes>
      </div>
      <footer className="footer">
        <p>Footer Content</p> {/* TODO: come up with the footer content */}
      </footer>
    </div>
  );
};

export default App;