import { Schema, model, Document, Types } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  documentType: 'court_filing' | 'evidence' | 'correspondence' | 'identity' | 'immigration_form' | 'other';
  caseId: Types.ObjectId;
  uploadDate: Date;
  author: string;
  filePath: string;
  fileSizeBytes: number;
}

const documentSchema = new Schema<IDocument>({
  title:         { type: String, required: true },
  documentType:  { type: String, required: true, enum: [
                    'court_filing', 'evidence', 'correspondence',
                    'identity', 'immigration_form', 'other'
                  ]},
  caseId:        { type: Schema.Types.ObjectId, ref: 'Case', required: true },
  uploadDate:    { type: Date,   required: true, default: Date.now },
  author:        { type: String, required: true },
  filePath:      { type: String, required: true },
  fileSizeBytes: { type: Number, required: true },
});

export const CaseDocument = model<IDocument>('Document', documentSchema, 'documents');
