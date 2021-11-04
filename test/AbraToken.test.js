const {
    time,
    expect,
    expectEvent,
    constants,
    expectRevert,
    ether
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

const BN = require("bn.js");

require("chai")
    .use(require("chai-as-promised"))
    .use(require("chai-bn")(BN))
    .should();

const AbraToken = artifacts.require("AbraToken");

contract("AbraToken", function (accounts) {
    [owner, beneficiary1, beneficiary2, beneficiary3, beneficiary4, wallet] = accounts;

    const tokenName = "Crypto Perx";
    const tokenSymbol = "CPRX";
    const initialSupply = ether("3000000000");

    before(async function () {
        abraToken = await AbraToken.new(wallet, owner);
    });

    describe("constructor", function () {
        it("should deploy with correct token name",async () => {
            (await abraToken.name()).should.be.equal(tokenName);
        });

        it("should deploy with correct token symol",async () => {
            (await abraToken.symbol()).should.be.equal(tokenSymbol);
        });

        it("should deploy with correct owner address",async () => {
            (await abraToken.owner()).should.be.equal(owner);
        });

        it("should mint initial supply to wallet address",async () => {
            (await abraToken.balanceOf(wallet)).should.be.bignumber.equal(initialSupply);
        });

        it("should return correct decimals",async () => {
            (await abraToken.decimals()).should.be.bignumber.equal(new BN(18));
        });

        it("should set owner correctly",async () => {
            let abraToken = await AbraToken.new(wallet, beneficiary1);
            (await abraToken.owner()).should.be.equal(beneficiary1);
        });

        it("cannot deploy with zero owner address",async () => {
            await expectRevert(
                AbraToken.new(wallet, constants.ZERO_ADDRESS),
                "CPRX: incorrect owner address"
            );
        });

        it("cannot deploy with zero wallet address",async () => {
            await expectRevert(
                AbraToken.new(constants.ZERO_ADDRESS, owner),
                "CPRX: incorrect wallet address"
            );
        });

    });

    context("transfer", function() {
        it("should transfer tokens correctly", async () => {
            result = await abraToken.transfer(owner, ether("1000"), {from: wallet});
            (await abraToken.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
            expectEvent(
                result,
                "Transfer",
                {from: wallet, to: owner, value: ether("1000")}
            );
        });

        it("cannot transfer with zero sender address", async () => {
            await expectRevert(
                abraToken.transferFrom(constants.ZERO_ADDRESS, beneficiary1, ether("10")),
                "ERC20: transfer from the zero address"
            );
        });

        it("cannot transfer with zero recipient address", async () => {
            await expectRevert(
                abraToken.transfer(constants.ZERO_ADDRESS, ether("10")),
                "ERC20: transfer to the zero address"
            );
        });

        it("cannot transfer more tokens than sender balance", async () => {
            await expectRevert(
                abraToken.transfer(beneficiary1, ether("100000000")),
                "ERC20: transfer amount exceeds balance"
            );
        });
    });

    context("transferFrom", function() {
        it("should transferFrom tokens correctly", async () => {
            await abraToken.approve(owner, ether("100"), {from: wallet});
            result = await abraToken.transferFrom(wallet, owner, ether("100"));
            (await abraToken.balanceOf(owner)).should.be.bignumber.equal(ether("1100"));
            expectEvent(
                result,
                "Transfer",
                {from: wallet, to: owner, value: ether("100")}
            );
        });

        it("cannot transferFrom with zero sender address", async () => {
            await expectRevert(
                abraToken.transferFrom(constants.ZERO_ADDRESS, owner, ether("10")),
                "ERC20: transfer from the zero address"
            );
        });

        it("cannot transferFrom with zero recipient address", async () => {
            await expectRevert(
                abraToken.transferFrom(wallet, constants.ZERO_ADDRESS, ether("10")),
                "ERC20: transfer to the zero address"
            );
        });

        it("cannot transferFrom more tokens than sender balance", async () => {
            await expectRevert(
                abraToken.transferFrom(wallet, owner, ether("10000000000000")),
                "ERC20: transfer amount exceeds balance"
            );
        });
    });

    context("approve", function() {
        it("should approve tokens correctly", async () => {
            result = await abraToken.approve(beneficiary1, ether("10"));
            expectEvent(
                result,
                "Approval",
                {owner: owner, spender: beneficiary1, value: ether("10")}
            );
        });

        it("cannot approve with zero spender address", async () => {
            await expectRevert(
                abraToken.approve(constants.ZERO_ADDRESS, ether("10")),
                "ERC20: approve to the zero address"
            );
        });
    });

    context("allowance", function() {
        it("should return allowance tokens correctly", async () => {
            result = await abraToken.allowance(owner, beneficiary1);
            result.should.be.bignumber.equal(ether("10"));
        });

        it("should increase allowance correctly", async () => {
            await abraToken.increaseAllowance(beneficiary1, ether("5"));
            result = await abraToken.allowance(owner, beneficiary1);
            result.should.be.bignumber.equal(ether("15"));
        });

        it("should decrease allowance correctly", async () => {
            await abraToken.decreaseAllowance(beneficiary1, ether("5"));
            result = await abraToken.allowance(owner, beneficiary1);
            result.should.be.bignumber.equal(ether("10"));
        });

        it("cannot decrease allowance if subtracted amount more than current allowance", async () => {
            await expectRevert(
                abraToken.decreaseAllowance(beneficiary1, ether("100")),
                "ERC20: decreased allowance below zero"
            );
        });
    });

    context("burn", function() {
        it("should burn tokens correctly", async () => {
            result = await abraToken.burn(ether("100"));
            (await abraToken.balanceOf(owner)).should.be.bignumber.equal(ether("1000"));
            expectEvent(
                result,
                "Transfer",
                {from: owner, to: constants.ZERO_ADDRESS, value: ether("100")}
            );
        });

        it("cannot burn more tokens than burner balance", async () => {
            await expectRevert(
                abraToken.burn(ether("10000")),
                "ERC20: burn amount exceeds balance"
            );
        });
    });

    context("burnFrom", function() {
        it("should burn tokens correctly", async () => {
            await abraToken.approve(wallet, ether("10000"), {from: owner});
            result = await abraToken.burnFrom(owner, ether("100"), {from: wallet});
            (await abraToken.balanceOf(owner)).should.be.bignumber.equal(ether("900"));
            expectEvent(
                result,
                "Transfer",
                {from: owner, to: constants.ZERO_ADDRESS, value: ether("100")}
            );
        });

        it("cannot burnFrom more tokens than burner balance", async () => {
            await expectRevert(
                abraToken.burnFrom(owner, ether("1000"), {from: wallet}),
                "ERC20: burn amount exceeds balance"
            );
        });

        it("cannot burn if amount exceeds allowance", async () => {
            await expectRevert(
                abraToken.burnFrom(owner, ether("800")),
                "ERC20: burn amount exceeds allowance"
            );
        });
    });
});