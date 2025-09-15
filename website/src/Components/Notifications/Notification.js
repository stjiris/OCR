import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from '@mui/material/Alert';

// TODO: React 19 will deprecate forwardRef, and ref can be taken as a prop
const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

class Notification extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            message: props.message,
            open: false
        }
    }

    openNotif(message = "") {
        this.setState({ open: true, message: message });
    }

    close(event, reason) {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ open: false });
    }

    render() {
        return (
            <Snackbar
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                autoHideDuration={3000}
                open={this.state.open}
                onClose={() => this.close()}
            >
                <Alert onClose={() => this.close()} severity={this.props.severity} sx={{ width: '100%' }}>
                    {this.state.message}
                </Alert>
            </Snackbar>
        )
    }
}

Notification.defaultProps = {
    message: null,
    severity: null,
}

export default Notification;
