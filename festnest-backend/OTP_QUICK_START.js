/*
╔════════════════════════════════════════════════════════════════╗
   FESTNEST — OTP SYSTEM QUICK START GUIDE
   Setup, Testing & Deployment Instructions
╔════════════════════════════════════════════════════════════════╗
║  STEP 1: VERIFY FILES WERE CREATED                            ║
╚════════════════════════════════════════════════════════════════╝

Check these files exist:
  ✓ festnest-backend/services/otpService.js
  ✓ festnest-backend/controllers/otpController.js
  ✓ festnest-backend/routes/otp.js
  ✓ festnest-backend/utils/otpEmail.js
  ✓ festnest-backend/OTP_SYSTEM_DOCUMENTATION.js (this file)

Modified files (minimal changes):
  ✓ festnest-backend/routes/auth.js (+ 2 lines)


╔════════════════════════════════════════════════════════════════╗
║  STEP 2: ENVIRONMENT SETUP                                    ║
╚════════════════════════════════════════════════════════════════╝

Ensure .env file has email configuration:

  EMAIL_USER=your-email@gmail.com
  EMAIL_PASS=your-app-password
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_FROM=FestNest <noreply@festnest.in>
  FRONTEND_URL=http://localhost:5000
  NODE_ENV=development

If using Gmail:
  → Go to myaccount.google.com/apppasswords
  → Generate app-specific password
  → Use that in EMAIL_PASS (not your main password)

If using Zoho:
  → Use your Zoho email as EMAIL_USER
  → Use app password as EMAIL_PASS
  → Set EMAIL_HOST=smtp.zoho.com


╔════════════════════════════════════════════════════════════════╗
║  STEP 3: DATABASE NOT REQUIRED                                ║
╚════════════════════════════════════════════════════════════════╝

⚠️  OTP uses in-memory storage (Map), NOT MongoDB
    ✓ No migrations needed
    ✓ No new collections needed
    ✓ No model changes
    ✓ Server restart clears old OTPs (by design)


╔════════════════════════════════════════════════════════════════╗
║  STEP 4: START SERVER & TEST                                  ║
╚════════════════════════════════════════════════════════════════╝

Development (with hot reload):
  $ npm run dev

Production:
  $ npm start

Server should start without errors:
  ✅ MongoDB connected
  ✅ Firebase initialized
  ✅ Server running on http://localhost:5000


╔════════════════════════════════════════════════════════════════╗
║  STEP 5: TEST ENDPOINTS                                       ║
╚════════════════════════════════════════════════════════════════╝

TEST 1: Send OTP
────────────────────────────────────────────────────────────────

Using curl:
  curl -X POST http://localhost:5000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@gmail.com"}'

Using Postman:
  1. New Request
  2. Method: POST
  3. URL: http://localhost:5000/api/auth/send-otp
  4. Body (JSON): {"email":"test@gmail.com"}
  5. Send

Expected Response (200):
  {
    "success": true,
    "message": "OTP sent to your email. Valid for 5 minutes.",
    "email": "te***@gmail.com",
    "expiresIn": 300
  }

Check console: Should see
  ✓ [SendOTP] 📥 POST received
  ✓ [SendOTP] ✅ OTP email sent to test@gmail.com
  ✓ ✅ OTP generated for test@gmail.com: 123456 (expires in 5 min)
  ✓ 📧 Email sent to test@gmail.com: <message-id>

────────────────────────────────────────────────────────────────

TEST 2: Verify OTP
────────────────────────────────────────────────────────────────

1. Check email inbox for:
   Subject: "🔐 Your FestNest Verification Code"
   
2. Extract the 6-digit code from the email

3. Send verification request:
   curl -X POST http://localhost:5000/api/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"email":"test@gmail.com","code":"123456"}'

Expected Response (200):
  {
    "success": true,
    "message": "OTP verified successfully. Proceed with signup.",
    "email": "test@gmail.com",
    "verified": true
  }

────────────────────────────────────────────────────────────────

TEST 3: Rate Limiting (Per Email)
────────────────────────────────────────────────────────────────

Run send-otp twice within 60 seconds for same email:

Request 1 (success):
  ✓ Response 200 with OTP sent message

Request 2 (rate limited):
  ✗ Response 429 with message:
  {
    "success": false,
    "message": "Please wait 45 seconds before requesting another OTP.",
    "retryAfter": 45
  }

────────────────────────────────────────────────────────────────

TEST 4: Invalid OTP
────────────────────────────────────────────────────────────────

Send verification with wrong code:
  curl -X POST http://localhost:5000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test@gmail.com","code":"000000"}'

Expected Response (400):
  {
    "success": false,
    "message": "Incorrect OTP. 4 attempts remaining.",
    "attemptsRemaining": 4
  }

────────────────────────────────────────────────────────────────

TEST 5: Expired OTP
────────────────────────────────────────────────────────────────

1. Send OTP
2. Wait 5 minutes (300 seconds)
3. Try to verify

Expected Response (400):
  {
    "success": false,
    "message": "OTP has expired. Please request a new OTP."
  }


╔════════════════════════════════════════════════════════════════╗
║  STEP 6: FRONTEND INTEGRATION FLOW                            ║
╚════════════════════════════════════════════════════════════════╝

OPTIONAL NEW SIGNUP FLOW:

Step 1: Email Entry
  └─ User enters email on form
  └─ Frontend calls: POST /api/auth/send-otp

Step 2: OTP Entry
  └─ User receives email with OTP
  └─ User enters OTP on form
  └─ Frontend calls: POST /api/auth/verify-otp

Step 3: Registration
  └─ User fills signup details (name, password, college, etc.)
  └─ Frontend calls: POST /api/auth/register (EXISTING)
  └─ User account created

EXISTING FLOW STILL WORKS:
  ✓ Users can bypass OTP and call /api/auth/register directly
  ✓ No dependencies or breaking changes
  ✓ 100% backward compatible


╔════════════════════════════════════════════════════════════════╗
║  STEP 7: VERIFY NO EXISTING APIS BROKEN                       ║
╚════════════════════════════════════════════════════════════════╝

Test existing endpoints still work:

Login (unchanged):
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"password123"}'

Register (unchanged):
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "firstName":"John",
      "lastName":"Doe",
      "email":"john@example.com",
      "password":"SecurePass123",
      "role":"student",
      "college":"MIT",
      "year":"2nd",
      "phone":"9876543210"
    }'

Both should work exactly as before ✓


╔════════════════════════════════════════════════════════════════╗
║  COMMON ISSUES & SOLUTIONS                                    ║
╚════════════════════════════════════════════════════════════════╝

ISSUE: "Email not configured — OTP email skipped"
SOLUTION: 
  → Ensure EMAIL_USER and EMAIL_PASS in .env
  → Check .env is in festnest-backend/ root
  → Restart server after .env changes

────────────────────────────────────────────────────────────────

ISSUE: "Module not found: services/otpService"
SOLUTION:
  → Verify file exists: festnest-backend/services/otpService.js
  → Check file is in correct directory structure
  → Restart Node server

────────────────────────────────────────────────────────────────

ISSUE: Email not arriving
SOLUTION:
  → Check spam/junk folder
  → Verify EMAIL_USER is correct Gmail/Zoho address
  → For Gmail: Use app-specific password, not main password
  → Check server logs for email errors

────────────────────────────────────────────────────────────────

ISSUE: "Too many OTP requests" immediately after sending
SOLUTION:
  → This is expected (rate limiting working)
  → Wait 60 seconds before requesting OTP again from same email
  → Different emails can request OTP immediately

────────────────────────────────────────────────────────────────

ISSUE: OTP works locally but not on production
SOLUTION:
  → If using Render: Add EMAIL_USER and EMAIL_PASS to env vars
  → If using Vercel: Add to environment settings
  → Restart deployment after setting env vars
  → Check .env not committed to git (add to .gitignore)


╔════════════════════════════════════════════════════════════════╗
║  SECURITY CHECKLIST                                           ║
╚════════════════════════════════════════════════════════════════╝

Before going to production:

☐ EMAIL_PASS is using app-specific password, not main password
☐ .env file is in .gitignore (NOT committed to git)
☐ HTTPS is enabled on production domain
☐ Rate limiting is appropriate for your user base
☐ Email provider account has security enabled
☐ Backup email delivery method exists (SMS fallback)
☐ OTP logs don't contain sensitive data
☐ Server has sufficient memory for in-memory OTP storage
☐ Error messages don't leak system information
☐ Email sender address (noreply@festnest.in) is verified


╔════════════════════════════════════════════════════════════════╗
║  DEPLOYMENT CHECKLIST                                         ║
╚════════════════════════════════════════════════════════════════╝

For Render/Vercel deployment:

☐ Add environment variables:
  - EMAIL_USER
  - EMAIL_PASS
  - EMAIL_HOST
  - EMAIL_PORT
  - EMAIL_FROM
  - FRONTEND_URL (update with production URL)

☐ If upgrading existing deployment:
  - Push changes to git
  - Render auto-redeploys on push
  - Verify OTP endpoints in production
  - Test email delivery from production server

☐ If Redis needed for multi-server:
  - Add Redis provider (e.g., Redis Cloud)
  - Install redis npm package
  - Update otpService.js to use Redis
  - Tested before deploy


╔════════════════════════════════════════════════════════════════╗
║  MONITORING & MAINTENANCE                                     ║
╚════════════════════════════════════════════════════════════════╝

Recommended monitoring:

1. Track OTP Success Rate
   └─ Monitor /api/auth/send-otp success rate
   └─ Alert if drops below 95%

2. Email Delivery Monitoring
   └─ Check email provider delivery stats
   └─ Monitor bounces and spam complaints

3. Rate Limit Monitoring
   └─ Log 429 responses per endpoint
   └─ Identify abuse patterns

4. Server Memory
   └─ In-memory OTP storage grows with users
   └─ Monitor memory usage (current ~0.1KB per OTP)
   └─ Cleanup happens on verification (OTPs deleted)

5. Error Tracking
   └─ Log all failed verifications
   └─ Alert on repeated failures from same IP

╔════════════════════════════════════════════════════════════════╗
║  SUPPORT & TROUBLESHOOTING                                    ║
╚════════════════════════════════════════════════════════════════╝

Files for reference:
  1. OTP_SYSTEM_DOCUMENTATION.js (full technical spec)
  2. services/otpService.js (core logic)
  3. controllers/otpController.js (request handlers)
  4. routes/otp.js (endpoint definitions)
  5. utils/otpEmail.js (email template)

For issues:
  1. Check console logs (Node server output)
  2. Review OTP_SYSTEM_DOCUMENTATION.js for full specs
  3. Enable 'NODE_ENV=development' for verbose logging
  4. Test /api/health endpoint to verify server is running

===================================================================
Ready to deploy! 🚀
===================================================================
*/
