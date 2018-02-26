App = {
  // TODO: This really shouldn't be checked in... Should figure out how to put this in a config file.
  devBirthdayCoinAddress = "0x23e84570f7b28ad0d5e5545d398009194a8734f3",

  web3Provider: null,
  contracts: {},

  init: function() {
    // Initialization logic?
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('BirthdayCoin.json', function(data) {
      // TODO: Figure out how to propagate this down properly...
      var devContractAddr = "0x23e84570f7b28ad0d5e5545d398009194a8734f3"

      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var BirthdayCoinArtifact = data;

      var abstractContract = TruffleContract(BirthdayCoinArtifact);
      abstractContract.setProvider(App.web3Provider);
      abstractContract.at(devBirthdayCoinAddress).then(function (contract) {
        App.contracts.BirthdayCoin = contract;
        App.populateHighPricesTable();
      });
    });

    return App.bindEvents();
  },

  populateHighPricesTable: function() {
    App.contracts.BirthdayCoin.getTop10Coins().then(function (top10Coins) {
      // TODO: Populate the rows in html!
      console.log(top10Coins);
    });
  },

  bindEvents: function() {
    // TODO
  },

  // TODO: binding for buying a birthday or withdrawing balance

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
