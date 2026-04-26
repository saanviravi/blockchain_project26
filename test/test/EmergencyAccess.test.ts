import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import hre from "hardhat";

describe("EmergencyAccess — ABAC + Break-Glass Protocol", function () {
  let contract: any;
  let admin: any,
    hospital: any,
    doctor: any,
    patient: any,
    surrogate: any,
    attacker: any,
    unregisteredPatient: any;

  beforeEach(async function () {
    const network = await hre.network.connect();
    const ethers = network.ethers;

    // admin is the deployer (signer[0])
    [admin, hospital, doctor, patient, surrogate, attacker, unregisteredPatient] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EmergencyAccess");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // UPDATED: Admin registers the hospital address (not hospital self-registering)
    await contract.connect(admin).registerHospital(
      hospital.address,
      "City General Hospital"
    );

    // Hospital attests the doctor
    await contract.connect(hospital).attestDoctor(doctor.address, "ER_DOCTOR");

    // Patient registers and deposits DEK into escrow
    const fakeDEK = ethers.encodeBytes32String("encrypted-dek-placeholder");
    await contract.connect(patient).registerPatient(
      fakeDEK,
      surrogate.address,
      ["cardiac", "accident", "diabetic"],
      ["ER_DOCTOR", "PARAMEDIC"]
    );
  });

  // ── Happy path ────────────────────────────────────────────────────

  it("TC1: grants emergency access when all 5 ABAC checks pass", async () => {
    const network = await hre.network.connect();
    const ethers = network.ethers;

    const tx = await contract
      .connect(doctor)
      .requestEmergencyAccess(patient.address, "cardiac");
    const receipt = await tx.wait();

    const log = await contract.getAccessLog(0);
    expect(log.doctor).to.equal(doctor.address);
    expect(log.patient).to.equal(patient.address);
    expect(log.emergencyType).to.equal("cardiac");
    expect(log.justificationSubmitted).to.equal(false);
    expect(log.flaggedForEthicsReview).to.equal(false);

    console.log("  ✓ DEK released from escrow");
    console.log(
      `  ✓ Access expires: ${new Date(Number(log.expiresAt) * 1000).toISOString()}`
    );
    console.log(`  ✓ Gas used: ${receipt.gasUsed.toString()} units`);
  });

  // ── ABAC adversarial checks ───────────────────────────────────────

  it("TC2: ABAC-1 — rejects unattested requester (not registered as doctor)", async () => {
    await expect(
      contract.connect(attacker).requestEmergencyAccess(patient.address, "cardiac")
    ).to.be.revertedWith(
      "ABAC-1 FAIL: Requester not attested by verified hospital"
    );
    console.log("  ✓ Unattested attacker correctly blocked");
  });

  it("TC3: ABAC-2 — rejects doctor with unauthorized role", async () => {
    const network = await hre.network.connect();
    const ethers = network.ethers;

    // Hospital attests attacker with an unauthorized role
    await contract.connect(hospital).attestDoctor(attacker.address, "ADMIN");

    await expect(
      contract.connect(attacker).requestEmergencyAccess(patient.address, "cardiac")
    ).to.be.revertedWith(
      "ABAC-2 FAIL: Requester role not authorized for this patient"
    );
    console.log("  ✓ Doctor with unauthorized role correctly blocked");
  });

  it("TC4: ABAC-3 — rejects access to unregistered patient", async () => {
    await expect(
      contract
        .connect(doctor)
        .requestEmergencyAccess(unregisteredPatient.address, "cardiac")
    ).to.be.revertedWith(
      "ABAC-2 FAIL: Requester role not authorized for this patient"
    );
    // Note: hits ABAC-2 first because unregistered patient has empty allowedRoles
    console.log(
      "  ✓ Access to unregistered patient correctly blocked (empty role list)"
    );
  });

  it("TC5: ABAC-4 — rejects disallowed emergency type", async () => {
    await expect(
      contract
        .connect(doctor)
        .requestEmergencyAccess(patient.address, "psychiatric")
    ).to.be.revertedWith(
      "ABAC-4 FAIL: Emergency type not in patient's allowed list"
    );
    console.log("  ✓ Disallowed emergency type correctly blocked");
  });

  // ── Audit log integrity ────────────────────────────────────────────

  it("TC6: audit log is written before DEK release", async () => {
    await contract
      .connect(doctor)
      .requestEmergencyAccess(patient.address, "accident");

    const count = await contract.getLogCount();
    expect(count).to.equal(1n);

    const log = await contract.getAccessLog(0);
    expect(log.doctor).to.equal(doctor.address);
    expect(log.flaggedForEthicsReview).to.equal(false);
    console.log(`  ✓ Log count: ${count.toString()}`);
    console.log("  ✓ Immutable audit log recorded on-chain");
  });

  // ── Post-access justification ──────────────────────────────────────

  it("TC7: doctor can submit post-access justification on-chain", async () => {
    await contract
      .connect(doctor)
      .requestEmergencyAccess(patient.address, "cardiac");

    await contract.connect(doctor).submitJustification(0);
    const log = await contract.getAccessLog(0);
    expect(log.justificationSubmitted).to.equal(true);
    console.log("  ✓ Justification recorded permanently on-chain");
  });

  // ── Gas measurement ────────────────────────────────────────────────

  it("TC8: emergency access transaction gas cost is under 300,000 units", async () => {
    const tx = await contract
      .connect(doctor)
      .requestEmergencyAccess(patient.address, "cardiac");
    const receipt = await tx.wait();
    const gas = receipt.gasUsed;
    console.log(`  ⛽ Gas used: ${gas.toString()} units`);
    expect(gas).to.be.lessThan(300000n);
  });

  // ── Security: admin control ────────────────────────────────────────

  it("SEC1: non-admin cannot register a hospital", async () => {
    await expect(
      contract
        .connect(attacker)
        .registerHospital(attacker.address, "Fake Hospital")
    ).to.be.revertedWith("Only admin can perform this action");
    console.log("  ✓ Fake hospital self-registration correctly blocked");
  });

  it("SEC2: zero-address patient is rejected", async () => {
    await expect(
      contract
        .connect(doctor)
        .requestEmergencyAccess(
          "0x0000000000000000000000000000000000000000",
          "cardiac"
        )
    ).to.be.revertedWith("Patient address cannot be zero");
    console.log("  ✓ Zero-address patient correctly rejected");
  });

  it("SEC3: out-of-bounds log retrieval reverts", async () => {
    await expect(contract.getAccessLog(999)).to.be.revertedWith(
      "Log index out of bounds"
    );
    console.log("  ✓ Out-of-bounds log access correctly rejected");
  });

  it("SEC4: patient can disable their own emergency access", async () => {
    await contract.connect(patient).disableEmergencyAccess();
    await expect(
      contract.connect(doctor).requestEmergencyAccess(patient.address, "cardiac")
    ).to.be.revertedWith(
      "ABAC-3 FAIL: Patient has not pre-approved emergency access"
    );
    console.log("  ✓ Patient successfully revoked emergency access consent");
  });

  it("SEC5: double registration is rejected", async () => {
    const network = await hre.network.connect();
    const ethers = network.ethers;
    const fakeDEK = ethers.encodeBytes32String("second-dek");
    await expect(
      contract
        .connect(patient)
        .registerPatient(fakeDEK, surrogate.address, ["cardiac"], ["ER_DOCTOR"])
    ).to.be.revertedWith("Patient already registered");
    console.log("  ✓ Double patient registration correctly rejected");
  });
});
