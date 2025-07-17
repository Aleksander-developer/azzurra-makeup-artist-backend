// src/routes/portfolio.routes.ts
import express from 'express';
import multer from 'multer';
// Non è più necessario importare 'path' se usi memoryStorage
// import path from 'path'; 
import {
  getPortfolioItems,
  getPortfolioItemById,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem
} from '../controllers/portfolio.controller';

const router = express.Router();

// Configurazione Multer per mantenere i file in memoria
// Questo è fondamentale per il caricamento diretto su Cloudinary senza salvare su disco
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotte per il Portfolio
router.get('/', getPortfolioItems);
router.get('/:id', getPortfolioItemById);

// **MODIFICATO:** Per la creazione (POST) di un nuovo elemento
// Il frontend invia i file sotto il campo 'images' e i metadati come stringa JSON 'imagesMetadata'
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 10 }, // Array di immagini per i nuovi elementi
    { name: 'imagesMetadata' }        // Metadati delle immagini come stringa JSON
  ]),
  addPortfolioItem
);

// **MODIFICATO:** Per l'aggiornamento (PUT) di un elemento esistente
// Il frontend invia i NUOVI file sotto 'newImages' e i metadati di TUTTE le immagini 'imagesMetadata'
router.put(
  '/:id',
  upload.fields([
    { name: 'newImages', maxCount: 10 }, // Solo i nuovi file aggiunti durante l'editing
    { name: 'imagesMetadata' }           // Metadati di tutte le immagini (esistenti e nuove)
  ]),
  updatePortfolioItem
);

router.delete('/:id', deletePortfolioItem);

export default router;
