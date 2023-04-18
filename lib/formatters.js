"use strict";
var helpers = require('web3-core-helpers');
var formatter = helpers.formatters;
var utils = require('web3-utils');
var _ = require('underscore');


var inputParamsFormatter = function (params) {
	
    return params;
};

var hexParamsFormatter = function (params) {
    var hexParams = {};
    for (const key in params) {
        const value = params[key];
        if ((typeof value === 'string' || value instanceof String) && !utils.isHexStrict(value)){
         
             hexParams[key] = utils.utf8ToHex(value);
        }else if(Array.isArray(value)){
           var array = [];
           for (var i = 0; i < value.length; i++){
                if ((typeof value[i] === 'string' || value[i] instanceof String) && !utils.isHexStrict(value[i])){
                      array[i] = utils.utf8ToHex(value[i]);
                }else {
                   array[i] = value[i]
                }
           }
           hexParams[key] = array;
        }else {
              hexParams[key] = value;
        }
        

         
    }
    return hexParams;
};

formatter.inputTransactionHistoryFormatter = function (options) {

    // check from, only if not number, or object
    if (!_.isNumber(options.from) && !_.isObject(options.from)) {
        options.from = options.from || (this ? this.defaultAccount : null);
        if (!options.from && !_.isNumber(options.from)) {
            throw new Error('The send transactions "from" field must be defined!');
        }
        options.from = formatter.inputAddressFormatter(options.from);
    }
    return options;
};

formatter.inputAccountEditFormatter = function (options) {

    // check from, only if not number, or object
    if (!_.isNumber(options.from) && !_.isObject(options.from)) {
        options.from = options.from || (this ? this.defaultAccount : null);
        if (!options.from && !_.isNumber(options.from)) {
            throw new Error('The send transactions "from" field must be defined!');
        }
        options.from = formatter.inputAddressFormatter(options.from);
    }
    return options;
};

module.exports = {
    inputParamsFormatter: inputParamsFormatter,
    hexParamsFormatter: hexParamsFormatter
   
};
