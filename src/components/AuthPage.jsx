import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../lib/supabaseClient';

function isStrongPassword(password) {
  const hasMinimumLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasMinimumLength && hasNumber && hasSpecial;
}

export default function AuthPage({ theme, setTheme, showToast }) {
  const [mode, setMode] = useState('choice');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup(event) {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const fullName = form.get('fullName').trim();
    const rollNumber = form.get('rollNumber').trim();
    const branch = form.get('branch').trim();
    const passingYear = parseInt(form.get('passingYear').trim(), 10);
    const email = form.get('email').trim();
    const password = form.get('password');

    if (!fullName || !rollNumber || !branch || !passingYear || !email || !password) {
      showToast('Please fill all signup fields.', 'warning');
      return;
    }

    if (!isStrongPassword(password)) {
      showToast('Password must have 8 characters, 1 number, and 1 special character.', 'warning');
      return;
    }

    setLoading(true);
    try {
      showToast('Creating your profile...', 'info');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            roll_number: rollNumber,
            branch: branch,
            passing_year: passingYear
          }
        }
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('already') || authError.status === 422) {
          showToast('Account already exists. Please login instead.', 'warning');
        } else {
          showToast('Signup failed: ' + authError.message, 'error');
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        showToast('Signup completed. Please check your email for confirmation.', 'info');
        setLoading(false);
        return;
      }

      // If email confirmation is enabled and session is null, ask to verify email
      if (!authData.session) {
        showToast('Signup successful! Please check your email to verify your account.', 'info');
        setLoading(false);
        return;
      }

      // Check if profile already exists by id to preserve role
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing profile is_admin:', fetchError);
      }

      const existingIsAdmin = existingProfile ? existingProfile.is_admin : false;

      // Profile creation only after session is verified
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: fullName,
        roll_number: rollNumber,
        branch: branch,
        passing_year: passingYear,
        email: email,
        is_admin: existingIsAdmin
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        showToast('Auth succeeded, but profile creation failed: ' + profileError.message, 'error');
      } else {
        showToast('Signup successful! Welcome to Geeks Community.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('An unexpected error occurred during signup.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const rollNumber = form.get('rollNumber').trim();
    const password = form.get('password');

    if (!rollNumber || !password) {
      showToast('Please enter roll number and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('roll_number', rollNumber)
        .maybeSingle();

      if (profileError) {
        showToast('Error checking roll number: ' + profileError.message, 'error');
        setLoading(false);
        return;
      }

      if (!profileData) {
        showToast('Roll number not found. Please sign up first.', 'warning');
        setLoading(false);
        return;
      }

      const email = profileData.email;

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        showToast('Login failed. Please check your email or password.', 'error');
      } else {
        showToast('Welcome back! Redirecting to dashboard...', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('An unexpected error occurred during login.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault();
    setMessage('');
    const form = new FormData(event.currentTarget);
    const email = form.get('email').trim();

    if (!email) {
      showToast('Please enter your email.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      if (error) {
        showToast('Reset failed: ' + error.message, 'error');
      } else {
        showToast('Password reset link sent to your email.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthLogin(provider) {
    try {
      showToast(`Redirecting to ${provider}...`, 'info');
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        showToast(`${provider} login failed: ` + error.message, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(`An unexpected error occurred during ${provider} login.`, 'error');
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-topbar">
        <span className="brand-mark">⚡ Geeks Community</span>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="auth-card glass-card">
        <div className="auth-badge">Student WhatsApp Community</div>
        <h1>Welcome to Geeks Community</h1>
        <p>Login or sign up to explore groups, posts, ideas, featured students, and your streak.</p>

        {mode === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div className="auth-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="primary-btn" style={{ flex: 1 }} onClick={() => setMode('signup')}>Sign Up</button>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={() => setMode('login')}>Login</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>or continue with</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                className="secondary-btn" 
                onClick={() => handleOAuthLogin('google')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px' }}
              >
                <span>🌐</span> Continue with Google
              </button>
              <button 
                type="button" 
                className="secondary-btn" 
                onClick={() => handleOAuthLogin('apple')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '12px' }}
              >
                <span>🍎</span> Continue with Apple
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <form className="form-grid" onSubmit={handleSignup}>
            <input name="fullName" placeholder="Full Name" disabled={loading} required />
            <input name="rollNumber" placeholder="Roll Number" disabled={loading} required />
            <input name="branch" placeholder="Branch" disabled={loading} required />
            <input name="passingYear" type="number" placeholder="Passing Year" disabled={loading} required />
            <input name="email" type="email" placeholder="Email" disabled={loading} required />
            <input name="password" type="password" placeholder="Strong Password" disabled={loading} required />
            <button className="primary-btn full-width" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Student Account'}
            </button>
            <button type="button" className="text-btn" disabled={loading} onClick={() => { setMode('choice'); setMessage(''); }}>Back</button>
          </form>
        )}

        {mode === 'login' && (
          <form className="form-grid" onSubmit={handleLogin}>
            <input name="rollNumber" placeholder="Roll Number" disabled={loading} required />
            <input name="password" type="password" placeholder="Password" disabled={loading} required />
            <button className="primary-btn full-width" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button type="button" className="text-btn" disabled={loading} onClick={() => { setMode('choice'); setMessage(''); }}>Back</button>
              <button type="button" className="text-btn" disabled={loading} onClick={() => { setMode('forgot'); setMessage(''); }}>Forgot Password?</button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form className="form-grid" onSubmit={handleForgotPassword}>
            <input name="email" type="email" placeholder="Enter registered email" disabled={loading} required />
            <button className="primary-btn full-width" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Password Reset Link'}
            </button>
            <button type="button" className="text-btn" disabled={loading} onClick={() => { setMode('login'); setMessage(''); }}>Back to Login</button>
          </form>
        )}

        {message && <p className="form-message">{message}</p>}
      </div>
    </section>
  );
}
