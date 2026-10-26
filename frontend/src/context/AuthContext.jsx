// "Context" lets many components share the same data without passing props through every level.
// This one shares who is logged in.
//
// How login works in YOUR backend: POST /login returns { token }. That is all
// (no user profile). So we save the token and the username the person typed.
// We have not seen any backend route that checks the token yet, so it is only
// stored for now; when you add protected routes, send it from services/api.js.

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginUser, registerUser } from '../services/api';

const TOKEN_KEY = 'meetspace_token';
const USERNAME_KEY = 'meetspace_username';

const AuthContext = createContext(null);

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    // storage blocked - the person will just need to log in again after a refresh
  }
}

export function AuthProvider({ children }) {
  // useState(() => ...) runs only once, when the app first loads
  const [token, setToken] = useState(() => readStorage(TOKEN_KEY));
  const [username, setUsername] = useState(() => readStorage(USERNAME_KEY));

  const login = useCallback(async (usernameInput, password) => {
    const result = await loginUser(usernameInput, password);
    writeStorage(TOKEN_KEY, result.token);
    writeStorage(USERNAME_KEY, usernameInput);
    setToken(result.token);
    setUsername(usernameInput);
  }, []);

  // Registers, then signs in automatically (the backend's register does not return a token).
  // Returns true when auto sign-in worked.
  const register = useCallback(
    async ({ name, username: usernameInput, password }) => {
      await registerUser({ name, username: usernameInput, password });
      try {
        await login(usernameInput, password);
        return true;
      } catch (error) {
        return false;
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    writeStorage(TOKEN_KEY, null);
    writeStorage(USERNAME_KEY, null);
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, username, isLoggedIn: Boolean(token), login, register, logout }),
    [token, username, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// A shortcut so components can write: const { username } = useAuth();
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
