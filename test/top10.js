const BirthdayCoin = artifacts.require("BirthdayCoin");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;
const dummyCoinID = 0;

contract("getTop10Coins for different coins", async (accounts) => {
  it("should place 10 different coins into the top 10 independently", async () => {
    let instance = await BirthdayCoin.deployed();

    for (i = 1; i <= 10; i++) {
      await instance.buyBirthday(i, 'foobar', {value: startingPrice, from: accounts[1]});
    }

    const top10Coins = await instance.getTop10Coins();
    const top10CoinIds = top10Coins.filter(x => x != dummyCoinID);

    assert.equal(top10CoinIds.length, 10);
    for (i = 0; i < 10; i++) {
      // NOTE: assumes an ordering for ties! Namely, always add a new tied coin towards the top
      assert.equal(top10CoinIds[i], i + 1);
    }
  });
});

// TODO: logic for testing top10 coin list is repeated multiple times... would be nice to abstract out
// NOTE: This test runs a series of top10 scenarios. In each scenario, the coin '1' is re-bought and the top10
// list is checked
contract("getTop10Coins with duplicate coins", async (accounts) => {

  it("0...1 -> 0...1", async () => {
    let instance = await BirthdayCoin.deployed();

    await instance.buyBirthday(1, 'foobar', {value: startingPrice, from: accounts[1]});
    const coinData = await instance.getCoinData(1);
    await instance.buyBirthday(1, 'foobar', {value: coinData[2], from: accounts[2]});
    let top10Coins = await instance.getTop10Coins();
    let top10CoinIds = top10Coins.filter(x => x != dummyCoinID);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });

  it("0...12 -> 0...21", async () => {
    let instance = await BirthdayCoin.deployed();

    const coinData = await instance.getCoinData(1);
    await instance.buyBirthday(2, 'foobar', {value: coinData[2], from: accounts[1]});

    let top10Coins = await instance.getTop10Coins();
    for (i = 0; i < 8; i++) {
      assert.equal(top10Coins[i], dummyCoinID);
    }
    assert.equal(top10Coins[8], 1);
    assert.equal(top10Coins[9], 2);

    await instance.buyBirthday(1, 'foobar', {value: coinData[2], from: accounts[1]});
    top10Coins = await instance.getTop10Coins();
    for (i = 0; i < 8; i++) {
      assert.equal(top10Coins[i], dummyCoinID);
    }
    assert.equal(top10Coins[8], 2);
    assert.equal(top10Coins[9], 1);
  });

  it("213...X -> 23...1", async () => {

  });

  it("1...X -> Y...X1", async () => {

  });


})
