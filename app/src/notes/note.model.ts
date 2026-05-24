import { Schema, model, Document, Types } from 'mongoose';

export interface INote extends Document {
  caseId: Types.ObjectId;
  authorStaffId: Types.ObjectId;
  body: string;
  createdAt: Date;
}

const noteSchema = new Schema<INote>({
  caseId:        { type: Schema.Types.ObjectId, ref: 'Case',  required: true },
  authorStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  body:          { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Note = model<INote>('Note', noteSchema, 'notes');
