// app.ts
// Express application setup. Middleware and route mounting only.
// Server startup (listen + db connect) lives in server.ts.
import express from 'express';
import { errorHandler } from './common/errorHandler';
import authRoutes from './auth/auth.routes';
import clientRoutes from './clients/client.routes';
import staffRoutes from './staff/staff.routes';
import caseRoutes from './cases/case.routes';
import noteGlobalRoutes from './notes/note.routes.global';
import taskGlobalRoutes from './tasks/task.routes.global';

const app = express();
app.use(express.json());

// Health check - useful for verifying the container is up before
// wiring up the full route set.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth',    authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/staff',   staffRoutes);
app.use('/api/cases',   caseRoutes);
app.use('/api/notes',   noteGlobalRoutes);
app.use('/api/tasks',   taskGlobalRoutes);

app.use(errorHandler);
export default app;
