import React, { Component } from 'react';
import socket from '../lib/Socket';
import logo from '../logo.svg';
import './Top.css';

// Import React Bootstrap stuff
import { Navbar, Nav, Badge } from 'react-bootstrap';

// Bad design, I know.
const STATE_SHOW_DASHBOARD = 2;

class Top extends Component {
  constructor (props) {
    super(props);

    this.state = {
      newEvents: 0
    };
  }

  componentDidMount = () => {
    socket.on('githubEvent', this._updateLabel);
  }
  componentWillUnmount = () => {
    socket.removeListener('githubEvent', this._updateLabel);
  }

  _updateLabel = () => {
    if (this.props.selected !== STATE_SHOW_DASHBOARD) {
      this.setState((state, props) => ({ newEvents: state.newEvents + 1 }));
    }
  }

  render() {
    return (
      <Navbar bg="dark" variant="dark">
        <Navbar.Brand>
          <img src={logo} alt="React logo that I stole :)" className="d-inline-block align-top Top-logo"/>
        </Navbar.Brand>
        <Nav defaultActiveKey="dash-key" className="mr-auto">
          <Nav.Item>
          {
            this.props.account
             ? <Nav.Link eventKey="dash-key" onClick={this.userWantsToViewDashboard}>Dashboard {this._renderBadge()}</Nav.Link>
             : <Navbar.Text className="text-white">Just Another Github Dashboard</Navbar.Text>
          }
          </Nav.Item>
          <Nav.Item>
          {
            this.props.account
            ? <Nav.Link eventKey="sett-key" onClick={this.userWantsToViewSettings}>Settings</Nav.Link>
            : undefined
          }
          </Nav.Item>
          <Nav.Item>
          {
            this.props.account
            ? <Nav.Link eventKey="sts-key" onClick={this.userWantsToViewStatus}>Status</Nav.Link>
            : undefined
          }
          </Nav.Item>
        </Nav>
        <Nav>
          {
            this.props.account
              ? <Navbar.Text>Hello {this.props.account}!</Navbar.Text>
              : undefined
          }
          {
            this.props.account
              ? <Nav.Link onClick={this.userWantsToLogout}>Logout?</Nav.Link>
              : <Nav.Link onClick={this.userWantsToLoginOrRegister}>Login / Register</Nav.Link>
          }
        </Nav>
        {
          this.props.img
            ? <Navbar.Brand><img src={this.props.img} alt="User avatar" className="d-inline-block align-top Top-avatar"/></Navbar.Brand>
            : undefined
        }
      </Navbar>
    );
  }

  _renderBadge = () => {
    return (
    <Badge variant="info" className="mr-1 ml-1">
      {
        this.state.newEvents > 0
          ? this.state.newEvents
          : ""
      }
    </Badge>);
  }

  userWantsToViewDashboard = () => {
    this.setState({ newEvents: 0 });
    this.props.onViewDashboard();
  }
  userWantsToViewSettings = () => {
    this.props.onViewSettings();
  }
  userWantsToLoginOrRegister = () => {
    this.props.onViewLogin(false);
  }
  userWantsToLogout = () => {
    this.props.onViewLogin(true);
  }
  userWantsToViewStatus = () => {
    this.props.onViewStatus();
  }
}

export default Top;