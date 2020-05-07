import crypto from 'crypto';
import { URL } from 'url';

import base64url from 'base64url';

const host = (req) => {
  const url = new URL(req.url);
  return url.host;
}

const path = (req) => {
  const url = new URL(req.url);
  return url.pathname;
}

const message = (req) => {
  return `${req.method.toUpperCase()}\n${host(req)}\n${path(req)}\n`
};

const encode = (buf) => {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export const sign = (pub, priv) => {
  return (req) => {
    const hmac = crypto.createHmac('sha256', priv);
    hmac.write(message(req));
    hmac.end();

    req.set('Authorization', `HMAC-SHA256 ${pub}:${encode(hmac.read())}`);
  };
};

export const jwt = (token) => {
  return (req) => {
    req.set('Authorization', `Bearer ${token.jwt}`);
  };
};
