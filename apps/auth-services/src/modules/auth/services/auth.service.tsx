import { DatabaseService } from '@/auth/modules/shared/database/database.service';
import { ClientsService } from '@/auth/modules/clients/services/clients.service';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private resend: Resend;

  constructor(
    private databaseService: DatabaseService,
    private clientsService: ClientsService,
    private jwtService: JwtService,
  ) {
    this.resend = new Resend(process.env.EMAIL_PROVIDER_API_KEY);
  }
}
