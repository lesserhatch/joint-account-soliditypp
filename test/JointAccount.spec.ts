import { describe } from "mocha";
import { expect } from "chai";
const vite = require('@vite/vuilder');
import config from "./vite.config.json";

let provider: any;
let deployer: any;
let jointAccountFactory: any;

describe('test JointAccount', () => {
  before(async function() {
    provider = vite.localProvider();
    deployer = vite.newAccount(config.networks.local.mnemonic, 0);

    // compile
    const compiledContracts = await vite.compile('JointAccount.solpp');
    expect(compiledContracts).to.have.property('JointAccountFactory');
    expect(compiledContracts).to.have.property('JointAccount');

    // deploy
    jointAccountFactory = compiledContracts.JointAccountFactory;
    jointAccountFactory.setDeployer(deployer).setProvider(provider);
    await jointAccountFactory.deploy({});
    expect(jointAccountFactory.address).to.be.a('string');
  });

  it('creates a joint account', async () => {
    let alice = vite.newAccount(config.networks.local.mnemonic, 1);
    let bob = vite.newAccount(config.networks.local.mnemonic, 2);
    let charlie = vite.newAccount(config.networks.local.mnemonic, 3);

    // create a joint account
    let members = [alice.address, bob.address, charlie.address];
    await jointAccountFactory.call('newJointAccount', [members, '2'], {caller: deployer});

    // verify the account
    let result = await jointAccountFactory.query('accounts', ['0']);
    console.log(result);
    // expect(await jointAccountFactory.query('getMembers', ['0'])).to.be.deep.equal([members]);
  });
});