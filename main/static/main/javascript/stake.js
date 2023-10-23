async function updateStakeBalances() {
    if (userAddress) {
        const tokenContract = await getTokenContract(web3, tokenAddress);
        let tokenBalance = await tokenContract.methods.balanceOf(userAddress).call({ from: userAddress });
        tokenStakeBalance = parseInt(tokenBalance) / 10 ** tokenDecimals;
        const usdtContract = await getTokenContract(web3, usdtAddress);
        let usdtBalance = await usdtContract.methods.balanceOf(userAddress).call({ from: userAddress });
        usdtStakeBalance = web3.utils.fromWei(usdtBalance.toString(), 'ether');
        document.getElementById('usdt-stake-balance').innerHTML = usdtStakeBalance == 0 ? '0.00' : Number(usdtStakeBalance).toFixed(2);
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        let currentPrice = await dexContract.methods._currentPrice().call();
        currentPrice = web3.utils.fromWei(currentPrice.toString(), 'ether');
        currentPrice = Number(currentPrice);
        const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
        const allStakes = await stakeContract.methods.getAllStakes(userAddress).call({ from: userAddress });
        withdraw_1 = await stakeContract.methods.getAllRewardsForPlan(0).call({ from: userAddress })
        withdraw_2 = await stakeContract.methods.getAllRewardsForPlan(1).call({ from: userAddress })
        document.getElementById('withdrawable-1').innerHTML = formatBalances((parseInt(withdraw_1) / 10 ** 18) / currentPrice, 2);
        document.getElementById('withdrawable-2').innerHTML = formatBalances((parseInt(withdraw_2) / 10 ** 18) / currentPrice, 2);
        staked_1 = 0;
        staked_2 = 0;
        allStakes.forEach(stake => {
            let amount = parseInt(stake.amount) / 10 ** 18;
            if (stake.plan === '0') {
                staked_1 += Number(amount);
            }
            else if (stake.plan === '1') {
                staked_2 += Number(amount);
            }

        });
        document.getElementById('staked-1').innerHTML = formatBalances(staked_1 / currentPrice, 2);
        document.getElementById('staked-2').innerHTML = formatBalances(staked_2 / currentPrice, 2);

        document.getElementById('earnable-1').innerHTML = formatBalances((Number(staked_1) + (parseInt(withdraw_1) / 10 ** 18)) / currentPrice, 2);
        document.getElementById('earnable-2').innerHTML = formatBalances((Number(staked_2) + (parseInt(withdraw_2) / 10 ** 18)) / currentPrice, 2);

        // -------------------------------
        let html = ''
        if (allStakes.length === 0) {
            html += "<div>Not Staked Anything yet.</div>"
        }
        else {
            html += `<div class="all-staking-head">
                         <p>Amount</p>
                         <p>Plan</p>
                         <p>Staked</p>
                         <p>Mature</p>
                         <a>Action</a>
                     </div>`;
            for (let i = 0; i < allStakes.length; i++) {
                let plan = allStakes[i].plan;
                let stakeObj = allStakes[i];

                let unixTimestamp = stakeObj.startTimestamp;
                let date = new Date(unixTimestamp * 1000);
                let year = date.getFullYear();
                let month = date.getMonth() + 1;
                let day = date.getDate();
                const stakeDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

                unixTimestamp = stakeObj.endTimestamp;
                date = new Date(unixTimestamp * 1000);
                year = date.getFullYear();
                month = date.getMonth() + 1;
                day = date.getDate();
                const matureDate = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                let currentTime = Date.now();
                let todayTimestamp = Math.floor(currentTime / 1000);

                html += `<div class="all-staking-item">
                         <p>${formatBalances((parseInt(allStakes[i].amount) / 10 ** 18) / currentPrice, 2)} VGF</p>
                         <p>${plan === '0' ? '180 Days' : plan === '1' ? '365 Days' : ''}</p>
                         <p>${stakeDate}</p>
                         <p>${matureDate}</p>`;
                if (Number(unixTimestamp) < Number(todayTimestamp)) {
                    html += `<a onclick='claimStake(${i})' class="claimBtn">Claim</a>`
                }
                else {
                    html += '<a href="" class="claimBtnDeactive">Claim</a>'
                }
                html += `</div>`;
            }


        }
        document.getElementById('all-staking-list').innerHTML = html;
        //--------------------------------

        const reportList = await stakeContract.methods.getUserClaimReport(userAddress).call()

        html = ''
        reportList.forEach(report => {
            const plan = report.plan;
            html += `<div class="report-item">
                        <p>Datetime: <span>${unixTimestampToDateTime(report.timestamp)}</span></p>
                        <p>Plan: <span>${plan === '0' ? '180 Days' : plan === '1' ? '365 Days' : ''}</span></p>
                        <p>USDT: <span>${((web3.utils.fromWei((report.usdtAmount).toString(), 'ether')))}</span></p>
                        <p>VGF: <span>${(30 * (parseInt(report.tokenAmount) / 10 ** tokenDecimals) / 100).toFixed(2)}</span></p>
                    </div>`
        });
        if (reportList.length == 0) {
            html += 'Claim Reports Appear here'
        }

        document.getElementById('report-list').innerHTML = html;
    }
}

$(document).ready(async function () {
    await new Promise(r => setTimeout(r, 2000));
    if (userAddress) {
        const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
        let minStake = await stakeContract.methods.minStakeAmount().call({ from: userAddress });
    }
    updateStakeBalances();
    setInterval(updateStakeBalances, 6000);
});


async function stakeBtnPressed(plan) {
    if (userAddress) {
        showStakePrompt(plan);
    }
}


function calculateReturnAmount(amount, percent, days) {
    let daily_bonus = (percent / 100) * Number(amount);
    let total_bonus = daily_bonus * days;
    return (total_bonus + Number(amount));
}


function estimateInUSDT() {
    let amount = document.getElementById('stake-amount').value;
    if (amount != 0 && amount != '') {
        const intAmount = (Number(amount) * Number(goldBuyPrice_)).toFixed(2);
        document.getElementById('stake-value').innerHTML = intAmount == 0 ? '0.00' : intAmount;
    }
    else {
        document.getElementById('stake-value').innerHTML = '0.00';
    }
}

async function stake() {
    let amount = document.getElementById('stake-amount').value;
    let plan = parseInt(document.getElementById('stake-plan').innerHTML);
    let plan_id = 0;
    if (plan === 180) {
        plan_id = 0;
    }
    else if (plan === 365) {
        plan_id = 1;
    }
    if (amount != 0 && amount != '') {
        amount = web3.utils.toWei(amount.toString(), 'ether');
        valid = true;
        if (Number(amount) < parseInt(minStakeAmount)) {
            valid = false;
            openGlobalError(`Minimum Stake amount is ${web3.utils.fromWei(minStakeAmount.toString(), 'ether')}`, 6000);
        }
        else if (Number(amount) > Number(web3.utils.toWei(usdtStakeBalance.toString(), 'ether'))) {
            valid = false;
            openGlobalError(`Low USDT balance`, 6000);
        }
        else if (Number(web3.utils.fromWei(amount.toString(), 'ether')) > Number(tokenStakeBalance)) {
            valid = false;
            openGlobalError("No Enough Token For Fee", 6000);
        }
        if (valid) {
            showStakeRoller();
            const fetchedGasPrice = await getSafeGasPrice();
            if (fetchedGasPrice) {
                const usdtContract = await getTokenContract(web3, usdtAddress);
                let allowance = await usdtContract.methods.allowance(userAddress, stakeContractAddress).call();
                console.log("Allowance:", allowance);

                if (Number(allowance) < Number(amount)) {
                    await usdtContract.methods.approve(stakeContractAddress, (web3.utils.toWei(usdtStakeBalance.toString(), 'ether'))).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                        .on('receipt', function (receipt) {
                            console.log('receipt:', receipt);
                        })
                        .on('error', function (error, receipt) {
                            hideStakeRoller();
                        })
                }
                const tokenContract = await getTokenContract(web3, tokenAddress);
                await tokenContract.methods.approve(stakeContractAddress, (parseFloat(tokenStakeBalance) * 10 ** Number(tokenDecimals)).toString()).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                    .on('receipt', function (receipt) {
                        console.log('receipt:', receipt);
                    })
                    .on('error', function (error, receipt) {
                        hideStakeRoller();
                    })
                const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
                stakeContract.methods.stake(amount, plan_id).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                    .on('transaction', function (hash) {
                        console.log("Transaction: ", hash);
                    })
                    .on('receipt', function (receipt) {
                        console.log('receipt:', receipt);
                        hideStakeRoller();
                        openGlobalInfo("Transaction Processed", 6000);
                    })
                    .on('error', function (error, receipt) {
                        console.log('Error:', error);
                        console.log('Error:', receipt);
                        hideStakeRoller();
                        openGlobalError("Transaction Failed", 6000);
                    })
            }
            else {
                openGlobalError("Something went wrong, please try after some time", 10000);
                hideRoller();
            }
        }
    }
}
async function swapToUSDT(plan) {
    openGlobalInfo("Approve Transaction in Wallet!", 5000);
    const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
    let allRewardsForPlan = await stakeContract.methods.getAllRewardsForPlan(plan).call({ from: userAddress });
    if (Number(allRewardsForPlan) < Number(min_withdraw)) {
        openGlobalError(`Minimum Amount to Withdraw is ${(min_withdraw / 10 ** 18).toFixed(2)} USDT`, 6000);
    }
    else {
        const fetchedGasPrice = await getSafeGasPrice();
        if (fetchedGasPrice) {
            stakeContract.methods.collectAllRewardsForPlan(plan).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                .on('transaction', function (hash) {
                    console.log("Transaction: ", hash);
                })
                .on('receipt', function (receipt) {
                    console.log('receipt:', receipt);
                    hideStakeRoller();
                    openGlobalInfo("Transaction Processed", 6000);
                })
                .on('error', function (error, receipt) {
                    console.log('Error:', error);
                    console.log('Error:', receipt);
                    hideStakeRoller();
                    openGlobalError("Transaction Failed", 6000);
                })
        }

        else {
            openGlobalError("Something went wrong, please try after some time", 10000);
            hideRoller();
        }

    }
}


async function claimStake(id) {
    openGlobalInfo("Approve Transaction in Wallet", 5000);
    const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
    const fetchedGasPrice = await getSafeGasPrice();
    if (fetchedGasPrice) {
        stakeContract.methods.withdrawStake(id).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
            .on('transaction', function (hash) {
                console.log("Transaction: ", hash);
            })
            .on('receipt', async function (receipt) {
                console.log('receipt:', receipt);
                openGlobalInfo("Transaction Processed", 6000);
                await new Promise(r => setTimeout(r, 2000));
                location.reload();

            })
            .on('error', function (error, receipt) {
                console.log('Error:', error);
                console.log('Error:', receipt);
                hideStakeRoller();
                openGlobalError("Transaction Failed", 6000);
            })
    }

    else {
        openGlobalError("Something went wrong, please try after some time", 10000);
    }

}