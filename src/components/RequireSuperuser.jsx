
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

const RequireSuperuser = ({ children }) => {
  const [isSuperuser, setIsSuperuser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;
      if (!user) return navigate("/");

      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.log('failed')
        navigate("/");
        return;
      }

      const data = await res.json();
      if (data.role === "superuser") {
        setIsSuperuser(true);
      } else {
        navigate("/");
      }
    };

    checkRole();
  }, [navigate]);

  if (isSuperuser === null) return <p>Checking access...</p>;

  return <>{children}</>;
};

export default RequireSuperuser;
