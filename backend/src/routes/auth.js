// /api/auth — login, register, current user.
const express = require('express');
const { verifyPassword, signToken, authRequired } = require('../auth');
const { createUser, findUserByEmail, publicUser } = require('../store');

const router = express.Router();
const ROLES = ['sme', 'merchant_banker', 'legal_counsel', 'admin'];

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email || '');
  if (!user || !verifyPassword(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.post('/register', (req, res) => {
  const { email, password, full_name, role } = req.body || {};
  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ error: 'email, password, full_name, role required' });
  }
  if (!ROLES.includes(role)) return res.status(400).json({ error: `role must be one of ${ROLES.join(', ')}` });
  if (findUserByEmail(email)) return res.status(409).json({ error: 'email already registered' });
  const user = createUser({ email, password, full_name, role });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => res.json({ user: req.user }));

module.exports = router;
