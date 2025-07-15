import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaEdit, FaInfoCircle } from 'react-icons/fa';

const Sidebar = () => {
  return (
    <div style={{ width: "200px", background: "#f8f9fa", height: "100vh", padding: "20px" }}>
      <ul className="list-unstyled">
        <li><Link className='text-dark' style={{textDecoration:'none'}}><FaFileAlt /> Apply</Link></li>
        <li className='mt-2 mb-2'><Link className='text-dark' style={{textDecoration:'none'}}><FaEdit /> Edit</Link></li>
        <li><Link className='text-dark' style={{textDecoration:'none'}}><FaInfoCircle /> Status</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;
