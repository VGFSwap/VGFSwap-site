let usdtUserBalance = 0;
let tokenUserBalance = 0
let maxApproveAmount = '';

const salesLevels = {}

async function updateUserBalances() {
    if (userAddress) {
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        let currentPrice = await dexContract.methods._currentPrice().call();
        currentPrice = web3.utils.fromWei(currentPrice.toString(), 'ether');
        currentPrice = Number(currentPrice);

        const usdtContract = await getTokenContract(web3, usdtAddress);
        let usdtBalance = await usdtContract.methods.balanceOf(userAddress).call({ from: userAddress });
        usdtBalance = usdtBalance.toString();
        usdtUserBalance = web3.utils.fromWei(usdtBalance, 'ether');
        document.getElementById('usdt-balance').innerHTML = usdtUserBalance == 0 ? '0.00' : formatBalances(Number(usdtUserBalance), 2);

        const tokenContract = await getTokenContract(web3, tokenAddress);
        let tokenBalance = await tokenContract.methods.balanceOf(userAddress).call({ from: userAddress });
        tokenUserBalance = parseInt(tokenBalance) / 10 ** tokenDecimals;
        document.getElementById('token-balance').innerHTML = tokenUserBalance == 0 ? '0.00' : formatBalances(Number(tokenUserBalance), 2);

        document.getElementById('bnb-balance').innerHTML = userBalance_ == 0 ? '0.00' : formatBalances(userBalance_, 2);

        const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
        let stakedAmount = await stakeContract.methods.totalStakedAmount(userAddress).call({ from: userAddress });
        stakedAmount = parseInt(stakedAmount) / 10 ** 18;
        document.getElementById('staked-amount').innerHTML = stakedAmount == 0 ? '0.00' : formatBalances(Number(stakedAmount / currentPrice), 2);

        let totalRewards = await stakeContract.methods.getTotalReferRewards(userAddress).call({ from: userAddress });
        totalRewards = parseInt(totalRewards) / 10 ** tokenDecimals;
        document.getElementById('rewards-amount').innerHTML = totalRewards == 0 ? '0.00' : formatBalances(Number(totalRewards), 2);

        let groupSales = await stakeContract.methods.getTotalSalesByReferrer(userAddress).call({ from: userAddress });
        groupSales = web3.utils.fromWei(groupSales.toString(), 'ether');
        groupSales = Number(groupSales) / currentPrice;
        document.getElementById('group-sales').innerHTML = groupSales == 0 ? '0.00' : `≈ ${Number(groupSales).toFixed(2)}`;
    }
}



$(document).ready(async function () {
    await new Promise(r => setTimeout(r, 1500));
    if (userAddress) {
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        let currentPrice = await dexContract.methods._currentPrice().call();
        currentPrice = web3.utils.fromWei(currentPrice.toString(), 'ether');
        currentPrice = Number(currentPrice);

        const stakeContract = await getCustomContract(web3, stakeContractAddress, stakeABI);
        const hasJoined = await stakeContract.methods.hasPurchased(userAddress).call({ from: userAddress });
        if (hasJoined) {
            updateUserBalances();
            setInterval(updateUserBalances, 6000);

            const listOfReferred = await stakeContract.methods.getReferredList(userAddress).call({ from: userAddress });

            if (listOfReferred.length == 0) {
                document.getElementById('user-list').innerHTML = 'No User Referred';
            }
            else {
                let html = '';
                listOfReferred.forEach(async address => {
                    let saleAmount = await stakeContract.methods.getTotalSalesByReferrer(address).call({ from: userAddress });
                    let userReferList = await stakeContract.methods.getReferredList(address).call({ from: userAddress });
                    html += `<div class="report-item">
                            <div class="first-level">
                            <p><span>${address}</span></p>
                            <p>(<span>${(Number(web3.utils.fromWei(saleAmount.toString(), 'ether')) / currentPrice).toFixed(2)} VGF</span>)</p>
                            </div>
                            <div class="second-level">`;

                    userReferList.forEach(async downline => {
                        html += `<p>- ${downline}</p>`
                    });
                    html += `</div></div>`;
                    // console.log(html)
                    document.getElementById('user-list').innerHTML = html;
                });
                document.getElementById('user-list').innerHTML = html;
            }

        }
        else {
            document.getElementById('user-box').style.display = 'none';
            document.getElementById('refer-box').style.display = 'none';
            document.getElementById('user-join-text').style.display = 'flex';
        }
    }
});
document.getElementById('nav-user').style.color = 'var(--tint)';