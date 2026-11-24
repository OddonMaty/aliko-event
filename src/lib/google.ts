import { appUrl } from "@/lib/utils";

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const googleRedirectUri = () => `${appUrl()}/api/auth/google/callback`;
export const OAUTH_COOKIE = "aliko_oauth";
