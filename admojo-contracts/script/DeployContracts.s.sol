// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {BoothRegistery} from "../src/BoothRegistery.sol";
import {PerformanceOracle} from "../src/PerformanceOracle.sol";

contract DeployContracts is Script {
    function run() external {
        // Setup deployer
        vm.startBroadcast();

    
        // Deploy Oracle
       BoothRegistery boothRegistry = new BoothRegistery();
        // Set references


        PerformanceOracle performanceOracle = new PerformanceOracle();
       

        vm.stopBroadcast();

        console.log("Deployment Complete:"); 

        console.log("BoothRegistry:", address(boothRegistry));
        console.log("PerformanceOracle:", address(performanceOracle));
        
    }
}