import React, { useEffect, useState } from 'react';
import {
  Container, Row, Col, Button, Spinner, Modal, Badge, Card, ListGroup
} from 'react-bootstrap';
import { auth } from '../firebase/config';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
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
      console.log(data, 'data')
      setApplications(data);
      setFiltered(data);
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

  const filterByStatus = (status) => {
    setActiveFilter(status);
    if (status === 'all') setFiltered(applications);
    else setFiltered(applications.filter(app => app.status === status));
  };

  const getCount = (status) => applications.filter(app => app.status === status).length;

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Sidebar */}
        <Col md={2} className="bg-light p-3 border-end">
          <h5 className="mb-3">Filters</h5>
          <ListGroup>
            <ListGroup.Item
              action active={activeFilter === 'all'}
              onClick={() => filterByStatus('all')}
              className="d-flex justify-content-between align-items-center"
            >
              All <Badge bg="secondary">{applications.length}</Badge>
            </ListGroup.Item>
            <ListGroup.Item
              action active={activeFilter === 'pending'}
              onClick={() => filterByStatus('pending')}
              className="d-flex justify-content-between align-items-center"
            >
              Pending <Badge bg="warning">{getCount('pending')}</Badge>
            </ListGroup.Item>
            <ListGroup.Item
              action active={activeFilter === 'approved'}
              onClick={() => filterByStatus('approved')}
              className="d-flex justify-content-between align-items-center"
            >
              Approved <Badge bg="success">{getCount('approved')}</Badge>
            </ListGroup.Item>
            <ListGroup.Item
              action active={activeFilter === 'rejected'}
              onClick={() => filterByStatus('rejected')}
              className="d-flex justify-content-between align-items-center"
            >
              Rejected <Badge bg="danger">{getCount('rejected')}</Badge>
            </ListGroup.Item>
          </ListGroup>
        </Col>

        {/* Main Content */}
        <Col md={10}>
          <h4 className="mb-4">Applications</h4>
          {loading ? (
            <Spinner animation="border" />
          ) : filtered.length === 0 ? (
            <p>No applications found for this filter.</p>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {filtered.map(app => (
                <Col key={app.uid}>
                  <Card className="shadow-sm h-100">
                    <Card.Img
                      variant="top"
                      src={app.photoURL}
                      alt="Photo"
                      style={{ objectFit: 'cover', height: '200px' }}
                    />
                    <Card.Body>
                      <Card.Title>{app.fullName}</Card.Title>
                      <Card.Text>
                        <strong>DOB:</strong> {app.dob}<br />
                        <strong>Status:</strong>{" "}
                        <span className={`text-capitalize fw-bold ${app.status === 'pending' ? 'text-warning' : app.status === 'approved' ? 'text-success' : 'text-danger'}`}>
                          {app.status}
                        </span>
                      </Card.Text>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setModalVisible(true);
                        }}
                      >
                        View Details
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* Modal for Application Details */}
      <Modal show={modalVisible} onHide={() => setModalVisible(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Review Application</Modal.Title>
        </Modal.Header>
        {selectedApp && (
          <Modal.Body>
            <Row>
              <Col md={6}>
                <p><strong>Full Name:</strong> {selectedApp.fullName}</p>
                <p><strong>DOB:</strong> {selectedApp.dob}</p>
                <p><strong>Address:</strong> {selectedApp.address}</p>
              </Col>
              <Col md={6}>
                <div className="mb-2">
                  <strong>Photo:</strong><br />
                  <img src={selectedApp.photoURL} className="img-fluid rounded border" alt="User" />
                </div>
                <div className="mt-3">
                  <strong>Birth Certificate:</strong><br />
                  <img src={selectedApp.certURL} className="img-fluid rounded border" alt="Birth Cert" />
                </div>
              </Col>
            </Row>
          </Modal.Body>
        )}
        <Modal.Footer>
          {selectedApp && selectedApp.status === "pending" && (
            <>
              <Button variant="success" onClick={() => handleReview(selectedApp.uid, "approved")}>
                Approve
              </Button>
              <Button variant="danger" onClick={() => handleReview(selectedApp.uid, "rejected")}>
                Reject
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
