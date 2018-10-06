const http = require('http');
const Url = require('url');

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

class Request {
    constructor({ dnsExpired }) {
        this.dnsExpired = dnsExpired;
        this.dnsCache = dnsCache;
    }

    request(url, options, callback) {
        if (typeof options == 'function') {
            callback = options;
            options = {};
        }
        
        this._dnsLookUp(url, options, (err, result) => {
            if (err) return callback && callback(err);
            http.request(result.url, result.options, callback);
        });
    }

    _dnsLookUp(url, options, callback) {
        url = typeof url == 'object' ? url : Url.parse(url);
        let { hostname } = url;

        if (hostname && IP_REGEX.test(hostname)) {
            return callback(null, { url, options });
        }
    }

    _dnsURLFormat() {

    }
}

module.exports = Request;