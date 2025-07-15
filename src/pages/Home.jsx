import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaUserPlus, FaSignInAlt } from 'react-icons/fa';

const Home = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleGetStarted = () => {
    if (!currentUser) {
      setShowModal(true);
    } else {
      window.location.href = '/apply';
    }
  };

  const handleAuth = async () => {
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    }
  };
  return (
    <div className='bg-light' style={{minHeight:'100vh'}}>

      {/* Intro Section */}
      <div className="bg-dark bg-dark-subtle" style={{ padding: '2rem' }}>
        <div className="container">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
                <div className="mb-4">
                    <h1 className="display-4 fw-bold">Getting Started<br />with Your Digital ID</h1>
                    <p className="lead mt-4">
                      Secure Your Digital Id with Ease and Confidence
                    </p>
                    <button className='btn btn-outline-dark' onClick={handleGetStarted}>Get Started</button>
                </div>
            </div>
        </div>
      </div>

    <Modal show={showModal} onHide={() => setShowModal(false)} centered>
    <Modal.Header closeButton className="border-0">
        <Modal.Title className="w-100 text-center">
        {isRegister ? (
            <>
            <FaUserPlus className="me-2 text-primary" /> Register
            </>
        ) : (
            <>
            <FaSignInAlt className="me-2 text-primary" /> Login
            </>
        )}
        </Modal.Title>
    </Modal.Header>

    <Modal.Body>
        <Form className="px-2">
        <Form.Group className="mb-3">
            <Form.Label><FaEnvelope className="me-2" />Email</Form.Label>
            <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-pill px-3"
            />
        </Form.Group>

        <Form.Group className="mb-4">
            <Form.Label><FaLock className="me-2" />Password</Form.Label>
            <Form.Control
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-pill px-3"
            />
        </Form.Group>

        <div className="d-grid gap-2">
            <Button
            variant="primary"
            onClick={handleAuth}
            className="rounded-pill fw-semibold"
            >
            {isRegister ? 'Create Account' : 'Login'}
            </Button>
        </div>
        </Form>

        <div className="text-center mt-4">
        {isRegister ? "Already have an account?" : "Don't have an account?"}
        <Button
            variant="link"
            className="ps-1"
            onClick={() => setIsRegister(!isRegister)}
        >
            {isRegister ? 'Login' : 'Register'}
        </Button>
        </div>
    </Modal.Body>
    </Modal>

    {/* About Section */}
    <div className="py-5" style={{'background':'#d2c3c4'}}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <h1>
                Getting Started with Your Digital ID
              </h1>
            </div>
            <div className="col-md-6 text-center">
              <img
                src="/images/private.png"
                alt="Government Access"
                className="img-fluid rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Learn More Section */}
      <div className="py-5 text-light" style={{'background':'#181916'}}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6 mb-4 mb-md-0">
              <h3 className="mb-3">Learn More</h3>
              <p>
                Our portal is dedicated to providing a safe and efficient way for Zimbabwean
                citizens to obtain their digital IDs. With simple steps and robust security, you can
                easily access government services with your new digital identity.
              </p>
            </div>
            <div className="col-md-6 text-center">
              <img
                src="/images/learnmore.png"
                alt="Secure Application"
                className="img-fluid rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
    <div className="bg-dark text-light py-5">
      <div className="container">
        <h2 className="mb-5">Services</h2>
        <div className="row">
          <div className="col-md-6 col-lg-4 mb-4">
            <h5>Create Account</h5>
            <p>Guide to registering an account for accessing the digital ID application portal.</p>
          </div>
          <div className="col-md-6 col-lg-4 mb-4">
            <h5>ID Usage Info</h5>
            <p>Details on how to use your digital ID for entry into government buildings and other services.</p>
          </div>
          <div className="col-md-6 col-lg-4 mb-4">
            <h5>Apply for Digital ID</h5>
            <p>Step-by-step instructions to fill out and submit your digital ID application form.</p>
          </div>
          <div className="col-md-6 col-lg-4 mb-4">
            <h5>QR Code Authentication</h5>
            <p>Information on how QR codes replace fingerprints for secure identification and access.</p>
          </div>
        </div>
      </div>
      <div className="text-center text-muted py-3" style={{ background: '#e5d4d5' }}>
        <small>IDConnect Zim</small>
      </div>
    </div>


    </div>
  );
};

export default Home;
