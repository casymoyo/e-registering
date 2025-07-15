
# E-Registering System with AI-Enhanced Passport Photo Capture

## 🧠 Overview

This project is a full-stack application built using **React** (frontend) and **Flask** (backend) to handle electronic registration with AI-assisted passport photo verification.

---

## 🚀 Features

### ✅ React Frontend
- **Webcam photo capture**
- **Real-time face detection** using `face-api.js`
- Prevents photo submission if no face is detected

### ✅ Flask Backend
- **Firebase Authentication** (verifies tokens from frontend)
- **SQLite Database** for storing application data
- **File Upload** (photo + birth certificate)
- **QR Code Generation** for approved applications
- **PDF Download** with embedded QR code and application data

---

## 🧠 AI Usage

### 🖥️ Frontend (React)
Uses `face-api.js` (based on TensorFlow.js) for:
- Detecting faces live in the browser
- Validating presence of a face before saving a passport photo

### 🔧 Backend (Flask)
- Generates QR codes with `qrcode`
- Can be extended with AI (like `deepface` or `face_recognition`) to:
  - Match uploaded images with existing ones
  - Perform image quality checks (blur, brightness)
  - Detect fraud or duplication

---

## 📁 Project Structure

```
📦 e-registering
├── client/                # React frontend
│   └── components/
│       └── PassportCapture.jsx
├── server/                # Flask backend
│   ├── app.py
│   ├── uploads/
│   └── static/qr_codes/
├── firebase-admin-sdk.json
└── README.md
```

---

## 📦 Setup Instructions

### Frontend (React)
```bash
cd client
npm install
npm run dev
```

### Backend (Flask)
```bash
cd server
pip install -r requirements.txt
python app.py
```

---

## 🔐 Authentication

Uses Firebase Authentication to protect API endpoints.

---

## 📥 Example Application Flow

1. User logs in via Firebase
2. Captures a passport photo (must include face)
3. Submits form + uploads files
4. Admin reviews and approves/rejects
5. Approved users can **download a PDF** with QR code

---

## 📌 Future AI Enhancements

- Server-side face match (`deepface`, `face_recognition`)
- Blur/brightness detection for better image quality control
- Duplicate detection or fraud analysis
- Admin dashboards with AI analytics

---

## 📄 License

MIT License