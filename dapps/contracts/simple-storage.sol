// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleStorage
 * @dev Smart contract untuk menyimpan nilai dengan ownership
 * @notice Contract ini digunakan untuk full stack dApp demo
 */
contract SimpleStorage {
    // State variables
    uint256 private storedValue;
    address public owner;

    // Events
    event OwnerSet(address indexed oldOwner, address indexed newOwner);
    event ValueUpdated(uint256 oldValue, uint256 newValue);

    /**
     * @dev Constructor - set deployer sebagai owner
     * Emit OwnerSet event saat deploy
     */
    constructor() {
        owner = msg.sender;
        emit OwnerSet(address(0), msg.sender);
    }

    /**
     * @dev Modifier untuk restrict access hanya owner
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @dev Set nilai baru ke storage
     * @param _value Nilai baru yang akan disimpan
     * Emit ValueUpdated event
     */
    function setValue(uint256 _value) public {
        uint256 oldValue = storedValue;
        storedValue = _value;
        emit ValueUpdated(oldValue, _value);
    }

    /**
     * @dev Get nilai yang tersimpan
     * @return Nilai yang tersimpan di storage
     */
    function getValue() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Transfer ownership ke address baru
     * @param newOwner Address owner baru
     * Hanya owner yang bisa memanggil function ini
     */
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnerSet(oldOwner, newOwner);
    }
}
