// contracts/CJNToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CJNToken is ERC20, Ownable {
    constructor(
        uint256 initialSupply
    )
        ERC20("Cojin Token", "CJN")
        Ownable(msg.sender) // ✅ 이 줄 추가
    {
        _mint(msg.sender, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
