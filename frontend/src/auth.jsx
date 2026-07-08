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

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
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
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
