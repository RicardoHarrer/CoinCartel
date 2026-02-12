import dotenv from 'dotenv';
import path from 'path';

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import debug from 'debug';
import routes from './api/routes/routes.js';
import bankRoutes from './api/routes/bankRoutes.js';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

debug.enable(process.env.DEBUG);

const startup = debug('startup');
const dirname = path.resolve();

// ✅ APP ZUERST ERSTELLEN
const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(dirname, '/public')));

// Routes
app.use('/', routes);
app.use('/api/bank', bankRoutes);
app.disable('etag');

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => startup(`Server is running on port ${PORT}`));

export default app;
