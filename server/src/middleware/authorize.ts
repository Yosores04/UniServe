import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";

export function authorize(...roles: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      response.status(403).json({ error: "FORBIDDEN", message: "You do not have permission to access this resource." });
      return;
    }
    next();
  };
}
