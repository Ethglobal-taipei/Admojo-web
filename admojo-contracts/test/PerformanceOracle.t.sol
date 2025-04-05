// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console2} from "forge-std/Test.sol";
import {PerformanceOracle} from "../src/PerformanceOracle.sol";

contract PerformanceOracleTest is Test {
    PerformanceOracle public oracle;
    address public admin;
    address public user;
    address public deviceSigner;
    uint256 public constant DEVICE_ID = 1;
    uint256 public constant TIMESTAMP = 1000;
    uint256 public constant VIEWS = 100;
    uint256 public constant TAPS = 50;
    bytes32 public constant FW_HASH = keccak256("test-firmware");

    // Private key for deviceSigner
    uint256 private constant DEVICE_SIGNER_PRIVATE_KEY = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

    function setUp() public {
        admin = address(this);
        user = makeAddr("user");
        deviceSigner = vm.addr(DEVICE_SIGNER_PRIVATE_KEY);
        oracle = new PerformanceOracle();
    }

    function test_InitialState() public view {
        assertEq(oracle.admin(), admin);
    }

    function test_SetDeviceAuth() public {
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);
        assertEq(oracle.deviceSigner(DEVICE_ID), deviceSigner);
        assertEq(oracle.deviceFwHash(DEVICE_ID), FW_HASH);
    }

    function test_SetDeviceAuthNonAdmin() public {
        vm.prank(user);
        vm.expectRevert("Only admin can call this function");
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);
    }

    function test_UpdateMetrics() public {
        oracle.updateMetrics(DEVICE_ID, TIMESTAMP, VIEWS, TAPS);
        
        (uint views, uint taps) = oracle.getMetrics(DEVICE_ID, TIMESTAMP);
        assertEq(views, VIEWS);
        assertEq(taps, TAPS);
    }

    function test_UpdateMetricsNonAdmin() public {
        vm.prank(user);
        vm.expectRevert("Only admin can call this function");
        oracle.updateMetrics(DEVICE_ID, TIMESTAMP, VIEWS, TAPS);
    }

    function test_UpdateMetricsWithSig() public {
        // First set up device authentication
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);

        // Create the message that was signed
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                DEVICE_ID,
                TIMESTAMP,
                VIEWS,
                TAPS,
                FW_HASH
            )
        );

        // Create the EIP-191 signed message hash
        bytes32 ethSignedMsg = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );

        // Sign with the device signer's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEVICE_SIGNER_PRIVATE_KEY, ethSignedMsg);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Update metrics with signature
        oracle.updateMetricsWithSig(
            DEVICE_ID,
            TIMESTAMP,
            VIEWS,
            TAPS,
            FW_HASH,
            signature
        );

        // Verify metrics were updated
        (uint views, uint taps) = oracle.getMetrics(DEVICE_ID, TIMESTAMP);
        assertEq(views, VIEWS);
        assertEq(taps, TAPS);
    }

    function test_UpdateMetricsWithSigInvalidFirmware() public {
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);

        bytes32 invalidFwHash = keccak256("invalid-firmware");
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                DEVICE_ID,
                TIMESTAMP,
                VIEWS,
                TAPS,
                invalidFwHash
            )
        );
        bytes32 ethSignedMsg = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEVICE_SIGNER_PRIVATE_KEY, ethSignedMsg);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Firmware hash mismatch");
        oracle.updateMetricsWithSig(
            DEVICE_ID,
            TIMESTAMP,
            VIEWS,
            TAPS,
            invalidFwHash,
            signature
        );
    }

    function test_UpdateMetricsWithSigInvalidSigner() public {
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);

        bytes32 messageHash = keccak256(
            abi.encodePacked(
                DEVICE_ID,
                TIMESTAMP,
                VIEWS,
                TAPS,
                FW_HASH
            )
        );
        bytes32 ethSignedMsg = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );
        // Use a different private key (2) that doesn't correspond to deviceSigner
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(2, ethSignedMsg);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Signature not from device signer");
        oracle.updateMetricsWithSig(
            DEVICE_ID,
            TIMESTAMP,
            VIEWS,
            TAPS,
            FW_HASH,
            signature
        );
    }

    function test_GetAggregatedMetrics() public {
        oracle.updateMetrics(DEVICE_ID, TIMESTAMP, VIEWS, TAPS);
        oracle.updateMetrics(DEVICE_ID, TIMESTAMP + 1, VIEWS * 2, TAPS * 2);
        
        (uint totalViews, uint totalTaps) = oracle.getAggregatedMetrics(
            DEVICE_ID,
            TIMESTAMP,
            TIMESTAMP + 1
        );
        
        assertEq(totalViews, VIEWS * 3);
        assertEq(totalTaps, TAPS * 3);
    }

    function test_GetAggregatedMetricsEmptyRange() public view {
        (uint totalViews, uint totalTaps) = oracle.getAggregatedMetrics(
            DEVICE_ID,
            TIMESTAMP,
            TIMESTAMP - 1
        );
        
        assertEq(totalViews, 0);
        assertEq(totalTaps, 0);
    }

    function test_GetMetricsNonExistent() public view {
        (uint views, uint taps) = oracle.getMetrics(DEVICE_ID, TIMESTAMP);
        assertEq(views, 0);
        assertEq(taps, 0);
    }

    function test_UpdateMetricsOverflow() public {
        uint maxUint = type(uint).max;
        oracle.updateMetrics(DEVICE_ID, TIMESTAMP, maxUint, maxUint);
        
        (uint views, uint taps) = oracle.getMetrics(DEVICE_ID, TIMESTAMP);
        assertEq(views, maxUint);
        assertEq(taps, maxUint);
    }
} 