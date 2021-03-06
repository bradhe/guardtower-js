import os from 'os';
import superagent from 'superagent';
import { EventEmitter } from 'events';

import { sign, jwt } from './hmac';

// this is the emitter that is used for notification.
const emitter = new EventEmitter();

// Default hostname for the service.
const DEFAULT_HOST = 'service.guardtower.dev';

// Default delay of vulns check every 5000ms (5s)
const DEFAULT_DELAY = 5000;

const doCheck = (token, ub) => {
  console.log(token);
  superagent.get(ub('/api/component-reports/check'))
      .use(jwt(token))
      .then((res) => {
        const data = JSON.parse(res.text);

        if (data.status === 'vulnerable') {
          emitter.emit('vulnerable', data.vulnerabilities);
        }
      });
};

const monitor = (token, ub, delay) => {
  setInterval(() => doCheck(token, ub), delay);
};

const urlBuilder = (host) => {
  return (path) => {
    return `https://${host}${path}`;
  }
}

const finalizeReport = (rep) => {
  // If this is a heroku environment then we want to report the app name vs.
  // the host name.
  if (process.env.HEROKU_APP_NAME) {
    rep.hostname = process.env.HEROKU_APP_NAME;
  } else {
    rep.hostname = os.hostname();
  }

  return rep;
}

/**
 * Register an event handler for when varioues events happen in the guardtower
 * system.
 */
export const on = (t, fn) => {
  return emitter.on(t, fn); 
};

/**
 * `start` starts the agent monitoring for vulnerabilities in your software.
 * The `pub` and `priv` arguments are the public and private portions of your
 * access key. The `rep` parameter is the component report you want to submit.
 */
export const start = (pub, priv, rep, opts={}) => {
  const {
    host  = DEFAULT_HOST,
    delay = DEFAULT_DELAY,
  } = opts;

  const ub = urlBuilder(host);

  return superagent.post(ub('/api/component-reports'))
      .use(sign(pub, priv))
      .send(finalizeReport(rep))
      .then(function(res) {
        const data = JSON.parse(res.text);
        monitor(data.token, ub, delay);
      }).catch(e => console.log('error occured', e));
};

const functions = {
  on,
  start,
}

export default functions;
