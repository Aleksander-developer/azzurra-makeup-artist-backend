// src/models/progetto.model.ts (nel tuo backend)
import mongoose, { Document, Schema } from 'mongoose';

// Interfaccia per le immagini della galleria
export interface IPortfolioImage {
  src: string;
  description?: string;
  alt?: string;
  isNew?: boolean; // <-- AGGIUNTO DI NUOVO: Questo è il fix per l'errore 'isNew'
}

// Interfaccia per l'elemento del portfolio
export interface IPortfolioItem extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  mainImage: string; // URL dell'immagine principale
  category: string;
  images?: IPortfolioImage[]; // Array di immagini della galleria
  createdAt: Date;
  updatedAt: Date;
  id?: string; // Aggiungi id qui per TypeScript, sarà un virtuale
}

const PortfolioImageSchema: Schema = new Schema({
  src: { type: String, required: true },
  description: { type: String },
  alt: { type: String }
}, { _id: false });

const PortfolioItemSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  mainImage: { type: String, required: true },
  category: { type: String, required: true },
  images: [PortfolioImageSchema]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      // FIX QUI: Cast 'ret' a 'any' per permettere l'assegnazione e la cancellazione di proprietà
      const transformedRet: any = ret;
      transformedRet.id = transformedRet._id;
      delete transformedRet._id;
      delete transformedRet.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      // FIX QUI: Cast 'ret' a 'any'
      const transformedRet: any = ret;
      transformedRet.id = transformedRet._id;
      delete transformedRet._id;
      delete transformedRet.__v;
    }
  }
});

export const PortfolioItem = mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);
