import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import "../../public/styles/authentication.css";
import { AuthContext } from "../context/AuthContext.jsx";

export default function AuthenticationPage() {
    const router = useNavigate();

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formState, setFormState] = useState("login");

    const { handleSignUp, handleLogin } = useContext(AuthContext);

    const setDefault = () => {
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
    };

    const handleFormStateChange = () => {
        setFormState((currState) => (
            currState === "login" ? "signup" : "login"
        ));
        setDefault();
        setError(false);
        setErrorMessage("");
    };

    const handleChange = (event) => {
        let { name, value } = event.target;
        if (name === "name") {
            setName(value);
        } else if (name === "username") {
            setUsername(value);
        } else if (name === "email") {
            setEmail(value);
        } else if (name === "password") {
            setPassword(value);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (formState === "login") {
            let { success, message } = await handleLogin(username, password);
            if (success) {
                router("/home");
            } else {
                setError(true);
                setErrorMessage(message);
            }
        } else {
            let { success, message } = await handleSignUp(name, username, email, password);
            if (success) {
                router("/home");
            } else {
                setError(true);
                setErrorMessage(message);
            }
        }

        setDefault();
    };

    useEffect(() => {
        setFormState("login");
        setError(false);
        setErrorMessage("");
        setName("");
        setUsername("");
        setEmail("");
        setPassword("");
    }, []);

    return (
        <Box className="Auth-container">
            <Box className="Auth-form-container">
                <Box className="Auth-form">
                    <Box className="Auth-form-header">
                        <h2>Authentication</h2>
                    </Box>
                    <Snackbar
                        open={error}
                        autoHideDuration={6000}
                        onClose={() => setError(false)}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert severity="error" variant="filled" onClose={() => setError(false)} sx={{ width: '100%' }}>
                            {errorMessage}
                        </Alert>
                    </Snackbar>
                    <div className="Auth-form-header-buttons">
                        <Button variant={formState === "login" ? "contained" : "outlined"} onClick={handleFormStateChange}>Login</Button>
                        <Button variant={formState === "signup" ? "contained" : "outlined"} onClick={handleFormStateChange}>SignUp</Button>
                    </div>
                    <Box className="Auth-form-body">
                        <form className="Auth-form-content" onSubmit={handleSubmit}>
                            {
                                formState === "signup" ? <>
                                    <TextField
                                        label="Name"
                                        required
                                        variant="outlined"
                                        name="name"
                                        value={name}
                                        onChange={handleChange}
                                    />
                                    <TextField
                                        label="Email"
                                        required
                                        variant="outlined"
                                        name="email"
                                        value={email}
                                        onChange={handleChange}
                                    />
                                </>
                                    : <></>
                            }
                            <TextField
                                label="Username"
                                required
                                variant="outlined"
                                name="username"
                                value={username}
                                onChange={handleChange}
                            />
                            <TextField
                                label="Password"
                                required
                                variant="outlined"
                                name="password"
                                type="password"
                                value={password}
                                onChange={handleChange}
                            />
                            <Button variant="contained" type="submit">
                                {formState === "login" ? "Login" : "SignUp"}
                            </Button>
                        </form>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
