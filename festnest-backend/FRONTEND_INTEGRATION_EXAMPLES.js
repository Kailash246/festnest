/* ============================================================
   FESTNEST — OTP FRONTEND INTEGRATION EXAMPLE
   JavaScript/React code samples for OTP verification flow
   ============================================================ */

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  VANILLA JAVASCRIPT EXAMPLE                              ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────
// 1. SEND OTP
// ─────────────────────────────────────────────────────────────

async function sendOTP(email) {
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 429) {
        showError(`Rate limited. Wait ${data.retryAfter} seconds.`);
      } else {
        showError(data.message || 'Failed to send OTP');
      }
      return false;
    }

    showSuccess(`OTP sent to ${data.email}`);
    startOTPTimer(300); // 5 minutes
    return true;
  } catch (error) {
    showError('Network error: ' + error.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 2. VERIFY OTP
// ─────────────────────────────────────────────────────────────

async function verifyOTP(email, code) {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();

    if (!response.ok) {
      showError(
        data.message || 'OTP verification failed'
      );
      if (data.attemptsRemaining !== undefined) {
        showWarning(`${data.attemptsRemaining} attempts remaining`);
      }
      return false;
    }

    showSuccess('Email verified! Proceed with signup.');
    return true;
  } catch (error) {
    showError('Network error: ' + error.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. COMPLETE SIGNUP FLOW (WITH OTP)
// ─────────────────────────────────────────────────────────────

async function signupWithOTP(userData) {
  const email = userData.email;

  // Step 1: Send OTP
  const otpSent = await sendOTP(email);
  if (!otpSent) return false;

  // Step 2: Get OTP from user (show modal/form)
  const otp = await getOTPFromUser();
  if (!otp) return false;

  // Step 3: Verify OTP
  const otpVerified = await verifyOTP(email, otp);
  if (!otpVerified) return false;

  // Step 4: Proceed with existing register API
  const registered = await register(userData);
  return registered;
}

// ─────────────────────────────────────────────────────────────
// 4. HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

function startOTPTimer(seconds) {
  let remaining = seconds;
  const timerElement = document.getElementById('otp-timer');
  
  const interval = setInterval(() => {
    remaining--;
    if (timerElement) {
      timerElement.textContent = `${remaining}s`;
    }
    
    if (remaining <= 0) {
      clearInterval(interval);
      showWarning('OTP expired. Request a new one.');
      // Disable OTP input, show "Request new OTP" button
      disableOTPInput();
    }
  }, 1000);
}

function showSuccess(message) {
  console.log('✅', message);
  // Update UI: show green toast/alert
  const alert = document.getElementById('alert');
  if (alert) {
    alert.innerHTML = `<div class="success">${message}</div>`;
  }
}

function showError(message) {
  console.error('❌', message);
  // Update UI: show red toast/alert
  const alert = document.getElementById('alert');
  if (alert) {
    alert.innerHTML = `<div class="error">${message}</div>`;
  }
}

function showWarning(message) {
  console.warn('⚠️', message);
  // Update UI: show yellow toast/alert
  const alert = document.getElementById('alert');
  if (alert) {
    alert.innerHTML = `<div class="warning">${message}</div>`;
  }
}

async function getOTPFromUser() {
  // Show modal/form and wait for user input
  return new Promise((resolve) => {
    const modal = document.getElementById('otp-modal');
    if (modal) {
      modal.style.display = 'block';
      
      const submitBtn = document.getElementById('verify-otp-btn');
      if (submitBtn) {
        submitBtn.onclick = () => {
          const input = document.getElementById('otp-input');
          const code = input.value.trim();
          modal.style.display = 'none';
          resolve(code);
        };
      }
    }
  });
}

function disableOTPInput() {
  const input = document.getElementById('otp-input');
  if (input) {
    input.disabled = true;
  }
}


/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  REACT COMPONENT EXAMPLE                                 ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';

function OTPVerificationFlow() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // email | otp | signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(t => t - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeRemaining]);

  // ─────────────────────────────────────────────────────────────
  // Send OTP
  // ─────────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
        return;
      }

      setMessage(`OTP sent to ${data.email}`);
      setTimeRemaining(300); // 5 minutes
      setStep('otp');
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Verify OTP
  // ─────────────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = data.message || 'OTP verification failed';
        if (data.attemptsRemaining !== undefined) {
          errorMsg += ` (${data.attemptsRemaining} attempts left)`;
        }
        setError(errorMsg);
        return;
      }

      setMessage('Email verified! Proceed with signup.');
      setStep('signup'); // Show signup form
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Signup (existing API)
  // ─────────────────────────────────────────────────────────────
  const handleSignup = async (formData) => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Signup failed');
        return;
      }

      // Success! Redirect to login or dashboard
      setMessage('Account created successfully!');
      // window.location.href = '/pages/events.html';
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render UI based on step
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="otp-container">
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {step === 'email' && (
        <form onSubmit={handleSendOTP}>
          <h3>Verify Your Email</h3>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOTP}>
          <h3>Enter OTP</h3>
          <p>Expires in {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}</p>
          <input
            type="text"
            placeholder="6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength="6"
            required
          />
          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" onClick={() => setStep('email')}>
            Request New OTP
          </button>
        </form>
      )}

      {step === 'signup' && (
        <SignupForm email={email} onSubmit={handleSignup} />
      )}
    </div>
  );
}

export default OTPVerificationFlow;


/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  OLD FLOW STILL WORKS (NO OTP)                           ║
 * ╚══════════════════════════════════════════════════════════╝
 */

// Users can still call register directly, bypassing OTP:

async function directSignup(userData) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  
  if (data.success) {
    // User registered successfully
    return data;
  }
  
  throw new Error(data.message);
}

// Example usage:
/*
directSignup({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  role: 'student',
  college: 'MIT',
  year: '2nd',
  phone: '9876543210'
}).then(() => {
  console.log('Signup complete!');
}).catch(err => {
  console.error('Signup failed:', err);
});
*/


/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  HTML FORM EXAMPLE                                       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/*
<div id="auth-container">
  <!-- Step 1: Email Entry -->
  <form id="email-form" onsubmit="return handleEmailSubmit(event)">
    <input 
      type="email" 
      id="email-input" 
      placeholder="your@email.com"
      required
    />
    <button type="submit">Send OTP</button>
    <p id="alert"></p>
  </form>

  <!-- Step 2: OTP Entry (hidden initially) -->
  <form id="otp-form" style="display:none;" onsubmit="return handleOtpSubmit(event)">
    <input 
      type="text" 
      id="otp-input" 
      placeholder="000000"
      maxlength="6"
      pattern="\d{6}"
      required
    />
    <p>Expires in <span id="otp-timer">300</span>s</p>
    <button type="submit">Verify OTP</button>
    <button type="button" onclick="showEmailForm()">Request New OTP</button>
    <p id="alert"></p>
  </form>

  <!-- Step 3: Registration Form (shown after OTP verified) -->
  <form id="signup-form" style="display:none;" onsubmit="return handleSignup(event)">
    <input type="text" placeholder="First Name" required />
    <input type="text" placeholder="Last Name" required />
    <input type="email" placeholder="Email (auto-filled)" value="" disabled />
    <input type="password" placeholder="Password" required />
    <select required>
      <option>Student</option>
      <option>Organizer</option>
    </select>
    <input type="text" placeholder="College" required />
    <button type="submit">Create Account</button>
  </form>
</div>

<script>
function handleEmailSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('email-input').value;
  sendOTP(email);
  document.getElementById('email-form').style.display = 'none';
  document.getElementById('otp-form').style.display = 'block';
}

function handleOtpSubmit(event) {
  event.preventDefault();
  const email = document.getElementById('email-input').value;
  const code = document.getElementById('otp-input').value;
  verifyOTP(email, code);
  // If successful, show signup form
}

function showEmailForm() {
  document.getElementById('email-form').style.display = 'block';
  document.getElementById('otp-form').style.display = 'none';
}
</script>
*/


// ═════════════════════════════════════════════════════════════
// API Response Examples
// ═════════════════════════════════════════════════════════════

/*
SEND OTP - Success (200):
{
  "success": true,
  "message": "OTP sent to your email. Valid for 5 minutes.",
  "email": "jo***@example.com",
  "expiresIn": 300
}

SEND OTP - Rate Limited (429):
{
  "success": false,
  "message": "Please wait 45 seconds before requesting another OTP.",
  "retryAfter": 45
}

VERIFY OTP - Success (200):
{
  "success": true,
  "message": "OTP verified successfully. Proceed with signup.",
  "email": "john@example.com",
  "verified": true
}

VERIFY OTP - Wrong Code (400):
{
  "success": false,
  "message": "Incorrect OTP. 4 attempts remaining.",
  "attemptsRemaining": 4
}

VERIFY OTP - Expired (400):
{
  "success": false,
  "message": "OTP has expired. Please request a new OTP."
}
*/
