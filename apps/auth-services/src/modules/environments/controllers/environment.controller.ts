import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PublicRoute } from '../../auth/decorators/auth-validation.decorator';
import { EnvironmentService } from '../services/environment.service';

@Controller('environments')
export class EnvironmentController {
  constructor(private environmentService: EnvironmentService) {}

  @Get('/owner/my-keys')
  @PublicRoute()
  public async signUpOwner(@Headers() headers) {
    if (headers['thon-labs-staff-api-key'] !== process.env.API_KEY) {
      throw new UnauthorizedException();
    }

    const environmentId = 'env-production-pv58lzlj6te';
    const [publicKey, secretKey] = await Promise.all([
      this.environmentService.getPublicKey(environmentId),
      this.environmentService.getSecretKey(environmentId),
    ]);

    return { publicKey, secretKey };
  }
}
