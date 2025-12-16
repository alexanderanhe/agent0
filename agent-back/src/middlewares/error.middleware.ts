import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const isZodError = err instanceof ZodError;
  const status =
    err instanceof HttpError
      ? err.statusCode
      : isZodError
      ? 400
      : 500;

  const message =
    err instanceof HttpError
      ? err.message
      : isZodError
      ? "Invalid request"
      : "Internal Server Error";

  const details =
    err instanceof HttpError
      ? err.details
      : isZodError
      ? err.flatten()
      : undefined;

  res.status(status).json({ error: message, details });
}
