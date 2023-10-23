const web3ProviderUrl = ''; 
const maxsupply = '';
async function updateOrderBook() {
    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(web3ProviderUrl));
        const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
        let currentPrice = await dexContract.methods._currentPrice().call()
        document.getElementById('nav-price').innerHTML = `$${formatBalances(web3.utils.fromWei(currentPrice.toString(), 'ether'), 3)}`
        const tokenContract = await getCustomContract(web3, tokenAddress, tokenABI);
        let bunedAmount = await tokenContract.methods.balanceOf('0x000000000000000000000000000000000000dEaD').call();
        if (window.location.pathname === '/') {
            document.getElementById('cover-price').innerHTML = `$${formatBalances(web3.utils.fromWei(currentPrice.toString(), 'ether'), 3)}`
            document.getElementById('burned').innerHTML = `${formatNumberWithCommas(formatBalances(parseInt(burnedAmount) / 10 ** tokenDecimals, 2))} VGF`;
            document.getElementById('circular').innerHTML = `${formatNumberWithCommas(maxsupply - formatBalances(parseInt(burnedAmount) / 10 ** tokenDecimals, 2))} VGF`;
        }
        if (window.location.pathname === "/dex/") {
            document.title = `$${formatBalances(web3.utils.fromWei(currentPrice.toString(), 'ether'), 4)} - DEX | VGFSWAP`
            let buyOrders = await dexContract.methods.getBuyOrders().call();
            let sellOrders = await dexContract.methods.getSellOrders().call();
            let html = ''
            buyOrders.forEach(order => {
                if (!order.executed && !order.revoked) {
                    html += `<li class="dex-stat-item buy-item">
                        <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                        <h4>${parseInt(order.amount - order.completed) / 10 ** tokenDecimals}</h4>
                    </li>`
                }
            });
            document.getElementById('buy-order-bracket').innerHTML = html;
            html = ''
            sellOrders.forEach(order => {
                if (!order.executed && !order.revoked) {
                    html += `<li class="dex-stat-item sell-item">
                        <p>${web3.utils.fromWei(order.price.toString(), 'ether')}</p>
                        <h4>${parseInt(order.amount - order.completed) / 10 ** tokenDecimals}</h4>
                    </li>`
                }
            });
            document.getElementById('sell-order-bracket').innerHTML = html;
        }

    } catch (error) {
        console.error("Error:", error);
    }
}
async function updateChartData() {
    const web3 = new Web3(new Web3.providers.HttpProvider(web3ProviderUrl));
    const dexContract = await getCustomContract(web3, dexContractAddress, dexContractABI);
    const priceEvents = await dexContract.methods.getPriceEvents().call()
    const chartData = convertToCandlestickFormat(priceEvents, 18);
    return chartData;
}

$(document).ready(async function () {
    await new Promise(r => setTimeout(r, 1000));
    updateOrderBook();
    setInterval(updateOrderBook, 5000);

});
