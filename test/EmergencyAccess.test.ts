import { expect } from "chai";
import hre from "hardhat";

describe("EmergencyAccess", function () {
  let contract: any;
  let admin: any, hospital: any, doctor: any, patient: any;

  beforeEach(async function () {
    [admin, hospital, doctor, patient] = await hre.ethers.getSigners();

    const EmergencyAccess = await hre.ethers.getContractFactory("EmergencyAccess");
    contract = await EmergencyAccess.deploy();
    await contract.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await contract.admin()).to.equal(admin.address);
  });

  it("Should allow admin to register hospital", async function () {
    await contract.connect(admin).registerHospital(hospital.address, "Test Hospital");
    const hospitalData = await contract.hospitals(hospital.address);
    expect(hospitalData.verified).to.be.true;
    expect(hospitalData.name).to.equal("Test Hospital");
  });

  it("Should allow hospital to attest doctor", async function () {
    await contract.connect(admin).registerHospital(hospital.address, "Test Hospital");
    await contract.connect(hospital).attestDoctor(doctor.address, "ER_DOCTOR");

    const doctorData = await contract.doctors(doctor.address);
    expect(doctorData.registered).to.be.true;
    expect(doctorData.role).to.equal("ER_DOCTOR");
  });

  it("Should allow patient registration", async function () {
    const emergencyDEK = hre.ethers.randomBytes(32);
    const allowedTypes = ["cardiac", "accident"];
    const allowedRoles = ["ER_DOCTOR"];

    await contract.connect(patient).registerPatient(
      emergencyDEK,
      hre.ethers.ZeroAddress,
      allowedTypes,
      allowedRoles
    );

    const patientData = await contract.patients(patient.address);
    expect(patientData.registered).to.be.true;
  });
});