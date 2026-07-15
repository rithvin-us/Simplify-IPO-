import React, { createContext, useContext, useState } from 'react';
import api from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('ipow_user');
    return raw ? JSON.parse(raw) : null;
  });

  function persist(token, u) {
    localStorage.setItem('ipow_token', token);
    localStorage.setItem('ipow_user', JSON.stringify(u));
    setUser(u);
  }

  // Returns { user } on success or { mfa_required, mfa_token } when the
  // account needs the second factor (complete via mfaLogin).
  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.mfa_required) return { mfa_required: true, mfa_token: data.mfa_token };
    persist(data.token, data.user);
    return { user: data.user };
  }

  async function mfaLogin(mfa_token, code) {
    const { data } = await api.post('/auth/mfa/login', { mfa_token, code });
    persist(data.token, data.user);
    return data.user;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload);
    persist(data.token, data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('ipow_token');
    localStorage.removeItem('ipow_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, mfaLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
