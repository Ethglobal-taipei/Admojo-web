// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console2} from "forge-std/Test.sol";
import {PerformanceOracle} from "../src/PerformanceOracle.sol";

contract PerformanceOracleTest is Test {
    PerformanceOracle public oracle;
    address public admin;
    address public user;
    uint256 public constant DEVICE_ID = 1;
    uint256 public constant TIMESTAMP = 1000;
    uint256 public constant VIEWS = 100;
    uint256 public constant TAPS = 50;

    function setUp() public {
        admin = address(this);
        user = makeAddr("user");
        oracle = new PerformanceOracle();
    }

    function test_InitialState() public {
        assertEq(oracle.admin(), admin);
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

    function test_GetAggregatedMetrics() public {
        // Update metrics for multiple timestamps
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

    function test_GetAggregatedMetricsEmptyRange() public {
        (uint totalViews, uint totalTaps) = oracle.getAggregatedMetrics(
            DEVICE_ID,
            TIMESTAMP,
            TIMESTAMP - 1
        );
        
        assertEq(totalViews, 0);
        assertEq(totalTaps, 0);
    }

    function test_GetMetricsNonExistent() public {
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