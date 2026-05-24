import { Schema, model, Document, Types } from 'mongoose';

export interface ICase extends Document {
  caseNumber: string;
  title: string;
  clientId: Types.ObjectId;
  responsibleStaffId: Types.ObjectId;
  caseType: 'employment_visa' | 'student_visa' | 'asylum' | 'green_card' | 'naturalization' | 'removal_defense' | 'family_petition' | 'other';
  receiptNumber?: string;
  priorityDate?: Date;
  filingDate?: Date;
  currentStage: string;
  status: 'open' | 'closed' | 'on_hold';
  dateOpened: Date;
  dateClosed?: Date;
  courtId?: Types.ObjectId;
}

const caseSchema = new Schema<ICase>({
  caseNumber:         { type: String, required: true, unique: true },
  title:              { type: String, required: true },
  clientId:           { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  responsibleStaffId: { type: Schema.Types.ObjectId, ref: 'Staff',  required: true },
  caseType:           { type: String, required: true, enum: [
                          'employment_visa', 'student_visa', 'asylum', 'green_card',
                          'naturalization', 'removal_defense', 'family_petition', 'other'
                        ]},
  receiptNumber:      { type: String },
  priorityDate:       { type: Date },
  filingDate:         { type: Date },
  currentStage:       { type: String, required: true },
  status:             { type: String, required: true, enum: ['open', 'closed', 'on_hold'], default: 'open' },
  dateOpened:         { type: Date,   required: true, default: Date.now },
  dateClosed:         { type: Date },
  courtId:            { type: Schema.Types.ObjectId, ref: 'Court' },
});

export const Case = model<ICase>('Case', caseSchema, 'cases');
