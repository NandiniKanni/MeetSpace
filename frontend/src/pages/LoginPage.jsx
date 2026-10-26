import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';

// Checks the form and returns an object like { username: "message" } (empty = all good)
function validateLogin(username, password) {
  const errors = {};
  if (!username.trim()) errors.username = 'Enter your username.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Each piece of form data is its own "state" value
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const errors = validateLogin(username, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return; // stop: the form has mistakes

    setLoading(true);
    try {
      await login(username.trim(), password);
      // Go back to the page the person wanted, or the dashboard
      const destination = location.state && location.state.from ? location.state.from.pathname : '/dashboard';
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(error.message);
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to start or join a meeting."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {serverError && <Alert>{serverError}</Alert>}

        <TextField
          label="Username"
          id="login-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          error={fieldErrors.username}
          autoComplete="username"
          autoFocus
        />
        <TextField
          label="Password"
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <Button type="submit" size="lg" loading={loading} className="btn-block">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
