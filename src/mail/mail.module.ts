import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mail, MailSchema} from "./mail.schema"

@Module({
  imports: [MongooseModule.forFeature([{ name: Mail.name, schema: MailSchema }])],
  providers: [MailService],
  controllers: [MailController],
})
export class MailModule {}
