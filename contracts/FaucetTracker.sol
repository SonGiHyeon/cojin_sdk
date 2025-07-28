// FaucetTracker.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FaucetTracker {
    address public owner;

    /// @notice 사용자별 어드민 수령 여부
    mapping(address => bool) public isAdminReceive;

    /// @notice 사용자별 유저 수령 여부
    mapping(address => bool) public isReceive;

    /// ✅ 사용자별 체인별 마지막 수령 시간
    mapping(address => mapping(string => uint256)) public lastReceivedAt;

    uint256 public cooldown = 1 days;
    bool public testingMode = false;

    modifier onlyOwner() {
        require(msg.sender == owner, "ONLY_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice 유저가 어드민으로부터 받은 경우 기록
    function setAdminReceived(
        address user,
        string calldata chain
    ) external onlyOwner {
        isAdminReceive[user] = true;
        lastReceivedAt[user][chain] = block.timestamp;
    }

    /// @notice 유저가 faucet에서 받은 경우 기록
    function setUserReceived(
        address user,
        string calldata chain
    ) external onlyOwner {
        isReceive[user] = true;
        lastReceivedAt[user][chain] = block.timestamp;
    }

    /// @notice 테스트 모드 설정
    function setTestingMode(bool mode) external onlyOwner {
        testingMode = mode;
    }

    /// @notice 쿨다운 시간 설정 (초 단위)
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldown = newCooldown;
    }

    /// @notice 특정 유저가 체인에서 수령 가능한지 확인
    function isEligible(
        address user,
        string calldata chain
    ) public view returns (bool) {
        if (testingMode) return true;

        uint256 last = lastReceivedAt[user][chain];
        return block.timestamp >= last + cooldown;
    }

    /// @notice 마지막 수령 시간 확인
    function getLastReceivedAt(
        address user,
        string calldata chain
    ) external view returns (uint256) {
        return lastReceivedAt[user][chain];
    }

    /// @notice 모든 기록 리셋 (관리자만 가능)
    function reset(address user, string calldata chain) external onlyOwner {
        lastReceivedAt[user][chain] = 0;
        isAdminReceive[user] = false;
        isReceive[user] = false;
    }
}
