// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PerformanceOracle {
    // Same Metric struct
    struct Metric {
        uint views; // Number of views
        uint taps; // Number of taps
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

    // ============================================================
    // NEW: Store (deviceId => signerAddress) and (deviceId => firmwareHash)
    // ============================================================
    mapping(uint => address) public deviceSigner; // deviceID => authorized signer address
    mapping(uint => bytes32) public deviceFwHash; // deviceID => approved firmware hash

    constructor() {
        admin = msg.sender;
    }

    // =====================================================================
    // Admin can set device's authorized signer and firmware hash
    // =====================================================================
    function setDeviceAuth(
        uint _deviceId,
        address _signer,
        bytes32 _fwHash
    ) external onlyAdmin {
        deviceSigner[_deviceId] = _signer;
        deviceFwHash[_deviceId] = _fwHash;
    }

    // =====================================================================
    // Original updateMetrics (unchanged, if you want to keep it)
    // =====================================================================
    function updateMetrics(
        uint _deviceId,
        uint _timestamp,
        uint _views,
        uint _taps
    ) external onlyAdmin {
        metrics[_deviceId][_timestamp] = Metric(_views, _taps);
        emit MetricsUpdated(_deviceId, _timestamp, _views, _taps);
    }

    // =====================================================================
    // NEW: updateMetricsWithSig - verifies device firmware + signature
    // =====================================================================
    function updateMetricsWithSig(
        uint _deviceId,
        uint _timestamp,
        uint _views,
        uint _taps,
        bytes32 _firmwareHash,
        bytes memory _signature
    ) external {
        // 1) Check that the provided firmware hash matches what's on file
        require(
            _firmwareHash == deviceFwHash[_deviceId],
            "Firmware hash mismatch"
        );

        // 2) Create the message that was signed
        // The message should include all the parameters that need to be verified
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                _deviceId,
                _timestamp,
                _views,
                _taps,
                _firmwareHash
            )
        );

        // 3) Create the EIP-191 signed message hash
        bytes32 ethSignedMsg = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                messageHash
            )
        );

        // 4) Recover the signer address from the signature
        address recovered = _recoverSigner(ethSignedMsg, _signature);

        // 5) Check that it matches the device's authorized signer
        require(
            recovered == deviceSigner[_deviceId],
            "Signature not from device signer"
        );

        // 6) If all checks pass, store the metrics
        metrics[_deviceId][_timestamp] = Metric(_views, _taps);
        emit MetricsUpdated(_deviceId, _timestamp, _views, _taps);
    }

    // =====================================================================
    // ecrecover helper for raw 65-byte ECDSA (r, s, v)
    // =====================================================================
    function _recoverSigner(
        bytes32 _ethSignedMsg,
        bytes memory _sig
    ) internal pure returns (address) {
        require(_sig.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        // Signature layout: [0..31] r, [32..63] s, [64] v
        assembly {
            r := mload(add(_sig, 32))
            s := mload(add(_sig, 64))
            v := byte(0, mload(add(_sig, 96)))
        }
        // Ethereum historically expects v in {27, 28}
        if (v < 27) {
            v += 27;
        }
        return ecrecover(_ethSignedMsg, v, r, s);
    }

    // =====================================================================
    // Additional getters, etc., from your original contract remain unchanged
    // ...
    // =====================================================================

    // We'll keep your getMetrics and getAggregatedMetrics as is, if you want:
    function getMetrics(
        uint _deviceId,
        uint _timestamp
    ) external view returns (uint views, uint taps) {
        Metric memory metric = metrics[_deviceId][_timestamp];
        return (metric.views, metric.taps);
    }

    function updateViews(
        uint _deviceId,
        uint _timestamp,
        uint _views
    ) external onlyAdmin {
        Metric memory existing = metrics[_deviceId][_timestamp];
        existing.views = _views;
        metrics[_deviceId][_timestamp] = existing;
        emit MetricsUpdated(
            _deviceId,
            _timestamp,
            existing.views,
            existing.taps
        );
    }

    function updateTaps(
        uint _deviceId,
        uint _timestamp,
        uint _taps
    ) external onlyAdmin {
        Metric memory existing = metrics[_deviceId][_timestamp];
        existing.taps = _taps;
        metrics[_deviceId][_timestamp] = existing;
        emit MetricsUpdated(
            _deviceId,
            _timestamp,
            existing.views,
            existing.taps
        );
    }
}