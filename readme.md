# Production Grade Authentication & Todo API

A full-stack MERN application featuring secure authentication, email verification, password recovery via OTP, session management, and a protected Todo Management System.

---

## Features

### Authentication

* User Registration
* Email Verification via JWT Token
* Resend Verification Email
* Secure Password Hashing using bcrypt
* User Login
* User Logout
* Session Management
* Forgot Password
* OTP Verification
* Password Reset
* Protected Routes

### Todo Management

* Create Todo
* Get All Todos
* Update Todo
* Delete Todo
* Search Todos
* Filter by Status
* Filter by Priority
* User-specific Todos

### Security Features

* JWT Authentication
* Password Hashing
* Email Verification
* OTP Expiration
* Route Protection Middleware
* User Session Tracking
* Input Validation
* MongoDB Data Isolation

---

# Tech Stack

## Frontend

* React
* React Router DOM
* Axios
* Tailwind CSS
* Shadcn UI
* Lucide React

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT
* BcryptJS
* Nodemailer

---

# Project Structure

```txt
production-grade-auth/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middlewares/
│   ├── validators/
│   ├── database/
│   ├── emailVerify/
│   │
│   ├── package.json
│   └── .env
│
├── Postman_Collection.json
├── Postman_Collection_Advanced.json
└── README.md
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

MAIL_USER=your_email@gmail.com
MAIL_PASS=your_email_app_password

JWT_SECRET_KEY=your_jwt_secret
```

## Variable Description

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| PORT           | Backend server port                                |
| MONGO_URI      | MongoDB Atlas connection string                    |
| MAIL_USER      | Email used for sending verification and OTP emails |
| MAIL_PASS      | Gmail App Password                                 |
| JWT_SECRET_KEY | JWT signing secret                                 |

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-username/production-grade-auth.git

cd production-grade-auth
```

---

## Install Backend Dependencies

```bash
cd backend

npm install
```

---

## Install Frontend Dependencies

```bash
cd frontend

npm install
```

---

# Running the Application

## Start Backend

```bash
cd backend

npm run dev
```

Backend runs on:

```txt
http://localhost:3000
```

---

## Start Frontend

```bash
cd frontend

npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

---

# Authentication Flow

```txt
Register
    ↓
Verification Email Sent
    ↓
Verify Email
    ↓
Login
    ↓
Generate Access Token
    ↓
Access Protected Routes
```

---

# Password Recovery Flow

```txt
Forgot Password
    ↓
OTP Sent To Email
    ↓
Verify OTP
    ↓
Change Password
    ↓
Login With New Password
```

---

# Todo Flow

```txt
Login
   ↓
Create Todo
   ↓
Read Todos
   ↓
Update Todo
   ↓
Delete Todo
```

---

# API Endpoints

## Authentication

### Register User

```http
POST /api/auth/register
```

### Verify Email

```http
POST /api/auth/verify
```

### Login User

```http
POST /api/auth/login
```

### Logout User

```http
POST /api/auth/logout
```

### Forgot Password

```http
POST /api/auth/forgot-password
```

### Verify OTP

```http
POST /api/auth/verify-otp/:email
```

### Change Password

```http
PATCH /api/auth/change-password/:email
```

---

## Todos

### Get All Todos

```http
GET /api/todos
```

### Create Todo

```http
POST /api/todos
```

### Update Todo

```http
PATCH /api/todos/:id
```

### Delete Todo

```http
DELETE /api/todos/:id
```

---

# Todo Status Values

```txt
pending
in_progress
completed
```

---

# Todo Priority Values

```txt
low
medium
high
```

---

# Query Parameters

## Search Todos

```http
GET /api/todos?search=meeting
```

## Filter by Status

```http
GET /api/todos?status=completed
```

## Filter by Priority

```http
GET /api/todos?priority=high
```

---

# HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 500  | Internal Server Error |

---

# Postman Collection

Import the provided collections into Postman:

```txt
Postman_Collection.json
Postman_Collection_Advanced.json
```

These collections contain ready-to-use requests for testing all authentication and todo endpoints.

---

# Future Improvements

* Refresh Token Rotation
* Google OAuth
* GitHub OAuth
* Two Factor Authentication (2FA)
* Rate Limiting
* Role Based Access Control (RBAC)
* Account Lockout Protection
* Email Change Verification

---

# Author

Diwakar Shukla

---

# License

This project is licensed under the MIT License.
