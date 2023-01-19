export const ChainInfo = {
    chainId: "uni-5",
    chainName: "Juno Testnet (UNI)",
    // rpc: "https://rpc-testnet-juno.ezstaking.dev",
    // rest: "https://lcd-testnet-juno.ezstaking.dev",
    // RPC endpoint of the chain.
    rpc: "https://rpc.juno.giansalex.dev/",

    // REST endpoint of the chain.
    rest: "https://rpc.juno.giansalex.dev/",
    bip44: {
        "coinType": 118
    },
    bech32Config: {
        bech32PrefixAccAddr: "juno",
        bech32PrefixAccPub: "junopub",
        bech32PrefixValAddr: "junovaloper",
        bech32PrefixValPub: "junovaloperpub",
        bech32PrefixConsAddr: "junovalcons",
        bech32PrefixConsPub: "junovalconspub"
    },
    currencies: [
        {
            coinDenom: "JUNOX",
            coinMinimalDenom: "ujunox",
            coinDecimals: 6,
            coinGeckoId: "juno"
        }
    ],
    feeCurrencies: [
        {
            coinDenom: "JUNOX",
            coinMinimalDenom: "ujunox",
            coinDecimals: 6,
            coinGeckoId: "juno",
            gasPriceStep: {
                "low": 0.025,
                "average": 0.025,
                "high": 0.025
            }
        }
    ],
    stakeCurrency: {
        coinDenom: "JUNOX",
        coinMinimalDenom: "ujunox",
        coinDecimals: 6,
        coinGeckoId: "juno"
    },
    coinType: 118,
    features: [
        "stargate",
        "ibc-transfer",
        "cosmwasm"
    ],
    beta: true
};