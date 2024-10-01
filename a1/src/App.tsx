import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import "./App.css";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar/Sidebar";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound";
import MySchedule from "./pages/MySchedule/MySchedule";

function App() {


  return (
    <div className="maincontainer"> {/* ensures that the sidebar does not cover the main-content */}
    <Sidebar />
    <div className="main-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/MySchedule" element={<MySchedule />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </div>

      
      <footer className="footer">
        <p>Footer Content</p> {/* TODO: come up with the footer content */}
      </footer>
    </div>
  );
}

export default App;
