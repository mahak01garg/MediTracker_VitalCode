const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const normalizePrivateKey = (value = "") => value.replace(/\\n/g, "\n");

const loadServiceAccountFromEnv = () => {
  const { FIREBASE_SERVICE_ACCOUNT, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  if (FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey || ""),
      };
    } catch (error) {
      throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${error.message}`);
    }
  }

  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

const loadServiceAccountFromFile = () => {
  const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialPath) return null;

  const resolvedPath = path.isAbsolute(credentialPath)
    ? credentialPath
    : path.resolve(process.cwd(), credentialPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase credentials file not found at ${resolvedPath}`);
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    return {
      projectId: parsed.project_id || parsed.projectId,
      clientEmail: parsed.client_email || parsed.clientEmail,
      privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey || ""),
    };
  } catch (error) {
    throw new Error(`Invalid Firebase credentials file: ${error.message}`);
  }
};

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccountFromEnv() || loadServiceAccountFromFile();

  if (!serviceAccount?.projectId || !serviceAccount?.clientEmail || !serviceAccount?.privateKey) {
    throw new Error(
      "Firebase Admin credentials missing. Set FIREBASE_SERVICE_ACCOUNT, or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;

