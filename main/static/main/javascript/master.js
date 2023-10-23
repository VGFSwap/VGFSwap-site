async function updateHomeBalances() {
    if (userAddress) {
        const usdtContract = await getTokenContract(web3, usdtAddress);
        let usdtBalance = await usdtContract.methods.balanceOf(userAddress).call({ from: userAddress });
        usdtBalance = usdtBalance.toString();
        usdtHomeBalance = web3.utils.fromWei(usdtBalance, 'ether');
        document.getElementById('usdt-home-balance').innerHTML = usdtHomeBalance == 0 ? '0.00' : Number(usdtHomeBalance).toFixed(2);
        const tokenContract = await getTokenContract(web3, tokenAddress);
        let tokenBalance = await tokenContract.methods.balanceOf(userAddress).call({ from: userAddress });
        tokenHomeBalance = parseInt(tokenBalance) / 10 ** 9;
        document.getElementById('token-home-balance').innerHTML = tokenHomeBalance == 0 ? '0.00' : Number(tokenHomeBalance).toFixed(2);

    }
}
$(document).ready(async function () {
    await new Promise(r => setTimeout(r, 2000));
    updateHomeBalances();
    setInterval(updateHomeBalances, 8000);
    if (userAddress) {
        const saleContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
        const hasPurchased = await saleContract.methods.hasPurchased(userAddress).call({ from: userAddress })
        const fetchReferrer = await saleContract.methods.referrers(userAddress).call({ from: userAddress })
        if (fetchReferrer != zero_address) {
            document.getElementById('buy-referral').style.display = 'none';
        }
        if (hasPurchased) {
            document.getElementById('buy-btn').style.display = 'none';
            document.getElementById('already-joined').style.display = 'block';
        }
    }
    let refer = document.getElementById('refer').innerHTML;
    if (refer != 'None' && refer != '') {
        document.getElementById('buy-referral').value = refer;
        console.log(refer)
    }
});
function estimateOutTokens() {
    let amount = document.getElementById('buy-quantity').value;
    if (amount != 0 && amount != '') {
        const outAmount = (parseFloat(amount) * parseInt(rateUSD)).toFixed(1);
        document.getElementById('buy-value').innerHTML = outAmount == 0 ? '0.00' : outAmount;
    }
    else {
        document.getElementById('buy-value').innerHTML = '0.00';
    }
}
const buyTokens = async () => {
    let amount = 590;
    let referral = document.getElementById('buy-referral').value;
    if (amount != 0 && amount != '') {
        amount = web3.utils.toWei(amount.toString(), 'ether');
        valid = true;
        if (parseInt(amount) > web3.utils.toWei(usdtHomeBalance.toString(), 'ether')) {
            valid = false;
            openGlobalError(`Low USDT Balance`, 5000);
        }
        if (valid) {
            showRoller();
            const fetchedGasPrice = await getSafeGasPrice();
            if (fetchedGasPrice) {
                const saleContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
                let referred = await saleContract.methods.referrers(userAddress).call({ from: userAddress });
                if (referred === zero_address) {
                    if (web3.utils.isAddress(referral)) {
                        await saleContract.methods.addReferral(referral).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                            .on('transaction', function (hash) {
                                console.log("Transaction: ", hash);
                            })
                            .on('receipt', function (receipt) {
                                hideRoller();
                                openGlobalInfo("Referral Added Successfully!", 6000);
                                document.getElementById('buy-referral').style.display = 'none';
                            })
                            .on('error', function (error, receipt) {
                                console.log('Error:', error);
                                console.log('Error:', receipt);
                                hideRoller();
                                openGlobalError("Transaction Failed", 6000);
                            })
                    }
                    else {
                        openGlobalError("Enter a valid Referral Address", 6000);
                        hideRoller();
                        return;
                    }
                }
                const usdtContract = await getTokenContract(web3, usdtAddress);
                let allowance = await usdtContract.methods.allowance(userAddress, stakeContractAddress).call();
                if (Number(allowance) < Number(amount)) {
                    await usdtContract.methods.approve(stakeContractAddress, web3.utils.toWei(usdtHomeBalance.toString(), 'ether')).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                        .on('receipt', function (receipt) {
                            console.log('receipt:', receipt);
                        })
                        .on('error', function (error, receipt) {
                            hideRoller();
                        })
                }
                saleContract.methods.buyTokensUSD(amount).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                    .on('transaction', function (hash) {
                        console.log("Transaction: ", hash);
                    })
                    .on('receipt', function (receipt) {
                        console.log('receipt:', receipt);
                        openGlobalInfo("Transaction Processed", 6000);
                        hideRoller();
                    })
                    .on('error', function (error, receipt) {
                        console.log('Error:', error);
                        console.log('Error:', receipt);
                        openGlobalError("Transaction Failed", 6000);
                        hideRoller();
                    })
            }
            else {
                openGlobalError("Something went wrong, please try after some time", 10000);
                hideRoller();
            }
        }
    }
}
document.getElementById('nav-home').style.color = 'var(--tint)';