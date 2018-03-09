const Etherdate = artifacts.require("Etherdate");

// TODO: Ideally these aren't repeated b/w all tests and smart contract
const startingPrice = 20000000000000000;
const dummyCoinID = 0;

function testTop10Coins(actual, expected) {
  for (i = 0; i < 10; i++) {
    assert.equal(actual[i].toNumber(), expected[i]);
  }
}

function generateTop10List(freshInstance, account, top10List) {
  for (i = 0; i < top10List.length; i++) {
    freshInstance.buy(top10List[i], 'foobar', {value: startingPrice, from: account});
  }
}

contract("getTop10Coins for different coins", async (accounts) => {
  it("should place 10 different coins into the top 10 independently", async () => {
    let instance = await Etherdate.deployed();

    for (i = 1; i <= 10; i++) {
      await instance.buy(i, 'foobar', {value: startingPrice, from: accounts[1]});
      let coinData = await instance.getCoinData(i);
    }

    const top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

contract("0...1 -> 0...1", async (accounts) => {
  it("should work", async () => {
    let instance = await Etherdate.deployed();

    await instance.buy(1, 'foobar', {value: startingPrice, from: accounts[1]});
    const coinData = await instance.getCoinData(1);
    await instance.buy(1, 'foobar', {value: coinData[2], from: accounts[2]});
    let top10Coins = await instance.getTop10Coins();
    let top10CoinIds = top10Coins.filter(x => x != dummyCoinID);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });
});

contract("0...12 -> 0...21", async (accounts) => {
  it("should work", async () => {
    let instance = await Etherdate.deployed();

    await instance.buy(1, 'foobar', {value: startingPrice, from: accounts[1]});
    await instance.buy(2, 'foobar', {value: startingPrice, from: accounts[1]});
    let top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, [0, 0, 0, 0, 0, 0, 0, 0, 1, 2]);

    const coinData = await instance.getCoinData(1);
    await instance.buy(1, 'foobar', {value: coinData[2], from: accounts[1]});
    top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, [0, 0, 0, 0, 0, 0, 0, 0, 2, 1]);
  });
});

contract("213...,10 -> 23..10,1", async (accounts) => {
  it("should work", async () => {
    let instance = await Etherdate.deployed();
    let first = [2,1,3,4,5,6,7,8,9,10]
    let second = [2,3,4,5,6,7,8,9,10,1]

    generateTop10List(instance, accounts[0], first)
    let top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, first);

    let coinData = await instance.getCoinData(1);
    await instance.buy(1, 'foobar', {value: coinData[2], from: accounts[1]});
    top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, second);
  });
});

contract("23...10,1 -> 3...10,1,2", async (accounts) => {
  it("should work", async () => {
    let instance = await Etherdate.deployed();
    let first = [2,3,4,5,6,7,8,9,10,1];
    let second = [3,4,5,6,7,8,9,10,1,2];

    generateTop10List(instance, accounts[0], first)
    let top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, first)

    let coinData = await instance.getCoinData(1);
    await instance.buy(2, 'foobar', {value: coinData[2], from: accounts[1]});
    top10Coins = await instance.getTop10Coins();
    testTop10Coins(top10Coins, second);
  });
})
