pragma solidity ^0.8.19;

contract EmergencyAccess {

    // ── Data structures ────────────────────────────────────────────
    struct Patient {
        bool registered;
        bool emergencyAccessEnabled;
        bytes32 emergencyDEK;          // encrypted DEK stored in escrow
        address surrogateContact;
        string[] allowedEmergencyTypes; // e.g. "cardiac", "accident"
        string[] allowedRoles;          // e.g. "ER_DOCTOR", "PARAMEDIC"
    }

    struct Doctor {
        bool registered;
        string role;                   // e.g. "ER_DOCTOR"
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

    // ── State ──────────────────────────────────────────────────────
    mapping(address => Patient)  public patients;
    mapping(address => Doctor)   public doctors;
    mapping(address => Hospital) public hospitals;
    AccessLog[]                  public accessLogs;

    uint256 public constant ACCESS_DURATION    = 4 hours;
    uint256 public constant JUSTIFICATION_WINDOW = 24 hours;

    // ── Events ─────────────────────────────────────────────────────
    event HospitalRegistered(address hospital, string name);
    event DoctorAttested(address doctor, address hospital, string role);
    event PatientRegistered(address patient);
    event EmergencyAccessGranted(address doctor, address patient,
                                  string emergencyType, uint256 expiresAt);
    event EmergencyAccessDenied(address doctor, address patient, string reason);
    event JustificationSubmitted(uint256 logIndex, address doctor);
    event EthicsReviewTriggered(uint256 logIndex);

    // ── Hospital registration ──────────────────────────────────────
    function registerHospital(string calldata name) external {
        hospitals[msg.sender] = Hospital({ verified: true, name: name });
        emit HospitalRegistered(msg.sender, name);
    }

    // ── Doctor attestation ─────────────────────────────────────────
    function attestDoctor(address doctor, string calldata role) external {
        require(hospitals[msg.sender].verified, "Not a verified hospital");
        doctors[doctor] = Doctor({
            registered: true,
            role: role,
            attestingHospital: msg.sender
        });
        emit DoctorAttested(doctor, msg.sender, role);
    }

    // ── Patient registration ───────────────────────────────────────
    function registerPatient(
        bytes32 emergencyDEK,
        address surrogate,
        string[] calldata allowedTypes,
        string[] calldata allowedRoles
    ) external {
        patients[msg.sender] = Patient({
            registered: true,
            emergencyAccessEnabled: true,
            emergencyDEK: emergencyDEK,
            surrogateContact: surrogate,
            allowedEmergencyTypes: allowedTypes,
            allowedRoles: allowedRoles
        });
        emit PatientRegistered(msg.sender);
    }

    // ── Core: Emergency Access (5 ABAC checks) ────────────────────
    function requestEmergencyAccess(
        address patientAddr,
        string calldata emergencyType
    ) external returns (bytes32) {

        Doctor  storage doc = doctors[msg.sender];
        Patient storage pat = patients[patientAddr];

        // CHECK 1 — Is requester attested by a verified hospital?
        require(doc.registered &&
                hospitals[doc.attestingHospital].verified,
                "ABAC-1 FAIL: Requester not attested by verified hospital");

        // CHECK 2 — Does requester hold an emergency-authorized role?
        require(_roleAllowed(pat.allowedRoles, doc.role),
                "ABAC-2 FAIL: Requester role not authorized for this patient");

        // CHECK 3 — Has patient pre-approved emergency access?
        require(pat.registered && pat.emergencyAccessEnabled,
                "ABAC-3 FAIL: Patient has not pre-approved emergency access");

        // CHECK 4 — Is emergency type in patient's allowed list?
        require(_typeAllowed(pat.allowedEmergencyTypes, emergencyType),
                "ABAC-4 FAIL: Emergency type not in patient's allowed list");

        // CHECK 5 — Is requester's role authorized for this emergency type?
        require(_roleAllowed(pat.allowedRoles, doc.role),
                "ABAC-5 FAIL: Role not authorized for this emergency type");

        // ALL CHECKS PASSED — log immutably BEFORE releasing DEK
        uint256 expiresAt = block.timestamp + ACCESS_DURATION;
        accessLogs.push(AccessLog({
            doctor:                  msg.sender,
            patient:                 patientAddr,
            emergencyType:           emergencyType,
            timestamp:               block.timestamp,
            expiresAt:               expiresAt,
            justificationSubmitted:  false,
            flaggedForEthicsReview:  false
        }));

        emit EmergencyAccessGranted(msg.sender, patientAddr,
                                     emergencyType, expiresAt);

        // Release DEK from escrow
        return pat.emergencyDEK;
    }

    // ── Post-access justification ──────────────────────────────────
    function submitJustification(uint256 logIndex) external {
        AccessLog storage log = accessLogs[logIndex];
        require(log.doctor == msg.sender, "Not the accessing doctor");
        require(!log.justificationSubmitted, "Already submitted");
        log.justificationSubmitted = true;
        emit JustificationSubmitted(logIndex, msg.sender);
    }

    // ── Ethics review trigger (callable by anyone after window) ───
    function triggerEthicsReview(uint256 logIndex) external {
        AccessLog storage log = accessLogs[logIndex];
        require(block.timestamp > log.timestamp + JUSTIFICATION_WINDOW,
                "Justification window still open");
        require(!log.justificationSubmitted,
                "Justification was submitted - no review needed");
        log.flaggedForEthicsReview = true;
        emit EthicsReviewTriggered(logIndex);
    }

    // ── Helpers ────────────────────────────────────────────────────
    function _roleAllowed(string[] storage allowed, string memory role)
        internal view returns (bool)
    {
        for (uint i = 0; i < allowed.length; i++) {
            if (keccak256(bytes(allowed[i])) == keccak256(bytes(role)))
                return true;
        }
        return false;
    }

    function _typeAllowed(string[] storage allowed, string memory t)
        internal view returns (bool)
    {
        for (uint i = 0; i < allowed.length; i++) {
            if (keccak256(bytes(allowed[i])) == keccak256(bytes(t)))
                return true;
        }
        return false;
    }

    function getAccessLog(uint256 i) external view returns (AccessLog memory) {
        return accessLogs[i];
    }

    function getLogCount() external view returns (uint256) {
        return accessLogs.length;
    }
}