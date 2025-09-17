import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  hashedPassword: string;

  @Prop({ required: true, default: 'user' })
  role: string;

  @Prop({ required: false })
  company?: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSuperuser: boolean;

  @Prop({ type: Object, default: {} })
  settings?: {
    email_notifications?: boolean;
    job_alerts?: boolean;
    resume_updates?: boolean;
  };

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
