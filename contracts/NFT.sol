pragma solidity ^0.4.4;

contract ERC721 {
  // Ownership
  function totalSupply() public constant returns (uint);
  function balanceOf(address) public constant returns (uint);
  function tokenOfOwnerByIndex(address owner, uint index) external constant returns (uint);
  function ownerOf(uint tokenId) external constant returns (address);

  // Transfer
  function transfer(address to, uint tokenId) public;
  function takeOwnership(uint tokenId) external;
  function transferFrom(address from, address to, uint tokenId) external;
  function approve(address beneficiary, uint tokenId) external;

  // Metadata, misc
  function tokenMetadata(uint tokenId) external constant returns (string);
  function name() constant returns (string name);
  function symbol() constant returns (string symbol);

  event Transferred(uint tokenId, address from, address to);
  event Approval(address owner, address beneficiary, uint tokenId);
  event MetadataUpdated(uint tokenId, address owner, string data);
}

// Basic implementation of ERC721. Any optimizations of ERC721-stuff should happen here
contract NFT is ERC721 {

  uint public totalTokens;

  mapping(address => uint[]) public ownedTokens;
  mapping(address => uint) _virtualLength;
  mapping(uint => uint) _tokenIndexInOwnerArray;
  mapping(uint => address) public tokenOwner;

  mapping(uint => address) public allowedTransfer;

  mapping(uint => string) public _tokenMetadata;

  //////////
  // ERC-721
  //////////

  function totalSupply() public constant returns (uint) {
    return totalTokens;
  }

  function balanceOf(address owner) public constant returns (uint) {
    return _virtualLength[owner];
  }

  function tokenOfOwnerByIndex(address owner, uint index) external constant returns (uint) {
    require(index >= 0 && index < balanceOf(owner));
    return ownedTokens[owner][index];
  }

  function ownerOf(uint tokenId) external constant returns (address) {
    return tokenOwner[tokenId];
  }

  function transfer(address to, uint tokenId) public {
    require(tokenOwner[tokenId] == msg.sender);
    return _transfer(tokenOwner[tokenId], to, tokenId);
  }

  function takeOwnership(uint tokenId) external {
    require(allowedTransfer[tokenId] == msg.sender);
    return _transfer(tokenOwner[tokenId], msg.sender, tokenId);
  }

  function transferFrom(address from, address to, uint tokenId) external {
    require(tokenOwner[tokenId] == from);
    require(allowedTransfer[tokenId] == msg.sender);
    return _transfer(tokenOwner[tokenId], to, tokenId);
  }

  function approve(address beneficiary, uint tokenId) external {
    require(msg.sender == tokenOwner[tokenId]);

    if (allowedTransfer[tokenId] != 0) {
      allowedTransfer[tokenId] = 0;
    }
    allowedTransfer[tokenId] = beneficiary;
    Approval(tokenOwner[tokenId], beneficiary, tokenId);
  }

  function tokenMetadata(uint tokenId) external constant returns (string) {
    return _tokenMetadata[tokenId];
  }

  function updateTokenMetadata(uint tokenId, string _metadata) external {
    require(msg.sender == tokenOwner[tokenId]);
    _tokenMetadata[tokenId] = _metadata;
    MetadataUpdated(tokenId, msg.sender, _metadata);
  }

  function _transfer(address from, address to, uint tokenId) internal {
    _clearApproval(tokenId);
    if (from != address(0)) {
        _removeTokenFrom(from, tokenId);
    }
    _addTokenTo(to, tokenId);
    Transferred(tokenId, from, to);
  }

  function _clearApproval(uint tokenId) internal {
    allowedTransfer[tokenId] = 0;
    Approval(tokenOwner[tokenId], 0, tokenId);
  }

  function _removeTokenFrom(address from, uint tokenId) internal {
    require(_virtualLength[from] > 0);

    uint length = _virtualLength[from];
    uint index = _tokenIndexInOwnerArray[tokenId];
    uint swapToken = ownedTokens[from][length - 1];

    ownedTokens[from][index] = swapToken;
    _tokenIndexInOwnerArray[swapToken] = index;
    _virtualLength[from]--;
  }

  function _addTokenTo(address owner, uint tokenId) internal {
    if (ownedTokens[owner].length == _virtualLength[owner]) {
      ownedTokens[owner].push(tokenId);
    } else {
      ownedTokens[owner][_virtualLength[owner]] = tokenId;
    }
    tokenOwner[tokenId] = owner;
    _tokenIndexInOwnerArray[tokenId] = _virtualLength[owner];
    _virtualLength[owner]++;
  }

  //////////////
  // Convenience
  //////////////

  function getAllTokens(address owner) public constant returns (uint[]) {
    uint size = _virtualLength[owner];
    uint[] memory result = new uint[](size);
    for (uint i = 0; i < size; i++) {
      result[i] = ownedTokens[owner][i];
    }
    return result;
  }
}
