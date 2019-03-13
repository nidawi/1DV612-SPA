import React, { Component } from 'react';
import { getAccount, initiateGithubAuthentication } from '../lib/Gateway';
import socket from '../lib/Socket';

// Import React Bootstrap stuff
import { ProgressBar, Container } from 'react-bootstrap';

class Top extends Component {
  constructor(props) {
    super(props);

    this._authWindow = undefined;

    this.state = {
      text: 'Awaiting authentication...',
      type: 'primary'
    }
  }

  componentDidMount = () => {
    socket.on('authentication', this._authenticationSuccessful);
    this._attemptAuthentication();
  }
  componentWillUnmount = () => {
    socket.removeListener('authentication', this._authenticationSuccessful);
  }

  _attemptAuthentication = () => {
    getAccount(this.props.token)
      .then(res => {
        // This means the user is already authenticated.
        this.props.onComplete(true, res)
      })
      .catch(() => initiateGithubAuthentication(this.props.account)
        .then(res => this._initiateAuthentication(res))
        .catch(err => this._authenticationFailed(err))
      );
  }

  _initiateAuthentication = res => {
    socket.emit('authenticate', { authentication: `bearer ${this.props.token}` });
    this._authWindow = window.open(res.url, 'authWindow');
  }
  _authenticationSuccessful = status => {
    if (status && status.success && status.user && this._authWindow) {
      console.log(`Authentication successful for ${status.user.username}!`);
      socket.emit('de-authenticate', { authentication: `bearer ${this.props.token}` });
      this._authWindow.close();
      this.props.onComplete(true, status.user);
    } else {
      this._authenticationFailed();
    }
  }
  _authenticationFailed = err => {
    this.setState({
      text: 'Authentication failed...',
      type: 'danger'
    });
  }

  render() {
    return (
      <Container className="mt-5">
        <h1 className="mt-3">{this.state.text}</h1>
        <ProgressBar variant={this.state.type} animated now="100" className="Content-centered"></ProgressBar>
      </Container>
    );
  }
}

export default Top;