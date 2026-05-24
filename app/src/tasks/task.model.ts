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

export const Task = model<ITask>('Task', taskSchema, 'tasks');
