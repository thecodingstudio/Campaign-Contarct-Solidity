const assert    = require('assert');
const ganache   = require('ganache-cli');
const Web3      = require('web3');

const web3      = new Web3(ganache.provider());

const compiledFactory   = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign  = require('../ethereum/build/Campaign.json');

let accounts, factory, campaign, campaignAddress;

beforeEach(
    async() => {

        accounts    = await web3.eth.getAccounts();

        factory     = await new web3.eth
            .Contract(
                JSON.parse(compiledFactory.interface)
            ).deploy(
                {
                    data    : compiledFactory.bytecode
                }
            ).send(
                {
                    from    : accounts[0],
                    gas     : '1000000'
                }
            );
        
        await factory.methods.createCampaign('100')
            .send(
                {
                    from    : accounts[0],
                    gas     : '1000000'
                }
            );

        [campaignAddress]   = await factory.methods.getDeployedCampaigns().call();

        campaign     = await new web3.eth
            .Contract(
                JSON.parse(compiledCampaign.interface),
                campaignAddress
            );
    }
);

describe(
    'Campaigns',
    ()  => {
        it(
            'Deploys a factory and a campaign',
            () => {
                assert.ok(factory.options.address);
                assert.ok(campaign .options.address);
            }
        );

        it(
            'Marks caller as the campaign maneger',
            async () => {
                const maneger   = await campaign.methods.manager().call();
                assert.equal(accounts[0], maneger);
            }
        );

        it(
            'Allow people to contribute money and marks them as approvers',
            async () => {
                await campaign.methods.Contribute()
                    .send(
                        {
                            from    : accounts[1],
                            value   : '200'
                        }
                    );
                
                const isContributor = await campaign.methods
                    .approvers(accounts[1])
                    .call(); 
                
                assert(isContributor);
            }
        );

        it(
            'Requires a mininmum amount of contribution',
            async () => {
                try {
                    await campaign.methods.Contribute()
                        .send(
                            {
                                from    : accounts[1],
                                value   : '5 '
                            }
                        );
                    assert(false);
                } 
                catch (error) {
                    assert(error);
                }
            }
        )
    }
);