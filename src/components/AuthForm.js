import React, { Component } from 'react';

import { registerAccount, authenticateAccount } from '../lib/Gateway';
import { Form, Button, InputGroup, Alert, ButtonGroup, Col } from 'react-bootstrap';

const STATE_LOGIN = 0;
const STATE_REGISTER = 1;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      type: STATE_LOGIN,
      validated: false,
      suppliedUsername: '',
      suppliedPassword: '',
      message: props.message || undefined
    };
  }

  onSubmit = e => {
    e.preventDefault();
    e.stopPropagation();
  
    if (e.target.checkValidity()) {
      if (this.state.type === STATE_LOGIN) this._login();
      else this._registerAccount();
    }

    this.setState({ validated: true });
  }

  _registerAccount = () => {
    registerAccount(this.state.suppliedUsername, this.state.suppliedPassword)
      .then(res => this._registrationSuccessful())
      .catch(err => this._setMessage('danger', err.message))
  }
  _registrationSuccessful = () => {
    this._setMessage('info', 'Signed up!');
    this.setState({ type: STATE_LOGIN });
  }

  _login = () => {
    authenticateAccount(this.state.suppliedUsername, this.state.suppliedPassword)
      .then(res => this._loginSuccessful(res))
      .catch(err => this._setMessage('danger', err.message))
  }
  _loginSuccessful = (res) => {
    this.props.onComplete(this.state.suppliedUsername, res.token);
  }

  _setMessage = (type, msg) => {
    this.setState({
      message: {
        type: type,
        msg: msg
      }
    })
  }

  render = () => {
    return (
      <Col xs={{ span: 8, offset: 2 }}>
        <Form noValidate validated={this.state.validated} onSubmit={e => this.onSubmit(e)} className="Content-centered mb-3">
          <h1 className="mt-3">{this.state.type === STATE_LOGIN ? 'Log In' : 'Sign Up'}</h1>
          <ButtonGroup aria-label="Basic example" className="mb-3 mt-3">
            <Button variant={this.state.type === STATE_LOGIN ? 'info' : 'dark'} onClick={e => this.setState({type: STATE_LOGIN})}>Log in</Button>
            <Button variant={this.state.type !== STATE_LOGIN ? 'info' : 'dark'} onClick={e => this.setState({type: STATE_REGISTER})}>Sign up</Button>
          </ButtonGroup>
          {
            this.state.message
              ? <Alert variant={this.state.message.type}>{this.state.message.msg}</Alert>
              : undefined
          }
          <Form.Group controlId="validationAccountName">
            <Form.Label>Account Name</Form.Label>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="text"
                placeholder="Account name"
                aria-describedby="inputGroupPrepend"
                required
                value={this.state.suppliedUsername}
                onChange={e => this.setState({ suppliedUsername: e.target.value })}
              />
              <Form.Control.Feedback type="invalid">
                <small>Please enter account name.</small>
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
            <Form.Group controlId="validationPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                required
                type="password"
                placeholder="Password"
                value={this.state.suppliedPassword}
                onChange={e => this.setState({ suppliedPassword: e.target.value })}
              />
              <Form.Control.Feedback type="invalid">
                <small>Please enter a valid password.</small>
              </Form.Control.Feedback>
          </Form.Group>
          <Button variant="info" type="submit" block className="mt-4 mb-4">Submit</Button>
        </Form>
        <Alert variant="secondary" className="Content-centered mt-3 ">
          This application relies on the browser's  Local Storage and Service Worker features and thus your consent is assumed should you choose to use it.
        </Alert>
      </Col>
    );
  }
}

export default App;
