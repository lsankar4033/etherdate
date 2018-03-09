const Etherdate = artifacts.require("Etherdate");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;

contract('buy', async (accounts) => {

  // NOTE: Necessary to test because of bug with top10 list
  it("should allow > 10 buys", async () => {
    let instance = await Etherdate.deployed();

    for (i = 1; i < 12; i++) {
      let result = await instance.buy(i, 'foobar', {value: startingPrice, from: accounts[1]});
    }

    for (i = 1; i < 12; i++) {
      let coinData = await instance.getCoinData(i);
      assert.equal(coinData[0], accounts[1]);
      assert.equal(coinData[1], 'foobar');
    }
  });
});
