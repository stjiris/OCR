import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function PrivateSession() {
    const { sessionId } = useParams();
    const [isValidSessionId, setIsValidSessionId] = useState(false);

    function validateSessionId() {
        fetch(process.env.REACT_APP_API_URL + 'validate-private-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "sessionId": sessionId
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            setIsValidSessionId(data.valid);
        });
    }

    useEffect(() => {
        validateSessionId();
    }, [sessionId]);

    if (!isValidSessionId) {
        return <h1>ID inválido</h1>;
    }

    return (
        <div>
            <h1>sessão privada {sessionId}</h1>
        </div>
    );
}

export default PrivateSession;
