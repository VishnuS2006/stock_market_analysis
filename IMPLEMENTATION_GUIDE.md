# StockFund - Complete Implementation Guide

## ✨ Modern, Professional Authentication System - MINIMAL 8-FIELD DESIGN

---

## 📋 System Overview

This is a **complete, production-ready** full-stack authentication system with:
- ✅ Modern SaaS-style UI (glassmorphism, gradients, glow effects)
- ✅ Minimal 8-field schema for Company and Investor
- ✅ Secure password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ MongoDB persistence with Mongoose
- ✅ Responsive design (mobile + desktop)
- ✅ Real-time form validation
- ✅ Toast notifications & loading spinner
- ✅ Password strength indicator

---

## 🏢 COMPANY SIGNUP (8 FIELDS)

1. **companyName** - Company legal name
2. **email** - Unique company email (lowercase trimmed)
3. **password** - Minimum 6 characters (bcrypt hashed)
4. **registrationNumber** - Unique company registration ID
5. **industry** - Company industry (e.g., "Technology")
6. **foundedYear** - Year company was founded (number)
7. **fundingNeeded** - Funding requirement (e.g., "$500K-$1M")
8. **equityOffered** - Equity percentage offered (number, e.g., 15)

### Company Model (MongoDB)
```javascript
{
  role: "company" (default),
  companyName: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed, required),
  registrationNumber: String (required, unique),
  industry: String (required),
  foundedYear: Number (required),
  fundingNeeded: String (required),
  equityOffered: Number (required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 👤 INVESTOR SIGNUP (8 FIELDS)

1. **fullName** - Investor's full name
2. **email** - Unique investor email  (lowercase trimmed)
3. **password** - Minimum 6 characters (bcrypt hashed)
4. **phone** - Contact phone number
5. **investorType** - Type of investor (Angel / VC / Individual)
6. **investmentRange** - Investment range (e.g., "$100K-$500K")
7. **preferredIndustry** - Preferred investment industry
8. **experienceLevel** - Years of experience (Beginner / Intermediate / Expert)

### Investor Model (MongoDB)
```javascript
{
  role: "investor" (default),
  fullName: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed, required),
  phone: String (required),
  investorType: String enum("Angel", "VC", "Individual", required),
  investmentRange: String (required),
  preferredIndustry: String (required),
  experienceLevel: String enum("Beginner", "Intermediate", "Expert", required),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🎨 UI/UX FEATURES

### **Signup Page** (`/signup`)
- **Modern Design**: Dark gradient background (purple-blue-indigo)
- **Glassmorphism Card**: Semi-transparent with backdrop blur
- **Animated Tabs**: Smooth Company/Investor switching
- **Floating Labels**: Modern input styling
- **Password Strength Indicator**: Real-time visual feedback (red→orange→green)
- **Show/Hide Password**: Toggle visibility
- **Form Validation**: Client-side validation with error messages
- **Loading Spinner**: During form submission
- **Toast Notifications**: Success/error feedback
- **Responsive**: Mobile-first design

### **Login Page** (`/login`)
- **Same Modern Theme**: Consistent styling
- **Email & Password Input**: Glow focus effects
- **Show/Hide Password Toggle**
- **Security Features Display**: JWT, bcrypt, role-based access
- **Redirect on Login**: Company → `/company-dashboard`, Investor → `/investor-dashboard`
- **Error Animations**: Shake effect for invalid credentials

### **Design Elements**
- **Colors**: Blue gradient (#3b82f6 to #8b5cf6), semi-transparent overlays
- **Effects**: 
  - Glassmorphism (backdrop-blur-20px)
  - Glow buttons (box-shadow with color)
  - Smooth hover transitions (2-3ms ease)
  - Soft shadows (0 8px 32px)
  - Rounded corners (rounded-lg, rounded-3xl)
- **Typography**: 'Segoe UI', bold headings, clean body text
- **Animations**: fadeInUp on page load, shakeX on errors, smooth transitions

---

## 🔐 BACKEND API ENDPOINTS

### **Signup Endpoints**

#### POST `/api/auth/signup/company`
Creates a company account with 8 minimal fields.

**Request Body:**
```json
{
  "companyName": "TechFlow Inc",
  "email": "hello@techflow.com",
  "password": "Secure123!",
  "confirmPassword": "Secure123!",
  "registrationNumber": "REG2024001",
  "industry": "Technology",
  "foundedYear": 2020,
  "fundingNeeded": "$500K-$1M",
  "equityOffered": 15.5
}
```

**Response (201 Created):**
```json
{
  "message": "Company registered successfully"
}
```

**Validations:**
- All fields required
- Email must be valid format & unique
- Password minimum 6 characters
- Passwords must match
- Registration number must be unique

---

#### POST `/api/auth/signup/investor`
Creates an investor account with 8 minimal fields.

**Request Body:**
```json
{
  "fullName": "John Smith",
  "email": "john@investor.com",
  "password": "Secure123!",
  "confirmPassword": "Secure123!",
  "phone": "+1-555-0123",
  "investorType": "Angel",
  "investmentRange": "$100K-$500K",
  "preferredIndustry": "Technology",
  "experienceLevel": "Intermediate"
}
```

**Response (201 Created):**
```json
{
  "message": "Investor registered successfully"
}
```

---

### **Login Endpoint**

#### POST `/api/auth/login`
Authenticates user and returns JWT token.

**Request Body:**
```json
{
  "email": "hello@techflow.com",
  "password": "Secure123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "company"
}
```

**Token Details:**
- Format: JWT (JSON Web Token)
- Payload: `{ id: user._id, role: "company"|"investor" }`
- Expires in: 24 hours
- Stored: localStorage on client
- Used for: Protected route access

---

## 💻 TECH STACK

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Custom styles with Tailwind CSS via CDN
- **Vanilla JavaScript** - No framework (lightweight)
- **Animate.css** - Smooth animations
- **FontAwesome** - Icons
- **localStorage** - Token persistence

### **Backend**
- **Node.js** - Runtime
- **Express.js v5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM (Object Document Mapper)
- **bcryptjs** - Password hashing (10 salt rounds)
- **jsonwebtoken** - JWT generation & verification
- **validator.js** - Input validation
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

### **Database**
- **MongoDB** - `stockDB` database
- **Collections**: `companies`, `investors`
- **Indexes**: Unique email + registrationNumber for companies

---

## 📁 PROJECT STRUCTURE

```
stock_analysis/
├── controllers/
│   └── authController.js      # Signup/login logic
├── middleware/
│   └── auth.js                # JWT verification
├── models/
│   ├── Company.js             # 8-field company schema
│   ├── Investor.js            # 8-field investor schema
│   ├── Stock.js               # (existing)
│   └── Event.js               # (existing)
├── routes/
│   └── auth.js                # Auth endpoints
├── public/
│   ├── index.html             # Landing page
│   ├── signup.html            # Signup form (modern UI)
│   ├── login.html             # Login form (modern UI)
│   ├── auth.js                # Form handling + API calls
│   ├── company-dashboard.html # Company dashboard
│   ├── investor-dashboard.html# Investor dashboard
│   ├── style.css              # Legacy styles
│   └── script.js              # Legacy scripts
├── .env                       # Environment config
├── server.js                  # Express server
├── package.json               # Dependencies
└── README.md                  # Documentation
```

---

## 🚀 RUNNING THE APPLICATION

### **1. Install Dependencies**
```bash
cd c:\Users\sakth\OneDrive\Desktop\BigData\stock_analysis
npm install
```

### **2. Create .env File**
Create `.env` in the root folder:
```ini
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/stockDB
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
```

### **3. Start the Server**
```bash
npm start
# or
node server.js
```

**Output:**
```
[dotenv] injecting env (2) from .env
Server running on port 5000
Mongoose connected
MongoDB Connected Successfully to mongodb://...
```

### **4. Access the Application**
- **Home**: http://localhost:5000/
- **Signup**: http://localhost:5000/signup
- **Login**: http://localhost:5000/login
- **Dashboard** (after login): Auto-redirect based on role

---

## ✅ TESTING THE SYSTEM

### **Company Signup Test**
```bash
curl -X POST http://localhost:5000/api/auth/signup/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "TechFlow",
    "email": "tech@flow.com",
    "password": "Pass123456",
    "confirmPassword": "Pass123456",
    "registrationNumber": "TRN2024",
    "industry": "AI",
    "foundedYear": 2023,
    "fundingNeeded": "$1M-$5M",
    "equityOffered": 12
  }'
```

**Expected Response (201):**
```json
{
  "message": "Company registered successfully"
}
```

---

### **Investor Signup Test**
```bash
curl -X POST http://localhost:5000/api/auth/signup/investor \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sarah Jones",
    "email": "sarah@invest.com",
    "password": "Pass123456",
    "confirmPassword": "Pass123456",
    "phone": "+1-555-1234",
    "investorType": "VC",
    "investmentRange": "$500K-$2M",
    "preferredIndustry": "SaaS",
    "experienceLevel": "Expert"
  }'
```

---

### **Login Test**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tech@flow.com",
    "password": "Pass123456"
  }'
```

**Expected Response (200):**
```json
{
  "token": "eyJhbGci...",
  "role": "company"
}
```

---

## 🔒 SECURITY FEATURES

✅ **Password Hashing**
- Bcrypt with 10 salt rounds
- Passwords never stored in plain text

✅ **JWT Tokens**
- Httponly would be better but using localStorage for simplicity
- 24-hour expiration
- Role-based verification

✅ **Input Validation**
- Email format validation
- Required fields check
- Password confirmation matching
- Unique constraints (email, registrationNumber)

✅ **CORS Protection**
- Enabled for development
- Should be restricted in production to specific domains

✅ **Duplicate Prevention**
- Unique email across system
- Unique registration number for companies
- MongoDB unique indexes

---

## 🎯 KEY IMPROVEMENTS (8-FIELD MINIMAL DESIGN)

| Previous | Current | Benefit |
|----------|---------|---------|
| 12+ fields | **8 fields** | Faster signup, less friction |
| Complex | **Minimal** | Easy to understand & fill |
| Validation heavy | **Smart validation** | Real-time feedback |
| Basic UI | **Modern glassmorphism** | Professional first impression |
| No strength meter | **Visual strength bar** | User awareness |
| Plain form | **Animated tabs** | Better UX |

---

## 🐛 DEBUGGING

### Enable Debug Logs
The server includes logging for:
- ✅ signupCompany called + body
- ✅ Company saved to DB + ID
- ✅ login attempt + email
- ✅ login failed + reason
- ✅ login successful + role

Watch server output:
```output
✅ signupCompany called
📦 Body: { companyName: "...", email: "..." }
✓ Company saved to DB: 507f1f77bcf86cd799439011
```

### Check MongoDB
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/stockDB

# List collections
show collections

# View companies
db.companies.find().pretty()

# View investors
db.investors.find().pretty()
```

---

## 📝 FEATURES IMPLEMENTED

- ✅ Modern SaaS-style dark UI with glassmorphism
- ✅ Smooth animations and transitions
- ✅ Password strength meter
- ✅ Show/hide password toggle
- ✅ Real-time form validation
- ✅ Loading spinner during submission
- ✅ Toast notifications (success/error)
- ✅ Tab switching (Company/Investor)
- ✅ Responsive mobile & desktop design
- ✅ Bcrypt password hashing
- ✅ JWT token-based auth
- ✅ Role-based redirects (company/investor dashboards)
- ✅ MongoDB persistence
- ✅ Client-side & server-side validation
- ✅ Error handling & messages
- ✅ Console logging for debugging

---

## 🚀 NEXT STEPS (OPTIONAL)

1. **Add Email Verification**
   - Send confirmation email on signup
   - Validate email before login

2. **Implement Logout**
   - Clear localStorage token
   - Add logout button to dashboards

3. **Add Password Reset**
   - Forgot password link
   - Reset token email
   - New password form

4. **Enhance Security**
   - Add rate limiting on auth endpoints
   - Implement 2FA
   - Use HTTPS in production
   - Add CSRF protection

5. **Improve UX**
   - Social login (Google, GitHub)
   - Remember me checkbox
   - Auto-fill email from previous session

6. **Dashboard Features**
   - Real investor/company data
   - Matching algorithm
   - Investment tracking
   - Document management

---

## 📧 SUPPORT

For issues or questions:
1. Check console logs (browser & server)
2. Verify .env configuration
3. Ensure MongoDB is running
4. Check network tab in browser DevTools
5. Review error messages in toast notifications

---

**System Status**: ✅ READY FOR DEPLOYMENT & TESTING

**Last Updated**: February 24, 2026  
**Version**: 1.0 - Minimal 8-Field Authentication System
