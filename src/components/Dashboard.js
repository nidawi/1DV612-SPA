import React, { Component } from 'react';
import socket from '../lib/Socket';

import EventList from './EventList';
import { Container, Row, Col } from 'react-bootstrap';

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      eventFilter: 'all'
    };


  }

  componentDidMount = () => {
    socket.on('connect', this._reconnect)
  }

  componentWillUnmount = () => {
    socket.removeListener('connect', this._reconnect);
  }

  _reconnect = () => {
    // Reconnection
    if (this.props.token) {
      socket.emit('subscribe', { authentication: `bearer ${this.props.token}` });
    }
  }

  render = () => {
    return (
      <Container className="mt-3 Content-right">
        <Row >
          <Col xs={{ span: 9 }}>
            <EventList token={this.props.token} account={this.props.account} visible={this.props.visible} ></EventList>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default Dashboard;