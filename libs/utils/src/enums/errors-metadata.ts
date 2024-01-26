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
  EmailInUse = 'This email is already stored',
  EnvironmentNotFound = 'Environment not found',
  ProjectNotFound = 'Project not found',
  UserNotFound = 'User not found',
  InvalidEmail = 'Invalid Email',
  RequiredField = 'This field is required',
  Unauthorized = 'Unauthorized action',
  InvalidCredentials = 'Invalid credentials',
  InvalidToken = 'Invalid Token',
  InternalError = 'An internal error ocurred, try again',
  MissingAuthSecret = 'Auth secret not found',
}
