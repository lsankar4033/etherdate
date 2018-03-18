pragma solidity ^0.4.4;

contract Etherdate {
  uint constant startingPrice = 20 finney;
  string constant startingMessage = "Nothing to see here...";

  uint constant dummyCoinID = 0;

  // There are 366 coins (1-indexed so that 0 can be used as a non-assignment flag):
  // day | id
  // 1/1 | 1
  // ...
  // 12/31 | 365
  // 2/29 | 366 (leap day)
  mapping(uint => address) public coinToOwner;
  mapping(uint => string) public coinToMessage;
  mapping(uint => uint) public coinToPrice;

  mapping(address => uint) _pendingWithdrawals;

  // sorted (lowest-highest) array of top 10 coin IDs by price
  uint[10] _top10Coins;

  // May not need this
  address public creator;

  modifier onlyCreator() {
    require(msg.sender == creator);
    _;
  }

  function Etherdate() public {
    creator = msg.sender;
  }

  // NOTE: These are users who owned dates in generation 1
  function insertGen1Data() public onlyCreator {
    _assignCoin(31, 0x183feBd8828a9ac6c70C0e27FbF441b93004fC05, "Vitalik's birthday", 40 finney);
    _assignCoin(365, 0x183feBd8828a9ac6c70C0e27FbF441b93004fC05, "New Year's eve Party Up!", 40 finney);
    _assignCoin(32, 0x0960069855Bd812717E5A8f63C302B4e43bAD89F, "", 40 finney);
    _assignCoin(110, 0x5632CA98e5788edDB2397757Aa82d1Ed6171e5aD, "Hitler kind of ruins this day, so blaze it up", 40 finney);
    _assignCoin(1, 0x183feBd8828a9ac6c70C0e27FbF441b93004fC05, "Happy New Year!", 80 finney);
    _assignCoin(165, 0xE5Ef187Fa4834d0e422763B02450299a1bbf5a59, "What do Donald Trump and Che Guevara have in common?", 40 finney);
    _assignCoin(45, 0x1436c16D38347953d388e882b2A21564EA33005a, "Do not buy. Reserved for loving actual people :D", 40 finney);
    _assignCoin(359, 0x0960069855Bd812717E5A8f63C302B4e43bAD89F, "", 80 finney);
    _top10Coins = [31, 365, 32, 110, 166, 45, 1, 359];
  }

  function buy(uint id, string message) public payable returns (bool) {
    require(id >= 1 && id <= 366);

    var (owner, prevMessage, price) = _getCoinData(id);
    if (msg.value >= price) {
      var (fee, payment) = _extractFee(msg.value);
      _pendingWithdrawals[creator] += fee;
      _pendingWithdrawals[owner] += payment;

      _assignCoin(id, msg.sender, message, _determineNewPrice(msg.value));
      _updateTop10Coins(id);
      return true;
    } else {
      return false;
    }
  }

  function _assignCoin(uint id, address owner, string message, uint newPrice) private {
    coinToOwner[id] = owner;
    coinToMessage[id] = message;
    coinToPrice[id] = newPrice;
  }

  // Extract fee to be paid to contract creator. Fee is defined entirely in this contract! Can be changed in
  // future versions
  function _extractFee(uint amountPaid) private pure returns (uint, uint) {
    uint fee = amountPaid / 100;
    return (fee, amountPaid - fee);
  }

  // 20 -> 320 f = 2x
  // 320 -> 1620 f = 1.5x
  // 1620 -> ... f = 1.1x
  function _determineNewPrice(uint amountPaid) private pure returns (uint) {
    if (amountPaid < 320 finney) {
      return amountPaid * 2;
    } else if (amountPaid < 1620 finney) {
      return (amountPaid * 3) / 2;
    } else {
      return (amountPaid * 11) / 10;
    }
  }

  // Do an insertion sort into the list and then unshift elements 'behind it'
  function _updateTop10Coins(uint newCoinId) private {
    _removeExistingFromTop10(newCoinId);
    _insertNewCoinTop10(newCoinId);
  }

  function _insertNewCoinTop10(uint newCoinId) private {
    uint newPrice = coinToPrice[newCoinId];

    // get insertion index
    uint8 i = 0;
    while (i < 10 && (_top10Coins[i] == dummyCoinID || newPrice >= coinToPrice[_top10Coins[i]])) {
      i++;
    }

    // don't need to insert if doesn't belong in top 10
    if (i > 0) {
      uint8 insertionIndex = i - 1;
      uint idToInsert = newCoinId;
      uint tmp;

      while (idToInsert != dummyCoinID) {
        tmp = _top10Coins[insertionIndex];
        _top10Coins[insertionIndex] = idToInsert;

        // Don't do shifting logic if we're at the beginning of the list!
        if (insertionIndex == 0) {
          break;
        }

        insertionIndex--;
        idToInsert = tmp;
      }
    }
  }

  // Remove all existing instances of new coin in the top 10 and shift list accordingly
  // i.e. if newCoinId = 1 and top10List = [0,...,3,1,2] -> [0,...,3,2]
  function _removeExistingFromTop10(uint newCoinId) private {
    uint newCoinIdx = 10; // only top 10, so this can never be an issue... May want to hardcode in top 10-ness
    for (uint i = 0; i < 10; i++) {
      if (_top10Coins[i] == newCoinId) {
        newCoinIdx = i;
      }
    }

    if (newCoinIdx < 10) {
      _top10Coins[newCoinIdx] = dummyCoinID;
      uint dummyIdx = newCoinIdx;

      // Right shift dummy coins
      while (dummyIdx > 0) {
        _top10Coins[dummyIdx] = _top10Coins[dummyIdx - 1];
        _top10Coins[dummyIdx - 1] = dummyCoinID;

        dummyIdx--;
      }
    }
  }

  // NOTE: Maybe this should return a 'nil'-type value
  function getCoinData(uint id) public view returns (address, string, uint) {
    return _getCoinData(id);
  }

  function _getCoinData(uint id) private view returns (address, string, uint) {
    address owner;
    string memory message;
    uint price;
    if (coinToPrice[id] == dummyCoinID) {
      owner = creator;
      message = startingMessage;
      price = startingPrice;
    } else {
      owner = coinToOwner[id];
      message = coinToMessage[id];
      price = coinToPrice[id];
    }

    return (owner, message, price);
  }

  function getTop10Coins() public view returns (uint[10]) {
    return _top10Coins;
  }

  // Withdraw split out to avoid re-entrancey if buy fails on send
  function withdraw() public {
    uint amount = _pendingWithdrawals[msg.sender];

    if (amount > 0) {
      _pendingWithdrawals[msg.sender] = 0; // zero out withdrawal first to protect against re-entrancy
      msg.sender.transfer(amount);
    }
  }

  function getPendingWithdrawal() public view returns (uint) {
    return _pendingWithdrawals[msg.sender];
  }

  // NOTE: For retrieving withdrawals in case a new generation is necessary
  function getPendingWithdrawal(address user) public view onlyCreator returns (uint) {
    return _pendingWithdrawals[user];
  }
}
