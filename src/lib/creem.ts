// Creem SDK wrapper.
// If the actual npm package name differs, replace 'creem-sdk' below.
// We load dynamically to avoid build-time failure if not installed locally.
let CreemCtor: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CreemCtor = require('creem');
} catch (e) {
  console.warn('creem package not found, please install it or adjust import name.');
}

export const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || '';
const CREEM_SECRET_KEY = process.env.CREEM_SECRET_KEY || '';

if (!CREEM_SECRET_KEY) {
  console.warn('CREEM_SECRET_KEY is not set; Creem payments will fail.');
}
if (!CREEM_WEBHOOK_SECRET) {
  console.warn('CREEM_WEBHOOK_SECRET is not set; webhook verification will fail.');
}

let creemInstance: any | null = null;

export function getCreemClient() {
  if (!CreemCtor) {
    throw new Error('creem package not available; install or check import name');
  }
  if (!CREEM_SECRET_KEY) {
    throw new Error('CREEM_SECRET_KEY missing');
  }
  if (!creemInstance) {
    creemInstance = new CreemCtor({
      secretKey: CREEM_SECRET_KEY,
    });
  }
  return creemInstance;
}

