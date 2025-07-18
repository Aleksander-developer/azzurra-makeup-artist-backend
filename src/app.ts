// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// import { connectDB } from './config/db.config'; // Non importare qui se gestito in index.ts
import apiRoutes from './routes';
import path from 'path';

// **IMPORTANTE:** Importa il tuo file di configurazione Cloudinary qui
import './config/cloudinary.config'; // <-- Questa riga va bene

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://azzurra-makeup-artist.netlify.app',
  'http://localhost:4200', // Per lo sviluppo locale di Angular
  'http://localhost:3000' // Per il backend stesso se fai richieste interne (utile per test)
];

app.use(cors({
  origin: function (origin, callback) {
    // Permetti richieste senza 'origin' (es. da Postman o curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log("CORS origin non permessa:", origin);
    return callback(new Error('Accesso CORS non consentito da questo dominio'), false);
  },
  credentials: true, // Permetti l'invio di cookie/header di autorizzazione
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Metodi HTTP consentiti
  allowedHeaders: ['Content-Type', 'Authorization'] // Header consentiti
}));

// Middleware per il parsing del body delle richieste
app.use(express.json()); // Per il parsing di application/json
app.use(express.urlencoded({ extended: true })); // Per il parsing di application/x-www-form-urlencoded

// Serve i file statici dalla cartella 'uploads' (usata da Multer)
// NOTA: Se usi multer.memoryStorage(), questa riga potrebbe non essere strettamente necessaria
// a meno che tu non abbia altri upload su disco.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRoutes);

// **MODIFICATO:** Rimuovi o commenta questa riga, la connessione DB è ora in index.ts
// (async () => { await connectDB(); })();

// Rotta di base per testare che il server sia attivo
app.get('/', (req, res) => {
  res.send('Server Express per Azzurra Makeup Artist avviato con successo!');
});

export default app;
