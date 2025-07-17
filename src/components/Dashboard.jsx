import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Button, Spinner, Modal, Table, Badge, Card
} from 'react-bootstrap';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';
import { FaEye } from 'react-icons/fa';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchApplications = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        toast.error("You must be logged in.");
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch("http://localhost:5000/api/admin/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Not authorized");
      const data = await res.json();
      setApplications(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchApplications();
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getCount = (status) => applications.filter(app => app.status === status).length;

  const handleReview = async (uid, action) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`http://localhost:5000/api/admin/review/${uid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: action }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(`Application ${action}`);
      setModalVisible(false);
      fetchApplications(); 
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col><h3>Dashboard Overview</h3><p className="text-muted">Manage and track citizen e-ID applications</p></Col>
      </Row>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="shadow-sm p-3">
            <h5>Total Applications</h5>
            <h3>{applications.length}</h3>
            <small className="text-success">↑ +12% from last month</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm p-3">
            <h5>Pending Review</h5>
            <h3>{getCount('pending')}</h3>
            <small className="text-danger">↓ -8% from last month</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm p-3">
            <h5>Approved</h5>
            <h3>{getCount('approved')}</h3>
            <small className="text-success">↑ +15% from last month</small>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm p-3">
            <h5>Rejected</h5>
            <h3>{getCount('rejected')}</h3>
            <small className="text-danger">↑ +3% from last month</small>
          </Card>
        </Col>
      </Row>

      {/* Recent Applications */}
      <Row className="mb-3 d-flex justify-content-between align-items-center">
        <Col><h5>Recent Applications</h5></Col>
        <Col className="text-end">
          <Button variant="outline-primary" className="me-2">Filter</Button>
          <Button variant="outline-secondary">Export</Button>
        </Col>
      </Row>

      {loading ? (
        <Spinner animation="border" />
      ) : (
        <Table responsive bordered hover className="bg-white shadow-sm">
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Applicant</th>
              <th>Document Type</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map(app => (
              <tr key={app.uid}>
                <td>{app.applicationId}</td>
                <td>
                  <strong>{app.fullName}</strong><br />
                  <small>{app.email}</small>
                </td>
                <td>{app.documentType || 'National ID'}</td>
                <td>{app.submittedDate || '2024-01-15'}</td>
                <td>
                  <Badge bg={
                    app.status === 'pending' ? 'warning' :
                    app.status === 'approved' ? 'success' : 'danger'
                  }>
                    {app.status}
                  </Badge>
                </td>
                <td>
                  <Button size="sm" variant="light" onClick={() => {
                    setSelectedApp(app);
                    setModalVisible(true);
                  }}>
                    <FaEye />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Application Details Modal */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Application Details</Modal.Title>
        </Modal.Header>
        {selectedApp && (
          <Modal.Body>
            <Row>
              <Col md={6}>
                <p><strong>Name:</strong> {selectedApp.fullName}</p>
                <p><strong>Email:</strong> {selectedApp.email}</p>
                <p><strong>DOB:</strong> {selectedApp.dob}</p>
                <p><strong>Address:</strong> {selectedApp.address}</p>
              </Col>
              <Col md={6}>
                <img
                  src={selectedApp.photoURL}
                  alt="User"
                  className="img-fluid rounded border mb-2"
                />
                <img
                  src={selectedApp.certURL}
                  alt="Certificate"
                  className="img-fluid rounded border"
                />
              </Col>
            </Row>
          </Modal.Body>
        )}
        <Modal.Footer>
          {selectedApp && selectedApp.status === "pending" && (
            <>
              <Button variant="success" onClick={() => handleReview(selectedApp.uid, "approved")}>Approve</Button>
              <Button variant="danger" onClick={() => handleReview(selectedApp.uid, "rejected")}>Reject</Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setModalVisible(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
