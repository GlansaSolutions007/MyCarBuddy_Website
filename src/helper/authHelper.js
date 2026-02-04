import CryptoJS from "crypto-js";
import axios from "axios";

const USER_STORAGE_KEY = "user";
const secretKey = process.env.REACT_APP_ENCRYPT_SECRET_KEY || "";
const baseUrl = process.env.REACT_APP_CARBUDDY_BASE_URL || "";

/**
 * Build and save user object from Auth/verify-otp response.
 * API response: { success, message, token, accessToken, refreshToken, expiresIn, name, phoneNumber, email, custID, profileImage }
 * @param {Object} data - response.data from Auth/verify-otp
 * @param {Object} overrides - optional { phone, name, email } (e.g. from form state)
 */
export function saveUserFromVerifyOtp(data, overrides = {}) {
  if (!data?.custID) return;
  const encryptedId = secretKey
    ? CryptoJS.AES.encrypt(data.custID.toString(), secretKey).toString()
    : data.custID.toString();

  const token = data.accessToken || data.token;
  const user = {
    id: encryptedId,
    name: overrides.name?.trim() || data.name?.trim() || "",
    phone: overrides.phone || data.phoneNumber || "",
    email: overrides.email?.trim() || data.email?.trim() || "",
    token,
    profileImage: data.profileImage || "",
    refreshToken: data.refreshToken || "",
    expiresIn: data.expiresIn != null ? data.expiresIn : 420,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
}

/**
 * Refresh access token using Auth/refresh.
 * POST /api/Auth/refresh body: { refreshToken }
 * Updates stored user with new token, refreshToken, expiresIn.
 * @returns {Promise<string>} new access token
 */
export async function refreshAccessToken() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  const user = raw ? JSON.parse(raw) : null;
  if (!user?.refreshToken) {
    throw new Error("No refresh token");
  }
  const res = await axios.post(`${baseUrl}Auth/refresh`, {
    refreshToken: user.refreshToken,
  });
  const d = res.data;
  const newToken = d.accessToken || d.token;
  const updated = {
    ...user,
    token: newToken,
    refreshToken: d.refreshToken != null ? d.refreshToken : user.refreshToken,
    expiresIn: d.expiresIn != null ? d.expiresIn : user.expiresIn,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  return newToken;
}

/**
 * Get current access token from storage.
 */
export function getAccessToken() {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  const user = raw ? JSON.parse(raw) : null;
  return user?.token || null;
}

/**
 * Update stored user with new token/refreshToken/expiresIn (e.g. after refresh).
 */
export function updateStoredTokens({ token, refreshToken, expiresIn }) {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  const user = raw ? JSON.parse(raw) : null;
  if (!user) return;
  if (token != null) user.token = token;
  if (refreshToken != null) user.refreshToken = refreshToken;
  if (expiresIn != null) user.expiresIn = expiresIn;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}
