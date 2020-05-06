const crypto = require('crypto'),
      request = require('superagent'),
      os = require('os');

// Default hostname for the service.
const DEFAULT_HOST = 'http://localhost:8081';

// Default delay of vulns check every 5000ms (5s)
const DEFAULT_DELAY = 5000;

const Client = function(pub, priv) {
  // TODO: Is there a better way to store these?
  this.pub = pub;
  this.priv = priv;

  // just initializing this to save for later. this doesn't actually serve any
  // purpose.
  this.tid = null;

  // TODO: Provide a way to override this at runtime.
  this.host = DEFAULT_HOST;
  this.delay = DEFAULT_DELAY;
};

const finalizeReport = function(rep) {
  rep.hostname = os.hostname();
  return rep;
}

const trimSchemePrefix = function(url) {
  if (url.indexOf('http://') == 0) {
    return url.slice(7);
  }

  if (url.indexOf('https://') == 0) {
    return url.slice(8);
  }

  return url
}

const sig = function(host, path, priv) {
  const hmac = crypto.createHmac('sha256', priv);
  const msg = "POST\n"+trimSchemePrefix(host)+"\n"+path+"\n";
  hmac.write(msg);
  hmac.end();

  const buf = Buffer.from(hmac.read());
  return buf.toString('base64');
}

Client.prototype.doVulnsCheck = function(token) {
  request.get(this.host + '/api/component-reports/check')
      .set("Authorization", "Bearer "+token.jwt)
      .then(function(res) {
        const data = JSON.parse(res.text);
        console.log(data);
      });
};

Client.prototype.monitorComponents = function(token) {
  var _this = this;
  this.tid = setInterval(function() { _this.doVulnsCheck(token); }, this.delay);
}

Client.prototype.checkComponents = function(rep) {
  var _this = this;

  return request.post(this.host + '/api/component-reports')
      .set("Authorization", "HMAC-SHA256 "+this.pub+":"+sig(this.host, '/api/component-reports', this.priv))
      .send(finalizeReport(rep))
      .then(function(res) {
        const data = JSON.parse(res.text);
        _this.monitorComponents(data.token);
      });
};

module.exports.Client = Client;
