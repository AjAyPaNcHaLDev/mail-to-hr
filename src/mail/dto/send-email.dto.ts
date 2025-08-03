import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ example: 'data.xlsx', description: 'Excel file in root' })
  @IsString()
  fileName: string;
}
