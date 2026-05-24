#!/usr/bin/env bash
# scaffold-models.sh
# Writes Mongoose model files for all six Tier 1 entities under
# /opt/lawfirm-crm/src. Run with sudo on the App Server.

set -euo pipefail

echo "[scaffold-models] starting at $(date -Iseconds)"

SRC="/opt/lawfirm-crm/src"

# ---- clients/client.model.ts ----

cat > "$SRC/clients/client.model.ts" <<'EOF'
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

export const Client = model<IClient>('Client', clientSchema);
EOF

# ---- staff/staff.model.ts ----

cat > "$SRC/staff/staff.model.ts" <<'EOF'
import { Schema, model, Document } from 'mongoose';

export interface IStaff extends Document {
  fullName: string;
  role: 'attorney' | 'paralegal' | 'admin';
  email: string;
  barNumber?: string;
  active: boolean;
  passwordHash: string;
}

const staffSchema = new Schema<IStaff>({
  fullName:     { type: String,  required: true },
  role:         { type: String,  required: true, enum: ['attorney', 'paralegal', 'admin'] },
  email:        { type: String,  required: true, unique: true },
  barNumber:    { type: String },
  active:       { type: Boolean, required: true, default: true },
  // Populated in Session 6 when auth is wired up. Field exists in schema
  // now so the collection shape does not change mid-build.
  passwordHash: { type: String, required: false },
});

export const Staff = model<IStaff>('Staff', staffSchema);
EOF

# ---- cases/case.model.ts ----

cat > "$SRC/cases/case.model.ts" <<'EOF'
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

export const Case = model<ICase>('Case', caseSchema);
EOF

# ---- documents/document.model.ts ----

cat > "$SRC/documents/document.model.ts" <<'EOF'
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

export const CaseDocument = model<IDocument>('Document', documentSchema);
EOF

# ---- notes/note.model.ts ----

cat > "$SRC/notes/note.model.ts" <<'EOF'
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

export const Note = model<INote>('Note', noteSchema);
EOF

# ---- tasks/task.model.ts ----

cat > "$SRC/tasks/task.model.ts" <<'EOF'
import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  title: string;
  caseId: Types.ObjectId;
  assignedStaffId: Types.ObjectId;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'complete';
}

const taskSchema = new Schema<ITask>({
  title:           { type: String, required: true },
  caseId:          { type: Schema.Types.ObjectId, ref: 'Case',  required: true },
  assignedStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  dueDate:         { type: Date,   required: true },
  priority:        { type: String, required: true, enum: ['low', 'medium', 'high'], default: 'medium' },
  status:          { type: String, required: true, enum: ['pending', 'in_progress', 'complete'], default: 'pending' },
});

export const Task = model<ITask>('Task', taskSchema);
EOF

chown -R ubuntu:ubuntu /opt/lawfirm-crm

echo "[scaffold-models] finished at $(date -Iseconds)"