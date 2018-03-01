const BirthdayCoin = artifacts.require("BirthdayCoin");

contract('BirthdayCoin test', async (accounts) => {

  it("buying a single coin should place it in the top 10", async () => {
    let bdaycoin = await BirthdayCoin.deployed();
    let account = accounts[0];

    // TODO: Ideally this wouldn't be declared both here and in the contract
    let price = 1000000000000000;

    await bdaycoin.buyBirthday(1, 'foobar', {value: price, from: account});
    let top10Coins = await bdaycoin.getTop10Coins.call();

    // TODO: This logic is duplicated too
    top10CoinIds = top10Coins.map(x => x.toNumber()).filter(x => x > 0);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });

  it("should only include a coin in the top 10 once", async () => {
    let bdaycoin = await BirthdayCoin.deployed();
    let account1 = accounts[0];
    let account2 = accounts[1];

    // TODO: Ideally this wouldn't be declared both here and in the contract
    let firstPrice = 1000000000000000;
    let secondPrice = 2000000000000000;

    await bdaycoin.buyBirthday(1, 'foobar', {value: firstPrice, from: account1});
    await bdaycoin.buyBirthday(1, 'foobar', {value: secondPrice, from: account2});
    let top10Coins = await bdaycoin.getTop10Coins.call();

    // TODO: This logic is duplicated too
    top10CoinIds = top10Coins.map(x => x.toNumber()).filter(x => x > 0);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });

  // TODO: Add other tests...

})
