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

   
    // =====================================================================
    // Tests for batch update functions
    // =====================================================================
    function test_UpdateBatchMetrics() public {
        uint[] memory deviceIds = new uint[](3);
        uint[] memory views = new uint[](3);
        uint[] memory taps = new uint[](3);

        // Setup test data
        for (uint i = 0; i < 3; i++) {
            deviceIds[i] = i + 1;
            views[i] = VIEWS * (i + 1);
            taps[i] = TAPS * (i + 1);
        }

        // Update metrics in batch
        oracle.updateBatchMetrics(TIMESTAMP, deviceIds, views, taps);

        // Verify each device's metrics
        for (uint i = 0; i < 3; i++) {
            (uint deviceViews, uint deviceTaps) = oracle.getMetrics(deviceIds[i], TIMESTAMP);
            assertEq(deviceViews, views[i]);
            assertEq(deviceTaps, taps[i]);
        }
    }

    function test_UpdateBatchMetricsNonAdmin() public {
        uint[] memory deviceIds = new uint[](1);
        uint[] memory views = new uint[](1);
        uint[] memory taps = new uint[](1);

        deviceIds[0] = DEVICE_ID;
        views[0] = VIEWS;
        taps[0] = TAPS;

        vm.prank(user);
        vm.expectRevert("Only admin can call this function");
        oracle.updateBatchMetrics(TIMESTAMP, deviceIds, views, taps);
    }

    function test_UpdateBatchMetricsWithSig() public {
        uint[] memory deviceIds = new uint[](2);
        uint[] memory views = new uint[](2);
        uint[] memory taps = new uint[](2);
        bytes32[] memory fwHashes = new bytes32[](2);
        bytes[] memory signatures = new bytes[](2);

        // Setup test data
        for (uint i = 0; i < 2; i++) {
            deviceIds[i] = i + 1;
            views[i] = VIEWS * (i + 1);
            taps[i] = TAPS * (i + 1);
            fwHashes[i] = FW_HASH;

            // Set up device authentication
            oracle.setDeviceAuth(deviceIds[i], deviceSigner, FW_HASH);

            // Create and sign message
            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    deviceIds[i],
                    TIMESTAMP,
                    views[i],
                    taps[i],
                    fwHashes[i]
                )
            );
            bytes32 ethSignedMsg = keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    messageHash
                )
            );
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEVICE_SIGNER_PRIVATE_KEY, ethSignedMsg);
            signatures[i] = abi.encodePacked(r, s, v);
        }

        // Update metrics in batch with signatures
        oracle.updateBatchMetricsWithSig(
            TIMESTAMP,
            deviceIds,
            views,
            taps,
            fwHashes,
            signatures
        );

        // Verify each device's metrics
        for (uint i = 0; i < 2; i++) {
            (uint deviceViews, uint deviceTaps) = oracle.getMetrics(deviceIds[i], TIMESTAMP);
            assertEq(deviceViews, views[i]);
            assertEq(deviceTaps, taps[i]);
        }
    }

    function test_UpdateBatchMetricsWithSigInvalidFirmware() public {
        uint[] memory deviceIds = new uint[](1);
        uint[] memory views = new uint[](1);
        uint[] memory taps = new uint[](1);
        bytes32[] memory fwHashes = new bytes32[](1);
        bytes[] memory signatures = new bytes[](1);

        deviceIds[0] = DEVICE_ID;
        views[0] = VIEWS;
        taps[0] = TAPS;
        fwHashes[0] = keccak256("invalid-firmware");

        // Set up device authentication with different firmware hash
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);

        // Create and sign message
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                DEVICE_ID,
                TIMESTAMP,
                VIEWS,
                TAPS,
                fwHashes[0]
            )
        );
        bytes32 ethSignedMsg = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEVICE_SIGNER_PRIVATE_KEY, ethSignedMsg);
        signatures[0] = abi.encodePacked(r, s, v);

        vm.expectRevert("Firmware hash mismatch");
        oracle.updateBatchMetricsWithSig(
            TIMESTAMP,
            deviceIds,
            views,
            taps,
            fwHashes,
            signatures
        );
    }

    function test_UpdateBatchMetricsWithSigInvalidSigner() public {
        uint[] memory deviceIds = new uint[](1);
        uint[] memory views = new uint[](1);
        uint[] memory taps = new uint[](1);
        bytes32[] memory fwHashes = new bytes32[](1);
        bytes[] memory signatures = new bytes[](1);

        deviceIds[0] = DEVICE_ID;
        views[0] = VIEWS;
        taps[0] = TAPS;
        fwHashes[0] = FW_HASH;

        // Set up device authentication
        oracle.setDeviceAuth(DEVICE_ID, deviceSigner, FW_HASH);

        // Create and sign message with different private key
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
        signatures[0] = abi.encodePacked(r, s, v);

        vm.expectRevert("Signature not from device signer");
        oracle.updateBatchMetricsWithSig(
            TIMESTAMP,
            deviceIds,
            views,
            taps,
            fwHashes,
            signatures
        );
    }


    function test_UpdateBatchMetricsInvalidLength() public {
        uint[] memory deviceIds = new uint[](2);
        uint[] memory views = new uint[](1);
        uint[] memory taps = new uint[](2);

        deviceIds[0] = 1;
        deviceIds[1] = 2;
        views[0] = VIEWS;
        taps[0] = TAPS;
        taps[1] = TAPS * 2;

        vm.expectRevert("Arrays must have same length");
        oracle.updateBatchMetrics(TIMESTAMP, deviceIds, views, taps);
    }

    function test_UpdateBatchMetricsWithSigInvalidLength() public {
        uint[] memory deviceIds = new uint[](2);
        uint[] memory views = new uint[](2);
        uint[] memory taps = new uint[](2);
        bytes32[] memory fwHashes = new bytes32[](1);
        bytes[] memory signatures = new bytes[](2);

        vm.expectRevert("Arrays must have same length");
        oracle.updateBatchMetricsWithSig(
            TIMESTAMP,
            deviceIds,
            views,
            taps,
            fwHashes,
            signatures
        );
    }

    function test_UpdateBatchViews() public {
        uint[] memory deviceIds = new uint[](3);
        uint[] memory views = new uint[](3);

        // Setup test data
        for (uint i = 0; i < 3; i++) {
            deviceIds[i] = i + 1;
            views[i] = VIEWS * (i + 1);
        }

        // Update views in batch
        oracle.updateBatchViews(TIMESTAMP, deviceIds, views);

        // Verify each device's metrics
        for (uint i = 0; i < 3; i++) {
            (uint deviceViews, uint deviceTaps) = oracle.getMetrics(deviceIds[i], TIMESTAMP);
            assertEq(deviceViews, views[i]);
            assertEq(deviceTaps, 0); // Taps should be 0
        }
    }

    function test_UpdateBatchTaps() public {
        uint[] memory deviceIds = new uint[](3);
        uint[] memory taps = new uint[](3);

        // Setup test data
        for (uint i = 0; i < 3; i++) {
            deviceIds[i] = i + 1;
            taps[i] = TAPS * (i + 1);
        }

        // Update taps in batch
        oracle.updateBatchTaps(TIMESTAMP, deviceIds, taps);

        // Verify each device's metrics
        for (uint i = 0; i < 3; i++) {
            (uint deviceViews, uint deviceTaps) = oracle.getMetrics(deviceIds[i], TIMESTAMP);
            assertEq(deviceViews, 0); // Views should be 0
            assertEq(deviceTaps, taps[i]);
        }
    }

    function test_UpdateBatchViewsNonAdmin() public {
        uint[] memory deviceIds = new uint[](1);
        uint[] memory views = new uint[](1);

        deviceIds[0] = DEVICE_ID;
        views[0] = VIEWS;

        vm.prank(user);
        vm.expectRevert("Only admin can call this function");
        oracle.updateBatchViews(TIMESTAMP, deviceIds, views);
    }

    function test_UpdateBatchTapsNonAdmin() public {
        uint[] memory deviceIds = new uint[](1);
        uint[] memory taps = new uint[](1);

        deviceIds[0] = DEVICE_ID;
        taps[0] = TAPS;

        vm.prank(user);
        vm.expectRevert("Only admin can call this function");
        oracle.updateBatchTaps(TIMESTAMP, deviceIds, taps);
    }

    function test_UpdateBatchViewsInvalidLength() public {
        uint[] memory deviceIds = new uint[](2);
        uint[] memory views = new uint[](1);

        deviceIds[0] = 1;
        deviceIds[1] = 2;
        views[0] = VIEWS;

        vm.expectRevert("Arrays must have same length");
        oracle.updateBatchViews(TIMESTAMP, deviceIds, views);
    }

    function test_UpdateBatchTapsInvalidLength() public {
        uint[] memory deviceIds = new uint[](2);
        uint[] memory taps = new uint[](1);

        deviceIds[0] = 1;
        deviceIds[1] = 2;
        taps[0] = TAPS;

        vm.expectRevert("Arrays must have same length");
        oracle.updateBatchTaps(TIMESTAMP, deviceIds, taps);
    }
} 