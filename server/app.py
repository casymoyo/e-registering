from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import uuid
import qrcode
import firebase_admin
from firebase_admin import credentials, auth
from flask import send_file
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from io import BytesIO

app = Flask(__name__)
CORS(app)

# Configure SQLite database URI
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///applications.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

db = SQLAlchemy(app)

# Firebase Admin SDK setup for auth verification
cred = credentials.Certificate("firebase-admin-sdk.json") 
firebase_admin.initialize_app(cred)

import logging

# Setup basic logging (can log to a file if needed)
# logging.basicConfig(
#     filename='logs/access.log',
#     level=logging.INFO,
#     format='%(asctime)s [%(levelname)s] %(message)s'
# )

def verify_token(req):
    token = req.headers.get("Authorization")
    if not token:
        logging.warning("No Authorization header found.")
        return None

    # Extract token part
    if token.startswith("Bearer "):
        token = token[len("Bearer "):]

    try:
        decoded_token = auth.verify_id_token(token)
        logging.info(f"Token verified for UID: {decoded_token.get('uid')}")
        return decoded_token
    except Exception as e:
        logging.error(f"Token verification failed: {e}")
        return None

# Application model
class User(db.Model):
    uid = db.Column(db.String, primary_key=True)
    email = db.Column(db.String)
    role = db.Column(db.String)  

class Application(db.Model):
    uid = db.Column(db.String, db.ForeignKey('user.uid'), primary_key=True)
    fullName = db.Column(db.String)
    dob = db.Column(db.String)
    address = db.Column(db.String)
    photoURL = db.Column(db.String)
    certURL = db.Column(db.String)
    status = db.Column(db.String)
    qrCodeURL = db.Column(db.String, nullable=True)  

    def generate_qr(self, base_url):
        """Generate QR code image for this application and save it."""
        url = f"{base_url}/verify/{self.uid}"
        qr = qrcode.make(url)
        qr_folder = 'static/qr_codes'
        os.makedirs(qr_folder, exist_ok=True)
        qr_path = os.path.join(qr_folder, f'{self.uid}.png')
        qr.save(qr_path)
        self.qrCodeURL = qr_path
        db.session.commit()

with app.app_context():
    db.create_all()

@app.route("/api/apply", methods=["POST"])
def apply():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    form = request.form
    files = request.files

    fullName = form.get("fullName")
    dob = form.get("dob")
    address = form.get("address")
    photo = files.get("photo")
    birthCert = files.get("birthCert")

    if not all([fullName, dob, address, photo, birthCert]):
        return jsonify({"error": "Missing required fields or files"}), 400

    uid = user["uid"]

    # Save files locally
    def save_file(file_obj, prefix):
        ext = os.path.splitext(file_obj.filename)[1]
        filename = f"{prefix}_{uid}_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file_obj.save(filepath)
        return filepath

    photo_path = save_file(photo, "photo")
    cert_path = save_file(birthCert, "birthCert")

    app_obj = Application.query.get(uid)
    if not app_obj:
        app_obj = Application(uid=uid)

    app_obj.fullName = fullName
    app_obj.dob = dob
    app_obj.address = address
    app_obj.photo_path = photo_path
    app_obj.cert_path = cert_path
    app_obj.status = "pending"

    db.session.add(app_obj)
    db.session.commit()
    
    print('file uploaded')

    return jsonify({"message": "Application submitted successfully"}), 200

@app.route('/api/status', methods=["GET"])
def get_application_status():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    app = Application.query.filter_by(uid=user['uid']).first()
    if not app:
        return jsonify({"error": "Not applied"}), 404

    return jsonify({
        "fullName": app.fullName,
        "dob": app.dob,
        "address": app.address,
        "status": app.status,
        "qrCodeURL": app.qrCodeURL  
    })

@app.route("/api/edit", methods=["POST"])
def edit_application():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    uid = user["uid"]
    form = request.form

    full_name = form.get("fullName")
    dob = form.get("dob")
    address = form.get("address")

    application = Application.query.filter_by(uid=uid).first()

    if not application:
        return jsonify({"error": "No existing application"}), 404

    application.full_name = full_name
    application.dob = dob
    application.address = address

    db.session.commit()

    return jsonify({"message": "Application updated successfully"}), 200

@app.route("/api/admin/applications", methods=["GET"])
def list_applications():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    admin = User.query.filter_by(uid=user["uid"]).first()
    if not admin or admin.role != "superuser":
        return jsonify({"error": "Forbidden"}), 403

    apps = Application.query.all()
    return jsonify([
        {
            "uid": app.uid,
            "fullName": app.fullName,
            "dob": app.dob,
            "address": app.address,
            "photoURL": app.photoURL,
            "certURL": app.certURL,
            "status": app.status
        }
        for app in apps
    ]), 200

@app.route("/api/admin/review/<uid>", methods=["POST"])
def review_application(uid):
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    admin = User.query.filter_by(uid=user["uid"]).first()
    if not admin or admin.role != "superuser":
        return jsonify({"error": "Forbidden"}), 403

    data = request.json
    new_status = data.get("status")
    if new_status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    app_record = Application.query.filter_by(uid=uid).first()
    if not app_record:
        return jsonify({"error": "Application not found"}), 404

    app_record.status = new_status

    if new_status == "approved":
        base_url = request.host_url.rstrip('/')  
        qr_url = f"{base_url}/verify/{app_record.uid}"

        qr = qrcode.make(qr_url)
        qr_folder = os.path.join('static', 'qr_codes')
        os.makedirs(qr_folder, exist_ok=True)
        qr_path = os.path.join(qr_folder, f'{app_record.uid}.png')
        qr.save(qr_path)

        app_record.qrCodeURL = qr_path

    db.session.commit()

    return jsonify({
        "message": f"Application {new_status}.",
        "qrCodeURL": app_record.qrCodeURL if new_status == "approved" else None
    }), 200



@app.route("/create-superuser", methods=["POST"])
def create_superuser():
    data = request.json
    uid = data.get("uid")
    email = data.get("email")

    user = User(uid=uid, email=email, role="superuser")
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Superuser created"}), 201


@app.route("/api/me", methods=["GET"])
def get_user_info():
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    uid = user["uid"]
    account = User.query.filter_by(uid=uid).first()

    if not account:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "uid": account.uid,
        "email": account.email,
        "role": account.role
    }), 200

@app.route('/api/download/<uid>', methods=["GET"])
def download_application(uid):
    user = verify_token(request)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    app = Application.query.filter_by(uid=uid).first()
    if not app or app.status != 'approved':
        return jsonify({"error": "Approved application not found"}), 404

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    text = c.beginText(50, 800)
    text.setFont("Helvetica", 12)
    text.textLine(f"Application ID: {app.uid}")
    text.textLine(f"Full Name: {app.fullName}")
    text.textLine(f"Date of Birth: {app.dob}")
    text.textLine(f"Address: {app.address}")
    text.textLine(f"Status: {app.status.capitalize()}")
    c.drawText(text)

    if app.qrCodeURL and os.path.exists(app.qrCodeURL):
        c.drawImage(app.qrCodeURL, 50, 600, width=150, height=150)

    c.showPage()
    c.save()
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"{app.uid}_application.pdf"
    )   

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)
