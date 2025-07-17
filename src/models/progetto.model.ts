// src/models/progetto.model.ts
import mongoose, { Document, Schema } from 'mongoose';

// Interfaccia per le immagini della galleria
export interface IPortfolioImage {
  src?: string;
  description?: string; // Reso opzionale
  alt?: string; // Reso opzionale
  isNew?: boolean; // Questo campo è solo per il frontend, non sarà salvato nel DB
}

// Interfaccia per l'elemento del portfolio
export interface IPortfolioItem extends Document {
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  images: IPortfolioImage[];
  createdAt: Date;
  updatedAt: Date;
  id?: string;
}

const PortfolioImageSchema: Schema = new Schema({
  src: { type: String, required: false },
  description: { type: String, required: false }, // Reso non richiesto
  alt: { type: String, required: false } // Reso non richiesto
}, { _id: false });

const PortfolioItemSchema: Schema = new Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  description: { type: String },
  category: { type: String, required: true },
  images: { type: [PortfolioImageSchema], default: [] }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      const transformedRet: any = ret;
      transformedRet.id = transformedRet._id;
      delete transformedRet._id;
      delete transformedRet.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      const transformedRet: any = ret;
      transformedRet.id = transformedRet._id;
      delete transformedRet._id;
      delete transformedRet.__v;
    }
  }
});

export const PortfolioItem = mongoose.model<IPortfolioItem>('PortfolioItem', PortfolioItemSchema);
