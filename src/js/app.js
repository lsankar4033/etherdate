// TODO: Add way to withdraw!
// TODO: Better display prices (i.e. as eth)
App = {
  // TODO: This really shouldn't be checked in... Should figure out how to put this in a config file.
  devBirthdayCoinAddress: '0xc8c03647d39a96f02f6ce8999bc22493c290e734',

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
      const abstractContract = TruffleContract(data);
      abstractContract.setProvider(App.web3Provider);
      abstractContract.at(App.devBirthdayCoinAddress).then(function (contract) {
        App.contracts.BirthdayCoin = contract;

        // initialize components
        App.populateHighPricesTable();
        App.initializeDatepicker();
        $('#buy-button').click(App.buyCoin);
      });
    });
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

  initializeDatepicker: function () {
    $('#datetimepicker').on('dp.change', App.handleDateChange);

    // Use a year (2020) with a leap day
    const startDate = new Date(2020, 0, 1);
    const endDate = new Date(2020, 12, 31);

    // TODO: Disable level changer
    // TODO: Disable days of week column headings
    $('#datetimepicker').datetimepicker({
      format: 'MM/DD',
      dayViewHeaderFormat: 'MMMM',
      minDate: startDate,
      maxDate: endDate
    });
  },

  handleDateChange: async function (e) {
    const momentDate = e.date;
    const coinId = momentDate.dayOfYear();
    const coinData = await App.contracts.BirthdayCoin.getCoinData(coinId);

    $('#selected-date input#owner').attr('placeholder', coinData[0]);
    $('#selected-date input#message').attr('placeholder', coinData[1]);
    $('#selected-date input#price').attr('placeholder', coinData[2].toNumber());
    $('#selected-date input#coin-id').val(coinId);
  },

  // TODO: if false is returned from smart contract, indicate this to user
  buyCoin: async function (e) {
    coinId = $('#selected-date input#coin-id').val();
    price = $('#selected-date input#price').attr('placeholder');

    // TODO: make it so that new message is user input (maybe also include input for price user is willing to
    // pay
    const didBuy = await App.contracts.BirthdayCoin.buyBirthday(coinId, 'TEST MESSAGE', {value: price});

    // TODO: Reload all panes

    // TODO: remove
    console.log(didBuy);
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
