const BirthdayCoin = artifacts.require("BirthdayCoin");

// TODO: Ideally these aren't repeated b/w here and the smart contract
const startingPrice = 20000000000000000;
const startingMessage = "Nothing to see here...";

contract('initialization', async (accounts) => {
  it("should initialize all coins to be owned by the contract creator", async () => {
    let bdaycoin = await BirthdayCoin.deployed();

    // Don't bother checking all of them...
    for (i = 1; i < 10; i++) {
      var coinData = await bdaycoin.getCoinData(i);
      assert.equal(coinData[0], accounts[0]);
      assert.equal(coinData[1], startingMessage);
      assert.equal(coinData[2], startingPrice);
    }
  });

  it("should initialize the top 10 list to all 0s", async () => {
    let bdaycoin = await BirthdayCoin.deployed();

    const top10Coins = await bdaycoin.getTop10Coins()

    assert.equal(top10Coins.length, 10);
    for (coin of top10Coins) {
      assert.equal(coin, 0);
    }
  });
});

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

contract('getTop10Coins', async (accounts) => {
  it("buying a single coin should place it in the top 10", async () => {
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
    const coinData = await bdaycoin.getCoinData(1)
    await bdaycoin.buyBirthday(1, 'foobar', {value: coinData[2], from: accounts[2]});
    let top10Coins = await bdaycoin.getTop10Coins();
    top10CoinIds = top10Coins.filter(x => x > 0);

    assert.equal(top10CoinIds.length, 1)
    assert.equal(top10CoinIds[0], 1)
  });
});
