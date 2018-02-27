App = {
  // TODO: This really shouldn't be checked in... Should figure out how to put this in a config file.
  devBirthdayCoinAddress: '0x8f0483125fcb9aaaefa9209d8e9d7b9c8b9fb90f',

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

  // TODO: Convert to async function
  initContract: function() {
    $.getJSON('BirthdayCoin.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var BirthdayCoinArtifact = data;

      var abstractContract = TruffleContract(BirthdayCoinArtifact);
      abstractContract.setProvider(App.web3Provider);
      abstractContract.at(App.devBirthdayCoinAddress).then(function (contract) {
        App.contracts.BirthdayCoin = contract;
        App.populateHighPricesTable();
      });
    });

    return App.bindEvents();
  },

  populateHighPricesTable: async function() {
    const top10Coins = await App.contracts.BirthdayCoin.getTop10Coins();
    const topCoinIds = top10Coins.map(x => x.toNumber()).filter(x => x > 0);

    topCoinData = []
    for (id of topCoinIds) {
      var coinData = await App.contracts.BirthdayCoin.getCoinData(id)
      coinData.push(id)
      topCoinData.push(coinData);
    }

    var html = '';
    topCoinData.reverse();
    for (coinData of topCoinData) {
      html += '<tr>';

      var dateStr = App.coinIdToDateStr(coinData[3]);
      html += `<td>${dateStr}</td>`;
      html += `<td>${coinData[0]}</td>`;
      html += `<td>${coinData[1]}</td>`;
      html += `<td>${coinData[2].toNumber()}</td>`;

      html += '</tr>';
    }

    $('#high-prices-table tbody').append(html);
  },

  // NOTE: May want to move all date handling logic to its own file...
  monthDays: [
    [1, 31],
    [2, 28],
    [3, 31],
    [4, 30],
    [5, 31],
    [6, 30],
    [7, 31],
    [8, 31],
    [9, 30],
    [10, 31],
    [11, 30],
    [12, 31]
  ],

  // NOTE: in the future may want to use intermediate date type
  coinIdToDateStr: function (id) {
    if (id > 366 || id < 1) {
      // TODO: Change to exception/log handling
      return 'NOT A DATE';
    } else if (id == 366) {
      return '2/29';
    } else {
      for (monthDay of App.monthDays) {
        if (id <= monthDay[1]) {
          return `${monthDay[0]}/${id}`;
        }

        id -= monthDay[1];
      }
    }
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
