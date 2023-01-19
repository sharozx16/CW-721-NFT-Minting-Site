import React from "react";

function ViewOwner({nfts, accounts, transferNft}) {

    if (!nfts || !accounts)
        return null;

    if (!accounts[0])
        return null;

    if (!nfts["tokens"]) {
        return (
            <div>
                <p>There are no NFTs in this collection</p>
            </div>
        );
    }

    if (!nfts["tokens"].length) {
        return (
            <div>
                <p>There are no NFTs in this collection</p>
            </div>
        );
    }

    const userNfts = nfts.tokens.filter((token) => {
        if (token.owner) {
            if (token.owner === accounts[0].address) return token;
            else return false;
        } else {
            return false;
        }
    });

    if (!userNfts.length) {
        return (
            <div>
                <p>You don't own any NFTs from this collection</p>
            </div>
        );
    }

    const tokens = [];
    for (const token of userNfts) {
        const image = token.token_uri ? token.token_uri : null;
        let name = token?.extension?.name ? token?.extension?.name : null;
        let description = token.extension?.description
            ? token?.extension?.description
            : null;
        let owner = token.owner === accounts[0].address ? "You" : token.owner;
        tokens.push(
            <div className="card" key={token.id}>
                <div className="wrapper">
                    <img className="card-img-top" src={image} alt={description}/>
                    <div className="card-body">
                        <h5 className="card-title">{name}</h5>
                        <p className="card-text">{description}</p>
                        <div className="id">
                            <p>
                                <strong>Token ID:</strong> {token.id}
                            </p>
                        </div>
                        <div className="owner">
                            <p>
                                <strong>Owned by:</strong>&nbsp;
                                <span>{owner}</span>
                            </p>
                        </div>
                        {/* Transfer NFT */}
                        <br/>
                        <br/>
                        <div className="controls transfer-controls">
                            <h5>Transfer token ownership:</h5>
                            <div>
                                <label className="recipient">
                                    <strong>Recipient:</strong>
                                </label>
                                <input
                                    id={token.id + "_recipient"}
                                    className="form-control"
                                    type="text"
                                    placeholder="archway1f395p0gg67mmfd5zcqvpnp9cxnu0hg6r9hfczq"
                                />
                                <button
                                    className="btn btn-primary btn-send"
                                    onClick={() =>
                                        transferNft(
                                            document.getElementById(token.id + "_recipient")
                                                .value,
                                            token.id
                                        )
                                    }
                                >
                                    Send
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="nfts mine">
            <h3>My Nfts</h3>

            <div className="my-items">
                <div>
                    <div className="card-deck">{tokens}</div>
                </div>
            </div>
        </div>
    );
}

export default ViewOwner