// network -> [sorted list of addresses by generation]
const contractAddressMap = {
  'rinkeby': ['0x5094bd12f227df04905918dc431e822e5d235e64', '0x62500af05b9238940b62abd8b73584f40da9971a'],
  'mainnet': ['0x77daea587e4cdf2bfa7acaba72f01b3a97d108ea']
};

const contractNetwork = 'rinkeby';
const contractGeneration = 1;

const contractAddress = contractAddressMap[contractNetwork][contractGeneration];

let etherscanNetworkURL;
if (contractNetwork == 'mainnet') {
  etherscanNetworkURL = `https://etherscan.io`;
} else {
  etherscanNetworkURL = `https://${contractNetwork}.etherscan.io`;
}

const etherscanContractURL = `${etherscanNetworkURL}/address/${contractAddress}`;

const contractIdentifierStr = `${contractNetwork} gen ${contractGeneration + 1}`;

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

const defaultGasPrice = 6000000000;

const preMetamaskMsg = "You'll now be redirected to Metamask to submit this transaction. Note that it will take some time after submission before the tx appears on the blockchain!"

function metamaskNetIdToNetwork(netId) {
  switch (netId) {
    case "1":
      return 'mainnet';
    case "2":
      return 'morden';
    case "3":
      return 'ropsten';
    case "4":
      return 'rinkeby';
    case "42":
      return 'kovan';
    default:
      return 'unknown';
  }
}

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
  return gasEstimate * 20;
}

function etherscanTxURL(txId) {
  return `${etherscanNetworkURL}/tx/${txId}`;
}

App = {
  web3Provider: null,
  contracts: {},

  init: function() {
    $('.etherscan-address-link').attr('href', etherscanContractURL);
    $('#header-contract-identifier').html(contractIdentifierStr);

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      $('#metamask-present').show();

      App.web3Provider = web3.currentProvider;
      web3 = new Web3(App.web3Provider);

      web3.version.getNetwork((err, netID) => {
        let metamaskNetwork = metamaskNetIdToNetwork(netID);
        if (metamaskNetwork === contractNetwork) {
          return App.initContract();
        } else {
          $('#wrong-network-modal').modal();
          $('span#wrong-network').text(metamaskNetwork);
          $('span#right-network').text(contractNetwork);
        }
      });
    } else {
      $('#metamask-absent').show();
    }
  },

  initContract: function() {
    // NOTE: This is the version of Etherdate.json that is *live* on the mainnet
    $.getJSON('Etherdate.json', (data) => {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      const abstractContract = TruffleContract(data);
      abstractContract.setProvider(App.web3Provider);
      abstractContract.at(contractAddress).then(function (contract) {
        App.contracts.Etherdate = contract;

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

    var top10Coins = await App.contracts.Etherdate.getTop10Coins();
    top10Coins = top10Coins.map(x => x.toNumber()).filter(x => x > 0)

    topCoinData = []
    for (id of top10Coins) {
      var coinData = await App.contracts.Etherdate.getCoinData(id)
      coinData.push(id)
      topCoinData.push(coinData);
    }

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
    const coinData = await App.contracts.Etherdate.getCoinData(id);
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

    const gasEstimate = await App.contracts.Etherdate.buy.estimateGas(coinId, newMessage);
    App.contracts.Etherdate.buy(coinId, newMessage, {value: price, gas: determineGas(gasEstimate), gasPrice: defaultGasPrice}).then((result) => {
      App.displayTxAlert(result['tx']);
    });

    alert(preMetamaskMsg);
  },

  initializeWithdrawalPane: async function () {
    App.reloadPendingWithdrawal();
    $('#withdraw-button').click(App.withdraw);
  },

  reloadPendingWithdrawal: async function () {
    const pendingWithdrawal = await App.contracts.Etherdate.getPendingWithdrawal();
    const pendingWithdrawalStr = getEther(pendingWithdrawal.toNumber());
    $('#withdraw span#pending-withdrawal').text(pendingWithdrawalStr);
  },

  withdraw: async function (e) {
    let gasEstimate = await App.contracts.Etherdate.withdraw.estimateGas()
    App.contracts.Etherdate.withdraw({gas: determineGas(gasEstimate), gasPrice: defaultGasPrice}).then((result) => {
      App.displayTxAlert(result['tx']);
    });

    alert(preMetamaskMsg);
  },

  displayTxAlert: function (txId) {
    $('#tx-submitted-modal').modal();
    $('a#tx-submitted-link').attr('href', etherscanTxURL(txId));
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
