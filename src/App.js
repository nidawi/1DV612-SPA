import React, { Component } from 'react';
import * as StorageDAO from './lib/StorageDAO';
import socket from './lib/Socket';
import * as visibility from './lib/Visibility';
import * as notifications from './lib/Notifications';
import './App.css';

import Top from './components/Top';
import AuthForm from './components/AuthForm';
import GithubAuth from './components/GithubAuth';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Status from './components/Status';

import { Container } from 'react-bootstrap';

const STATE_LOGIN = 0;
const STATE_AUTHENTICATE= 1;
const STATE_SHOW_DASHBOARD = 2;
const STATE_SHOW_SETTINGS = 3;
const STATE_SHOW_STATUS = 4;

class App extends Component {
  constructor(props) {
    super(props);

    const storedAccount = StorageDAO.getAccount();

    this.state = {
      state: storedAccount ? STATE_AUTHENTICATE : STATE_LOGIN,
      account: storedAccount ? storedAccount.account : undefined,
      token: storedAccount ? storedAccount.token : undefined,
      github: { username: undefined, avatar: undefined },
      visible: true
    };
  }

  componentDidMount = () => {
    notifications.updateWorker(true);
    document.addEventListener(visibility.visibilityIds.visibilityChange, this._onVisibilityChange);
    socket.on('githubEvent', this._catchEvent);
  }
  componentWillUnmount = () => {
    document.removeEventListener(visibility.visibilityIds.visibilityChange, this._onVisibilityChange);
    socket.removeListener('githubEvent', this._catchEvent);
  }

  _onVisibilityChange = e => {
    notifications.updateWorker(!document[visibility.visibilityIds.hiddenId]);
    this.setState({ visible: !document[visibility.visibilityIds.hiddenId] });
  }

  // Fetch information despite dashboard not open...
  _catchEvent = event => {
    if (this.state.state !== STATE_SHOW_DASHBOARD) {
      event.isNew = true; // If the user is not actively viewing the dashboard, the event is "new".
      StorageDAO.saveEvents([event]);
    }
  }

  render = () => {
    return (
      <div className="App">
        <Top
          account={this.state.github.username}
          img={this.state.github.avatar}
          onViewDashboard={this._swapToDashboard}
          onViewSettings={this._swapToSettings}
          onViewLogin={this._swapToLogin}
          onViewStatus={this._swapToStatus}
          selected={this.state.state}
          >
        </Top>
        
        <div className="Content">
          <Container className="mt-2" fluid={true}>
            {
              this.state.state === STATE_LOGIN
                ? <AuthForm onComplete={this._loginComplete}></AuthForm>
                : this.state.state === STATE_AUTHENTICATE
                  ? <GithubAuth account={this.state.account} token={this.state.token} onComplete={this._authenticationComplete}></GithubAuth>
                  : this.state.state === STATE_SHOW_DASHBOARD
                    ? <Dashboard token={this.state.token} account={this.state.account} visible={this.state.visible} ></Dashboard>
                    : this.state.state === STATE_SHOW_SETTINGS
                      ? <Settings token={this.state.token} account={this.state.account}></Settings>
                      : this.state.state === STATE_SHOW_STATUS
                        ? <Status></Status>
                        : undefined
            }
          </Container>
        </div>
      </div>
    );
  }

  _swapToDashboard = () => {
    this.setState({ state: STATE_SHOW_DASHBOARD });
  }
  _swapToSettings = () => {
    this.setState({ state: STATE_SHOW_SETTINGS });
  }
  _swapToLogin = (logout) => {
    if (logout) {
      socket.emit('un-subscribe', { authentication: `bearer ${this.state.token}` })
      StorageDAO.clearAccount();
      this.setState({ account: undefined, token: undefined, github: { username: undefined, avatar: undefined } });
    }
    this.setState({ state: STATE_LOGIN });
  }
  _swapToStatus = () => {
    this.setState({ state: STATE_SHOW_STATUS });
  }

  _loginComplete = (username, token) => {
    this.setState({ state: STATE_AUTHENTICATE, account: username, token: token });
    StorageDAO.setAccount(username, token);
  }
  _authenticationComplete = (success, githubUser) => {
    if (success) {
      // Ensure the user's push subscription is up-to-date.
      notifications.subscribeToPush(this.state.account, this.state.token)
        .then(() => {
          this.setState({
            github: { username: githubUser.username, avatar: githubUser.avatar },
            state: STATE_SHOW_DASHBOARD
          });
          socket.emit('subscribe', { authentication: `bearer ${this.state.token}` });
        });
    }
  }
}

export default App;
