require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Route modules (to be implemented)
// app.use('/api/auth', require('./routes/auth'));            // login, role detection, invitations
// app.use('/api/workspaces', require('./routes/workspaces')); // IPO workspace CRUD, membership
// app.use('/api/wizard', require('./routes/wizard'));         // guided data capture, auto-save
// app.use('/api/documents', require('./routes/documents'));   // upload, checklist, categories
// app.use('/api/sections', require('./routes/sections'));     // ownership, locking, status
// app.use('/api/reviews', require('./routes/reviews'));       // comments, change requests, approvals
// app.use('/api/dashboard', require('./routes/dashboard'));   // health score, activity feed
// app.use('/api/export', require('./routes/export'));         // export summary, Word/PDF
// app.use('/api/billing', require('./routes/billing'));       // payments, subscriptions

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`IPOW backend listening on :${port}`));
