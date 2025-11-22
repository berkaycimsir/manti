import CryptoJS from "crypto-js";
import { env } from "~/env";

/**
 * Encrypts sensitive data using AES encryption
 */
export function encryptSensitiveData(data: string): string {
	return CryptoJS.AES.encrypt(data, env.ENCRYPTION_KEY).toString();
}

/**
 * Decrypts sensitive data using AES encryption
 */
export function decryptSensitiveData(encryptedData: string): string {
	const bytes = CryptoJS.AES.decrypt(encryptedData, env.ENCRYPTION_KEY);
	return bytes.toString(CryptoJS.enc.Utf8);
}
