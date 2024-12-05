// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

event UpdatePlayers();

contract Roulette {
    address public owner;
    uint256 public entryFee;

    address[] public players;
    mapping(address => bool) public playersMapping;

    uint256 private randCount = 0;

    constructor(uint256 _entryFee) {
        require(_entryFee > 0, "Entry fee must be greater than 0");
        owner = msg.sender;
        entryFee = _entryFee;
    }

    function joinRoulette() public payable {
        require(!playersMapping[msg.sender], "User already joined");
        require(msg.value == entryFee, "Incorrect entry fee");

        playersMapping[msg.sender] = true;
        players.push(msg.sender);

        emit UpdatePlayers();
    }

    function beginRoulette() public payable {
        require(msg.sender == owner, "Not owner");
        require(players.length > 1, "Not enough players in roulette");

        address randAddress = randomPlayer();

        payable(randAddress).transfer(address(this).balance);

        // reset roulette
        for (uint256 i = 0; i < players.length; i++) {
            playersMapping[players[i]] = false;
        }

        delete players;

        emit UpdatePlayers();
    }

    function randomPlayer() private returns (address) {
        require(players.length > 0, "Players must exist in array");
        randCount++;
        uint256 index = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, randCount))
        ) % (players.length);
        return players[index];
    }

    function clearRoulette() public {
        require(msg.sender == owner, "Not owner");
        require(players.length != 0, "No players");

        for (uint256 i = 0; i < players.length; i++) {
            playersMapping[players[i]] = false;
            payable(players[i]).transfer(entryFee);
        }

        delete players;
    }

    function playersCount() public view returns (uint256) {
        return players.length;
    }

    // function pooledAmount() public view returns (uint256) {
    //     return address(this).balance;
    // }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }
}
