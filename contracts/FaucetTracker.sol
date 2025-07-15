// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FaucetTracker {
    struct FaucetInfo {
        bool isReceive;
        bool isAdminReceive;
        uint256 lastReceivedAt;
    }

    mapping(address => FaucetInfo) public records;
    address public owner;

    // ✅ 테스트 모드 플래그
    bool public testingMode = false;

    // ✅ 쿨다운 시간 (기본: 1일)
    uint256 public cooldown = 1 days;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ✅ 테스트 모드 ON/OFF (only owner)
    function setTestingMode(bool mode) external onlyOwner {
        testingMode = mode;
    }

    // ✅ 쿨다운 시간 조절 (테스트시 60초 등으로 설정 가능)
    function setCooldown(uint256 newCooldown) external onlyOwner {
        cooldown = newCooldown;
    }

    function markReceived(address user, bool isAdmin) external onlyOwner {
        FaucetInfo storage info = records[user];
        if (isAdmin) {
            info.isAdminReceive = true;
        } else {
            info.isReceive = true;
        }
        info.lastReceivedAt = block.timestamp;
    }

    function getFaucetInfo(
        address user
    ) external view returns (FaucetInfo memory) {
        return records[user];
    }

    function resetAll(address user) external onlyOwner {
        delete records[user];
    }

    function setUserReceived(address user) external onlyOwner {
        records[user].isReceive = true;
        records[user].lastReceivedAt = block.timestamp;
    }

    function setAdminReceived(address user) external onlyOwner {
        records[user].isAdminReceive = true;
        records[user].lastReceivedAt = block.timestamp;
    }

    function reset(address user) external onlyOwner {
        delete records[user];
    }

    function getStatus(address user) external view returns (bool, bool) {
        FaucetInfo memory info = records[user];
        return (info.isAdminReceive, info.isReceive);
    }

    function updateLastReceive(address user) external onlyOwner {
        records[user].lastReceivedAt = block.timestamp;
    }

    function isEligible(address user) public view returns (bool) {
        require(user != address(0), "Zero address not allowed");

        if (testingMode) {
            return true; // ✅ 테스트 모드에서는 무조건 통과
        }

        require(
            records[user].lastReceivedAt + cooldown <= block.timestamp,
            "Too soon to request again"
        );
        return true;
    }
}
