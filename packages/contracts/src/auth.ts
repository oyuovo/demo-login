import { z } from "zod";

export const ROLE_MEMBER = "MEMBER" as const;
export const ROLE_PRIVILEGED = "PRIVILEGED" as const;
export const UserRole = z.enum([ROLE_MEMBER, ROLE_PRIVILEGED]);
export type UserRole = z.infer<typeof UserRole>;

export const RegisterRequest = z.object({
  username: z.string().min(1).max(32),
  password: z.string().min(8).max(128),
});
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const RegisterResponse = z.object({
  id: z.string(),
  username: z.string(),
  role: UserRole,
  createdAt: z.string(),
});
export type RegisterResponse = z.infer<typeof RegisterResponse>;

export const LoginRequest = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.object({
  id: z.string(),
  username: z.string(),
  role: UserRole,
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const MeResponse = z.object({
  id: z.string(),
  username: z.string(),
  role: UserRole,
});
export type MeResponse = z.infer<typeof MeResponse>;

export const ApiError = z.object({
  error: z.string(),
  message: z.string(),
});
export type ApiError = z.infer<typeof ApiError>;
