const { EthereumProvider } = require("@walletconnect/ethereum-provider");

window.ethProvider = async function (){
    const provider = await EthereumProvider.init({
        projectId,
        chains: [56], 
        showQrModal: true, 
    })

    return provider;
}
