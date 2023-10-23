async function updateDexBalances() {
    if (userAddress) {
        const usdtContract = await getTokenContract(web3, usdtAddress);
        let usdtBalance = await usdtContract.methods.balanceOf(userAddress).call({ from: userAddress });
        usdtBalance = usdtBalance.toString();
        usdtDexBalance = web3.utils.fromWei(usdtBalance, 'ether');
        document.getElementById('dex-usdt-balance').innerHTML = usdtDexBalance == 0 ? '0.00' : Number(usdtDexBalance).toFixed(2);

        const tokenContract = await getTokenContract(web3, tokenAddress);
        let tokenBalance = await tokenContract.methods.balanceOf(userAddress).call({ from: userAddress });
        tokenDexBalance = parseInt(tokenBalance) / 10 ** tokenDecimals;
        document.getElementById('dex-token-balance').innerHTML = tokenDexBalance == 0 ? '0.00' : Number(tokenDexBalance).toFixed(2);

    }
}

async function updateOrderList() {
    if (userAddress) {
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        let buyOrders = await dexContract.methods.getBuyOrders().call({ from: userAddress });
        let sellOrders = await dexContract.methods.getSellOrders().call({ from: userAddress });
        let html = `<div class="order-item-head">
                        <p>Timestamp</p>
                        <p>Side</p>
                        <p>Price</p>
                        <p>Amount</p>
                        <p>Completed</p>
                        <a>Revoke</a>
                    </div>`;
        for (let i = 0; i < buyOrders.length; i++) {
            let order = buyOrders[i];
            if (!order.executed && !order.revoked && order.user === userAddress) {
                html += ` <div class="order-item">
                        <p>${unixTimestampToDateTime(order.timestamp)}</p>
                        <p class="buy-side">Buy</p>
                        <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                        <p>${parseInt(order.amount) / 10 ** tokenDecimals}</p>
                        <p>${parseInt(order.completed) / 10 ** tokenDecimals}</p>
                        <a class="remove-btn" onclick="revokeBuyOrder(${i})">Revoke</a>
                    </div>`
            }
        };
        for (let i = 0; i < sellOrders.length; i++) {
            let order = sellOrders[i];
            if (!order.executed && !order.revoked && order.user === userAddress) {
                html += ` <div class="order-item">
                        <p>${unixTimestampToDateTime(order.timestamp)}</p>
                        <p class="sell-side">Sell</p>
                        <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                        <p>${parseInt(order.amount) / 10 ** tokenDecimals}</p>
                        <p>${parseInt(order.completed) / 10 ** tokenDecimals}</p>
                        <a class="remove-btn" onclick="revokeSellOrder(${i})">Revoke</a>
                    </div>`
            }
        };
        document.getElementById('active-orders').innerHTML = html;

        html = `<div class="order-item-head">
                <p>Timestamp</p>
                <p>Side</p>
                <p>Price</p>
                <p>Amount</p>
            </div>`

        buyOrders.forEach(order => {
            if (order.executed && !order.revoked && order.user === userAddress) {
                html += `<div class="order-item">
                            <p>${unixTimestampToDateTime(order.timestamp)}</p>
                            <p class="buy-side">Buy</p>
                            <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                            <p>${parseInt(order.amount) / 10 ** tokenDecimals}</p>
                        </div>`
            }
        });
        sellOrders.forEach(order => {
            if (order.executed && !order.revoked && order.user === userAddress) {
                html += ` <div class="order-item">
                            <p>${unixTimestampToDateTime(order.timestamp)}</p>
                            <p class="sell-side">Sell</p>
                            <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                            <p>${parseInt(order.amount) / 10 ** tokenDecimals}</p>
                        </div>`
            }
        });
        document.getElementById('executed-orders').innerHTML = html;

    }
}


function calculateBuyTotal() {
    let buyPrice = document.getElementById('buy-price').value;
    let buyAmount = document.getElementById('buy-amount').value;
    if (buyPrice === '') {
        buyPrice = 0;
    }
    if (buyAmount === '') {
        buyAmount = 0;
    }

    let totalAmount = parseFloat(buyPrice) * parseFloat(buyAmount);
    totalAmount = formatBalances(totalAmount, 2);
    document.getElementById('total-buy-amount').innerHTML = totalAmount == 0 ? '0.00' : totalAmount;
}

function calculateSellTotal() {
    let sellPrice = document.getElementById('sell-price').value;
    let sellAmount = document.getElementById('sell-amount').value;
    if (sellPrice === '') {
        sellPrice = 0;
    }
    if (sellAmount === '') {
        sellAmount = 0;
    }

    let totalAmount = parseFloat(sellPrice) * parseFloat(sellAmount);
    totalAmount = formatBalances(totalAmount, 2);
    document.getElementById('total-sell-amount').innerHTML = totalAmount == 0 ? '0.00' : totalAmount;
}

const buyButtonPressed = async () => {
    let buyPrice = document.getElementById('buy-price').value;
    let buyAmount = document.getElementById('buy-amount').value;
    buyAmount = Number(buyAmount);
    buyPrice = Number(buyPrice);
    if (buyPrice != 0 && buyPrice != '' && buyAmount != 0 && buyAmount != '') {
        showDexRoller('buy');
        valid = true;
        if (buyAmount < minTradeAmount) {
            valid = false;
            openGlobalError(`Min Trade Amount is ${minTradeAmount}`, 5000);
            hideDexRoller();
        }
        let amountToDeduct = parseFloat(buyPrice) * parseFloat(buyAmount);
        if (amountToDeduct > usdtDexBalance) {
            valid = false;
            openGlobalError("No Enough USDT Balance", 6000);
            hideDexRoller();
        }

        if (valid) {
            let amount = web3.utils.toWei(amountToDeduct.toString(), 'ether');
            const fetchedGasPrice = await getSafeGasPrice();
            if (fetchedGasPrice) {
                const usdtContract = await getTokenContract(web3, usdtAddress);
                let allowance = await usdtContract.methods.allowance(userAddress, dexContractAddress).call();
                console.log("Allowance:", allowance);

                if (Number(allowance) < Number(amount)) {
                    await usdtContract.methods.approve(dexContractAddress, web3.utils.toWei(usdtDexBalance.toString(), 'ether')).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                        .on('receipt', function (receipt) {
                            console.log('receipt:', receipt);
                        })
                        .on('error', function (error, receipt) {
                            hideDexRoller();
                        })
                }
                buyPrice = web3.utils.toWei(buyPrice.toString(), 'ether');
                buyAmount = buyAmount * 10 ** tokenDecimals;
                const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
                dexContract.methods.placeBuyOrder(buyPrice, buyAmount).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                    .on('transaction', function (hash) {
                        console.log("Transaction: ", hash);
                    })
                    .on('receipt', function (receipt) {
                        console.log('receipt:', receipt);
                        openGlobalInfo("Order Placed", 6000);
                        hideDexRoller();
                    })
                    .on('error', function (error, receipt) {
                        console.log('Error:', error);
                        console.log('Error:', receipt);
                        openGlobalError("Transaction Failed", 6000);
                        hideDexRoller();
                    })

            }
            else {
                openGlobalError("Something went wrong, please try after some time", 10000);
                hideDexRoller();
            }
        }
        else {
            hideDexRoller();
        }
    }
}


const sellButtonPressed = async () => {
    let sellPrice = document.getElementById('sell-price').value;
    let sellAmount = document.getElementById('sell-amount').value;
    sellAmount = Number(sellAmount);
    sellPrice = Number(sellPrice);
    if (sellPrice != 0 && sellPrice != '' && sellAmount != 0 && sellAmount != '') {
        showDexRoller('sell');
        valid = true;
        if (sellAmount < minTradeAmount) {
            valid = false;
            openGlobalError(`Min Trade Amount is ${minTradeAmount}`, 5000);
            hideDexRoller();
        }
        let amountToDeduct = sellAmount;
        if (amountToDeduct > tokenDexBalance) {
            valid = false;
            openGlobalError("No Enough Token Balance", 6000);
            hideDexRoller();
        }

        if (valid) {
            let amount = amountToDeduct * 10 ** tokenDecimals;
            const fetchedGasPrice = await getSafeGasPrice();
            if (fetchedGasPrice) {
                const tokenContract = await getTokenContract(web3, tokenAddress);
                let allowance = await tokenContract.methods.allowance(userAddress, dexContractAddress).call();
                console.log("Allowance:", allowance);

                if (Number(allowance) < Number(amount)) {
                    await tokenContract.methods.approve(dexContractAddress, (tokenDexBalance * 10 ** tokenDecimals).toString()).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                        .on('receipt', function (receipt) {
                            console.log('receipt:', receipt);
                        })
                        .on('error', function (error, receipt) {
                            hideDexRoller();
                        })
                }
                sellPrice = web3.utils.toWei(sellPrice.toString(), 'ether');
                sellAmount = sellAmount * 10 ** tokenDecimals;
                const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
                dexContract.methods.placeSellOrder(sellPrice.toString(), sellAmount.toString()).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
                    .on('transaction', function (hash) {
                        console.log("Transaction: ", hash);
                    })
                    .on('receipt', function (receipt) {
                        console.log('receipt:', receipt);
                        openGlobalInfo("Order Placed", 6000);
                        hideDexRoller();
                    })
                    .on('error', function (error, receipt) {
                        console.log('Error:', error);
                        console.log('Error:', receipt);
                        openGlobalError("Transaction Failed", 6000);
                        hideDexRoller();
                    })

            }
            else {
                openGlobalError("Something went wrong, please try after some time", 10000);
                hideDexRoller();
            }
        }
        else {
            hideDexRoller();
        }
    }
}

const revokeBuyOrder = async (order_id) => {
    const fetchedGasPrice = await getSafeGasPrice();
    if (fetchedGasPrice) {
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        dexContract.methods.revokeBuyOrder(order_id).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
            .on('transaction', function (hash) {
                console.log("Transaction: ", hash);
            })
            .on('receipt', function (receipt) {
                console.log('receipt:', receipt);
                openGlobalInfo("Order Removed", 6000);
                hideDexRoller();
            })
            .on('error', function (error, receipt) {
                console.log('Error:', error);
                console.log('Error:', receipt);
                openGlobalError("Transaction Failed", 6000);
                hideDexRoller();
            })
    }
    else {
        openGlobalError("Something went wrong, please try after some time", 10000);
    }
}

const revokeSellOrder = async (order_id) => {
    const fetchedGasPrice = await getSafeGasPrice();
    if (fetchedGasPrice) {
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        dexContract.methods.revokeSellOrder(order_id).send({ from: userAddress, gas: gasLimit, gasPrice: web3.utils.toWei(fetchedGasPrice, 'gwei') })
            .on('transaction', function (hash) {
                console.log("Transaction: ", hash);
            })
            .on('receipt', function (receipt) {
                console.log('receipt:', receipt);
                openGlobalInfo("Order Removed", 6000);
                hideDexRoller();
            })
            .on('error', function (error, receipt) {
                console.log('Error:', error);
                console.log('Error:', receipt);
                openGlobalError("Transaction Failed", 6000);
                hideDexRoller();
            })
    }
    else {
        openGlobalError("Something went wrong, please try after some time", 10000);
    }
}
document.getElementById('nav-dex').style.color = 'var(--tint)';