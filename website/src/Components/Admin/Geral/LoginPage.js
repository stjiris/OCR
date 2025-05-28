import React, {useState} from 'react';
import axios from 'axios';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const LoginPage = ({setLoggedIn}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const logInUser = () => {
        axios.post(API_URL + "/account/login", {
            email: email,
            password: password
        })
            .then((r) => {
                setLoggedIn();
            })
            .catch((error) => {
                console.log(error);
            });
    }

    return (
        <div>
            <h1>OCR Admin Login</h1>
            <form>
                <div>
                    <label>Email: </label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label>Password: </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="button" onClick={logInUser}>Submit</button>
            </form>
        </div>
    );
}

LoginPage.defaultProps = {
    setLoggedIn: ()=>{}
}

export default LoginPage;
