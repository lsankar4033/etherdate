pragma solidity ^0.4.4;

// import './NFT.sol';

// TODO: Consider making this thing follow ERC721
contract BirthdayCoin  {

  // TODO: Refine
  string constant defaultMessage = "For Sale!";
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
  mapping(uint => uint) public coinToPrice;
  mapping(address => uint) _pendingWithdrawals;

  // May not need this
  address public creator = msg.sender;

  // Initialize all coins to be owned by creator with some default message
  // TODO: In truffle, this is running out of gas...
  function BirthdayCoin() public {
    for (uint coin = 0; coin < 366; coin++) {
      coinToOwner[coin] = creator;
      coinToMessage[coin] = defaultMessage;
      coinToPrice[coin] = startingPrice;
    }
  }

  function buyBirthday(uint id, string message) public payable returns (bool) {
    require(id >= 0 && id < 366);

    // TODO: determine how fee to creator (and gas) works
    if (msg.value > coinToPrice[id]) {
      _pendingWithdrawals[coinToOwner[id]] += msg.value;
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
