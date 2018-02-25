pragma solidity ^0.4.4;

// TODO: Consider making this thing abide by ERC721
contract BirthdayCoin  {

  // TODO: Refine
  uint constant startingPrice = 1 finney;

  // There are 366 coins (1-indexed so that 0 can be used as a non-assignment flag):
  // day | id
  // 1/1 | 1
  // ...
  // 12/31 | 365
  // 2/29 | 366 (leap day)
  mapping(uint => address) public coinToOwner;
  mapping(uint => string) public coinToMessage;
  mapping(uint => uint) public coinToPrice; // TODO: for clarity, maybe this should reflect the initial price too..
  mapping(address => uint) _pendingWithdrawals;

  // sorted (lowest-highest) array of top 10 coin IDs by price
  uint[10] _top10Coins;

  // May not need this
  address public creator;

  function BirthdayCoin() public {
    creator = msg.sender;
  }

  // TODO: (maybe) add fee to creator
  function buyBirthday(uint id, string message) public payable returns (bool) {
    require(id >= 1 && id <= 366);

    // Janky logic that's necessary because maps aren't initialized for performance reasons
    uint price;
    address owner;
    if (coinToPrice[id] == 0) {
      price = startingPrice;
      owner = creator;
    } else {
      price = coinToPrice[id];
      owner = coinToOwner[id];
    }

    if (msg.value > price) {
      _pendingWithdrawals[owner] += msg.value;
      coinToOwner[id] = msg.sender;
      coinToMessage[id] = message;
      coinToPrice[id] = _determineNewPrice(msg.value);
      _updateTop10Coins(id);
    } else {
      return false;
    }
  }

  // TODO: Refine
  function _determineNewPrice(uint amountPaid) private pure returns (uint) {
    return amountPaid * 2;
  }

  // Do an insertion sort into the list and then unshift elements 'behind it'
  function _updateTop10Coins(uint newCoinId) private {
    uint newPrice = coinToPrice[newCoinId];

    uint i = 0;
    while (i < 10 && (_top10Coins[i] == 0 || newPrice > coinToPrice[_top10Coins[i]])) {
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

        idToInsert = tmp;
        insertionIndex--;
      }
    }
  }

  function getCoinData(uint id) public view returns (address, string, uint) {
    return (coinToOwner[id], coinToMessage[id], coinToPrice[id]);
  }

  function getTop10Coins() public view returns (uint[10]) {
    return _top10Coins;
  }

  // Withdraw split out to avoid re-entrancey if buyBirthday fails on send
  function withdraw() public {
    uint amount = _pendingWithdrawals[msg.sender];
    _pendingWithdrawals[msg.sender] = 0; // zero out withdrawal first to protect against re-entrancy
    msg.sender.transfer(amount);
  }
}
