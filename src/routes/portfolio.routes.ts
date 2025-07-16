// src/routes/portfolio.routes.ts
import express from 'express';
import multer from 'multer';
// import path from 'path'; // Non più necessario se non usi path per disk storage
import {
  getPortfolioItems,
  getPortfolioItemById,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../controllers/portfolio.controller';

const router = express.Router();

// --- CORREZIONE QUI: Usa multer.memoryStorage() ---
// Configurazione Multer per mantenere i file in memoria
const storage = multer.memoryStorage(); // <--- CAMBIATO DA diskStorage A memoryStorage
const upload = multer({ storage: storage });

// Rotte per il Portfolio
router.get('/', getPortfolioItems);
router.get('/:id', getPortfolioItemById);

// Per add e update, usiamo `upload.fields` per gestire più campi file
router.post(
  '/',
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ]),
  addPortfolioItem
);

router.put(
  '/:id',
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'galleryImages', maxCount: 10 }
  ]),
  updatePortfolioItem
);

router.delete('/:id', deletePortfolioItem);

export default router;
