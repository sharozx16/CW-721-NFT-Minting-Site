import React from "react";

function Market({nfts, accounts}) {
    if (!nfts) return null;

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

    const tokens = [];
    for (const token of nfts.tokens) {
        const image = token.token_uri ? token.token_uri : null;
        const name = token.extension?.name ? token.extension?.name : null;
        const description = token.extension?.description
            ? token.extension?.description
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
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="market">
            <h3>Market</h3>

            <div className="market-items">
                <div>
                    <div className="card-deck">{tokens}</div>
                </div>
            </div>
        </div>
    );
}

export default Market