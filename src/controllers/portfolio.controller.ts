// src/controllers/portfolio.controller.ts
import { Request, Response } from 'express';
import cloudinary from 'cloudinary'; // Assicurati che sia importato correttamente
import { IPortfolioImage, IPortfolioItem, PortfolioItem } from '../models/progetto.model';

// Assicurati che Cloudinary sia configurato nel tuo server principale (es. server.ts o app.ts)
// Esempio:
// cloudinary.v2.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// Funzione helper per caricare un file su Cloudinary
async function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream(
      { resource_type: "auto", folder: folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url); // Usiamo '!' per asserire che result non è null
      }
    ).end(fileBuffer);
  });
}

// Funzione helper per estrarre il public_id da un URL di Cloudinary
function getPublicIdFromUrl(url: string): string | null {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  // Rimuovi l'estensione del file per ottenere il public_id
  return filename.split('.')[0] || null;
}

// GET tutti gli elementi del portfolio
export const getPortfolioItems = async (req: Request, res: Response) => {
  try {
    const items: IPortfolioItem[] = await PortfolioItem.find({}); // Tipizzato
    res.status(200).json(items);
  } catch (error: any) {
    console.error('Errore nel recupero degli elementi del portfolio:', error);
    res.status(500).json({ message: 'Errore nel recupero degli elementi del portfolio', error: error.message });
  }
};

// GET un singolo elemento del portfolio per ID
export const getPortfolioItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item: IPortfolioItem | null = await PortfolioItem.findById(id); // Tipizzato
    if (!item) {
      return res.status(404).json({ message: 'Elemento portfolio non trovato.' });
    }
    res.status(200).json(item);
  } catch (error: any) {
    console.error('Errore nel recupero del singolo elemento portfolio:', error);
    res.status(500).json({ message: 'Errore nel recupero del singolo elemento portfolio', error: error.message });
  }
};

// POST Aggiungi un nuovo elemento portfolio
export const addPortfolioItem = async (req: Request, res: Response) => {
  console.log('--- Controller: addPortfolioItem ---');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  try {
    const { title, subtitle, description, category } = req.body;

    let imagesMetadata: IPortfolioImage[] = []; // **CORREZIONE:** Tipizzato esplicitamente
    if (req.body.imagesMetadata) {
      try {
        imagesMetadata = JSON.parse(req.body.imagesMetadata);
      } catch (e) {
        console.error('Errore nel parsing di imagesMetadata:', e);
        return res.status(400).json({ message: 'Formato dei metadati delle immagini non valido.' });
      }
    }

    const uploadedFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })['images'];

    if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).json({ message: 'Almeno un\'immagine è richiesta per un nuovo elemento portfolio.' });
    }

    const uploadedImageUrls: string[] = [];
    for (const file of uploadedFiles) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'azzurra-makeup/portfolio');
        uploadedImageUrls.push(imageUrl);
    }

    let finalImages: IPortfolioImage[] = []; // **CORREZIONE:** Tipizzato esplicitamente
    let newImageCounter = 0;
    imagesMetadata.forEach(meta => {
        if (meta.isNew) {
            if (uploadedImageUrls[newImageCounter]) {
                finalImages.push({
                    src: uploadedImageUrls[newImageCounter],
                    description: meta.description,
                    alt: meta.alt
                });
                newImageCounter++;
            } else {
                console.warn('Metadati per nuova immagine ma nessun URL caricato corrispondente.');
            }
        } else {
            finalImages.push({
                src: meta.src,
                description: meta.description,
                alt: meta.alt
            });
        }
    });

    const newPortfolioItem = new PortfolioItem({
      title,
      subtitle,
      description,
      category,
      images: finalImages,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedItem = await newPortfolioItem.save();
    res.status(201).json(savedItem);

  } catch (error: any) {
    console.error('Errore durante l\'aggiunta dell\'elemento portfolio:', error);
    res.status(500).json({ message: 'Errore nell\'aggiunta dell\'elemento portfolio', error: error.message });
  }
};

// PUT Aggiorna un elemento portfolio esistente
export const updatePortfolioItem = async (req: Request, res: Response) => {
  console.log('--- Controller: updatePortfolioItem ---');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files);

  try {
    const { id } = req.params;
    const { title, subtitle, description, category } = req.body;

    let imagesMetadata: IPortfolioImage[] = []; // **CORREZIONE:** Tipizzato esplicitamente
    if (req.body.imagesMetadata) {
      try {
        imagesMetadata = JSON.parse(req.body.imagesMetadata);
      } catch (e) {
        console.error('Errore nel parsing di imagesMetadata:', e);
        return res.status(400).json({ message: 'Formato dei metadati delle immagini non valido.' });
      }
    }

    const portfolioItem: IPortfolioItem | null = await PortfolioItem.findById(id); // Tipizzato
    if (!portfolioItem) {
      return res.status(404).json({ message: 'Elemento portfolio non trovato.' });
    }

    const uploadedNewFiles = (req.files as { [fieldname: string]: Express.Multer.File[] })['newImages'];
    const uploadedNewImageUrls: string[] = [];

    if (uploadedNewFiles && uploadedNewFiles.length > 0) {
      for (const file of uploadedNewFiles) {
        const imageUrl = await uploadToCloudinary(file.buffer, 'azzurra-makeup/portfolio');
        uploadedNewImageUrls.push(imageUrl);
      }
    }

    let finalImages: IPortfolioImage[] = []; // **CORREZIONE:** Tipizzato esplicitamente
    let newImageCounter = 0;

    // **CORREZIONE:** Controlla se portfolioItem.images esiste prima di mappare
    const existingImageUrls = portfolioItem.images ? portfolioItem.images.map(img => img.src) : [];

    imagesMetadata.forEach(meta => {
        if (meta.isNew) {
            if (uploadedNewImageUrls[newImageCounter]) {
                finalImages.push({
                    src: uploadedNewImageUrls[newImageCounter],
                    description: meta.description,
                    alt: meta.alt
                });
                newImageCounter++;
            }
        } else {
            finalImages.push({
                src: meta.src,
                description: meta.description,
                alt: meta.alt
            });
        }
    });

    const updatedImageUrls = finalImages.map(img => img.src);
    for (const originalUrl of existingImageUrls) {
        if (originalUrl && !updatedImageUrls.includes(originalUrl)) {
            const publicId = getPublicIdFromUrl(originalUrl);
            if (publicId) {
                console.log(`Eliminazione immagine da Cloudinary: azzurra-makeup/portfolio/${publicId}`);
                await cloudinary.v2.uploader.destroy(`azzurra-makeup/portfolio/${publicId}`);
            }
        }
    }

    portfolioItem.title = title;
    portfolioItem.subtitle = subtitle;
    portfolioItem.description = description;
    portfolioItem.category = category;
    portfolioItem.images = finalImages; // Assegna l'array tipizzato
    portfolioItem.updatedAt = new Date();

    const updatedItem = await portfolioItem.save();
    res.status(200).json(updatedItem);

  } catch (error: any) {
    console.error('Errore durante l\'aggiornamento dell\'elemento portfolio:', error);
    res.status(500).json({ message: 'Errore nell\'aggiornamento dell\'elemento portfolio', error: error.message });
  }
};

// DELETE Elimina un elemento portfolio
export const deletePortfolioItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const portfolioItem: IPortfolioItem | null = await PortfolioItem.findById(id); // Tipizzato

    if (!portfolioItem) {
      return res.status(404).json({ message: 'Elemento portfolio non trovato.' });
    }

    // **CORREZIONE:** Controlla se portfolioItem.images esiste prima di iterare
    if (portfolioItem.images) {
      for (const img of portfolioItem.images) {
          if (img.src) {
              const publicId = getPublicIdFromUrl(img.src);
              if (publicId) {
                  console.log(`Eliminazione immagine da Cloudinary: azzurra-makeup/portfolio/${publicId}`);
                  await cloudinary.v2.uploader.destroy(`azzurra-makeup/portfolio/${publicId}`);
              }
          }
      }
    }

    await PortfolioItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Elemento portfolio eliminato con successo.' });

  } catch (error: any) {
    console.error('Errore durante l\'eliminazione dell\'elemento portfolio:', error);
    res.status(500).json({ message: 'Errore nell\'eliminazione dell\'elemento portfolio', error: error.message });
  }
};
