/**
 * Session token expiry in minutes
 */
export const SESSION_TOKEN_EXPIRY_MINUTES = 15;

/**
 * Session token expiry in milliseconds
 */
export const SESSION_TOKEN_EXPIRY_MS = SESSION_TOKEN_EXPIRY_MINUTES * 60 * 1000;

/**
 * Session token expiry as jose duration string
 */
export const SESSION_TOKEN_EXPIRY_JOSE = "15m" as const;
