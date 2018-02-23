var BirthdayCoin = artifacts.require("./BirthdayCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(BirthdayCoin);
}
