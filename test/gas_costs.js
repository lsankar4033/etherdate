const Etherdate = artifacts.require("Etherdate");

const startingPrice = 20000000000000000;

// NOTE: Duplicated in top10.js
function generateTop10List(freshInstance, account, top10List) {
  for (i = 0; i < top10List.length; i++) {
    freshInstance.buy(top10List[i], 'foobar', {value: startingPrice, from: account});
  }
}

contract("gas estimation", async (accounts) => {
  // NOTE: This is the worst-case gas usage scenario as far as we know
  it("buy with fully populated top 10 list", async () => {
    let instance = await Etherdate.deployed();
    generateTop10List(instance, accounts[0], [1,2,3,4,5,6,7,8,9,10]);

    for (i = 1; i < 11; i++) {
      let estimate = await instance.buy.estimateGas(i, 'foobar');
      console.log(`Gas estimate for date ${i}: ${estimate}`);
    }
  });
})

