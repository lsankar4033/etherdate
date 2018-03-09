const BirthdayCoin = artifacts.require("BirthdayCoin");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;

contract('buyBirthday', async (accounts) => {

  // NOTE: Necessary to test because of bug with top10 list
  it("should allow > 10 buys", async () => {
    let instance = await BirthdayCoin.deployed();

    for (i = 1; i < 12; i++) {
      let result = await instance.buyBirthday(i, 'foobar', {value: startingPrice, from: accounts[1]});
    }

    for (i = 1; i < 12; i++) {
      let coinData = await instance.getCoinData(i);
      assert.equal(coinData[0], accounts[1]);
      assert.equal(coinData[1], 'foobar');
    }
  });
});
