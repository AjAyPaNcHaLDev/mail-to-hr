import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = Email & Document;

@Schema({ timestamps: true })
export class Email {
  @Prop({ required: true })
  jobRole: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ default: false })
  viewed: boolean;

  @Prop()
  viewedAt?: Date;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
