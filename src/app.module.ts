// app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MailModule } from './mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // ✅ This loads .env globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',  
    }),

    // ✅ Mongoose async config using ConfigService
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI'); 
        return {
          uri,
        };
      },
    }),

    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
