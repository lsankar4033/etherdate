const Etherdate = artifacts.require("Etherdate");

function testTop10Coins(actual, expected) {
  for (i = 0; i < expected.length; i++) {
    assert.equal(actual[i].toNumber(), expected[i]);
  }
}

contract("gen 1 -> gen 2", async (accounts) => {
  let expectedTop10 = [31, 365, 32, 110, 166, 45, 1, 359];

  let idAddrMsgPrice = [
    [31, "0x183feBd8828a9ac6c70C0e27FbF441b93004fC05", "Vitalik's birthday", 40000000000000000],
    [365, "0x183feBd8828a9ac6c70C0e27FbF441b93004fC05", "New Year's eve Party Up!", 40000000000000000],
    [32, "0x0960069855Bd812717E5A8f63C302B4e43bAD89F", "", 40000000000000000],
    [110, "0x5632CA98e5788edDB2397757Aa82d1Ed6171e5aD", "Hitler kind of ruins this day, so blaze it up", 40000000000000000],
    [1, "0x183feBd8828a9ac6c70C0e27FbF441b93004fC05", "Happy New Year!", 80000000000000000],
    [165, "0xE5Ef187Fa4834d0e422763B02450299a1bbf5a59", "What do Donald Trump and Che Guevara have in common?", 40000000000000000],
    [45, "0x1436c16D38347953d388e882b2A21564EA33005a", "Do not buy. Reserved for loving actual people :D", 40000000000000000],
    [359, "0x0960069855Bd812717E5A8f63C302B4e43bAD89F", "", 80000000000000000],
  ]

  it("should properly migrate all buys over from gen 1", async () => {
    let instance = await Etherdate.deployed();
    await instance.insertGen1Data();

    let top10 = await instance.getTop10Coins();
    for (i = 0; i < expectedTop10.length; i++) {
      assert.equal(top10[i].toNumber(), expectedTop10[i]);
    }

    for (i = expectedTop10.length; i < top10.length; i++) {
      assert.equal(top10[i].toNumber(), 0);
    }

    for (tup of idAddrMsgPrice) {
      let coinData = await instance.getCoinData(tup[0]);

      assert.equal(coinData[0].toUpperCase(), tup[1].toUpperCase());
      assert.equal(coinData[1], tup[2]);
      assert.equal(coinData[2], tup[3]);
    }
  });
});
