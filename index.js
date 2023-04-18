
var Web3 = require('web3');
var utils = require('web3-utils');
var Method = require('web3-core-method');
var formatter = require('./lib/formatters');


var myDAPPwallet = function myDAPPwallet() {
	Web3.call(this, arguments[0]); // wywołanie konstruktora klasy bazowej
	this.user = undefined;  	

  var methods = [

            new Method({
                  name: '_connect',
                  call: 'connect',
                  params: 0,
            }),
    ];
	methods.forEach(function(method) {
		method.attachToObject(this);
		method.setRequestManager(this._requestManager, this.accounts); // second param is the eth.accounts module (necessary for signing transactions locally)
		method.defaultBlock = this.eth.defaultBlock;
		method.defaultAccount = this.eth.defaultAccount;
		method.transactionBlockTimeout = this.eth.transactionBlockTimeout;
		method.transactionConfirmationBlocks = this.eth.transactionConfirmationBlocks;
		method.transactionPollingTimeout = this.eth.transactionPollingTimeout;
		method.handleRevert = this.eth.handleRevert;
	}.bind(this));

	if(this._provider.connectId){
		this.connect(arguments[1]);
	}

	return true;
}

myDAPPwallet.prototype = Object.create(Web3.prototype);

myDAPPwallet.prototype.addAccount = function (account){
	
	let wallet = this.eth.accounts.wallet;
	account.address = utils.toChecksumAddress(account.address);
	 if (!wallet[account.address]) {
		 this.eth.accounts._addAccountFunctions(account);
		account.index = wallet._findSafeIndex();
        wallet[account.index] = account;
        wallet[account.address] = account;
        wallet[account.address.toLowerCase()] = account;
		wallet.length++;
		if(	account.index===0){
			this.eth.defaultAccount = account.address;
		}
		 return account;
	 }else {
		 return wallet[account.address];
	}
	

 
}

myDAPPwallet.prototype.connect = function (callback){

	this._provider.connect(function (error, result){
		 if(result){
			this.user = result.user;
			this.addAccount(result.wallet);
            this.user = result.user;              
		 }
  		 if(callback)callback(error, result);	
	}.bind(this));
	
	return true;
}

myDAPPwallet.prototype.disconnect = function (callback){

	this._provider.disconnect(function (error, result){
		 if(result){

			 this.user = undefined;
			 this.eth.accounts.wallet.clear();
		 }
  		 if(callback)callback(error, result);	
	}.bind(this));
	
	return true;
}

myDAPPwallet.prototype.isConnected = function (){

	return !!this.user;
		
}


module.exports = myDAPPwallet;