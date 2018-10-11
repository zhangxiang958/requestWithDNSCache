const http = require('http');
const dns = require('dns');
const Url = require('url');

const IP_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
class CacheStorage {
    constructor() {
        this.store = {};
    }

    set(key ,value) {
        this.store[key] = value;
    }

    get(key) {
        return this.store[key];
    }

    clean() {
        this.store = {};
    }
}

class DNSCache {
    constructor(options = {}) {
        this.DNSExpired = options.DNSExpired || 1000 * 60 * 10;
        this.store = options.store || new CacheStorage();
    }

    set(host, address) {
        let DNSCache = {
            address,
            freshTime: new Date()
        };
        this.store.set(host, DNSCache);
    }

    get(host) {
        let res = this.store.get(host);
        let now = new Date();
        if (res) {
            let isExpired = (now - res.freshTime) > this.DNSExpired;
            if (isExpired) {
                return void 0;
            } else {
                res.freshTime = now;
                this.set(host, res);
                return res.address;
            }
        } else {
            return void 0;
        }
    }

    clean() {
        this.store.clean();
    }
}

class Request {
    constructor(options = {}) {
        let expired = options.expired || 1000;
        this.dnsCache = new DNSCache({ DNSExpired: expired });
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
        let { hostname, host, port } = url;
        
        if (hostname) {
            if (IP_REGEX.test(hostname)) {
                return callback(null, { url, options });
            }
        } else if (host) {
            if (IP_REGEX.test(host)) {
                return callback(null, { url, options });
            }
        } else {
            throw new Error('hostname or host is required.');
        }

        let requestHost = `${ hostname ? hostname : host }`;
        let dnsCacheHost = this.dnsCache.get(requestHost);
        if (dnsCacheHost) {
            url.hostname ? (url.hostname = dnsCacheHost) : (url.host = dnsCacheHost);
            return callback && callback(null, {
                url,
                options
            });
        }
        dns.lookup(requestHost, { family: 4 }, (err, address) => {
            if (err) {
                return callback && callback(err);
            }

            this.dnsCache.set(requestHost, address);

            url.hostname ? (url.hostname = address) : (url.host = address);
            callback && callback(null, {
                url,
                options
            });
        });
    }
}

let request = new Request();

request.request({
    hostname: 'www.google.com',
    port: 80,
    path: '/',
    method: 'GET'
}, {}, (err, res) => {
    console.log(err);
    console.log(res);
});

module.exports = new Request();