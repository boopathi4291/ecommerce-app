import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-key-phase-1'

export function encryptPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

export function generateToken(identifier: string, timestamp: number = Date.now()): string {
  return CryptoJS.SHA256(identifier + timestamp).toString().slice(0, 32)
}

export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}
