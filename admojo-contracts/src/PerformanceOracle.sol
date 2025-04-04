// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PerformanceOracle {
    // Struct to store performance metrics
    struct Metric {
        uint views;  // Number of views
        uint taps;   // Number of taps
    }

    // Mapping: deviceId => timestamp => Metric
    mapping(uint => mapping(uint => Metric)) public metrics;
    // Admin address (backend) for updating metrics
    address public admin;

    // Event for tracking metric updates
    event MetricsUpdated(uint deviceId, uint timestamp, uint views, uint taps);

    // Modifier to restrict access to admin (backend)
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    // Constructor sets the deployer as the admin
    constructor() {
        admin = msg.sender;
    }

    // Update metrics for a booth (called by backend every minute)
    function updateMetrics(
        uint _deviceId,
        uint _timestamp,
        uint _views,
        uint _taps
    ) external onlyAdmin {
        metrics[_deviceId][_timestamp] = Metric(_views, _taps);
        emit MetricsUpdated(_deviceId, _timestamp, _views, _taps);
    }

    // Get metrics for a specific booth and timestamp
    function getMetrics(uint _deviceId, uint _timestamp) external view returns (uint views, uint taps) {
        Metric memory metric = metrics[_deviceId][_timestamp];
        return (metric.views, metric.taps);
    }

    // Get aggregated metrics for a booth over a time period (e.g., daily report)
    function getAggregatedMetrics(
        uint _boothId,
        uint _startTime,
        uint _endTime
    ) external view returns (uint totalViews, uint totalTaps) {
        for (uint t = _startTime; t <= _endTime; t++) {
            Metric memory metric = metrics[_boothId][t];
            totalViews += metric.views;
            totalTaps += metric.taps;
        }
        return (totalViews, totalTaps);
    }
}