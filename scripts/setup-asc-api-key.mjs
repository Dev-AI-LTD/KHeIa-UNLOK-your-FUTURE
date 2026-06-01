/**
 * Generate App Store Connect API key (.p8) using saved Apple session.
 * Writes key to ./secrets/asc-api-key.p8 and prints keyId + issuerId for eas.json.
 */
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const easCliRoot = 'C:/Users/octav/AppData/Roaming/npm/node_modules/eas-cli';

const { authenticateAsync, getRequestContext } = require(
  `${easCliRoot}/build/credentials/ios/appstore/authenticate`,
);
const { createAscApiKeyAsync } = require(
  `${easCliRoot}/build/credentials/ios/appstore/ascApiKey`,
);

const analytics = { logEvent: () => {} };

async function main() {
  const authCtx = await authenticateAsync({
    appleId: process.env.EXPO_APPLE_ID || 'contact@devaieood.com',
    teamId: '3L7H3SZXM3',
  });

  const ascKey = await createAscApiKeyAsync(analytics, authCtx, {
    nickname: 'EAS Submit KHEYA',
  });

  const secretsDir = path.join(projectRoot, 'secrets');
  fs.mkdirSync(secretsDir, { recursive: true });
  const keyPath = path.join(secretsDir, 'asc-api-key.p8');
  fs.writeFileSync(keyPath, ascKey.keyP8, 'utf8');

  console.log(JSON.stringify({
    ascAppId: '6774581226',
    ascApiKeyPath: keyPath.replace(/\\/g, '/'),
    ascApiKeyId: ascKey.keyId,
    ascApiKeyIssuerId: ascKey.issuerId,
  }, null, 2));
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
