/**
 * Resolve App Store Connect app ID (ascAppId) for com.kheia.edumat using saved Apple session.
 * Usage: node scripts/get-asc-app-id.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const easCliRoot = 'C:/Users/octav/AppData/Roaming/npm/node_modules/eas-cli';
const { App } = require(`${easCliRoot}/node_modules/@expo/apple-utils`);
const { authenticateAsync, getRequestContext } = require(
  `${easCliRoot}/build/credentials/ios/appstore/authenticate`,
);

async function main() {
  const authCtx = await authenticateAsync({
    appleId: process.env.EXPO_APPLE_ID || 'contact@devaieood.com',
    teamId: '3L7H3SZXM3',
  });
  const context = getRequestContext(authCtx);
  const app = await App.findAsync(context, { bundleId: 'com.kheia.edumat' });
  if (!app?.id) {
    console.error('App not found on App Store Connect for com.kheia.edumat');
    process.exit(1);
  }
  console.log(app.id);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
