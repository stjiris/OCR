import React, {useRef, useState} from 'react';
import axios from 'axios';
import {useLocation, useNavigate} from "react-router";

import loadComponent from "../../../utils/loadComponents";
const Notification = loadComponent('Notifications', 'Notification');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const LoginPage = ({ isAuthenticated = false, setLoggedIn = null }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const errorNotif = useRef(null);

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
                if (error.status === 400) {
                    errorNotif.current.openNotif("Email ou password incorretos");
                } else {
                    errorNotif.current.openNotif(error.message);
                }
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
            <Notification message={""} severity={"error"} ref={errorNotif}/>

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


export default LoginPage;
