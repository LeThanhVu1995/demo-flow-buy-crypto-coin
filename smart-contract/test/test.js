const { expect } = require("chai");
const { ethers } = require("hardhat");

const main = async () => {
  const usdcFactory = await hre.ethers.getContractFactory("Usdc");
  const usdcContract = await usdcFactory.deploy();
  await usdcContract.deployed();

  console.log("USDC deployed to: ", usdcContract.address);
};

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
