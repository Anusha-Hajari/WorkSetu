# WorkSetu

WorkSetu is a full-stack job and service marketplace platform designed to connect users who need work done with skilled workers. It supports normal job posting, urgent hiring, worker applications, bookings, real-time chat, work tracking, wallet payments, KYC verification, admin management, dispute handling, media verification, and AI-based worker matching.

The project contains a React frontend, a FastAPI backend, MongoDB database integration, Socket.IO real-time communication, and a separate AI/ML module for ranking workers.

## Project Title and Brief Description

### Project Title

**WorkSetu**

### Brief Description

WorkSetu is an online work marketplace where users can post jobs, apply for jobs, hire workers, track work progress, communicate in real time, manage payments through a wallet and escrow-style flow, and use AI-powered matching to find suitable workers.

The system also includes urgent job handling, KYC verification, admin controls, dispute management, AI work verification, real-time notifications, and media authenticity checks.

## Technology Stack and Tools Used

### Frontend

- React.js
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- Socket.IO Client
- Lucide React Icons
- Motion animation library
- JavaScript
- HTML
- CSS

### Backend

- Python
- FastAPI
- Uvicorn
- PyMongo
- Pydantic
- Python Socket.IO
- JWT authentication using `python-jose`
- `python-multipart` for file upload handling
- Pillow for image/media verification
- Bcrypt
- MongoDB Atlas

### AI / Machine Learning

- Python
- Pandas
- Scikit-learn
- Joblib
- Logistic Regression model
- Trained model file: `AiModel/model.pkl`
- Dataset file: `AiModel/dataset.csv`

### Database

- MongoDB Atlas
- MongoDB collections are used for users, jobs, urgent jobs, bookings, applications, messages, wallet transactions, tracking updates, disputes, KYC records, and payments.

### Development Tools

- npm
- Node.js
- Python virtual environment
- Git
- Vite development server
- FastAPI development server

## Features and Functionalities Implemented

### User Authentication

- User registration
- User login
- JWT token-based authentication
- Password hashing
- Protected frontend routes
- Authenticated API requests using bearer token
- User session handling through frontend auth context

### User Features

- User dashboard
- User profile page
- View available jobs
- View job details
- Apply for jobs
- View submitted applications
- View posted jobs
- Manage bookings
- View payment-related pages
- Access wallet
- Use protected pages only after login

### Job Management

- Create and post new jobs
- View all jobs
- Search jobs by title, skill, and description
- Filter jobs by skill and type
- View single job details
- Update jobs
- Delete jobs
- Accept jobs
- Start jobs
- Complete jobs
- Track job status

### Urgent Job System

- Create urgent jobs
- View active urgent jobs
- Urgent jobs have expiry duration
- Workers can apply to urgent jobs
- Workers can accept urgent jobs
- Posters can view applicants
- Posters can select or reject workers
- Workers can reject or dismiss urgent jobs
- AI scoring is used for urgent job applicants
- Supports onsite and remote urgent work modes

### AI Matching and Recommendation

- AI model ranks users/workers
- Worker ranking uses:
  - Match score
  - Rating
  - Completed jobs
  - Response time
- Logistic Regression model is trained using `dataset.csv`
- Trained model is saved as `model.pkl`
- Backend loads the trained model for ranking
- Fallback ranking is available if the model cannot be loaded
- AI matching API endpoint is available through `/api/ai/ai-match`

### Work Tracking

- Active booking tracking
- Job progress status tracking
- Worker progress update submission
- Poster approval or rejection of updates
- AI checks worker update text
- Tracking supports regular jobs and urgent jobs
- Real-time tracking updates through Socket.IO
- Worker location update support for tracking

### AI Work Verification

- AI evaluates work progress updates
- Short or incomplete updates can be rejected
- Updates with progress-related keywords can pass verification
- AI feedback and score are stored with each update

### Media Upload and Verification

- File upload support
- Supported uploads include:
  - Images
  - Videos
  - Documents
  - PDFs
  - ZIP files
- Image authenticity verification
- EXIF metadata checking
- Camera/device metadata checking
- Timestamp freshness checking
- AI-generated image indicators
- Screenshot or downloaded image detection
- Image quality and statistical checks
- Uploaded files are served from `/uploads`

### Chat and Real-Time Communication

- Real-time chat between job poster and selected/assigned worker
- Chat history storage in MongoDB
- Chat access control
- Socket.IO room-based communication
- Real-time message notifications
- Attachment support in chat:
  - Image
  - Video
  - Document
  - File name
- Chat is enabled only after worker selection or job assignment

### Notifications

- Real-time user notifications
- Job status change notifications
- New chat message notifications
- Tracker update notifications
- Worker approval or rejection notifications
- Payment and job completion notifications

### Booking and Scheduling

- Create bookings for jobs
- Select booking date and time
- Add booking notes
- View user bookings
- Fetch booking by ID
- Booked slots are stored with job records

### Wallet and Payment System

- Wallet balance view
- Escrow balance view
- Deposit funds
- Withdraw funds
- Transaction history
- Test credit feature
- Escrow lock when poster finalizes a job
- Escrow refund when offer is rejected
- Escrow release after job completion
- Payment approval after job completion
- Payment status checking

### KYC Verification

- Submit ID type
- Submit ID number
- Upload ID image
- Upload selfie image
- KYC status checking
- Basic simulated KYC validation
- Verified users are marked as verified
- Verified users can receive identity badge

### Admin Features

- Admin login route
- Admin-protected pages
- Admin dashboard overview
- Admin statistics
- View total users
- View total jobs
- View bookings
- View payments
- View banned users
- View active jobs
- View open disputes
- View completion rate
- View user growth data
- View job growth data
- View revenue data
- View skills distribution
- Manage users
- Ban users
- Unban users
- Verify users
- Delete users
- View all jobs
- Approve jobs
- Reject jobs
- Delete jobs
- View bookings
- View disputes
- Resolve disputes
- AI audit admin page

### Dispute Management

- Dispute-related backend routes
- Admin dispute view
- Admin dispute resolution

### Frontend Pages Implemented

- Home
- Jobs
- Job Details
- Post Job
- Apply
- Login
- Register
- Dashboard
- Profile
- My Bookings
- My Applications
- My Posts
- Payments
- Payment
- Wallet
- Schedule
- How It Works
- Chat
- Tracking
- Admin Login
- Admin Overview
- Admin Users
- Admin Jobs
- Admin Bookings
- Admin Payments
- Admin Disputes
- Admin AI Audit

### Frontend Components Implemented

- Navbar
- Footer
- Hero
- FAQ
- Job Card
- Urgent Job Card
- Urgent Feed
- Booking Slot
- Work Tracker
- AI Match Banner
- Skill Radar
- Earnings Pulse
- Elite Passport
- Featured Workers
- Home Features
- How It Works
- Live Job Ticker
- Notification Toast
- Loader
- Premium CTA
- Post Urgent Job
- 3D Setu Bridge component
- Petal Effect

## Installation / Execution Steps to Run the Project

### Prerequisites

Before running the project, install:

- Python
- Node.js
- npm
- Git
- MongoDB Atlas account or a valid MongoDB connection string

## Backend Setup

### 1. Open the Project Folder

```bash
cd WorkSetu
```

### 2. Go to the Backend Folder

```bash
cd backend
```

### 3. Create a Python Virtual Environment

```bash
python -m venv .venv
```

### 4. Activate the Virtual Environment

On Windows:

```bash
.venv\Scripts\activate
```

### 5. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 6. Run the Backend Server

```bash
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

The backend will run at:

```bash
http://localhost:8000
```

To check if the backend is running, open:

```bash
http://localhost:8000/
```

Expected response:

```json
{
  "msg": "WorkSetu API running"
}
```

## Frontend Setup

### 1. Open a New Terminal

Go to the frontend folder:

```bash
cd frontend
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Run the Frontend Development Server

```bash
npm run dev
```

The frontend will usually run at:

```bash
http://localhost:5173
```

## AI Model Setup

### 1. Go to the AI Model Folder

```bash
cd AiModel
```

### 2. Train the AI Model

```bash
python train.py
```

This command trains the Logistic Regression model using `dataset.csv` and saves the trained model as:

```bash
model.pkl
```

The backend uses this file for AI-based worker ranking.

## Environment Configuration

The frontend uses the backend API URL from:

```bash
VITE_API_URL
```

If this variable is not provided, the frontend defaults to:

```bash
http://localhost:8000
```

Example custom environment variable:

```bash
VITE_API_URL=http://localhost:8000
```

MongoDB connection is configured in:

```bash
backend/app/db/database.py
```

Make sure the MongoDB connection string is valid before running the backend.

## Running the Complete Project

Start the backend first:

```bash
cd backend
uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

Then start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend in the browser:

```bash
http://localhost:5173
```

The frontend will communicate with the backend running on:

```bash
http://localhost:8000
```

## Project Folder Structure

```bash
WorkSetu/
|
|-- AiModel/
|   |-- dataset.csv
|   |-- model.pkl
|   |-- predict.py
|   `-- train.py
|
|-- backend/
|   |-- app/
|   |   |-- db/
|   |   |-- models/
|   |   |-- routers/
|   |   |-- schemas/
|   |   |-- services/
|   |   |-- main.py
|   |   `-- socket_manager.py
|   |-- uploads/
|   |-- make_admin.py
|   `-- requirements.txt
|
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- package.json
|   |-- vite.config.js
|   |-- tailwind.config.js
|   `-- index.html
|
|-- README.md
`-- requirements.txt
```

## Important Backend Routes

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Jobs

- `POST /api/add-job`
- `GET /api/jobs`
- `GET /api/job/{job_id}`
- `PUT /api/update-job/{job_id}`
- `DELETE /api/delete-job/{job_id}`
- `POST /api/accept-job/{job_id}`
- `POST /api/start-job/{job_id}`
- `POST /api/complete-job/{job_id}`
- `GET /api/job/{job_id}/best-users`

### Urgent Jobs

- `POST /api/urgent/create`
- `GET /api/urgent/active`
- `GET /api/urgent/skills`
- `POST /api/urgent/{job_id}/apply`
- `POST /api/urgent/{job_id}/accept`
- `POST /api/urgent/{job_id}/reject`
- `GET /api/urgent/{job_id}/applicants`
- `POST /api/urgent/{job_id}/select/{worker_id}`
- `POST /api/urgent/{job_id}/reject-applicant/{worker_id}`
- `GET /api/urgent/{job_id}`

### Applications

- Application routes are available under:

```bash
/api/applications
```

### Bookings

- `POST /api/bookings`
- `GET /api/bookings/my-bookings`
- `GET /api/bookings/{booking_id}`

### Chat

- `GET /api/chat-access/{job_id}`
- `GET /api/chat/{job_id}`
- `POST /api/chat/{job_id}`
- `POST /api/chat/{job_id}/action`

### Tracking

- `GET /api/tracking/job/{job_id}/active-booking`
- `GET /api/tracking/{booking_id}`
- `POST /api/tracking/{booking_id}/update`
- `POST /api/tracking/{booking_id}/approve/{update_id}`
- `POST /api/tracking/{booking_id}/reject/{update_id}`
- `POST /api/tracking/{booking_id}/complete_job`

### Wallet

- `GET /api/wallet/`
- `POST /api/wallet/deposit`
- `POST /api/wallet/withdraw`
- `GET /api/wallet/history`
- `POST /api/wallet/test-credit`

### Payment

- `POST /api/payment/approve-payment/{job_id}`
- `GET /api/payment/payment/{job_id}`

### AI

- `POST /api/ai/ai-match`

### Uploads

- `POST /api/upload`

### KYC

- `POST /api/kyc/submit`
- `GET /api/kyc/status`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PUT /api/admin/users/{user_id}/ban`
- `PUT /api/admin/users/{user_id}/unban`
- `PUT /api/admin/users/{user_id}/verify`
- `DELETE /api/admin/users/{user_id}`
- `GET /api/admin/jobs`
- `PUT /api/admin/jobs/{job_id}/approve`
- `PUT /api/admin/jobs/{job_id}/reject`
- `DELETE /api/admin/jobs/{job_id}`
- `GET /api/admin/bookings`
- `GET /api/admin/disputes`
- `PUT /api/admin/disputes/{dispute_id}/resolve`
- `PUT /api/admin/make-admin/{user_id}`
- `POST /api/admin/setup-admin`

## Socket.IO Features

The backend uses Socket.IO for real-time features.

Implemented socket events include:

- User room joining
- Job room joining
- Chat room joining
- Tracker room joining
- Sending and receiving chat messages
- Job status updates
- Tracker updates
- User notifications
- Worker location updates

Important Socket.IO event names include:

- `join`
- `join_job`
- `leave_job`
- `join_chat`
- `join_tracker`
- `leave_tracker`
- `send_message`
- `receive_message`
- `new_urgent_job`
- `job_update`
- `job_status_change`
- `new_applicant`
- `tracker_updated`
- `new_notification`
- `update_location`
- `worker_location`

## AI Model Details

The AI model is located in the `AiModel` folder.

### Training File

```bash
AiModel/train.py
```

This file:

- Loads `dataset.csv`
- Selects model features
- Splits the data into training and testing sets
- Trains a Logistic Regression model
- Calculates model accuracy
- Saves the trained model as `model.pkl`

### Prediction File

```bash
AiModel/predict.py
```

This file:

- Loads `model.pkl`
- Reads user data as JSON input
- Converts data into a Pandas DataFrame
- Predicts match probability
- Adds score to each user
- Sorts users by score
- Returns the ranked result

### Model Features

The model uses the following fields:

- `matchScore`
- `rating`
- `completedJobs`
- `responseTime`

## Notes

- The backend is built with FastAPI, not Express.
- MongoDB connection details are currently stored directly in `backend/app/db/database.py`.
- Uploaded files are stored in `backend/uploads`.
- KYC uploads are stored in `backend/uploads/kyc`.
- The frontend default backend URL is `http://localhost:8000`.
- The backend should be started before the frontend for full functionality.
- The AI model file `model.pkl` should exist for AI ranking to work fully.

## Conclusion

WorkSetu is a complete full-stack work marketplace application with user authentication, job posting, urgent hiring, AI worker matching, real-time chat, booking management, work tracking, payment and wallet handling, KYC verification, media verification, and admin dashboard functionality.

It combines React, FastAPI, MongoDB, Socket.IO, and Machine Learning to provide a practical platform for connecting job posters with skilled workers.
