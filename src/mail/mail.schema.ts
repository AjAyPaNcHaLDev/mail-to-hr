import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Mail extends Document {
  @Prop() to: string;
  @Prop() subject: string;
  @Prop() name: string;
  @Prop() body: string; 
  @Prop({ default: false }) isSent: boolean;
  @Prop({ default: false }) viewed: boolean;
}

export const MailSchema = SchemaFactory.createForClass(Mail);
