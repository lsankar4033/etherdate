var BirthdayCoin = artifacts.require("./BirthdayCoin.sol");
var solc = require('solc')

// script for estimate the gas cost of a deploy
module.exports = function(callback) {
  BirthdayCoin.web3.eth.getGasPrice(function(error, result){
    var gasPrice = Number(result);
    console.log("Gas Price is " + gasPrice + " wei"); // "10000000000000"

    var BirthdayCoinContract = web3.eth.contract(BirthdayCoin._json.abi);
    var contractData = BirthdayCoinContract.new.getData({data: BirthdayCoin._json.bytecode});
    var gas = Number(web3.eth.estimateGas({data: contractData}))

    console.log("gas estimation = " + gas + " units");
    console.log("gas cost estimation = " + (gas * gasPrice) + " wei");
    console.log("gas cost estimation = " + BirthdayCoin.web3.fromWei((gas * gasPrice), 'ether') + " ether");
  });
};
