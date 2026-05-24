import { Schema, model, Document } from 'mongoose';

export interface IClient extends Document {
  fullName: string;
  dateOfBirth: Date;
  countryOfOrigin: string;
  aNumber: string;
  currentImmigrationStatus: string;
  dateOfEntry: Date;
  email: string;
  phone: string;
  mailingAddress: string;
  dateOnboarded: Date;
  status: 'active' | 'inactive' | 'closed';
}

const clientSchema = new Schema<IClient>({
  fullName:                  { type: String, required: true },
  dateOfBirth:               { type: Date,   required: true },
  countryOfOrigin:           { type: String, required: true },
  aNumber:                   { type: String, required: true, unique: true },
  currentImmigrationStatus:  { type: String, required: true },
  dateOfEntry:               { type: Date,   required: true },
  email:                     { type: String, required: true },
  phone:                     { type: String, required: true },
  mailingAddress:            { type: String, required: true },
  dateOnboarded:             { type: Date,   required: true, default: Date.now },
  status:                    { type: String, required: true, enum: ['active', 'inactive', 'closed'], default: 'active' },
});

export const Client = model<IClient>('Client', clientSchema, 'clients');
