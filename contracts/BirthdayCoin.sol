pragma solidity ^0.4.4;

contract BirthdayCoin  {
  uint constant startingPrice = 20 finney;
  string constant startingMessage = "Nothing to see here...";

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

  function BirthdayCoin() public {
    creator = msg.sender;
  }

  function buyBirthday(uint id, string message) public payable returns (bool) {
    require(id >= 1 && id <= 366);

    var (owner, prevMessage, price) = _getCoinData(id);
    if (msg.value >= price) {
      var (fee, payment) = _extractFee(msg.value);
      _pendingWithdrawals[creator] += fee;
      _pendingWithdrawals[owner] += payment;

      coinToOwner[id] = msg.sender;
      coinToMessage[id] = message;
      coinToPrice[id] = _determineNewPrice(msg.value);
      _updateTop10Coins(id);
      return true;
    } else {
      return false;
    }
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
    uint newPrice = coinToPrice[newCoinId];

    uint i = 0;
    while (i < 10 && (_top10Coins[i] == 0 || newPrice >= coinToPrice[_top10Coins[i]])) {
      i++;
    }

    // don't need to change anything if new price less than all of top 10
    if (i > 0) {
      uint insertionIndex = i - 1;
      uint idToInsert = newCoinId;
      uint tmp;

      // because 0 represents non-coin, if we ever have to insert a 0, rest of array is 0s, so can break out
      // of loop
      while (insertionIndex >= 0 && idToInsert != 0) {
        tmp = _top10Coins[insertionIndex];
        _top10Coins[insertionIndex] = idToInsert;

        insertionIndex--;

        if (tmp == idToInsert) { // duplicate coin
          idToInsert = _top10Coins[insertionIndex];
        } else {
          idToInsert = tmp;
        }
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
    if (coinToPrice[id] == 0) {
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

  // Withdraw split out to avoid re-entrancey if buyBirthday fails on send
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
}
