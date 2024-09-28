import { Controller } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) { }


  sendEmail(emailInfo: {
    to: any;
    subject: any;
    html: any;
  }) {
    return this.emailService.sendEmail(emailInfo);
  }
}
