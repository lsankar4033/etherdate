const BirthdayCoin = artifacts.require("BirthdayCoin");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;

contract('withdraw', async (accounts) => {
  it("should debit the withdrawer's account", async () => {
    let bdaycoin = await BirthdayCoin.deployed();

    await bdaycoin.buyBirthday(1, 'msg 2', {value: startingPrice, from: accounts[1]});

    let pendingWithdrawal = await bdaycoin.getPendingWithdrawal({from: accounts[0]});
    assert.equal(pendingWithdrawal, startingPrice);

    const preWithdrawal = web3.eth.getBalance(accounts[0]).toNumber();

    await bdaycoin.withdraw({from: accounts[0]});
    pendingWithdrawal = await bdaycoin.getPendingWithdrawal({from: accounts[0]});
    assert.equal(pendingWithdrawal, 0);

    const postWithdrawal = web3.eth.getBalance(accounts[0]).toNumber();

    // NOTE: maybe this should be more exact by looking at the gas calculation...
    assert.isBelow(preWithdrawal, postWithdrawal);
  });
});
