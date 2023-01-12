import * as React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';

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
    this.setState({ size: 0, progress: 0 });
  }

  show() {
    this.setState({ size: 40 });
  }

  render() {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress variant="determinate" size={this.state.size} value={this.state.progress} />
        <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Typography variant="caption" component="div" color="text.secondary">
            {
              this.state.size !== 0
              ? `${Math.round(this.state.progress)}%`
              : ""
            }
          </Typography>
        </Box>
      </Box>
    );
  }
}

export default ProgressWheel;