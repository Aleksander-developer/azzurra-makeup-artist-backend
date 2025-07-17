// src/index.ts
import app from './app'; // Importa l'istanza dell'app Express da app.ts
import { connectDB } from './config/db.config'; // Importa la funzione di connessione al DB

const PORT = process.env.PORT || 3000;

// Funzione asincrona per avviare il server dopo la connessione al DB
const startServer = async () => {
  try {
    await connectDB(); // Attendi che la connessione al DB sia stabilita
    app.listen(PORT, () => {
      console.log(`Server avviato su http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Errore critico all\'avvio del server:', error);
    process.exit(1); // Termina il processo in caso di errore critico
  }
};

startServer(); // Avvia la funzione
