import RevokedToken from "../models/RevokedToken.js";

export async function isTokenRevoked(jti) {
  if (!jti) return false;
  return Boolean(await RevokedToken.exists({ _id: jti }));
}

export async function revokeToken(decoded) {
  if (!decoded?.jti || !decoded?.exp) return false;
  try {
    await RevokedToken.create({ _id: decoded.jti, expiresAt: new Date(decoded.exp * 1000) });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return true;
}
