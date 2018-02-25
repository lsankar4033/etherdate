pragma solidity ^0.4.4;

// import './NFT.sol';

// TODO: Consider making this thing abide by ERC721
contract BirthdayCoin  {

  // TODO: Refine
  uint constant startingPrice = 1 finney;

  // There are 366 coins:
  // day | id
  // 1/1 | 0
  // 1/2 | 1
  // 1/3 | 2
  // ...
  // 12/31 | 364
  // 2/29 | 365 (leap day)
  mapping(uint => address) public coinToOwner;
  mapping(uint => string) public coinToMessage;
  mapping(uint => uint) public coinToPrice; // TODO: for clarity, maybe this should reflect the initial price too..
  mapping(address => uint) _pendingWithdrawals;

  // May not need this
  address public creator;

  function BirthdayCoin() public {
    creator = msg.sender;
  }

  // TODO: (maybe) add fee to creator
  function buyBirthday(uint id, string message) public payable returns (bool) {
    require(id >= 0 && id < 366);

    // May be cleaner to structure price/owner/message as struct and condition creator check below on
    // whether that struct is defined
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
    } else {
      return false;
    }
  }

  // TODO: Refine
  function _determineNewPrice(uint amountPaid) private pure returns (uint) {
    return amountPaid * 2;
  }

  function withdraw() public {
    uint amount = _pendingWithdrawals[msg.sender];
    _pendingWithdrawals[msg.sender] = 0; // zero out withdrawal first to protect against re-entrancy
    msg.sender.transfer(amount);
  }
}
