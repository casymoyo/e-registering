import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const getUserInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : '';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-4">
      <a className="navbar-brand fw-bold" href="#">IDConnect Zim</a>
      <div className="collapse navbar-collapse justify-content-end">
        <ul className="navbar-nav">
          <li className="nav-item">
            <Link to="/" className="nav-link active">Home</Link>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">How It Works</a>
          </li>
          <li className="nav-item">
            <a className="nav-link" href="#">About</a>
          </li>
          <li className="nav-item">
            {user ? (
              <span className="nav-link fw-bold text-light rounded-5 bg-dark">
                {getUserInitial(user.email)}
              </span>
            ) : (
              <a className="nav-link" href="#">Login</a>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
