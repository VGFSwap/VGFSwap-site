
function formatBalances(balance, place) {
    const balanceString = balance.toString();
    const [integerPart, decimalPart] = balanceString.split('.');
    const truncatedDecimalPart = decimalPart ? decimalPart.slice(0, place) : '';
    const displayBalance = decimalPart ? `${integerPart}.${truncatedDecimalPart}` : integerPart;
    return displayBalance;
}

function formatNumberWithCommas(number) {
    let numStr = number.toString();

    let parts = numStr.split(".");
    let integerPart = parts[0];
    let decimalPart = parts[1] || "";

    let formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    let formattedNumber = formattedInteger + (decimalPart ? "." + decimalPart : "");

    return formattedNumber;
}


var truncateRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/;

var truncateEthAddress = function (address) {
    var match = address.match(truncateRegex);
    if (!match)
        return address;
    return match[1] + "\u2026" + match[2];
};

const getWeb3 = async (wallet, injected) => {
    closeWallet();
    return new Promise(async (resolve, reject) => {

        if (!injected) {
            var provider = await window.ethProvider();
            provider.enable().then(function (res) {
                web3 = new Web3(provider);
                localStorage.setItem('walletProvider', 'walletconnect');
                resolve(web3)
            });
        }
        else {
            if (typeof window.ethereum !== "undefined") {
                try {
                    let provider = window.ethereum;
                    // edge case if MM and CBW are both installed
                    if (wallet === "metamask") {
                        provider = window.ethereum;
                        await provider.request({
                            method: "eth_requestAccounts",
                            params: [],
                        });
                    }
                    else if (wallet === "coinbase") {
                        if (window.ethereum.providers?.length) {
                            window.ethereum.providers.forEach(async (p) => {
                                if (p.isCoinbaseWallet) provider = p;
                            });
                        }
                        await provider.request({
                            method: "eth_requestAccounts",
                            params: [],
                        });
                    }
                    else if (wallet === "trustwallet") {
                        provider = window.trustwallet;
                        await provider.request({
                            method: "eth_requestAccounts",
                            params: [],
                        });
                    }
                    else if (wallet === "enkrypt") {
                        provider = window.enkrypt;
                        await provider.enable();
                    }
                    else {
                        provider = window.ethereum;
                    }
                    web3 = new Web3(provider);
                    localStorage.setItem('walletProvider', wallet);
                    resolve(web3);
                } catch (error) {
                    console.log(error)
                    openGlobalError("Wallet not installed", 5000)
                }

            }
        }


    });
}



const getTokenContract = async (web3, address) => {
    const tokenContract = new web3.eth.Contract(tokenABI, address);
    return tokenContract;
};

const getCustomContract = async (web3, address, abi) => {
    const contract = new web3.eth.Contract(abi, address);
    return contract;
}

function getRandomNumber(min, max) {
    const randomValue = Math.random() * (max - min) + min;
    return parseFloat(randomValue.toFixed(2));
}


function unixTimestampToDateTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000); 
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
    return formattedDateTime;
}
function convertToCandlestickFormat(rawData, tokenDecimals) {
    const groupedData = new Map();
    for (let i = 0; i < rawData.length; i++) {
        const currentData = rawData[i];
        const timestamp = parseInt(currentData[1]);
        const date = new Date(timestamp * 1000).toISOString().split('T')[0];
        if (!groupedData.has(date)) {
            groupedData.set(date, []);
        }
        groupedData.get(date).push(currentData[0]);
    }
    const candlestickData = [];
    for (const [date, prices] of groupedData) {
        const open = formatBalances((parseFloat(prices[0]) / (10 ** tokenDecimals)), 4);
        const close = formatBalances((parseFloat(prices[prices.length - 1]) / (10 ** tokenDecimals)), 4);
        const high = formatBalances((Math.max(...prices.map(price => parseFloat(price))) / (10 ** tokenDecimals)), 4);
        const low = formatBalances((Math.min(...prices.map(price => parseFloat(price))) / (10 ** tokenDecimals)), 4);

        candlestickData.push({
            time: date,
            open,
            high,
            low,
            close,
        });
    }
    return candlestickData;
}
