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
    event BatchMetricsUpdated(uint timestamp, uint[] deviceIds, uint[] views, uint[] taps);
    event BatchViewsUpdated(uint timestamp, uint[] deviceIds, uint[] views);
    event BatchTapsUpdated(uint timestamp, uint[] deviceIds, uint[] taps);

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
    // NEW: updateMetricsWithSig - verifies device firmware + signature
    // =====================================================================
    function updateBatchMetrics(
        uint _timestamp,
        uint[] calldata _deviceIds,
        uint[] calldata _views,
        uint[] calldata _taps
    ) external onlyAdmin {
        require(
            _deviceIds.length == _views.length && 
            _views.length == _taps.length,
            "Arrays must have same length"
        );

        for (uint i = 0; i < _deviceIds.length; i++) {
            metrics[_deviceIds[i]][_timestamp] = Metric(_views[i], _taps[i]);
        }

        emit BatchMetricsUpdated(_timestamp, _deviceIds, _views, _taps);
    }

    // =====================================================================
    // NEW: updateBatchMetricsWithSig - verifies device firmware + signature
    // =====================================================================
    function updateBatchMetricsWithSig(
        uint _timestamp,
        uint[] calldata _deviceIds,
        uint[] calldata _views,
        uint[] calldata _taps,
        bytes32[] calldata _firmwareHashes,
        bytes[] calldata _signatures
    ) external {
        require(
            _deviceIds.length == _views.length && 
            _views.length == _taps.length &&
            _taps.length == _firmwareHashes.length &&
            _firmwareHashes.length == _signatures.length,
            "Arrays must have same length"
        );

        for (uint i = 0; i < _deviceIds.length; i++) {
            uint deviceId = _deviceIds[i];
            
            // 1) Check that the provided firmware hash matches what's on file
            require(
                _firmwareHashes[i] == deviceFwHash[deviceId],
                "Firmware hash mismatch"
            );

            // 2) Create the message that was signed
            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    deviceId,
                    _timestamp,
                    _views[i],
                    _taps[i],
                    _firmwareHashes[i]
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
            address recovered = _recoverSigner(ethSignedMsg, _signatures[i]);

            // 5) Check that it matches the device's authorized signer
            require(
                recovered == deviceSigner[deviceId],
                "Signature not from device signer"
            );

            // 6) If all checks pass, store the metrics
            metrics[deviceId][_timestamp] = Metric(_views[i], _taps[i]);
        }

        emit BatchMetricsUpdated(_timestamp, _deviceIds, _views, _taps);
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
    // =====================================================================

    // We'll keep your getMetrics as is:
    function getMetrics(
        uint _deviceId,
        uint _timestamp
    ) external view returns (uint views, uint taps) {
        Metric memory metric = metrics[_deviceId][_timestamp];
        return (metric.views, metric.taps);
    }


    // =====================================================================
    // NEW: Batch update views for multiple devices
    // =====================================================================
    function updateBatchViews(
        uint _timestamp,
        uint[] calldata _deviceIds,
        uint[] calldata _views
    ) external onlyAdmin {
        require(
            _deviceIds.length == _views.length,
            "Arrays must have same length"
        );

        for (uint i = 0; i < _deviceIds.length; i++) {
            uint deviceId = _deviceIds[i];
            uint viewCount = _views[i];
            metrics[deviceId][_timestamp].views = viewCount;
        }

        emit BatchViewsUpdated(_timestamp, _deviceIds, _views);
    }


    // =====================================================================
    // NEW: Batch update taps for multiple devices
    // =====================================================================
    function updateBatchTaps(
        uint _timestamp,
        uint[] calldata _deviceIds,
        uint[] calldata _taps
    ) external onlyAdmin {
        require(
            _deviceIds.length == _taps.length,
            "Arrays must have same length"
        );

        for (uint i = 0; i < _deviceIds.length; i++) {
            uint deviceId = _deviceIds[i];
            uint tapCount = _taps[i];
            metrics[deviceId][_timestamp].taps = tapCount;
        }

        emit BatchTapsUpdated(_timestamp, _deviceIds, _taps);
    }
}