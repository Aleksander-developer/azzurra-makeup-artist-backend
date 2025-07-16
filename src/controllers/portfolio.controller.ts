// src/controllers/portfolio.controller.ts
import { Request, Response } from 'express';
import { PortfolioItem, IPortfolioImage } from '../models/progetto.model';
import cloudinary from '../config/cloudinary.config';
// import fs from 'fs'; // Non più necessario se usi memoryStorage
// import path from 'path'; // Non più necessario se usi memoryStorage

// Funzione helper per eliminare i file temporanei di Multer
// NON PIÙ NECESSARIA, PUOI RIMUOVERLA COMPLETAMENTE
const cleanupMulterFiles = (files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[]) => {
  // Questa funzione non è più necessaria con multer.memoryStorage()
  // dato che i file non vengono scritti su disco.
  // Puoi rimuovere questa funzione e tutte le sue chiamate.
};


// GET tutti gli elementi del portfolio
export const getPortfolioItems = async (_req: Request, res: Response) => {
  try {
    const items = await PortfolioItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Errore nel recupero degli elementi del portfolio:', error);
    res.status(500).json({ message: 'Errore nel recupero degli elementi del portfolio', error });
  }
};

// GET un singolo elemento del portfolio per ID
export const getPortfolioItemById = async (req: Request, res: Response) => {
  try {
    const item = await PortfolioItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Elemento del portfolio non trovato' });
    }
    res.json(item);
  } catch (error) {
    console.error('Errore nel recupero dell\'elemento del portfolio:', error);
    res.status(500).json({ message: 'Errore nel recupero dell\'elemento del portfolio', error });
  }
};

// POST Aggiungi un nuovo elemento del portfolio (con upload immagini)
export const addPortfolioItem = async (req: Request, res: Response) => {
  try {
    const { title, subtitle, description, category } = req.body;
    const mainImageFile = (req.files as { [fieldname: string]: Express.Multer.File[] })?.mainImage?.[0];
    const galleryFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })?.galleryImages;

    const imagesData: IPortfolioImage[] = req.body.images ? JSON.parse(req.body.images) : [];

    if (!title || !category) {
      // cleanupMulterFiles(req.files as { [fieldname: string]: Express.Multer.File[] }); // Rimuovi questa chiamata
      return res.status(400).json({ message: 'Titolo e Categoria sono obbligatori.' });
    }
    if (!mainImageFile) {
      // cleanupMulterFiles(req.files as { [fieldname: string]: Express.Multer.File[] }); // Rimuovi questa chiamata
      return res.status(400).json({ message: 'Immagine principale è obbligatoria.' });
    }

    let mainImageUrl = '';

    // --- CORREZIONE QUI: Carica da buffer, non da path ---
    const resultMain = await cloudinary.uploader.upload(
      `data:${mainImageFile.mimetype};base64,${mainImageFile.buffer.toString('base64')}`, // <-- USA .buffer
      {
        folder: 'azzurra-makeup/portfolio-main',
        quality: "auto:low",
        fetch_format: "auto"
      }
    );
    mainImageUrl = resultMain.secure_url;
    // fs.unlinkSync(mainImageFile.path); // Rimuovi questa riga
    // --- FINE CORREZIONE ---

    // Upload immagini della galleria
    const galleryImages: IPortfolioImage[] = [];
    if (galleryFiles && galleryFiles.length > 0) {
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        // --- CORREZIONE QUI: Carica da buffer, non da path ---
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, // <-- USA .buffer
          {
            folder: 'azzurra-makeup/portfolio-gallery',
            quality: "auto:low",
            fetch_format: "auto"
          }
        );
        // fs.unlinkSync(file.path); // Rimuovi questa riga
        // --- FINE CORREZIONE ---

        const imageDetails: IPortfolioImage = imagesData[i] || { src: '', description: '', alt: '' };
        galleryImages.push({
          src: result.secure_url,
          description: imageDetails.description || '',
          alt: imageDetails.alt || ''
        });
      }
    }

    const newItem = new PortfolioItem({
      title,
      subtitle,
      description,
      mainImage: mainImageUrl,
      category,
      images: galleryImages,
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Errore nell\'aggiunta dell\'elemento del portfolio:', error);
    // cleanupMulterFiles(req.files as { [fieldname: string]: Express.Multer.File[] }); // Rimuovi questa chiamata
    res.status(500).json({ message: 'Errore nell\'aggiunta dell\'elemento del portfolio', error: (error as Error).message });
  }
};

// PUT Aggiorna un elemento del portfolio (con upload immagini)
export const updatePortfolioItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, category } = req.body;
    const mainImageFile = (req.files as { [fieldname: string]: Express.Multer.File[] })?.mainImage?.[0];
    const galleryFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })?.galleryImages;

    const imagesData: IPortfolioImage[] = req.body.images ? JSON.parse(req.body.images) : [];

    const item = await PortfolioItem.findById(id);
    if (!item) {
      // cleanupMulterFiles(req.files as { [fieldname: string]: Express.Multer.File[] }); // Rimuovi questa chiamata
      return res.status(404).json({ message: 'Elemento del portfolio non trovato' });
    }

    item.title = title || item.title;
    item.subtitle = subtitle !== undefined ? subtitle : item.subtitle;
    item.description = description !== undefined ? description : item.description;
    item.category = category || item.category;

    // Gestione immagine principale
    if (mainImageFile) {
      // --- CORREZIONE QUI: Carica da buffer, non da path ---
      const result = await cloudinary.uploader.upload(
        `data:${mainImageFile.mimetype};base64,${mainImageFile.buffer.toString('base64')}`, // <-- USA .buffer
        {
          folder: 'azzurra-makeup/portfolio-main',
          quality: "auto:low",
          fetch_format: "auto"
        }
      );
      item.mainImage = result.secure_url;
      // fs.unlinkSync(mainImageFile.path); // Rimuovi questa riga
      // --- FINE CORREZIONE ---
    } else if (req.body.mainImage === '') {
        item.mainImage = '';
    }

    // Gestione immagini della galleria
    const finalGalleryImages: IPortfolioImage[] = [];
    let galleryFileIndex = 0;

    for (const imgData of imagesData) {
        if (imgData.isNew && galleryFiles && galleryFileIndex < galleryFiles.length) {
            const file = galleryFiles[galleryFileIndex];
            // --- CORREZIONE QUI: Carica da buffer, non da path ---
            const result = await cloudinary.uploader.upload(
              `data:${file.mimetype};base64,${file.buffer.toString('base64')}`, // <-- USA .buffer
              {
                folder: 'azzurra-makeup/portfolio-gallery',
                quality: "auto:low",
                fetch_format: "auto"
              }
            );
            // fs.unlinkSync(file.path); // Rimuovi questa riga
            // --- FINE CORREZIONE ---
            finalGalleryImages.push({
                src: result.secure_url,
                description: imgData.description || '',
                alt: imgData.alt || ''
            });
            galleryFileIndex++;
        } else if (imgData.src) {
            finalGalleryImages.push({
                src: imgData.src,
                description: imgData.description || '',
                alt: imgData.alt || ''
            });
        }
    }

    item.images = finalGalleryImages;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'elemento del portfolio:', error);
    // cleanupMulterFiles(req.files as { [fieldname: string]: Express.Multer.File[] }); // Rimuovi questa chiamata
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'elemento del portfolio', error: (error as Error).message });
  }
};


// DELETE Elimina un elemento del portfolio
export const deletePortfolioItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await PortfolioItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ message: 'Elemento del portfolio non trovato' });
    }

    res.status(200).json({ message: 'Elemento del portfolio eliminato con successo' });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'elemento del portfolio:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'elemento del portfolio', error: (error as Error).message });
  }
};
