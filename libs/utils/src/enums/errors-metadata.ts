import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export enum StatusCodes {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  NotAcceptable = 406,
  Conflict = 409,
  Internal = 500,
}

export enum ErrorCodes {
  InvalidEmail = 'invalid-email',
  TokenNotFound = 'token-not-found',
  UserExists = 'user-exists',
  EmailInUse = 'email-in-use',
  ResourceNotFound = 'resource-not-found',
  Unauthorized = 'unauthorized',
}

export enum ErrorMessages {
  EmailInUse = 'This email is already in use',
  EnvironmentNotFound = 'Environment not found',
  ProjectNotFound = 'Project not found',
  UserNotFound = 'User not found',
  InvalidEmail = 'Invalid Email',
  RequiredField = 'This field is required',
  Unauthorized = 'Unauthorized access',
  Forbidden = 'Forbidden access',
  InvalidCredentials = 'Invalid credentials',
  InvalidToken = 'Invalid Token',
  InternalError = 'An internal error ocurred, try again',
  MissingAuthSecret = 'Auth secret not found',
  EmailTemplateNotFound = 'Email template not found',
}

export const exceptionsMapper = {
  [StatusCodes.Forbidden]: ForbiddenException,
  [StatusCodes.BadRequest]: BadRequestException,
  [StatusCodes.Conflict]: ConflictException,
  [StatusCodes.Internal]: InternalServerErrorException,
  [StatusCodes.NotAcceptable]: NotAcceptableException,
  [StatusCodes.NotFound]: NotFoundException,
  [StatusCodes.Unauthorized]: UnauthorizedException,
};
