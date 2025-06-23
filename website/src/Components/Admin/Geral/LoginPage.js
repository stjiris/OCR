import React, {useState} from 'react';
import axios from 'axios';
import {useLocation, useNavigate} from "react-router";

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const LoginPage = ({ isAuthenticated, setLoggedIn }) => {
    const navigate = useNavigate();
    const location = useLocation();

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

    // Redirect to intended page if already authenticated
    if (isAuthenticated) {
        location?.state?.originPath
            ? navigate(location.state.originPath, {replace: true})
            : navigate("/admin", {replace: true});
    }
    else return (
        <div style={{ marginLeft: "2%" }}>
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
