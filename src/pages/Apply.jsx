import React, { useEffect, useState } from 'react';
import { Form, Button, Spinner, Card, Container, Row, Col } from 'react-bootstrap';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import {
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaUpload,
  FaFileAlt, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import { onAuthStateChanged } from 'firebase/auth';

const PassportCapture = ({ onCapture }) => {
  const webcamRef = React.useRef(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setLoadingModels(false);
    };
    loadModels();
  }, []);

  const capture = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setDetecting(true);

    const img = await faceapi.fetchImage(imageSrc);
    const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());

    setDetecting(false);
    if (detection) {
      onCapture(dataURItoBlob(imageSrc));
    } else {
      alert('No face detected. Please try again.');
      setCapturedImage(null);
    }
  };

  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="text-center">
      {capturedImage ? (
        <div>
          <img
            src={capturedImage}
            alt="Captured"
            className="img-thumbnail mb-2"
            style={{ maxWidth: '250px' }}
          />
          <Button variant="secondary" onClick={() => setCapturedImage(null)}>Retake</Button>
        </div>
      ) : (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={300}
            height={300}
            videoConstraints={{ width: 300, height: 300, facingMode: 'user' }}
            className="rounded border"
          />
          <div className="mt-2">
            <Button
              disabled={loadingModels || detecting}
              onClick={capture}
              variant="primary"
            >
              {loadingModels ? 'Loading AI...' : detecting ? 'Detecting...' : 'Capture Photo'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const ERegister = () => {
  const [activeTab, setActiveTab] = useState('apply');
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [photo, setPhoto] = useState(null);
  const [birthCert, setBirthCert] = useState(null);
  const [guardianCert, setGuardianCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [qrCodeURL, setQrCodeURL] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return setCheckingStatus(false);

      try {
        const token = await user.getIdToken();
        const res = await fetch('http://localhost:5000/api/status', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setHasApplied(true);
          setFullName(data.fullName || '');
          setDob(data.dob || '');
          setAddress(data.address || '');
          setVillage(data.village || '');
          setStatus(data.status || 'pending');
          setQrCodeURL(data.qrCodeURL || '');
        } else setHasApplied(false);
      } catch (err) {
        toast.error('Could not connect to server.');
      } finally {
        setCheckingStatus(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error('Login required');
    if (!photo || !birthCert) return toast.warn('Please upload required documents.');
    setLoading(true);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      const photoBlob = dataURLtoBlob(capturedImage);

      formData.append('fullName', fullName);
      formData.append('dob', dob);
      formData.append('address', address);
      formData.append('village', village);
      formData.append('photo', photoBlob, 'photo.jpg');
      formData.append('birthCert', birthCert);
      formData.append('guardianCert', guardianCert);

      const res = await fetch('http://localhost:5000/api/apply', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');

      toast.success('Application submitted!');
      setHasApplied(true);
      setStatus('pending');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => (
    <>
      <h4 className="fw-bold mb-4 text-primary">e-Registration Application</h4>
      <Form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
        <Row>
          <Col md={6}>
            <Form.Group controlId="fullName">
              <Form.Label><FaUser className="me-2" />Full Name</Form.Label>
              <Form.Control type="text" className="rounded-pill px-3" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="dob">
              <Form.Label><FaCalendarAlt className="me-2" />Date of Birth</Form.Label>
              <Form.Control type="date" className="rounded-pill px-3" required value={dob} onChange={(e) => setDob(e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group controlId="address">
              <Form.Label><FaMapMarkerAlt className="me-2" />Residential Address</Form.Label>
              <Form.Control type="text" className="rounded-pill px-3" required value={address} onChange={(e) => setAddress(e.target.value)} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="village">
              <Form.Label><FaMapMarkerAlt className="me-2" />Village</Form.Label>
              <Form.Control type="text" className="rounded-pill px-3" required value={village} onChange={(e) => setVillage(e.target.value)} />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group controlId="guardianCertUpload">
          <Form.Label><FaUpload className="me-2" />Mother/Father's Birth Certificate</Form.Label>
          <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setGuardianCert(e.target.files[0])} />
          {guardianCert && guardianCert.type.startsWith('image/') && (
            <img src={URL.createObjectURL(guardianCert)} alt="Preview" className="mt-2 border rounded shadow-sm" style={{ maxWidth: '250px' }} />
          )}
        </Form.Group>

        <Form.Group controlId="biometric">
          <Form.Label><FaUpload className="me-2" />Passport Photo (Biometric Capture)</Form.Label>
          <PassportCapture onCapture={(image) => setPhoto(image)} />
        </Form.Group>

        <Form.Group controlId="birthCertUpload">
          <Form.Label><FaUpload className="me-2" />Birth Certificate</Form.Label>
          <Form.Control type="file" accept="image/*,.pdf" onChange={(e) => setBirthCert(e.target.files[0])} />
          {birthCert && (
            birthCert.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(birthCert)} alt="Preview" className="mt-2 border rounded shadow-sm" style={{ maxWidth: '250px' }} />
            ) : (
              <p className="text-muted mt-2">PDF selected: {birthCert.name}</p>
            )
          )}
        </Form.Group>

        <Button type="submit" className="w-100 rounded-pill py-2 fs-6 shadow-sm" variant="primary" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Submit Application'}
        </Button>
      </Form>
    </>
  );

  const renderSuccess = () => (
    <div className="text-center py-5">
      <FaCheckCircle size={100} className="text-success mb-3" />
      <h3 className="text-success">Application Submitted</h3>
      <p className="text-muted">Your application is under review.</p>
    </div>
  );

  const renderStatus = () => (
    <div className="text-center py-4">
      <h4 className="mb-3 text-primary">Application Status</h4>
      <p className="fs-4 text-capitalize">
        <span className={`badge px-4 py-2 bg-${status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning'} text-white rounded-pill`}>
          {status}
        </span>
      </p>
      {status === 'approved' && (
        <div className="mt-4 text-start">
          <ul className="list-group shadow-sm">
            <li className="list-group-item"><strong>Full Name:</strong> {fullName}</li>
            <li className="list-group-item"><strong>Date of Birth:</strong> {dob}</li>
            <li className="list-group-item"><strong>Address:</strong> {address}</li>
            <li className="list-group-item"><strong>Village:</strong> {village}</li>
          </ul>
          {qrCodeURL && (
            <div className="mt-4 text-center">
              <h6 className="text-muted">Verification QR Code</h6>
              <img
                src={`http://localhost:5000/${qrCodeURL}`}
                alt="QR Code"
                style={{ width: '200px', height: '200px' }}
                className="border rounded p-2 bg-white shadow-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (checkingStatus) return <div className="text-center py-5">Checking application status...</div>;
    if (activeTab === 'apply') return hasApplied ? renderSuccess() : renderForm();
    if (activeTab === 'status') return hasApplied ? renderStatus() : <p>No application found.</p>;
  };

  return (
    <div className="row">
      <div className="col-md-3 col-lg-2 bg-light vh-100 border-end">
        <div className="d-flex flex-column gap-3 py-4 px-3">
          <button onClick={() => setActiveTab('apply')} className={`btn btn-outline-primary text-start rounded-pill ${activeTab === 'apply' && 'fw-bold'}`}>
            <FaFileAlt className='me-2' /> Apply
          </button>
          <button onClick={() => setActiveTab('status')} className={`btn btn-outline-info text-start rounded-pill ${activeTab === 'status' && 'fw-bold'}`}>
            <FaInfoCircle className='me-2' /> Status
          </button>
        </div>
      </div>
      <div className="col-md-9 col-lg-10">
        <Container fluid className="py-4 px-md-5">
          <Card className="p-4 border-0 shadow-lg rounded-4 bg-white">
            <Card.Body>{renderContent()}</Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default ERegister;
