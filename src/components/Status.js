import React, { Component } from 'react';

// Import React Bootstrap stuff
import { ListGroup, Container } from 'react-bootstrap';


class Status extends Component {
  render() {
    return (
      <Container>
        <h2 className="mt-3 mb-3">Application Status</h2>
        <ListGroup className="mt-1 mb-3">
            {
              [{ name: 'Service Worker', status: 'serviceWorker' in navigator }, { name: 'Local Storage', status: 'localStorage' in window }, { name: 'Push Notifications', status: 'PushManager' in window }]
                .map(a => this._renderStatus(a.name, a.status))
            }
          </ListGroup>
          <small className="text-muted mt-3 mb-3">This is the status of the application's features. Those marked in yellow are not available which means that you will not be able to enjoy them. Another browser might do the trick.</small>
      </Container>
    );
  }

  _renderStatus = (name, status) => {
    return (
      <ListGroup.Item key={`${name}-${status}-key`} variant={ status ? "success" : "warning" }>
        {name}
      </ListGroup.Item>
    );
  }
}

export default Status;