// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EmergencyAccess {

    struct Patient {
        bool registered;
        bool emergencyAccessEnabled;
        bytes32 emergencyDEK;
        address surrogateContact;
        string[] allowedEmergencyTypes;
        string[] allowedRoles;
    }

    struct Doctor {
        bool registered;
        string role;
        address attestingHospital;
    }

    struct Hospital {
        bool verified;
        string name;
    }

    struct AccessLog {
        address doctor;
        address patient;
        string emergencyType;
        uint256 timestamp;
        uint256 expiresAt;
        bool justificationSubmitted;
        bool flaggedForEthicsReview;
    }

    address public immutable admin;
    mapping(address => Patient)   public patients;
    mapping(address => Doctor)    public doctors;
    mapping(address => Hospital)  public hospitals;
    mapping(uint256 => AccessLog) public accessLogs;
    uint256 public logCount;

    uint256 public constant ACCESS_DURATION      = 4 hours;
    uint256 public constant JUSTIFICATION_WINDOW = 24 hours;

    event HospitalRegistered(address indexed hospitalAddr, string name);
    event DoctorAttested(address indexed doctor, address indexed hospital, string role);
    event PatientRegistered(address indexed patient);
    event EmergencyAccessGranted(address indexed doctor, address indexed patient, string emergencyType, uint256 logIndex, uint256 expiresAt);
    event EmergencyAccessDenied(address indexed requester, address indexed patient, string reason, uint256 timestamp);
    event JustificationSubmitted(uint256 indexed logIndex, address indexed doctor);
    event EthicsReviewTriggered(uint256 indexed logIndex, address indexed patient);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function registerHospital(address hospitalAddr, string calldata name) external onlyAdmin {
        require(hospitalAddr != address(0), "Hospital address cannot be zero");
        require(!hospitals[hospitalAddr].verified, "Hospital already registered");
        hospitals[hospitalAddr] = Hospital({ verified: true, name: name });
        emit HospitalRegistered(hospitalAddr, name);
    }

    function attestDoctor(address doctor, string calldata role) external {
        require(hospitals[msg.sender].verified, "Not a verified hospital");
        require(doctor != address(0), "Doctor address cannot be zero");
        require(bytes(role).length > 0, "Role cannot be empty");
        doctors[doctor] = Doctor({ registered: true, role: role, attestingHospital: msg.sender });
        emit DoctorAttested(doctor, msg.sender, role);
    }

    function registerPatient(
        bytes32 emergencyDEK,
        address surrogate,
        string[] calldata allowedTypes,
        string[] calldata allowedRoles
    ) external {
        require(!patients[msg.sender].registered, "Patient already registered");
        require(emergencyDEK != bytes32(0), "Emergency DEK cannot be empty");
        require(allowedTypes.length > 0, "Must allow at least one emergency type");
        require(allowedRoles.length > 0, "Must allow at least one role");
        patients[msg.sender] = Patient({
            registered:             true,
            emergencyAccessEnabled: true,
            emergencyDEK:           emergencyDEK,
            surrogateContact:       surrogate,
            allowedEmergencyTypes:  allowedTypes,
            allowedRoles:           allowedRoles
        });
        emit PatientRegistered(msg.sender);
    }

    function requestEmergencyAccess(
        address patient,
        string calldata emergencyType
    ) external returns (bool accessGranted, uint256 logIndex, uint256 expiresAt) {
        require(patient != address(0), "Patient address cannot be zero");

        Patient storage p = patients[patient];
        Doctor  storage d = doctors[msg.sender];

        if (!d.registered || !hospitals[d.attestingHospital].verified) {
            emit EmergencyAccessDenied(msg.sender, patient, "ABAC-1: Not attested by verified hospital", block.timestamp);
            revert("ABAC-1 FAIL: Requester not attested by verified hospital");
        }

        if (!_stringInList(p.allowedRoles, d.role)) {
            emit EmergencyAccessDenied(msg.sender, patient, "ABAC-2: Role not in patient allowed list", block.timestamp);
            revert("ABAC-2 FAIL: Requester role not authorized for this patient");
        }

        if (!p.registered || !p.emergencyAccessEnabled) {
            emit EmergencyAccessDenied(msg.sender, patient, "ABAC-3: Patient not enrolled or disabled", block.timestamp);
            revert("ABAC-3 FAIL: Patient has not pre-approved emergency access");
        }

        if (!_stringInList(p.allowedEmergencyTypes, emergencyType)) {
            emit EmergencyAccessDenied(msg.sender, patient, "ABAC-4: Emergency type not pre-approved", block.timestamp);
            revert("ABAC-4 FAIL: Emergency type not in patient's allowed list");
        }

        if (!_checkRoleTypeCompatibility(d.role, emergencyType)) {
            emit EmergencyAccessDenied(msg.sender, patient, "ABAC-5: Role incompatible with emergency type", block.timestamp);
            revert("ABAC-5 FAIL: Role not authorized for this emergency type");
        }

        uint256 _expiresAt = block.timestamp + ACCESS_DURATION;
        uint256 _logIndex  = logCount;
        accessLogs[_logIndex] = AccessLog({
            doctor:                 msg.sender,
            patient:                patient,
            emergencyType:          emergencyType,
            timestamp:              block.timestamp,
            expiresAt:              _expiresAt,
            justificationSubmitted: false,
            flaggedForEthicsReview: false
        });
        logCount++;

        emit EmergencyAccessGranted(msg.sender, patient, emergencyType, _logIndex, _expiresAt);
        return (true, _logIndex, _expiresAt);
    }

    function submitJustification(uint256 logIndex) external {
        require(logIndex < logCount, "Log index out of bounds");
        AccessLog storage log = accessLogs[logIndex];
        require(log.doctor == msg.sender, "Only the accessing doctor can justify");
        require(!log.justificationSubmitted, "Justification already submitted");
        log.justificationSubmitted = true;
        emit JustificationSubmitted(logIndex, msg.sender);
    }

    function triggerEthicsReview(uint256 logIndex) external {
        require(logIndex < logCount, "Log index out of bounds");
        AccessLog storage log = accessLogs[logIndex];
        address patient = log.patient;
        bool authorized = (msg.sender == admin) || (msg.sender == patients[patient].surrogateContact);
        require(authorized, "Not authorized to trigger ethics review");
        require(!log.flaggedForEthicsReview, "Already flagged for review");
        log.flaggedForEthicsReview = true;
        emit EthicsReviewTriggered(logIndex, patient);
    }

    function disableEmergencyAccess() external {
        require(patients[msg.sender].registered, "Not a registered patient");
        patients[msg.sender].emergencyAccessEnabled = false;
    }

    function getAccessLog(uint256 i) external view returns (AccessLog memory) {
        require(i < logCount, "Log index out of bounds");
        return accessLogs[i];
    }

    function getLogCount() external view returns (uint256) {
        return logCount;
    }

    function _checkRoleTypeCompatibility(string memory role, string memory emergencyType) internal pure returns (bool) {
        bytes32 r = keccak256(bytes(role));
        bytes32 t = keccak256(bytes(emergencyType));
        if (r == keccak256(bytes("ER_DOCTOR")))
            return t == keccak256(bytes("cardiac")) || t == keccak256(bytes("accident")) || t == keccak256(bytes("diabetic")) || t == keccak256(bytes("overdose"));
        if (r == keccak256(bytes("PARAMEDIC")))
            return t == keccak256(bytes("accident")) || t == keccak256(bytes("overdose"));
        if (r == keccak256(bytes("CARDIOLOGIST")))
            return t == keccak256(bytes("cardiac"));
        return false;
    }

    function _stringInList(string[] storage list, string memory target) internal view returns (bool) {
        bytes32 h = keccak256(bytes(target));
        for (uint256 i = 0; i < list.length; i++) {
            if (keccak256(bytes(list[i])) == h) return true;
        }
        return false;
    }
}
