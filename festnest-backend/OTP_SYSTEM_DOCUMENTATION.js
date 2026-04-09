/*
╔════════════════════════════════════════════════════════════════╗
   FESTNEST — OTP VERIFICATION SYSTEM
   Implementation Documentation
╔════════════════════════════════════════════════════════════════╗

OTP SYSTEM ARCHITECTURE & FILES CREATED

NEWLY CREATED FILES:
═══════════════════════════════════════════════════════════════

1. /services/otpService.js
   ├─ generateOTP(email)        : Generate & store OTP with rate limiting
   ├─ verifyOTP(email, code)    : Verify OTP code and check expiry
   ├─ isOTPValid(email)         : Check if valid OTP exists
   ├─ cleanupExpiredOTPs()      : Manual cleanup of expired entries
   └─ getOTPStatus(email)       : Debug function to check OTP status

2. /controllers/otpController.js
   ├─ sendOTP()                 : POST handler for /api/auth/send-otp
   └─ verifyOTP()               : POST handler for /api/auth/verify-otp

3. /routes/otp.js
   ├─ POST /send-otp            : Send OTP to email (rate limited: 3/min)
   └─ POST /verify-otp          : Verify OTP code (rate limited: 10/min)

4. /utils/otpEmail.js
   ├─ sendOTPEmail(email)       : Send beautiful HTML OTP email
   └─ sendOTPErrorNotification() : Admin error notification (dev only)

MINIMALLY MODIFIED FILES:
═══════════════════════════════════════════════════════════════

1. /routes/auth.js
   └─ Added single line: const otpRouter = require('./otp');
   └─ Added router mount: router.use('/', otpRouter);
   (NO logic changes, NO existing code removed)


API ENDPOINTS

1. SEND OTP
   ────────────────────────────────────────────────────────────
   Endpoint    : POST /api/auth/send-otp
   Rate Limit  : 3 requests per 60 seconds per IP
   Rate Limit  : 60 seconds per email (built-in)
   
   Request Body:
   {
     "email": "student@example.com"
   }
   
   Success Response (200):
   {
     "success": true,
     "message": "OTP sent to your email. Valid for 5 minutes.",
     "email": "st***@example.com",     // Masked for privacy
     "expiresIn": 300                   // Seconds
   }
   
   Rate Limit Response (429):
   {
     "success": false,
     "message": "Please wait 45 seconds before requesting another OTP.",
     "retryAfter": 45
   }
   
   Error Response (400/500):
   {
     "success": false,
     "message": "Email is required." | "Invalid email format." | etc
   }

────────────────────────────────────────────────────────────────

2. VERIFY OTP
   ────────────────────────────────────────────────────────────
   Endpoint    : POST /api/auth/verify-otp
   Rate Limit  : 10 requests per 60 seconds per IP
   
   Request Body:
   {
     "email": "student@example.com",
     "code": "123456"
   }
   
   Success Response (200):
   {
     "success": true,
     "message": "OTP verified successfully. Proceed with signup.",
     "email": "student@example.com",
     "verified": true
   }
   
   Invalid OTP Response (400):
   {
     "success": false,
     "message": "Incorrect OTP. 3 attempts remaining.",
     "attemptsRemaining": 3
   }
   
   Expired OTP Response (400):
   {
     "success": false,
     "message": "OTP has expired. Please request a new OTP."
   }
   
   Max Attempts Response (400):
   {
     "success": false,
     "message": "Maximum verification attempts exceeded. Please request a new OTP."
   }


FEATURE SPECIFICATIONS

OTP GENERATION:
├─ Length     : 6 digits (000000-999999)
├─ Randomness : Cryptographically generated
└─ Format     : Numeric string

STORAGE:
├─ Type       : In-memory Map (fast, no DB required)
├─ Structure  : { email → { code, expiresAt, attempts, lastSentAt } }
├─ Security   : OTP deleted on successful verification
└─ Cleanup    : Manual cleanup available via cleanupExpiredOTPs()

EXPIRY:
├─ Duration   : 5 minutes (300 seconds)
├─ Type       : Absolute timestamp-based
└─ Behavior   : OTP becomes inaccessible after expiry

RATE LIMITING:
├─ Per Email  : 60 seconds between send attempts
├─ Per IP     : 3 send requests per 60 seconds
├─ Per IP     : 10 verify requests per 60 seconds
└─ Behavior   : IP limits return 429 status, email limit handled in controller

ATTEMPT LIMIT:
├─ Maximum    : 5 failed verification attempts
├─ Behavior   : OTP deleted after max attempts reached
└─ Message    : Shows attempts remaining

EMAIL:
├─ Provider   : Nodemailer (uses existing config)
├─ Template   : Beautiful HTML email with gradient header
├─ Subject    : "🔐 Your FestNest Verification Code"
├─ Sender     : noreply@festnest.in (configurable via EMAIL_FROM env)
├─ From .env  : EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT
└─ Fallback   : Gracefully skips if email not configured


ENVIRONMENT VARIABLES REQUIRED

EXISTING VARIABLES (already configured):
  EMAIL_USER           : SMTP username
  EMAIL_PASS           : SMTP password
  EMAIL_HOST           : SMTP host (default: smtp.gmail.com)
  EMAIL_PORT           : SMTP port (default: 587)
  EMAIL_FROM           : Sender name (default: FestNest <noreply@festnest.in>)
  FRONTEND_URL         : Frontend URL for links in emails

OPTIONAL:
  ADMIN_EMAIL          : Admin email for error notifications (dev only)
  NODE_ENV             : development/production (affects logging)

EXAMPLE .env entry:
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-app-password
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587


INTEGRATION WITH EXISTING SIGNUP FLOW

OPTIONAL SIGNUP FLOW (NEW):
────────────────────────────────────
1. User enters email on signup form
2. Frontend calls: POST /api/auth/send-otp
   → User receives OTP via email
3. User enters 6-digit OTP
4. Frontend calls: POST /api/auth/verify-otp
   → If success, show confirmation
5. User fills remaining signup details
6. Frontend calls: POST /api/auth/register (EXISTING)
   → User account created as before

EXISTING SIGNUP FLOW (UNCHANGED):
──────────────────────────────────
Users can STILL use: POST /api/auth/register directly
No changes to:
  - /api/auth/register endpoint
  - /api/auth/login endpoint
  - Student/Organizer models
  - Auth middleware
  - Validation logic

100% BACKWARD COMPATIBLE ✅


TESTING THE SYSTEM

STEP 1 - Test Send OTP:
─────────────────────────
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

Expected Response:
{
  "success": true,
  "message": "OTP sent to your email. Valid for 5 minutes.",
  "email": "te***@example.com",
  "expiresIn": 300
}

STEP 2 - Check Email:
─────────────────────
Look for email from noreply@festnest.in with subject:
"🔐 Your FestNest Verification Code"

Extract the 6-digit code from the email.

STEP 3 - Test Verify OTP:
─────────────────────────
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'

Expected Response:
{
  "success": true,
  "message": "OTP verified successfully. Proceed with signup.",
  "email": "test@example.com",
  "verified": true
}

STEP 4 - Test Rate Limiting:
─────────────────────────────
Try requesting OTP 4 times rapidly:
curl -X POST http://localhost:5000/api/auth/send-otp ... (x4)

After 3 requests, should get 429:
{
  "success": false,
  "message": "Too many OTP requests. Please wait before trying again."
}

STEP 5 - Test Expiry:
─────────────────────
1. Send OTP
2. Wait 5+ minutes
3. Try to verify

Expected Response:
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}


ERROR HANDLING & SAFETY

GRACEFUL DEGRADATION:
├─ If email not configured  → OTP system warns and continues
├─ If email send fails      → User redirected to request new OTP
├─ If database down         → Server continues (uses in-memory)
└─ If rate limiter fails    → Continues with service-level limits

ERROR SCENARIOS HANDLED:
├─ Missing email input      → 400 Bad Request
├─ Invalid email format     → 400 Bad Request
├─ Rate limit exceeded      → 429 Too Many Requests
├─ OTP expired              → 400 Bad Request with message
├─ Invalid OTP code         → 400 Bad Request with attempts left
├─ Max attempts exceeded    → 400 Bad Request, OTP deleted
├─ Email not found          → 400 Bad Request
└─ Server errors            → 500 with generic message

LOGGING:
├─ All OTP generation logged with timestamp
├─ All OTP verification attempts logged
├─ Rate limit hits logged with reason
├─ Email send success/failure logged
└─ Errors logged without sensitive data


PRODUCTION DEPLOYMENT NOTES

IMPORTANT CONSIDERATIONS:
① Email Setup Priority
   - Gmail: Use App Password (not account password)
   - Zoho: Use app-specific password
   - Ensure EMAIL_USER and EMAIL_PASS are in production env

② Rate Limiting Strategy
   - Current: 3 sends per 60 sec per IP + 60 sec per email
   - For high traffic: Adjust in /routes/otp.js

③ OTP Storage
   - Currently: In-memory (lost on server restart)
   - For multi-server: Consider Redis backend
   - Implementation: Replace Map with Redis client
   - Minimal code change needed in /services/otpService.js

④ Data Privacy
   - OTPs never logged in full
   - Email masked in responses
   - OTPs deleted after verification
   - No OTP stored in database

⑤ Monitoring
   - Monitor email delivery rate
   - Alert on high OTP failures
   - Track rate limit hits
   - Consider SMS fallback for critical scenarios

⑥ Security
   - Ensure HTTPS in production
   - Keep EMAIL_PASS secure (use env vars)
   - Periodically audit OTP logs
   - Consider CAPTCHA for repeated failures


FUTURE ENHANCEMENTS (OPTIONAL)

1. Redis Backend for Multi-Server Deployment
   - Replace Map with Redis
   - Enables horizontal scaling
   - Survives server restarts

2. SMS Fallback
   - Add SMS provider (Twilio)
   - Send SMS if email fails
   - Falls back gracefully

3. OTP Database Logging (Audit Trail)
   - Store OTP events in MongoDB
   - Track success/failure rates
   - Generate reports

4. Email Verification Status Flag
   - Add isEmailVerified to User model
   - Only required once
   - Frontend can check this

5. CAPTCHA Integration
   - Require CAPTCHA after 3 failed attempts
   - Prevent abuse

6. Custom Email Validation
   - Block disposable emails
   - Verify domain DNS records

===================================================================
*/
