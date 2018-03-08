const BirthdayCoin = artifacts.require("BirthdayCoin");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;

contract('getTop10Coins', async (accounts) => {
  it("should place coins in the top 10", async () => {
    let bdaycoin = await BirthdayCoin.deployed();

    await bdaycoin.buyBirthday(1, 'foobar', {value: startingPrice, from: accounts[1]});
    let top10Coins = await bdaycoin.getTop10Coins();
    top10CoinIds = top10Coins.filter(x => x > 0);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });

  it("should only include each coin in the top 10 once", async () => {
    let bdaycoin = await BirthdayCoin.deployed();

    let secondPrice = 10000000000000000;

    await bdaycoin.buyBirthday(1, 'foobar', {value: startingPrice, from: accounts[1]});
    const coinData = await bdaycoin.getCoinData(1);
    await bdaycoin.buyBirthday(1, 'foobar', {value: coinData[2], from: accounts[2]});
    let top10Coins = await bdaycoin.getTop10Coins();
    top10CoinIds = top10Coins.filter(x => x > 0);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });
});
