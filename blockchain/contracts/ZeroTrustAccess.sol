// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ZeroTrustAccess
 * @dev Smart contract-based access control for VNC sessions
 */
contract ZeroTrustAccess is Ownable, ReentrancyGuard {
    
    struct AccessToken {
        address userAddress;
        uint256 permissions;
        uint256 dataLimit;
        uint256 timeLimit;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        uint256 dataUsed;
    }
    
    mapping(uint256 => AccessToken) public accessTokens;
    mapping(address => uint256[]) public userTokens;
    mapping(address => bool) public authorizedValidators;
    
    uint256 public tokenCounter;
    
    // Permission flags
    uint256 public constant VIEW_ONLY = 0x1;
    uint256 public constant CLIPBOARD_ACCESS = 0x2;
    uint256 public constant FILE_TRANSFER = 0x4;
    uint256 public constant REMOTE_CONTROL = 0x8;
    uint256 public constant ADMIN_ACCESS = 0x10;
    
    event AccessGranted(
        uint256 indexed tokenId,
        address indexed userAddress,
        uint256 permissions
    );
    
    event AccessRevoked(
        uint256 indexed tokenId,
        string reason
    );
    
    modifier onlyValidator() {
        require(authorizedValidators[msg.sender] || msg.sender == owner(), "Unauthorized");
        _;
    }
    
    constructor() {
        authorizedValidators[msg.sender] = true;
    }
    
    /**
     * @dev Grant access with specific permissions
     */
    function grantAccess(
        address _userAddress,
        uint256 _permissions,
        uint256 _dataLimit,
        uint256 _timeLimit,
        string[] memory _allowedIPs
    ) external onlyValidator returns (uint256) {
        require(_userAddress != address(0), "Invalid address");
        
        uint256 tokenId = ++tokenCounter;
        
        accessTokens[tokenId] = AccessToken({
            userAddress: _userAddress,
            permissions: _permissions,
            dataLimit: _dataLimit,
            timeLimit: _timeLimit,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + _timeLimit,
            isActive: true,
            dataUsed: 0
        });
        
        userTokens[_userAddress].push(tokenId);
        
        emit AccessGranted(tokenId, _userAddress, _permissions);
        
        return tokenId;
    }
    
    /**
     * @dev Validate session access
     */
    function validateSessionAccess(
        uint256 _tokenId,
        bytes memory _sessionData
    ) external view returns (bool) {
        AccessToken memory token = accessTokens[_tokenId];
        
        return token.isActive && token.expiresAt > block.timestamp;
    }
    
    /**
     * @dev Record data usage
     */
    function recordDataUsage(
        uint256 _tokenId,
        uint256 _dataUsed
    ) external onlyValidator {
        AccessToken storage token = accessTokens[_tokenId];
        
        token.dataUsed += _dataUsed;
        
        if (token.dataUsed > token.dataLimit) {
            token.isActive = false;
            emit AccessRevoked(_tokenId, "Data limit exceeded");
        }
    }
    
    /**
     * @dev Report violation
     */
    function reportViolation(
        uint256 _tokenId,
        string memory _violationType
    ) external onlyValidator {
        accessTokens[_tokenId].isActive = false;
        emit AccessRevoked(_tokenId, _violationType);
    }
    
    /**
     * @dev Revoke access
     */
    function revokeAccess(uint256 _tokenId) external onlyValidator {
        accessTokens[_tokenId].isActive = false;
        emit AccessRevoked(_tokenId, "Manual revocation");
    }
}