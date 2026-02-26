# API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Company Signup
**Endpoint:** `POST /auth/signup/company`

**Request Body:**
```json
{
  "companyName": "string (required)",
  "email": "string (required, must be valid email)",
  "password": "string (required, min 6 chars)",
  "confirmPassword": "string (required, must match password)",
  "registrationNumber": "string (required, must be unique)",
  "industry": "string (required)",
  "website": "string (required, must be valid URL or empty)",
  "description": "string (required)",
  "foundedYear": "number (required)",
  "phone": "string (required)",
  "address": "string (required)",
  "employees": "number (required)"
}
```

**Response (201 Created):**
```json
{
  "message": "Company registered successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or validation failed
- `409 Conflict` - Email or registration number already exists
- `500 Internal Server Error` - Database error

**Validation Rules:**
- Email must be a valid format
- Password must be at least 6 characters
- Password and confirmPassword must match
- Website URL must be valid or empty
- Registration number must be unique
- All required fields must be provided

---

### 2. Investor Signup
**Endpoint:** `POST /auth/signup/investor`

**Request Body:**
```json
{
  "fullName": "string (required)",
  "email": "string (required, must be valid email)",
  "password": "string (required, min 6 chars)",
  "confirmPassword": "string (required, must match password)",
  "phone": "string (required)",
  "investmentRange": "string (required)",
  "industries": "array (required)",
  "location": "string (required)",
  "experience": "string (required) - 'Beginner' | 'Intermediate' | 'Expert'",
  "linkedin": "string (optional, must be valid URL if provided)"
}
```

**Response (201 Created):**
```json
{
  "message": "Investor registered successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or validation failed
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Database error

**Validation Rules:**
- Email must be unique and valid format
- Password must be at least 6 characters
- Password and confirmPassword must match
- LinkedIn URL must be valid format if provided
- All required fields must be provided

---

### 3. Login
**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "token": "JWT token string",
  "role": "company" | "investor"
}
```

**Error Responses:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid email or password
- `500 Internal Server Error` - Database error

**Token Details:**
- Format: JWT (JSON Web Token)
- Expires in: 1 hour
- Payload includes: user ID and role

---

## Protected Routes

All protected routes require the JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

### 4. Company Dashboard
**Endpoint:** `GET /company/dashboard`

**Headers Required:**
```
Authorization: Bearer <JWT token with role='company'>
```

**Response (200 OK):**
```json
{
  "message": "Welcome to the company dashboard",
  "user": {
    "id": "user_id",
    "role": "company"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - User does not have company role

---

### 5. Investor Dashboard
**Endpoint:** `GET /investor/dashboard`

**Headers Required:**
```
Authorization: Bearer <JWT token with role='investor'>
```

**Response (200 OK):**
```json
{
  "message": "Welcome to the investor dashboard",
  "user": {
    "id": "user_id",
    "role": "investor"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No token or invalid token
- `403 Forbidden` - User does not have investor role

---

### 6. Company Stats (for dashboard)
**Endpoint:** `GET /company/stats`

**Headers Required:**
```
Authorization: Bearer <JWT token with role='company'>
```

**Response (200 OK):**
```json
{
  "funding": 1200000,
  "investors": 345,
  "growth": 24,
  "chartData": [12, 19, 3, 5, 2, 3]
}
```

---

### 7. Investor Stats (for dashboard)
**Endpoint:** `GET /investor/stats`

**Headers Required:**
```
Authorization: Bearer <JWT token with role='investor'>
```

**Response (200 OK):**
```json
{
  "investments": 75,
  "returns": 18,
  "opportunities": 14,
  "chartData": [5, 10, 8, 15, 9, 12]
}
```

---

## Example API Calls

### Using cURL

**Company Signup:**
```bash
curl -X POST http://localhost:5000/api/auth/signup/company \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "TechCorp",
    "email": "info@techcorp.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "registrationNumber": "REG12345",
    "industry": "Technology",
    "website": "https://techcorp.com",
    "description": "Leading tech company",
    "foundedYear": 2015,
    "phone": "1234567890",
    "address": "123 Tech St, Silicon Valley",
    "employees": 150
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "info@techcorp.com",
    "password": "SecurePass123!"
  }'
```

**Access Protected Route:**
```bash
curl -X GET http://localhost:5000/api/company/dashboard \
  -H "Authorization: Bearer <your_jwt_token_here>"
```

### Using PowerShell

**Company Signup:**
```powershell
$body = @{
  companyName = "TechCorp"
  email = "info@techcorp.com"
  password = "SecurePass123!"
  confirmPassword = "SecurePass123!"
  registrationNumber = "REG12345"
  industry = "Technology"
  website = "https://techcorp.com"
  description = "Leading tech company"
  foundedYear = 2015
  phone = "1234567890"
  address = "123 Tech St, Silicon Valley"
  employees = 150
} | ConvertTo-Json

Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/signup/company' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body
```

**Login:**
```powershell
$body = @{
  email = "info@techcorp.com"
  password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' `
  -Method Post `
  -Headers @{'Content-Type'='application/json'} `
  -Body $body

$token = ($response.Content | ConvertFrom-Json).token
```

**Access Protected Route:**
```powershell
Invoke-WebRequest -Uri 'http://localhost:5000/api/company/dashboard' `
  -Headers @{'Authorization'="Bearer $token"}
```

### Using JavaScript/Fetch

**Company Signup:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/signup/company', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'TechCorp',
    email: 'info@techcorp.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    registrationNumber: 'REG12345',
    industry: 'Technology',
    website: 'https://techcorp.com',
    description: 'Leading tech company',
    foundedYear: 2015,
    phone: '1234567890',
    address: '123 Tech St, Silicon Valley',
    employees: 150
  })
});
const data = await response.json();
console.log(data);
```

**Login:**
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'info@techcorp.com',
    password: 'SecurePass123!'
  })
});
const data = await response.json();
localStorage.setItem('token', data.token);
console.log('Role:', data.role);
```

**Access Protected Route:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/company/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(data);
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid credentials or missing token |
| 403 | Forbidden - Token valid but user lacks required role |
| 409 | Conflict - Resource already exists (duplicate email, etc.) |
| 500 | Internal Server Error - Server-side error |

---

## Error Response Format

All errors return a JSON object with a message:
```json
{
  "message": "Error description here"
}
```

---

## Security Notes

1. **Password Storage**: All passwords are hashed with bcrypt (10 salt rounds)
2. **JWT Token**: Stored in localStorage on the client
3. **CORS**: Enabled for development, should be restricted in production
4. **Token Expiration**: 1 hour (can be modified in authController.js)
5. **No Token Blacklist**: Currently no logout mechanism (tokens remain valid until expiration)

---

## Future Enhancements

- Add password reset endpoint
- Add email verification
- Implement token refresh mechanism
- Add 2FA (Two-Factor Authentication)
- Add user profile update endpoints
- Add logout with token blacklist
- Rate limiting on auth endpoints
- HTTPS requirement in production
