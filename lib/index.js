const request = require('superagent'),
      os = require('os');

// Default hostname for the service.
const DEFAULT_HOST = 'http://localhost:8081';

const Client = function() {
    // just initializing this to save for later. this doesn't actually serve any
    // purpose.
    this.tid = null;

    // TODO: Provide a way to override this at runtime.
    this.host = DEFAULT_HOST;
};

const finalizeReport = function(repo) {
    rep.hostname = os.hostname();
    return rep;
}

Client.prototype.checkComponents = function(rep) {
    return request.post(this.host + '/api/component-reports')
        .send(finalizeReport(rep))
        .then(function(res) {
            console.log(res);
        }).catch(function(err) {
            console.log('an error occured', err);
        });
};

module.exports.Client = Client;
