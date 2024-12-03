const {
  time,
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { expect } = require('chai');

const ENTRY_FEE = 1000;

describe('Roulette', function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Roulette = await ethers.getContractFactory('Roulette');
    const contract = await Roulette.deploy(ENTRY_FEE);

    return { contract, owner, otherAccount };
  }

  describe('Deployment', async function () {
    it('Constructor sets owner and entree fee properly', async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      expect(await contract.owner()).to.equal(owner);
      expect(await contract.entryFee()).to.equal(ENTRY_FEE);
    });

    it('Should not allow a contract of 0 or negative bid', async function () {
      const [owner, otherAccount] = await ethers.getSigners();

      const Roulette = await ethers.getContractFactory('Roulette');

      await expect(Roulette.deploy(0)).to.be.reverted;
    });
  });

  describe('joinRoulette', async function () {
    it(`Shouldn't allow someone to join the roulette twice`, async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract.connect(owner).joinRoulette({ value: ENTRY_FEE });
      await expect(contract.connect(owner).joinRoulette({ value: ENTRY_FEE }))
        .to.be.reverted;
    });

    it(`Shouldn't allow someone to join the roulette with incorrect entry fees`, async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await expect(
        contract.connect(owner).joinRoulette({ value: ENTRY_FEE + 10 })
      ).to.be.reverted;
      await expect(
        contract.connect(owner).joinRoulette({ value: ENTRY_FEE - 10 })
      ).to.be.reverted;
    });

    it(`Should update players array and players mapping on join`, async function () {
      const { contract, owner, otherAccount } = await loadFixture(
        deployFixture
      );

      await contract.connect(owner).joinRoulette({ value: ENTRY_FEE });
      const players = await contract.getPlayers();
      expect(players[0]).to.equal(owner.address);
      expect(players.length).to.equal(1);

      await contract.connect(otherAccount).joinRoulette({ value: ENTRY_FEE });
      const players2 = await contract.getPlayers();
      expect(players2[1]).to.equal(otherAccount.address);
      expect(players2.length).to.equal(2);

      expect(await contract.playersMapping(owner)).to.be.true;
      expect(await contract.playersMapping(otherAccount)).to.be.true;

      const randomWallet = ethers.Wallet.createRandom();
      expect(await contract.playersMapping(randomWallet)).to.be.false;
    });
  });

  describe('beginRoulette', async function () {
    it(`Should only allow owner to beginRoulette`, async function () {
      const { contract, owner, otherAccount } = await loadFixture(
        deployFixture
      );

      await expect(contract.connect(otherAccount).beginRoulette()).to.be
        .reverted;
      await expect(contract.connect(owner).beginRoulette()).to.be.revertedWith(
        'Not enough players in roulette'
      );
    });

    it("Shouldn't beginRoulette with less than 2 players", async function () {
      const { contract, owner } = await loadFixture(deployFixture);

      await contract.connect(owner).joinRoulette({ value: ENTRY_FEE });
      await expect(contract.connect(owner).beginRoulette()).to.be.reverted;
    });

    it('Should transfer appropriate amount to one of the players randomly and clear the players after', async function () {
      const { contract, owner, otherAccount } = await loadFixture(
        deployFixture
      );

      await contract.connect(owner).joinRoulette({ value: ENTRY_FEE });
      await contract.connect(otherAccount).joinRoulette({ value: ENTRY_FEE });

      const tx = await contract.connect(owner).beginRoulette();

      try {
        await expect(tx).to.changeEtherBalances(
          [owner, otherAccount],
          [ENTRY_FEE * 2, 0]
        );
      } catch (error) {
        await expect(tx).to.changeEtherBalances(
          [owner, otherAccount],
          [0, ENTRY_FEE * 2]
        );
      }

      expect(await contract.playersCount()).to.equal(0);
      expect(await contract.playersMapping(owner)).to.be.false;
      expect(await contract.playersMapping(otherAccount)).to.be.false;
    });
  });
});
