/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/** @file httpprovider.js
 * @authors:
 *   Marek Kotewicz <marek@parity.io>
 *   Marian Oancea
 *   Fabian Vogelsteller <fabian@ethereum.org>
 * @date 2015
 */




var errors = require('web3-core-helpers').errors;
var XHR2 = require('xhr2-cookies').XMLHttpRequest; // jshint ignore: line
var http = require('http');
var https = require('https');
var Jsonrpc = require('./jsonrpc.js');
/**
 * HttpProvider should be used to send rpc calls over http
 */

var bindEvent =  function(element, eventName, eventHandler) {
	 if (element.addEventListener){
                element.addEventListener(eventName, eventHandler, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + eventName, eventHandler);
            }
}




var myDAPPwalletProvider = function HttpProvider(host, options) {
    options = options || {};
    this.withCredentials = options.withCredentials || false;
    this.timeout = options.timeout || 0;
    this.headers = options.headers;
	this.apiKey = options.apiKey;
    this.connectId = window.localStorage.getItem("ConnectId");
  //  alert(this.connectId);
    this.agent = options.agent;
    this.redirect = options.redirect;
    this.connected = false;
    this.user = undefined;
    this.info = undefined;
    // keepAlive is true unless explicitly set to false
    const keepAlive = options.keepAlive !== false;
    this.host = host || 'http://localhost:8545';
	this.network = options.network || {name:"default", chainId:0,  host:this.host };
	if(this.network){
		this.host = this.network.host;
	}else 
    if (!this.agent) {
        if (this.host.substring(0, 5) === "https") {
            this.httpsAgent = new https.Agent({ keepAlive });
        }
        else {
            this.httpAgent = new http.Agent({ keepAlive });
        }
    }
    bindEvent(window, "message", this._eventHandler.bind(this));
    this.callback = {};
    	this.callback = {};
	
	
    



};

myDAPPwalletProvider.prototype._eventHandler = function (event) { 
    var data = event.data;
  
 if(data.target==='mdw-inpage'){

    switch(data.event){
        case 'mdw-connect':
            if(data.result) {
                this.connectId = data.result.connectId;
                    window.localStorage.setItem("ConnectId", data.result.connectId);
                }
            break;
        
    }
    const callback = this.callback[data.id];
    if(callback){
        callback(data.error, data);
        delete this.callback[data.id];
    }
 }
}



//{"jsonrpc":"2.0","id":2,"method":"gateway_login","params":[{"username":"0x4b6f6e726164","password":"0x3132333435363738","remember":false}]}


myDAPPwalletProvider.prototype._prepareRequest = function () {
    var request;
    // the current runtime is a browser
    if (typeof XMLHttpRequest !== 'undefined') {
        request = new XMLHttpRequest();
    }
    else {
        request = new XHR2();
        var agents = { httpsAgent: this.httpsAgent, httpAgent: this.httpAgent, baseUrl: this.baseUrl };
        if (this.agent) {
            agents.httpsAgent = this.agent.https;
            agents.httpAgent = this.agent.http;
            agents.baseUrl = this.agent.baseUrl;
        }
        request.nodejsSet(agents);
    }
	
    request.open('POST', this.host, true);
	if(this.connectId){
        request.setRequestHeader("ConnectId", this.connectId);
    }
        request.setRequestHeader("ApiKey", this.apiKey);
    request.setRequestHeader('Content-Type', 'application/json');
//
    request.timeout = this.timeout;
    request.withCredentials = this.withCredentials;
    if (this.headers) {
        this.headers.forEach(function (header) {
            request.setRequestHeader(header.name, header.value);
        });
    }
    return request;
};
/**
 * Should be used to make async request
 *
 * @method send
 * @param {Object} payload
 * @param {Function} callback triggered on end with (err, result)
 */
myDAPPwalletProvider.prototype.send = function (payload, callback) {
    var _this = this;
    var request = this._prepareRequest();
 
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.timeout !== 1) {
            var result = request.responseText;
            var error = null;
            try {
                result = JSON.parse(result);
                if(result.result && result.result.redirect){
                
                    if(!_this.window || _this.window.closed){
                        _this.window = window.open(result.result.redirect, "Connect application to MyDappShop", "width=576,height=700");
                    }else {
                            _this.window.location = result.result.redirect;
                    }
                     _this.callback[payload.id] =   callback;
                    _this.connected = true;
                    return;
                }
            }
            catch (e) {
                error = _this.InvalidResponse(request.responseText);
            }
            _this.connected = true;
            callback(error, result);
        }
    };
    request.ontimeout = function () {
        _this.connected = false;
        callback(errors.ConnectionTimeout(this.timeout));
    };
    try {
        request.send(JSON.stringify(payload));
    }
    catch (error) {
        this.connected = false;
        callback(errors.InvalidConnection(this.host));
    }
};








myDAPPwalletProvider.prototype.disconnect = function (callback){ 
     const payload = Jsonrpc.toPayload("disconnect");
        this.send(payload,
 		this._jsonrpcResultCallback(function (error, result){
  
          if(result){
            this.connectId = undefined;
            window.localStorage.removeItem("ConnectId");
          }		
          callback(error,result);	
		
          }.bind(this), payload)
	);
};

myDAPPwalletProvider.prototype.connect = function (callback){ 
        const payload = Jsonrpc.toPayload("connect");
        this.send(payload,
 		this._jsonrpcResultCallback(function (error, result){
          if(error){
               this.connectId = undefined;
               window.localStorage.removeItem("ConnectId");
          }  
         callback(error,result);	
		
          }.bind(this), payload)
	);
};
/**
 * Returns the desired boolean.
 *
 * @method supportsSubscriptions
 * @returns {boolean}
 */
myDAPPwalletProvider.prototype.supportsSubscriptions = function () {
    return false;
};

 myDAPPwalletProvider.prototype.InvalidResponse =  function (result) {
        var message = !!result && !!result.error && !!result.error.message ? result.error.message : 'Invalid JSON RPC response: ' + JSON.stringify(result);
        var err = new Error(message);
        var code = (!!result.error && !!result.error.code) ? result.error.code : 500;
		err.code = code;
        return err;
    };

myDAPPwalletProvider.prototype.ErrorResponse =  function (result) {
        var message = !!result && !!result.error && !!result.error.message ? result.error.message : JSON.stringify(result);
        var data = (!!result.error && !!result.error.data) ? result.error.data : null;
        var err = new Error(message);
        err.data = data;
 		var code = (!!result.error && !!result.error.code) ? result.error.code : null;
		err.code = code;
        return err;
};


myDAPPwalletProvider.prototype._jsonrpcResultCallback = function (callback, payload) {
      let _this = this; 
  	  return function (err, result) {
        if (result && result.id && payload.id !== result.id) {
            return callback(new Error(`Wrong response id ${result.id} (expected: ${payload.id}) in ${JSON.stringify(payload)}`));
        }
        if (err) {
            return callback(err);
        }
        if(result.info){
            _this.info = result.info;
        }
        if (result && result.error) {
            return callback(_this.ErrorResponse(result));
        }
        if (!Jsonrpc.isValidResponse(result)) {
            return callback(errors.InvalidResponse(result));
        }
        callback(null, result.result);
    }};

myDAPPwalletProvider.prototype.setNetwork = function (network) {
	this.network = network;
	this.host = network.host;
} 	


myDAPPwalletProvider.prototype.readInfo = function () {
	this.info = undefined;
	
} 	




	


module.exports = myDAPPwalletProvider;