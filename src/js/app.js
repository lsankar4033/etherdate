// TODO: Put these in a config that's determined by env!
const devBirthdayCoinAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10';
const rinkebyBirthdayCoinAddress = '0x5094bd12f227df04905918dc431e822e5d235e64';
const mainBirthdayCoinAddress = '0x77daea587e4cdf2bfa7acaba72f01b3a97d108ea'; // commit: f659224

// NOTE: May want to move all date handling logic to its own file...
const monthDays = [
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
]

// NOTE: in the future may want to use intermediate date type
function coinIdToDateStr(id) {
  if (id > 366 || id < 1) {
    return 'INVALID DATE';
  } else if (id == 366) {
    return '2/29';
  } else {
    for (monthDay of monthDays) {
      if (id <= monthDay[1]) {
        return `${monthDay[0]}/${id}`;
      }

      id -= monthDay[1];
    }
  }
}

function dayOfYearToCoinId(doy) {
  if (doy < 60) {
    return doy
  } else if (doy == 60) {
    return 366;
  } else {
    return doy - 1;
  }
}

function getEther(wei) {
  return wei / (10 ** 18);
}

function getWei(ether) {
  return ether * (10 ** 18);
}

function determineGas(gasEstimate) {
  return gasEstimate * 10;
}

// TODO: Notice that ethereum txes take tiem after buy
// TODO: Display prices better (i.e. as eth)
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
    // NOTE: This is the version of BirthdayCoin.json that is *live* on the mainnet
    $.getJSON('BirthdayCoin.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      const abstractContract = TruffleContract(data);
      abstractContract.setProvider(App.web3Provider);
      abstractContract.at(rinkebyBirthdayCoinAddress).then(function (contract) {
        App.contracts.BirthdayCoin = contract;

        // initialize components
        App.reloadHighPricesTable();

        // NOTE: non-unified paradigms between buy/withdraw panes, but w/e
        App.initializeDatepicker();
        $('#buy-button').click(App.buyCoin);

        App.initializeWithdrawalPane();
      });
    });
  },

  reloadHighPricesTable: async function() {
    $('#high-prices-table tbody').empty();

    const top10Coins = await App.contracts.BirthdayCoin.getTop10Coins();

    // TODO: Fix smart contract so we don't have to do this deduplication...
    const topCoinIds = new Set(top10Coins.map(x => x.toNumber()).filter(x => x > 0));

    topCoinData = []
    for (id of topCoinIds) {
      var coinData = await App.contracts.BirthdayCoin.getCoinData(id)
      coinData.push(id)
      topCoinData.push(coinData);
    }
    topCoinData.sort((a,b) => a[2] - b[2])

    var html = '';
    topCoinData.reverse();
    for (coinData of topCoinData) {
      html += '<tr>';

      var dateStr = coinIdToDateStr(coinData[3]);
      html += `<td>${dateStr}</td>`;
      html += `<td>${coinData[1]}</td>`;
      html += `<td>${getEther(coinData[2].toNumber())}</td>`;

      html += '</tr>';
    }

    $('#high-prices-table tbody').append(html);
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
    await App._handleDateChange(dayOfYearToCoinId(momentDate.dayOfYear()));
  },

  _handleDateChange: async function (id) {
    const coinData = await App.contracts.BirthdayCoin.getCoinData(id);
    $('#selected-date input#message').attr('placeholder', coinData[1]);
    $('#selected-date input#price').attr('placeholder', getEther(coinData[2].toNumber()));
    $('#selected-date input#coin-id').val(id);

    if (coinData[0] == web3.eth.accounts[0]) {
      $('#buy-input').hide();
      $('#selected-date input#owner').attr('placeholder', `${coinData[0]} (you)`);
    } else {
      $('#buy-input').show();
      $('#selected-date input#owner').attr('placeholder', coinData[0]);
    }
  },

  buyCoin: async function (e) {
    coinId = $('#selected-date input#coin-id').val();
    price = getWei($('#selected-date input#price').attr('placeholder'));
    newMessage = $('#selected-date input#new-message').val();

    const gasEstimate = await App.contracts.BirthdayCoin.buyBirthday.estimateGas(coinId, newMessage);

    const didBuy = await App.contracts.BirthdayCoin.buyBirthday(coinId, newMessage, {value: price, gas: determineGas(gasEstimate)});

    App._handleDateChange(coinId);
    App.reloadHighPricesTable();
    App._reloadPendingWithdrawal();
  },

  initializeWithdrawalPane: async function () {
    App._reloadPendingWithdrawal();
    $('#withdraw-button').click(App.withdraw);
  },

  _reloadPendingWithdrawal: async function () {
    const pendingWithdrawal = await App.contracts.BirthdayCoin.getPendingWithdrawal();
    const pendingWithdrawalStr = getEther(pendingWithdrawal.toNumber());
    $('#withdraw span#pending-withdrawal').text(pendingWithdrawalStr);
  },

  withdraw: async function (e) {
    const gasEstimate = await App.contracts.BirthdayCoin.withdraw.estimateGas()

    await App.contracts.BirthdayCoin.withdraw({gas: determineGas(gasEstimate)});
    App._reloadPendingWithdrawal();
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
