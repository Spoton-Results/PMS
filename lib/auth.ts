import { redirect } from "next/navigation";

export type AppRole = "PLATFORM_ADMIN" | "ORG_ADMIN" | "PM" | "AP" | "VENDOR";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  organizationId: string;
};

export async function getCurrentUser(): Promise<SessionUser> {
  return {
    id: "mvp-admin",
    email: "admin@vendorcontrolos.local",
    name: "MVP Admin",
    role: "PLATFORM_ADMIN",
    organizationId: "seed-org"
  };
}

export async function requireRole(roles: AppRole[]) {
  const user = await getCurrentUser();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}
