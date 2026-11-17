import "server-only";

export function getGoogleServiceAccount() {
  const clientEmail = String(process.env.GOOGLE_CLIENT_EMAIL || "").trim();
  const projectId = String(process.env.GOOGLE_PROJECT_ID || "").trim();
  let privateKey = String(process.env.GOOGLE_PRIVATE_KEY || "").trim();
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  return { clientEmail, projectId, privateKey };
}