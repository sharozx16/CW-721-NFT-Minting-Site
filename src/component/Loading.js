import React from "react";

function Loading({msg}) {
    if (!msg)
        return <></>;

    return (
        <div className="loading">
            <p>{msg}</p>
        </div>
    );
}


export default Loading;