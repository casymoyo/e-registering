import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home"; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Navbar from "./components/Navbar";
import Apply from "./pages/Apply";
import AdminDashboard from "./components/Dashboard";
import RequireSuperuser from "./components/RequireSuperuser";
// import EditApplication from './components/EditApplication';
// import Status from './components/Status';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/edit" element={<EditApplication />} />
        <Route path="/status" element={<Status />} /> */}
         <Route path="/apply" element={<Apply />} />
         <Route path="/admin" element={<AdminDashboard/>} />
      </Routes>
    </Router>
  );
}

export default App;
