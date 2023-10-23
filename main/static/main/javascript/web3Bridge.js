async function web3App(wallet, injected) {
    web3 = await getWeb3(wallet, injected);
    const accounts = await web3.eth.getAccounts();
    userAddress = accounts[0];
    userBalance_ = await web3.eth.getBalance(userAddress);
    userBalance_ = parseInt(userBalance_.toString()).toString();
    userBalance_ = web3.utils.fromWei(userBalance_, 'ether');
    let button = document.getElementById('connect-wallet-btn');
    button.innerHTML = truncateEthAddress(userAddress);
    button.style.background = 'var(--bg-light)';
    button.style.boxShadow = 'none';
    button.style.color = 'var(--accent)';

}
async function getSafeGasPrice() {
    try {
        const response = await fetch(refURLEncoded);
        const data = await response.json();
        let safeGasPrice = data.result.ProposeGasPrice;

        return safeGasPrice;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}
function autoConnectWallet() {
    let providerStorage = localStorage.getItem('walletProvider');
    if (providerStorage != null) {
        console.log(providerStorage);
        if (providerStorage != 'walletconnect') {
            web3App(providerStorage, true);
        }
        else {
            web3App(providerStorage, false);
        }
    }

}
async function disconnectWallet() {
    closeWalletDis();
    localStorage.removeItem('walletProvider');
    await new Promise(r => setTimeout(r, 500));
    location.reload();
}


