const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber, BigNumberish } = require("@ethersproject/bignumber");
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const INIT_FEE_RATE = 1000;
const INIT_MANAGER = "0xa293B3d8EF9F2318F7E316BF448e869e8833ec63";
const FEE_RATE_TOTAL = 10000;

// const SPex = artifacts.require('SPex');


describe("SPex", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploySPex() {
    // const LibValidator = await ethers.getContractFactory("Validator");
    // const lib = await LibValidator.deploy();
    // await lib.deployed();

    // console.log("Library Address--->" + lib.address);
    const [owner, otherAccount] = await ethers.getSigners();
    const SPex = await hre.ethers.getContractFactory("SPex", {
      libraries: {
        // Validator: lib.address,
      },
    });
    // const ERC20 = await hre.ethers.getContractFactory("FeedbackToken");
    const spex = await SPex.deploy(owner.address, INIT_FEE_RATE);
    await spex.deployed();
    return { spex, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Shold set the right manager", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      expect(await spex.getManager()).to.equal(owner.address);
    });

    it("Shold set the right fee rate", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      expect(await spex.getFeeRate()).to.equal(INIT_FEE_RATE);
    });

    it("Shold set the right fee rate unit", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      expect(await spex.FEE_RATE_TOTAL()).to.equal(FEE_RATE_TOTAL);
    });
  });

  describe("Functions", function () {
    const minerId = 1002;
    const price = 2222;
    const newPrice = 40000;

    it("test confirmTransferMinerIntoSPex", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      console.log("await spex.getMinerDelegator(minerId): ", typeof(await spex.getMinerDelegator(minerId)))
      expect(await spex.getMinerDelegator(minerId)).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      let id1 = (await spex.getListMinerById(minerId))[0].toString();
      expect(id1).to.equal(BigNumber.from("0").toString());
      let timestamp = Math.floor(Date.now() / 1000);
      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );

      let id2 = (await spex.getListMinerById(minerId))[0].toString();
      expect(id2).to.equal(BigNumber.from(0).toString());

      let seller = (await spex.getListMinerById(minerId))[1];

      // console.log(
      //   "owner.address",
      //   typeof owner.address,
      //   "owner.address: ",
      //   owner.address
      // );
      console.log("seller: ", seller);
      expect(seller).to.equal(constants.ZERO_ADDRESS);

      // console.log("await spex.getListMinerById(minerId): ", await spex.getListMinerById(minerId))
      let onlinePrice = (await spex.getListMinerById(minerId))[3].toString();
      console.log("onlinePrice: ", onlinePrice)
      expect(onlinePrice).to.equal(BigNumber.from(0).toString());

      // test timestamp
      
      let timestamp2 = timestamp - 1000;

      // await expectRevert(spex.connect(otherAccount).confirmTransferMinerIntoSPex(minerId+1, "0x12", timestamp2), "timestamp is expired")
      
      // await expectRevert(spex.connect(otherAccount).confirmTransferMinerIntoSPex(minerId, "0x12", timestamp), "timestamp is expired")

      // await spex.connect(otherAccount).confirmTransferMinerIntoSPex(minerId+1, "0x12", timestamp2)
      // await spex.confirmTransferMinerIntoSPex(minerId, "0x12", timestamp);
      // await spex.confirmTransferMinerIntoSPex(minerId+3, "0x12", timestamp);

    });

    it("test confirmTransferMinerIntoSPexAndList", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      expect(await spex.getMinerDelegator(minerId)).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
      let id1 = (await spex.getListMinerById(minerId))[0].toString();
      expect(id1).to.equal(BigNumber.from("0").toString());
      let timestamp = Math.floor(Date.now() / 1000);
      await spex.confirmTransferMinerIntoSPexAndList(
        minerId,
        "0x12",
        timestamp,
        price,
        constants.ZERO_ADDRESS
      );

      let onlinePrice = (await spex.getListMinerById(minerId))[3].toString();
      expect(onlinePrice).to.equal(BigNumber.from(price).toString());
      
    })

    it("test changePrice", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      let timestamp = Math.floor(Date.now() / 1000);

      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );

      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS)

      await spex.changePrice(minerId, newPrice);
      let onlinePrice = (await spex.getListMinerById(minerId))[3].toString();
      expect(onlinePrice).to.equal(BigNumber.from(newPrice).toString());
    });

    it("test cancelList", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      let timestamp = Math.floor(Date.now() / 1000);

      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );

      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS)


      await spex.cancelList(minerId);
      let id1 = (await spex.getListMinerById(minerId))[0].toString();
      expect(id1).to.equal(BigNumber.from("0").toString());
    });

    it("test listMiner", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      let timestamp = Math.floor(Date.now() / 1000);

      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );

      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS)

      await spex.cancelList(minerId);
      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS);
      let onlinePrice = (await spex.getListMinerById(minerId))[3].toString();
      expect(onlinePrice).to.equal(BigNumber.from(price).toString());
    });

    it("test buyMiner", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      let timestamp = Math.floor(Date.now() / 1000);

      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );
      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS)

      let provider = spex.provider;
      let buyerBalanceBefore = await provider.getBalance(otherAccount.address);
      let spexBalanceBefore = await provider.getBalance(spex.address);
      let sellerBalanceBefore = await provider.getBalance(owner.address);

      let feeRate = await spex.getFeeRate();

      let onlinePrice = (await spex.getListMinerById(minerId))[3].toString();
      let seller = (await spex.getListMinerById(minerId))[1];
      expect(seller).to.equal(owner.address);

      await spex
        .connect(otherAccount)
        .buyMiner(minerId, { value: onlinePrice });

      let buyerBalanceAfter = await provider.getBalance(otherAccount.address);
      let spexBalanceAfter = await provider.getBalance(spex.address);
      let sellerBalanceAfter = await provider.getBalance(owner.address);

      let transactionFee = Math.floor((onlinePrice * feeRate) / FEE_RATE_TOTAL);
      console.log("transactionFee: ", transactionFee);
      let toSellerAmount = onlinePrice - transactionFee;

      console.log("onlinePrice: ", onlinePrice)

      console.log("buyerBalanceBefore: ", buyerBalanceBefore, "buyerBalanceAfter: ", buyerBalanceAfter)
      console.log("spexBalanceBefore: ", spexBalanceBefore, "spexBalanceAfter: ", spexBalanceAfter)
      console.log("sellerBalanceBefore: ", sellerBalanceBefore, "sellerBalanceAfter: ", sellerBalanceAfter)

      expect(buyerBalanceBefore - buyerBalanceAfter).to.equal(onlinePrice);
      expect(spexBalanceAfter - spexBalanceBefore).to.equal(transactionFee);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(toSellerAmount);
      
      let minerId2 = minerId + 1
      await spex.confirmTransferMinerIntoSPexAndList(
        minerId2,
        "0x12",
        timestamp+1,
        price,
        otherAccount.address
      );

      let buyer = (await spex.getListMinerById(minerId2))[2];
      expect(buyer).to.equal(otherAccount.address);
      await spex.connect(otherAccount).buyMiner(minerId2, {value: price });
    });

    it("test changeFee", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      // await spex.confirmTransferMinerIntoSPex(
      //   minerId,
      //   "0x12",
      //   timestamp,
      // );
      // await spex.listMiner(minerId, price)

      const newFeeRate = 500;
      await spex.changeFeeRate(newFeeRate);

      expect(await spex.getFeeRate()).to.equal(newFeeRate);
    });

    it("test changeManager", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);

      let tx =  spex
        .connect(otherAccount).changeManager(otherAccount.address);
      await expect(tx).to.be.revertedWith("You are not the manager")

      let tx1 =  spex.changeManager(constants.ZERO_ADDRESS);
      await expect(tx1).to.be.revertedWith("the manager address cannot be set zero address")

      await spex.changeManager(otherAccount.address);
      expect(await spex.getManager()).to.equal(otherAccount.address);
    });

    it("test withdraw", async function () {
      const { spex, owner, otherAccount } = await loadFixture(deploySPex);
      let timestamp = Math.floor(Date.now() / 1000);

      await spex.confirmTransferMinerIntoSPex(
        minerId,
        "0x12",
        timestamp,
      );
      // const price = 
      await spex.listMiner(minerId, price, constants.ZERO_ADDRESS)
      await spex
        .connect(otherAccount)
        .buyMiner(minerId, { value: price });

      // let provider = ethers.getDefaultProvider();

      let provider = spex.provider;

      
      let spexBalanceBefore = await provider.getBalance(spex.address);
      console.log("spexBalanceBefore: ", spexBalanceBefore)
      // await spex.withdraw(owner.address, price * INIT_FEE_RATE / FEE_RATE_TOTAL / 2)
      // let spexBalanceAfter = await provider.getBalance(spex.address);
      // console.log("spexBalanceAfter: ", spexBalanceAfter)

      // await spex.changeManager(otherAccount.address);
      // expect(await spex.getManager()).to.equal(otherAccount.address);
    });
  });

});
