import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class SendSingleEmailDto {
  @ApiProperty({ 
    example: 'Java Developer', 
    description: 'Job role must be defined like Java, Node.js, React.js etc.' 
  })
  @IsString()
  jobRole: string;

  @ApiProperty({ 
    example: 'HR Name', 
    description: 'Specifies the HR name' 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'hr@example.com', 
    description: 'Email address for HR' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'Example Company', 
    description: 'Name of the company'
  })
  @IsString()
  companyName: string;
}
