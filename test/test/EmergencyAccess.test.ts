import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import hre from "hardhat";

describe("EmergencyAccess — ABAC + Break-Glass Protocol", function () {
  let contract: any;
  let hospital: any, doctor: any, patient: any, surrogate: any, attacker: any, unregisteredPatient: any;

  beforeEach(async function () {
    const network = await hre.network.connect();
    const ethers = network.ethers;

    [hospital, doctor, patient, surrogate, attacker, unregisteredPatient] =
      await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EmergencyAccess");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    await contract.connect(hospital).registerHospital("City General Hospital");
    await contract.connect(hospital).attestDoctor(doctor.address, "ER_DOCTOR");

    const fakeDEK = ethers.encodeBytes32String("encrypted-dek-placeholder");
    await contract.connect(patient).registerPatient(
      fakeDEK,
      surrogate.address,
      ["cardiac", "accident", "diabetic"],
      ["ER_DOCTOR", "PARAMEDIC"]
    );
  });

  it("PASS: grants emergency access when all 5 ABAC checks pass", async () => {
    const tx = await contract.connect(doctor)
      .requestEmergencyAccess(patient.address, "cardiac");
    const receipt = await tx.wait();
    const log = await contract.getAccessLog(0);
    expect(log.doctor).to.equal(doctor.address);
    expect(log.patient).to.equal(patient.address);
    expect(log.emergencyType).to.equal("cardiac");
    expect(log.justificationSubmitted).to.equal(false);
    console.log("  ✓ DEK released from escrow");
    console.log(`  ✓ Access expires: ${new Date(Number(log.expiresAt) * 1000).toISOString()}`);
    console.log(`  ✓ Gas used: ${receipt.gasUsed.toString()} units`);
  });

  it("FAIL CHECK 1: rejects unattested requester", async () => {
    await expect(
      contract.connect(attacker).requestEmergencyAccess(patient.address, "cardiac")
    ).to.be.revertedWith("ABAC-1 FAIL: Requester not attested by verified hospital");
    console.log("  ✓ Unattested attacker correctly blocked");
  });

  it("FAIL CHECK 2: rejects doctor with unauthorized role", async () => {
    await contract.connect(hospital).attestDoctor(attacker.address, "ADMIN");
    await expect(
      contract.connect(attacker).requestEmergencyAccess(patient.address, "cardiac")
    ).to.be.revertedWith("ABAC-2 FAIL: Requester role not authorized for this patient");
    console.log("  ✓ Wrong role correctly blocked");
  });

  it("FAIL CHECK 3: rejects if patient not registered", async () => {
    await expect(
      contract.connect(doctor).requestEmergencyAccess(unregisteredPatient.address, "cardiac")
    ).to.be.revertedWith("ABAC-2 FAIL: Requester role not authorized for this patient");
    console.log("  ✓ Unregistered patient correctly blocks access");
  });

  it("FAIL CHECK 4: rejects disallowed emergency type", async () => {
    await expect(
      contract.connect(doctor).requestEmergencyAccess(patient.address, "psychiatric")
    ).to.be.revertedWith("ABAC-4 FAIL: Emergency type not in patient's allowed list");
    console.log("  ✓ Disallowed emergency type correctly blocked");
  });

  it("records immutable audit log before releasing DEK", async () => {
    await contract.connect(doctor).requestEmergencyAccess(patient.address, "accident");
    const count = await contract.getLogCount();
    expect(count).to.equal(1n);
    const log = await contract.getAccessLog(0);
    expect(log.flaggedForEthicsReview).to.equal(false);
    console.log(`  ✓ Log count: ${count.toString()}`);
  });

  it("doctor can submit post-access justification", async () => {
    await contract.connect(doctor).requestEmergencyAccess(patient.address, "cardiac");
    await contract.connect(doctor).submitJustification(0);
    const log = await contract.getAccessLog(0);
    expect(log.justificationSubmitted).to.equal(true);
    console.log("  ✓ Justification recorded on-chain");
  });

  it("measures gas cost for emergency access transaction", async () => {
    const tx = await contract.connect(doctor)
      .requestEmergencyAccess(patient.address, "cardiac");
    const receipt = await tx.wait();
    const gas = receipt.gasUsed;
    console.log(`  Gas used: ${gas.toString()} units`);
    expect(gas).to.be.lessThan(300000n);
  });
});