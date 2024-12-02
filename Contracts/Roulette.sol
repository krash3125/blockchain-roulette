// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Roulette {
    address public owner;
    uint256 public entryFee;

    address[] public players;
    mapping(address => bool) public playersMapping;

    constructor(uint256 _entryFee) {
        require(_entryFee > 0, "Entry fee must be greater than 0");
        owner = msg.sender;
        entryFee = _entryFee;
    }

    function joinRoulette() public payable {
        require(!playersMapping[msg.sender], "User already joined");
        require(msg.value >= entryFee, "Insufficient funds");

        playersMapping[msg.sender] = true;
        players.push(msg.sender);
    }
}
