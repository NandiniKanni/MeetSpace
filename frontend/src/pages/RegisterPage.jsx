import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function validateRegister({ name, username, password, confirmPassword }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Enter your full name (at least 2 characters).';
  if (username.trim().length < 3) errors.username = 'Username must be at least 3 characters.';
  else if (/\s/.test(username.trim())) errors.username = 'Username cannot contain spaces.';
  if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // One object holds all fields, so we need only one change handler
  const [form, setForm] = useState({ name: '', username: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Returns a function that updates just one field of the form
  function updateField(fieldName) {
    return (event) => setForm((previous) => ({ ...previous, [fieldName]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const errors = validateRegister(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      // Backend field names: name, username, password
      const signedIn = await register({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      if (signedIn) {
        showToast('Account created. Welcome!', 'success');
        navigate('/dashboard', { replace: true });
      } else {
        showToast('Account created. Please sign in.', 'success');
        navigate('/login', { replace: true });
      }
    } catch (error) {
      setServerError(error.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <TextField
          label="Full name"
          id="register-name"
          value={form.name}
          onChange={updateField('name')}
          error={fieldErrors.name}
          autoComplete="name"
          autoFocus
        />
        <TextField
          label="Username"
          id="register-username"
          value={form.username}
          onChange={updateField('username')}
          error={fieldErrors.username}
          autoComplete="username"
        />
        <TextField
          label="Password"
          id="register-password"
          type="password"
          value={form.password}
          onChange={updateField('password')}
          error={fieldErrors.password}
          hint="At least 6 characters."
          autoComplete="new-password"
        />
        <TextField
          label="Confirm password"
          id="register-confirm"
          type="password"
          value={form.confirmPassword}
          onChange={updateField('confirmPassword')}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" loading={loading} className="btn-block">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}
