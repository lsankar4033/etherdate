const Etherdate = artifacts.require("Etherdate");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;
const startingMessage = "Nothing to see here...";

contract('initialization', async (accounts) => {
  it("should initialize all coins to be owned by the contract creator", async () => {
    let instance = await Etherdate.deployed();

    // Don't bother checking all of them...
    for (i = 1; i <= 10; i++) {
      var coinData = await instance.getCoinData(i);
      assert.equal(coinData[0], accounts[0]);
      assert.equal(coinData[1], startingMessage);
      assert.equal(coinData[2], startingPrice);
    }
  });

  it("should initialize the top 10 list to all 0s", async () => {
    let instance = await Etherdate.deployed();

    const top10Coins = await instance.getTop10Coins();
    assert.equal(top10Coins.length, 10);
    for (coin of top10Coins) {
      assert.equal(coin, 0);
    }
  });
});
