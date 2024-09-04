import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import { EnvironmentDomainService } from '@/auth/modules/environments/services/environment-domain.service';
import { EnvironmentService } from '@/auth/modules/environments/services/environment.service';
import getEnvIdHash from '@/utils/services/get-env-id-hash';

@Injectable()
export class VerifyDomainGuard implements CanActivate {
  private readonly logger = new Logger(VerifyDomainGuard.name);

  // These endpoints are allowed to be accessed by any validated domain
  private readonly allowedEndpoints = [
    '/auth/signup',
    '/auth/login',
    '/auth/magic',
    '/auth/refresh',
    '/auth/logout',
    '/auth/reset-password',
    '/auth/confirm-email',
  ];

  constructor(
    private environmentService: EnvironmentService,
    private environmentDomainService: EnvironmentDomainService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /*
      This is used to protect the app from domains that are not allowed to access the API.
      Even if the customer create a custom CNAME in his DNS, we need to validate if the domain is allowed.

      First we need to check if the endpoint is in the list of allowed endpoints and the host comes from thonlabs API.
      Any endpoint that is not listed above can be only accessed by thonlabs API defined at API_ROOT_URL env variable.

      Second we need to check if the request comes from the thonlabs auth custom domain, if so, we allow the request.

      Third we need to check if the request comes from a custom domain that the customer has defined at his environment.
      No worries about the CNAME here, if it's valid on DB means the CNAME process is already done.
    */
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    try {
      const currentEndpoint = req.url;
      const originDomain = new URL(`https://${req.headers.host}` || '')
        .hostname;
      const apiDomain = new URL(process.env.API_ROOT_URL).hostname;

      if (originDomain === apiDomain) {
        return true;
      }

      const isAllowedEndpoint = this.allowedEndpoints.some((endpoint) =>
        currentEndpoint.startsWith(endpoint),
      );

      if (!isAllowedEndpoint) {
        this.logger.error(
          `The domain ${originDomain} is not authorized to access ${currentEndpoint}`,
        );
        res.status(StatusCodes.NotFound).send('');
        return false;
      }

      if (!req.headers['tl-env-id']) {
        this.logger.error(`No env id provided`);
        res.status(StatusCodes.Unauthorized).json({
          error: ErrorMessages.Unauthorized,
        });
        return false;
      }

      const appDomain = new URL(process.env.APP_ROOT_URL).hostname;
      const thonLabsAuthDomain = `${getEnvIdHash(
        req.headers['tl-env-id'],
      )}.auth.${appDomain}`;

      if (originDomain === thonLabsAuthDomain) {
        const { data: environment } = await this.environmentService.getById(
          req.headers['tl-env-id'],
        );

        if (!environment) {
          this.logger.error(`Environment not found`);
          res.status(StatusCodes.NotFound).send('');
          return false;
        }

        return true;
      }

      const customDomain =
        await this.environmentDomainService.getByCustomDomainAndEnvironmentId(
          originDomain,
          req.headers['tl-env-id'],
        );
      if (customDomain) {
        return true;
      }

      this.logger.error(
        `The domain ${originDomain} is not authorized to access ${currentEndpoint}`,
      );
      res.status(StatusCodes.NotFound).send('');
      return false;
    } catch (error) {
      this.logger.error(`Error verifying domain for endpoint`, error);
      throw new NotFoundException();
    }
  }
}
