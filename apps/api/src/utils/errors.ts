export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error: string = "Error",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "Not Found");
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message, "Bad Request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message, "Unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message, "Forbidden");
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, "Conflict");
  }
}
