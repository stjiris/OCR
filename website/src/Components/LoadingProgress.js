import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

class ProgressWheel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: 0,
      size: 0
    };
  }

  setProgress(progress) {
    this.setState({ progress: progress });
  }

  hide() {
    this.setState({ size: 0 });
  }

  show() {
    this.setState({ size: 40 });
  }

  render() {
    return (
        <CircularProgress size={this.state.size} color="success" value={this.state.progress} />
    );
  }
}

export default ProgressWheel;