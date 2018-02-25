App = {
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
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var BirthdayCoinArtifact= data;
      App.contracts.BirthdayCoin = TruffleContract(BirthdayCoinArtifact);

      // Set the provider for our contract
      App.contracts.BirthdayCoin.setProvider(App.web3Provider);

      // Populate high scores table
      App.populateHighPricesTable();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    // TODO
  },

  populateHighPricesTable: function() {
    App.contracts.BirthdayCoin.deployed().then(function(instance) {
      //return instance.
      // adoptionInstance = instance;

      // return adoptionInstance.getAdopters.call();
    })
  },

  // TODO: binding for buying a birthday or withdrawing balance

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
