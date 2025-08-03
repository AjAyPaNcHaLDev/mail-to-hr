import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { readExcel } from 'src/utils/excel-reader';
import { SendSingleEmailDto } from './dto/SendSingleEmailDto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mail } from './mail.schema';
import { existsSync } from 'fs';
import { join } from 'path';
import * as fs from 'fs/promises';
import { safeDeleteFile } from 'src/utils/file-utils';
function getResumePathByJobRole(role: string): string {
  const normalized = role.toLowerCase();
  const basePath = join(__dirname, '../../resume');
  if (normalized.includes('mern')) return join(basePath, 'mern.pdf');
  if (normalized.includes('react')) return join(basePath, 'reactjs.pdf');
  if (normalized.includes('node')) return join(basePath, 'nodejs.pdf');
  if (normalized.includes('java')) return join(basePath, 'java.pdf');
  const fallback = join(basePath, 'default.pdf');
  return existsSync(fallback) ? fallback : '';
}

function buildEmailHtml(name: string, jobRole: string, companyName?: string, pixel?: string): string {
  return `
    <p>Hi ${name},</p>
    <p>I hope you're doing well!</p>
    <p>
      I'm reaching out to express my interest in the <strong>${jobRole}</strong> Developer role
      ${companyName ? `at <strong>${companyName}</strong>` : ''}.
      I bring 2+ years of hands-on experience and have successfully delivered 8+ projects in this domain.
    </p>
    <p>I’d love the opportunity to contribute my skills and energy to your team.</p>
    <p>Best regards,<br>Ajay Panchal</p>
    <p>+91 8570091377<br>ajaypanchal1726@gmail.com</p>
    ${pixel || ''}
  `;
}

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    @InjectModel(Mail.name) private mailModel: Model<Mail>,
  ) { }

  onModuleInit() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendBulkEmail(filePath: string): Promise<string> {
    const recipients = readExcel(filePath);
    const filtered = recipients.filter(r => r?.Email?.trim());

    if (!filtered.length) {
      throw new BadRequestException('No valid emails found in the uploaded file.');
    }

    let successCount = 0;

    const results = await Promise.all(
      filtered.map(async (entry) => {
        const email = entry['Email']?.trim();
        const jobRole = entry['Role']?.trim() || 'Software Developer';
        const name = entry['Name']?.trim() || 'there';
        const companyName = entry['Company Name']?.trim();

        if (!email) return { email: null, success: false, reason: 'Missing email' };
        if (!jobRole) return { email, success: false, reason: 'Missing job role' };

        const emailDoc = await this.mailModel.create({
          to: email,
          name,
          subject: `Application for ${jobRole}${companyName ? ' at ' + companyName : ''}`,
          body: `Interest in ${jobRole}${companyName ? ' at ' + companyName : ''}`,
        });

        try {
          const resumePath = getResumePathByJobRole(jobRole);
          const pixel = `<img src="http://localhost:${this.config.get('PORT')}/mail/view/${emailDoc._id}" width="1" height="1"/>`;
          const html = buildEmailHtml(name, jobRole, companyName, pixel);

          await this.transporter.sendMail({
            from: `"Ajay Panchal" <${this.config.get('EMAIL')}>`,
            to: email,
            subject: `Application for ${jobRole}${companyName ? ' at ' + companyName : ''}`,
            html,
            attachments: resumePath ? [{ filename: 'Resume.pdf', path: resumePath }] : [],
          });

          emailDoc.isSent = true;
          await emailDoc.save();

          return { email, success: true };
        } catch (err) {
          emailDoc.isSent = false;
          await emailDoc.save();
          return { email, success: false, reason: err.message };
        }
      })
    );

    successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;
    safeDeleteFile(filePath, "A");
    return `✅ Successfully sent ${successCount} out of ${filtered.length} emails. ❌ Failed: ${failedCount}`;
  }

  async sendSingleEmail(dto: SendSingleEmailDto) {
    const { email, jobRole, name = 'there', companyName } = dto;

    if (!email) throw new BadRequestException('Missing required field: email');
    if (!jobRole) throw new BadRequestException('Missing required field: jobRole');

    const resumePath = getResumePathByJobRole(jobRole);

    const emailDoc = await this.mailModel.create({
      to: email,
      name,
      subject: `Application for ${jobRole}${companyName ? ' at ' + companyName : ''}`,
      body: `Interest in ${jobRole}${companyName ? ' at ' + companyName : ''}`,
    });

    const pixel = `<img src="http://localhost:${this.config.get('PORT')}/mail/view/${emailDoc._id}" width="1" height="1"/>`;
    const html = buildEmailHtml(name, jobRole, companyName, pixel);

    try {
      await this.transporter.sendMail({
        from: `"Ajay Panchal" <${this.config.get('EMAIL')}>`,
        to: email,
        subject: `Application for ${jobRole}${companyName ? ' at ' + companyName : ''}`,
        html,
        attachments: resumePath ? [{ filename: 'Resume.pdf', path: resumePath }] : [],
      });

      emailDoc.isSent = true;
      await emailDoc.save();

      return { message: `Email sent successfully to ${email}` };
    } catch (err) {
      emailDoc.isSent = false;
      await emailDoc.save();
      throw new BadRequestException(`Failed to send email: ${err.message}`);
    }
  }

  async markViewed(id: string) {
    await this.mailModel.findByIdAndUpdate(id, { viewed: true });
  }

  async getSentEmails(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.mailModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.mailModel.countDocuments(),
    ]);

    return {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRecords: total,
      data,
    };
  }
}
