import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  Param,
  Get,
  Res,
  BadRequestException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MailService } from './mail.service';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SendSingleEmailDto } from './dto/SendSingleEmailDto';
import { Response } from 'express';
import { BodyPasswordGuard } from 'src/common/middleware/auth.middleware';

@ApiTags('Mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) { }

  @Post('send-bulk')
  @UseGuards(BodyPasswordGuard)
  @ApiOperation({ summary: 'Send emails from uploaded Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        password: { type: 'string', example: 'supersecret' },
      },
      required: ['file', 'password'],
    },
  })
  @ApiResponse({ status: 201, description: 'Emails sent successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${unique}${ext}`);
        },
      }),
    }),
  )
  async sendBulk(@UploadedFile() file: Express.Multer.File) {
    if (!file || !file.path) {
      throw new BadRequestException('Excel file is required for bulk email sending');
    }

    return this.mailService.sendBulkEmail(file.path);
  }

  @Post('send-one')
  @UseGuards(BodyPasswordGuard)
  @ApiOperation({ summary: 'Send a single email to a recipient' })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  async sendOne(@Body() recipientDto: SendSingleEmailDto) {
    return this.mailService.sendSingleEmail(recipientDto);
  }

  @Get('view/:id')
  async track(@Param('id') id: string, @Res() res: Response) {
    console.log(id)
    await this.mailService.markViewed(id);

    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQImWNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=',
      'base64',
    );

    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
  }
  @Get('sent-emails')
  @ApiOperation({ summary: 'Retrieve sent emails with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getSentEmails(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.mailService.getSentEmails(+page, +limit);
  }
  @Get('sent-emails-html')
  @ApiOperation({ summary: 'Retrieve sent emails with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getSentEmailsWithHtml(
    @Query('page') page = 1,
    @Query('limit') limit = 10, @Res() res: Response,
  ) {
    const { data, totalPages } = await this.mailService.getSentEmails(+page, +limit);
    const html = this.buildHtml(data, +page, totalPages, +limit);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  private buildHtml(data: any[], page: number, totalPages: number, limit: number): string {
    return `
      <html>
        <head>
          <title>Sent Emails</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: #f4f4f4;
            }
            h2 {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #007bff;
              color: white;
            }
            .pagination {
              text-align: center;
              margin-top: 20px;
            }
            .pagination a {
              display: inline-block;
              padding: 8px 16px;
              margin: 0 5px;
              border: 1px solid #007bff;
              color: #007bff;
              text-decoration: none;
              border-radius: 4px;
              background-color: #fff;
            }
            .pagination a.active {
              background-color: #007bff;
              color: white;
              pointer-events: none;
            }
            .pagination a:hover:not(.active) {
              background-color: #e9ecef;
            }
          </style>
        </head>
        <body>
          <h2>Sent Emails</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Subject</th>
                <th>Viewed</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              ${data
        .map(
          (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.to}</td>
                  <td>${item.subject}</td>
                  <td>${item.viewed ? '✅ Yes' : '❌ No'}</td>
                  <td>${item.isSent ? new Date(item.createdAt).toLocaleString() : "Failed"}</td>
                </tr>
              `
        )
        .join('')}
            </tbody>
          </table>
          <div class="pagination">
            ${Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(
          (p) => `
              <a href="?page=${p}&limit=${limit}" class="${p === page ? 'active' : ''
            }">${p}</a>
            `
        )
        .join('')}
          </div>
        </body>
      </html>
    `;
  }
}
