import React from "react";

function Accounts({accounts = null, coinDenom = null}) {

    // console.log(accounts[0]?.balance,'##############')

    if (!accounts || !coinDenom) return null;
    else if (!accounts[0]) return null;
    else if (!accounts[0]["balance"]) return null;
    else if (!accounts[0].balance["amount"]) return null;

    return (
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
                            <span>{`${parseInt(accounts[0].balance.amount) / 1000000} ${coinDenom}`}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default Accounts