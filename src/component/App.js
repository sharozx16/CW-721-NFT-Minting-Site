import React, {useEffect, useState} from "react"
import {SigningCosmWasmClient} from "@cosmjs/cosmwasm-stargate";
import {IPFS} from "../ipfs";
import {CONTRACT_ADDRESS, MARKET, MINT, POSSIBLE_STATES, VIEW_OWNER, VIEW_TOKEN} from "../constants";
import {calculateFee, GasPrice} from "@cosmjs/stargate";
import logo from "../logo.svg";
import logo2 from "../juno.svg";
import Loading from "./Loading";
import Accounts from "./Accounts";
import Market from "../pages/Market";
import ViewOwner from "../pages/VIewOwner";
import "../App.css";
import getQueryContract from "../utils/getQueryContract";
import {ChainInfo} from "../constants/ChainInfo";

const App = () => {
    const [cwClient, setCwClient] = useState(null);
    const [offlineSigner, setOfflineSigner] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState("");
    const [minting, setMinting] = useState(false);
    const [files, setFiles] = useState([]);
    const [image, setImage] = useState(null);
    const [ipfsImage, setIpfsImage] = useState(null);
    const [logs, setLogs] = useState([]);
    const [nfts, setNfts] = useState(null)
    const [metadata, setMetadata] = useState({name: "", description: "", image: null})
    const [accounts, setAccounts] = useState(null);
    const [userAddress, setUserAddress] = useState(null);
    const [isSending, setIsSending] = useState(null);
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [tokenURI, setTokenURI] = useState(null);

    const [currentState, setCurrentState] = useState(MARKET);
    const [filesJSX, setFilesJSX] = useState(null)


    const getKeplr = async () => {
        if (window.keplr)
            return window.keplr

        if (document.readyState === "complete")
            return window.keplr;

        return new Promise((resolve) => {
            const documentStateChange = (event) => {
                if (
                    event.target &&
                    (event.target).readyState === "complete"
                ) {
                    resolve(window.keplr);
                    document.removeEventListener("readystatechange", documentStateChange);
                }
            };

            document.addEventListener("readystatechange", documentStateChange);
        })
    }

    const connectWallet = async () => {
        const keplr = await getKeplr();

        if (!window.getOfflineSigner && !window.keplr && !keplr) {
            alert("Please install keplr to continue.");
            window.open("https://www.keplr.app/", '_blank');
            return;
        }

        if (window.keplr.experimentalSuggestChain) {
            try {
                await window.keplr.experimentalSuggestChain(ChainInfo);
            } catch (error) {
                console.log(error)
                return;
            }
        } else {
            alert('Please use the recent version of keplr extension');
            return;
        }

        try {
            await keplr.enable(ChainInfo.chainId);
            await window.keplr.enable(ChainInfo.chainId)
            const offlineSigner = await window.getOfflineSignerOnlyAmino(ChainInfo.chainId)

            const cwClient = await SigningCosmWasmClient.connectWithSigner(
                ChainInfo.rpc,
                offlineSigner
            );

            const accounts = await offlineSigner.getAccounts();
            const userAddress = accounts[0].address;


            Promise.resolve()
                .then(() => {
                    setAccounts(accounts);
                    setUserAddress(userAddress);
                    setCwClient(cwClient);
                    setOfflineSigner(offlineSigner)
                })
                .catch((e) => console.error(`Error in Promise`))


        } catch (e) {
            console.error(`Error in connectWallet()`, e);
            return;
        }
    }

    //NOTE:: update Accounts with balance and Loading NFTS
    useEffect(() => {
        (async () => {
            if (accounts && cwClient)
                await getBalances();
            await loadNfts()
        })()
    }, [cwClient]);

    //NOTE:: Handling File Upload JSX
    useEffect(() => {
        if (files.length > 0) {
            const jsx = files.map((file, i) => {
                return (
                    (
                        <li className="text-sm p-1" key={"file-" + i}>
                            <p>{file.name}</p>
                            <button
                                className="btn btn-danger btn-reset"
                                type="button"
                                onClick={clearFiles}
                                title="Remove file"
                            >
                                Reset
                            </button>
                        </li>
                    )
                )
            });

            setFilesJSX(jsx);
        }
    }, [files]);


    const resetMetadataForm = async () => {
        const metadata = {
            name: "",
            description: "",
            image: null,
        };

        setMetadata(metadata);
        setImage(null);
        setIpfsImage(null);

        try {
            const dropzone = document.getElementById("dropzone");
            if (dropzone) {
                dropzone.classList.remove("ok");
                dropzone.classList.add("waiting");
            }
        } catch (e) {
            console.warn("Dropzone classes were not correctly cleaned up", e);
        }
    };

    const getBalances = async () => {

        if (!ChainInfo)
            return;
        else if (!ChainInfo['chainName'])
            return;
        else if (!ChainInfo['currencies'])
            return;
        else if (!ChainInfo['currencies'].length)
            return;

        // console.log('CALLED', '###########', accounts);

        setLoadingStatus(true)
        setLoadingMsg("Updating account balances...")

        if (accounts) {
            if (accounts.length) {
                for (let i = 0; i < accounts.length; i++) {
                    // console.log('CALLED', '###########', accounts[i]);
                    if (accounts[i]["address"]) {
                        try {
                            console.log("address", accounts[i].address);
                            const balance = await cwClient.getBalance(
                                accounts[i].address,
                                ChainInfo.currencies[0].coinMinimalDenom
                            );
                            // console.log('CALLED', '###########', balance);

                            const _accounts = [...accounts];

                            _accounts[i].balance = balance;

                            setLoadingStatus(false);
                            setLoadingMsg("");
                            setAccounts(_accounts);

                            console.log("Balance updated", _accounts[i].balance);
                        } catch (e) {
                            console.error("Error occurred in getBalance()", e)
                            // console.error("Error reading account address", [
                            //     String(e),
                            //     accounts[i],
                            // ]);

                            setLoadingStatus(false);
                            setLoadingMsg("");

                            return;
                        }
                    } else {
                        console.error(
                            "Failed to resolve account address at index " + i,
                            accounts[i]
                        );
                    }
                }
            } else {
                setLoadingStatus(false);
                setLoadingMsg("");

                console.error("Failed to resolve Keplr wallet");
            }
        } else {
            setLoadingStatus(false);
            setLoadingMsg("");

            console.warn("Failed to resolve Keplr wallet");
        }
    };

    const loadNfts = async () => {
        // Load NFTs
        try {
            // All NFTs (of contract)
            const nfts = await getNfts();
            console.log("All NFTs", nfts);
            // Iterate ID's and get token data
            await loadNftData(nfts,);
        } catch (e) {
            console.error("Error loading NFTs", {
                nfts: nfts,
                user: accounts,
                error: e,
            });
        }
    };

    const loadNftData = async (nfts = null,) => {
        try {
            if (!nfts) {
                console.error("No NFTs; nothing to query", nfts);
                return;
            } else if (!nfts?.tokens) {
                console.error("No NFTs; nothing to query", nfts);
                return;
            }

            for (let i = 0; i < nfts.tokens.length; i++) {
                let id = nfts.tokens[i];
                console.log("Requesting data for token " + id);
                const data = await getTokenMeta(id);
                let resolvedMetadata = data;
                resolvedMetadata.id = id;
                nfts.tokens[i] = resolvedMetadata;
                if (i === nfts.tokens.length - 1) {
                    setNfts(nfts);
                    console.log("Finished loading NFTs", nfts);
                }
            }
        } catch (e) {
            console.error("Error occurred in loadNftData()", e)
        }
    };

    const getTokenMeta = async (tokenId = false) => {
        try {
            if (!tokenId || typeof tokenId !== "string") {
                console.error(
                    "Invalid token ID. Token ID must be a string, but got " + typeof tokenId
                );
                return;
            }

            let entrypoint = {
                nft_info: {
                    token_id: tokenId,
                },
            };

            setLoadingStatus(true);
            setLoadingMsg("Loading NFT data of token " + tokenId + "...")

            const queryHandler = getQueryContract(cwClient);
            const query = await queryHandler(CONTRACT_ADDRESS, entrypoint);

            if (query?.token_uri) {
                // query.extension.image = query?.token_uri
                // if (query.extension.image) {
                //     query.extension.image = query.extension.image.replace(
                //         "ipfs://",
                //         IPFS.ipfsGateway
                //     );
                // }
            }

            entrypoint = {
                owner_of: {
                    token_id: tokenId,
                },
            };
            let ownerQuery = await queryHandler(
                CONTRACT_ADDRESS,
                entrypoint
            );

            if (ownerQuery["owner"])
                query.owner = ownerQuery.owner;
            if (ownerQuery["approvals"])
                query.approvals = ownerQuery.approvals;

            console.log(
                "NFT contract successfully queried for token ID " + tokenId,
                query
            );

            setLoadingStatus(false);
            setLoadingMsg("");

            return query;
        } catch (e) {
            console.error("Error occurred in getTokenMeta()", e)
        }
    };

    const getNfts = async () => {
        try {
            const entrypoint = {
                all_tokens: {},
            };

            setLoadingStatus(true);
            setLoadingMsg("Loading all NFTs of contract " + CONTRACT_ADDRESS + "...")

            const queryHandler = getQueryContract(cwClient);
            const query = await queryHandler(CONTRACT_ADDRESS, entrypoint);
            console.log("Market NFTs", query);


            setLoadingStatus(false);
            setLoadingMsg("");

            return query;
        } catch (e) {
            console.error('Error occurred in getNfts()');
        }
    };

    const mintNft = async (tokenURI) => {
        if (
            !metadata.name ||
            !metadata.description ||
            !metadata.image
        ) {
            console.error(
                "Error resolving NFT name or description metadata",
                metadata
            );
            return;
        }

        console.log("metadata if clear")
        // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
        if (!accounts) {
            console.warn("Error getting user", accounts);
            return;
        } else if (!accounts.length) {
            console.warn("Error getting user", accounts);
            return;
        }

        console.log("account if clear")
        // Refresh NFT market to get last minted ID
        await loadNfts();
        console.log("NFTS loaded")

        setMinting(true);
        setLoadingStatus(true);
        setLoadingMsg("Minting nft...");

        console.log("state is set")

        const tokenId = nfts?.tokens?.length + 1 || 1;

        // Prepare Tx
        let entrypoint = {
            mint: {
                token_id: String(tokenId),
                owner: accounts[0].address,
                token_uri: metadata?.image,
                extension: null
            },
        };

        console.log("Entrypoint", entrypoint);

        console.log("Tx args", {
            senderAddress: accounts[0].address,
            contractAddress: CONTRACT_ADDRESS,
            msg: entrypoint,
        });

        try {
            console.log("starting try")
            // Send Tx
            // const temp = {mint:{token_id:"1",owner:this.state.accounts[0].address,token_uri:"abcd"}};
            const txFee = calculateFee(3000000, GasPrice.fromString(
                "10000000" + ChainInfo.currencies[0].coinMinimalDenom
            ));

            let tx = await cwClient.execute(
                accounts[0].address,
                CONTRACT_ADDRESS,
                entrypoint,
                txFee
            );

            console.log("starting tx")

            console.log("Mint Tx", tx);

            setLoadingStatus(false);
            setLoadingMsg("");
            setMinting(false);

            // Reset minting form
            await resetMetadataForm();

            // Update Logs
            if (tx.logs) {
                if (tx.logs.length) {
                    tx.logs[0].type = "mint";
                    tx.logs[0].timestamp = new Date().getTime();

                    setLogs([JSON.stringify(tx.logs, null, 2), ...logs])
                }
            }
            // Refresh NFT collections (all NFTs and NFTs owned by end user)
            await loadNfts();
            if (accounts.length) {
                await getBalances();
            }
        } catch (e) {
            console.error("Error executing mint tx", e);
            setLoadingStatus(false);
            setLoadingMsg("");
            setMinting(false);
        }
    };

    const transferNft = async (recipient = null, tokenId = null) => {
        // SigningCosmWasmClient.execute: async (senderAddress, contractAddress, msg, fee, memo = "", funds)
        if (!accounts) {
            console.warn("Error getting user", accounts);
            return;
        } else if (!accounts.length) {
            console.warn("Error getting user", accounts);
            return;
        } else if (!tokenId || !recipient) {
            console.warn(
                "Nothing to transfer (check token ID and recipient address)",
                {token_id: tokenId, recipient: recipient}
            );
            return;
        }
        // Prepare Tx
        let entrypoint = {
            transfer_nft: {
                recipient: recipient,
                token_id: tokenId,
            },
        };

        setIsSending(true);
        setLoadingStatus(true);
        setLoadingMsg("Transferring NFT to " + recipient + "...")

        // Send Tx
        try {
            let tx = await cwClient.execute(
                accounts[0].address,
                CONTRACT_ADDRESS,
                entrypoint,
                "auto"
            );

            console.log("Transfer Tx", tx);

            setIsSending(false);
            setLoadingStatus(false);
            setLoadingMsg("");

            // Update logs
            if (tx.logs) {
                if (tx.logs.length) {
                    tx.logs[0].type = "transfer_nft";
                    tx.logs[0].timestamp = new Date().getTime();

                    setLogs([JSON.stringify(tx.logs, null, 2), ...logs])
                }
            }

            // Refresh NFT collections (all NFTs and NFTs owned by end user)
            await loadNfts();
            if (accounts.length) {
                await getBalances();
            }
        } catch (e) {
            console.warn("Error executing transfer tx", e);

            setIsSending(false);
            setLoadingStatus(false);
            setLoadingMsg("");
        }
    };

    // Form handlers
    const onChangeHandler = (event) => {
        const {id, value} = event.target;
        setMetadata(prevState => ({...prevState, [id]: value}));
    }

    const changeDisplayState = async (state = 0, account = null) => {
        if (typeof state !== "number") {
            return;
        } else if (state < 0 || state > POSSIBLE_STATES.length - 1) {
            console.warn(
                "An invalid state was selected. State must be an integer within range 0 and " +
                (POSSIBLE_STATES.length - 1),
                state
            );
            return;
        }

        setSelectedOwner(() => {
            if (account)
                return accounts
            return null
        });

        setCurrentState(state);

        switch (state) {
            case MARKET: {
                await loadNfts();
                break;
            }
            case MINT: {
                resetMetadataForm();
                break;
            }
            case VIEW_TOKEN: {
                break;
            }
            case VIEW_OWNER: {
                console.log("Viewing NFTs of owner", account);
                break;
            }
            default: {
                break;
            }
        }
    };

    const readyToMint = async () => {
        try {

            const response = await IPFS.uploadJSON(metadata);
            // setTokenURI(response?.pinataURL)

            console.log(response, "*********** IFS JSON UPLOAD");
            const _res = await mintNft(response?.pinataURL);
            // console.log(_res, "************* MINT NFT");
        } catch (e) {
            console.error(`ERROR IN readyToMint func`, e);
        }
    };

    // File handlers
    const onChange = async (event) => {
        try {
            event.preventDefault();
            const resp = await IPFS.uploadFile(event.target.files[0]);
            setMetadata(prevState => ({...prevState, image: resp?.pinataURL}))

            setFiles([...event.target.files])
        } catch (err) {
            console.log(err);
        }
    };

    const clearFiles = () => {
        setFiles([]);
        setFilesJSX(null);
    };

    const dragover = (event) => {
        event.preventDefault();
        if (!event.currentTarget.classList.contains("ok")) {
            event.currentTarget.classList.add("hovering");
        }
    };

    const dragleave = (event) => event.currentTarget.classList.remove("hovering");

    const drop = (event) => {
        event.preventDefault();
        event.currentTarget.classList.remove("waiting");
        event.currentTarget.classList.add("ok");

        setFiles(Array.from(event.dataTransfer.files))

        console.log("Dropped files", {
            FileList: event.dataTransfer.files,
            Array: files,
        });
    }

    const logMeta = [];
    for (let i = 0; i < logs.length; i++) {
        let logItem = JSON.parse(logs[i]);
        let meta = {
            type: logItem[0].type,
            timestamp: logItem[0].timestamp,
        };
        logMeta.push(meta);
    }

    const logItems = logs.length
        ? logs.map((log, i) => (
            <div key={logMeta[i].timestamp}>
                <p className="label">
                    <strong>
                        <span>{logMeta[i].type}&nbsp;</span>({logMeta[i].timestamp}):
                    </strong>
                </p>
                <pre className="log-entry" key={i}>
              {log}
            </pre>
            </div>
        ))
        : null;


    // Not Connected
    if (!userAddress) {
        return (
            <div className="content">
                <div className="row">
                    <img src={logo} alt="logo" height={"100px"} width={"100px"}/>
                    <img src={logo2} alt="logo2" height={"100px"} width={"100px"}/>
                </div>

                <div className="button-controls">
                    <button
                        id="connect"
                        className="btn btn-main"
                        onClick={connectWallet}
                    >
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    } else if (currentState === MINT) {
        return (
            <div className="content">
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div
                        className="collapse navbar-collapse"
                        id="navbarSupportedContent"
                    >
                        <ul className="navbar-nav mr-auto">
                            <li className="nav-item">
                                <button
                                    className={`btn ${
                                        currentState === MARKET ? "btn-primary" : "btn-inverse"
                                    }`}
                                    onClick={() => changeDisplayState(MARKET)}
                                >
                                    Market
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`btn ${
                                        currentState === MINT ? "btn-primary" : "btn-inverse"
                                    }`}
                                    onClick={() => this.changeDisplayState(MINT)}
                                >
                                    Mint
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`btn ${
                                        currentState === VIEW_OWNER ? "btn-primary" : "btn-inverse"
                                    }`}
                                    onClick={() => changeDisplayState(VIEW_OWNER)}
                                >
                                    My NFTs
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                <br/>
                <br/>
                <img src={logo} alt="logo" height={"100px"} width={"100px"}/>
                <img src={logo2} alt="logo2" height={"100px"} width={"100px"}/>
                {/* Account balance */}
                <br/>
                <br/>
                <div className="accounts">
                    <div className="status status-display balances">
                        <ul className="status accounts-list">
                            <li className="accounts account-item">
                                {/* Address */}
                                <strong>Account:</strong>&nbsp;
                                <span>{accounts[0].address}</span>
                                {/* Balance */}
                                <div>
                                    <strong>Balance:</strong>&nbsp;
                                    <span>
                            {parseInt(accounts[0]?.balance?.amount) /
                                1000000 +
                                " " +
                                ChainInfo?.currencies[0].coinDenom}
                    </span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mint">
                    <h3>Minter</h3>

                    <div className="minting-form">
                        {/* Name */}
                        <div className="name">
                            <label htmlFor="nft_name">
                                <strong>Name:</strong>
                            </label>
                            <input
                                id="name"
                                type="text"
                                name="nft_name"
                                className="form-control"
                                value={metadata.name}
                                onChange={onChangeHandler}
                                placeholder="My NFT name"
                            />
                        </div>

                        {/* Description */}
                        <div className="description">
                            <label htmlFor="nft_descr">
                                <strong>Description:</strong>
                            </label>
                            <textarea
                                id="description"
                                name="nft_descr"
                                className="form-control"
                                value={metadata?.description}
                                onChange={onChangeHandler}
                            ></textarea>
                        </div>

                        {/* Image */}
                        <div className="image">
                            <p className="art">
                                <label>
                                    <strong>Art:</strong>
                                </label>
                                <br/>
                                <span style={{fontStyle: "italic"}}>
                    *accepted file types: png, gif, jpeg
                  </span>
                            </p>
                            <div
                                id="dropzone"
                                className="dropzone waiting"
                                onDragOver={dragover}
                                onDragLeave={dragleave}
                                onDrop={drop}
                            >
                                <input
                                    type="file"
                                    name="fields[assetsFieldHandle][]"
                                    id="assetsFieldHandle"
                                    className="hidden"
                                    onChange={onChange}
                                    accept="image/png, image/gif, image/jpeg"
                                />
                                <label
                                    htmlFor="assetsFieldHandle"
                                    className="block cursor-pointer"
                                >
                                    <div>
                                        <p className="instr-t">Drag and drop NFT art here</p>
                                    </div>
                                </label>

                                {/* Dropped files */}
                                <ul className="files-list-ul">{filesJSX}</ul>
                            </div>

                            <div className="controls minting-controls">
                                <button
                                    className="btn btn-primary"
                                    onClick={readyToMint}
                                >
                                    Mint NFT
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                <br/>
                <br/>
                <Loading msg={loadingMsg}/>
                {/*{Loading(loadingMsg)}*/}

                {/* Logs map */}
                <br/>
                <br/>
                <div className="logs">
                    <div>{logItems}</div>
                </div>
            </div>
        );
    }

    // Connected
    return (
        <div className="content">
            <nav className="navbar navbar-expand-lg navbar-light bg-light">
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item">
                            <button
                                className={`btn ${
                                    currentState === MARKET ? "btn-primary" : "btn-inverse"
                                }`}
                                onClick={() => changeDisplayState(MARKET)}
                            >
                                Market
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`btn ${
                                    currentState === MINT ? "btn-primary" : "btn-inverse"
                                }`}
                                onClick={() => changeDisplayState(MINT)}
                            >
                                Mint
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`btn ${
                                    currentState === VIEW_OWNER ? "btn-primary" : "btn-inverse"
                                }`}
                                onClick={() => changeDisplayState(VIEW_OWNER)}
                            >
                                My NFTs
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            <br/>
            <br/>
            <div className="row">
                <img src={logo} alt="logo" height={"100px"} width={"100px"}/>
                <img src={logo2} alt="logo2" height={"100px"} width={"100px"}/>
            </div>

            {/* Account balance */}
            <br/>
            <br/>
            <Accounts accounts={accounts} coinDenom={ChainInfo.currencies[0].coinDenom}/>
            {/*{Accounts(accounts, CHAIN_META.currencies[0].coinDenom)}*/}

            {/* Current View */}
            <br/>
            <br/>
            {View(currentState, nfts, accounts, transferNft)}

            {/* Loading */}
            <br/>
            <br/>
            {Loading(loadingMsg)}

            {/* Logs map */}
            <br/>
            <br/>
            <div className="logs">
                <div>{logItems}</div>
            </div>
        </div>
    );
};

function View(state, nfts, accounts, transferNft) {
    if (typeof state !== "number") {
        return;
    } else if (state < 0 || state > POSSIBLE_STATES.length - 1) {
        console.warn(
            "An invalid state was selected. State must be an integer within range 0 and ",
            state
        );
        return;
    }

    switch (state) {
        case MARKET: {
            return <Market accounts={accounts} nfts={nfts}/>
        }

        case VIEW_OWNER: {
            return <ViewOwner nfts={nfts} accounts={accounts} transferNft={transferNft}/>
        }
        default: {
            return <></>;
        }
    }
}

export default App;