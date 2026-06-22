import { Schema, model, Document } from 'mongoose';

export interface IStaff extends Document {
  fullName: string;
  role: 'attorney' | 'paralegal' | 'admin';
  email: string;
  barNumber?: string;
  active: boolean;
  biography?: string;
  passwordHash: string;
}

const staffSchema = new Schema<IStaff>({
  fullName:     { type: String,  required: true },
  role:         { type: String,  required: true, enum: ['attorney', 'paralegal', 'admin'] },
  email:        { type: String,  required: true, unique: true },
  barNumber:    { type: String },
  active:       { type: Boolean, required: true, default: true },
  // Excluded from query results by default so the staff list payload stays
  // lean. The detail handler opts in with select('+biography').
  biography:    { type: String, select: false },
  // Populated in Session 6 when auth is wired up. Field exists in schema
  // now so the collection shape does not change mid-build.
  passwordHash: { type: String, required: false, select: false },
});

export const Staff = model<IStaff>('Staff', staffSchema, 'staff');
