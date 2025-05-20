import { BrowserAuthorizationClient } from "@itwin/browser-authorization";

const AUTH_AUTHORITY = 'https://ims.bentley.com';
const AUTH_CLIENT_ID = 'spa-u7a4hFVaobEgnNRLBCWQFJuOJ';
const AUTH_CLIENT_SCOPES = 'itwin-platform';

export const client = new BrowserAuthorizationClient({
    clientId: AUTH_CLIENT_ID,
    redirectUri: "http://localhost:3000",
    scope: AUTH_CLIENT_SCOPES,
    authority: AUTH_AUTHORITY,
    responseType: "code"
  });

