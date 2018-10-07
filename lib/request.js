const http = require('http');
const dns = require('dns');
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
        let { protocol, hostname, host, port, path, hash } = url;

        if (hostname) {
            return IP_REGEX.test(hostname) && callback(null, { url, options });
        } else if (host) {
            return IP_REGEX.test(host) && callback(null, { url, options });
        } else {
            throw new Error('hostname or host is required.');
        }
        let requestHost = `${ hostname ? hostname : `${ port ? `${host || 'localhost'}:${port}` : `${host}` }` }`;
        let requestUrl = `${protocol || 'http'}://${ requestHost }${path || '/'}${hash || ''}`;

        dns.lookup(requestHost, { family: 4 }, (err, address) => {
            if (err) {
                return callback && callback(err);
            }

            callback && callback(null, {
                url: this._dnsURLFormat(url, hostname, address),
                options
            })
        });
    }

    _dnsURLFormat(url, hostname, address) {
        
    }
}

module.exports = Request;