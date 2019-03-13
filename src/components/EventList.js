import React, { Component } from 'react';
import * as StorageDAO from '../lib/StorageDAO';
import { getAccountItems, getOrganizations } from '../lib/Gateway';
import socket from '../lib/Socket';
import './EventList.css';

import { Container, OverlayTrigger, Media, Badge, Tooltip, ProgressBar, Row, DropdownButton } from 'react-bootstrap';
import DropdownItem from 'react-bootstrap/DropdownItem';

const MAXIMUM_EVENTS_DISPLAYED = 12;

// This whole thing is "just enough", and barely even that.
class EventList extends Component {
  constructor(props) {
    super(props);

    // We use _mounted to track whether this component is currently mounted.
    // This is because I currently do not have time to redesign this app to use Bluebird's
    // cancellable promises and I need to cancel promises so I do not call setState() with
    // an unmounted component.
    this._mounted = false;

    this.state = {
      loaded: false,
      shownEvents: [],
      userOrgs: [],
      eventFilter: undefined
    };

    this._loadData();
  }

  render = () => {
    return (
      <Container className="EventList mb-3">
        {
          this.state.loaded
            ? this._renderEventList()
            : this._renderLoading()
        }
      </Container>
    );
  }

  _loadData = () => {
    getOrganizations(this.props.token)
      .then(res => {
        if (this._mounted) {
          this.setState({ userOrgs: res.filter(a => a.hasHookRegistered) });
        }
      })
      .then(() => getAccountItems(this.props.account, this.props.token))
      .then(res => {
        // Regardless of what happens, we add any "missed items" to the cache.
        StorageDAO.saveEvents(res
          .map(a => Object.assign(a, { isNew: true }))); // We want those to show up as new.

        if (this._mounted) {
          // If we're mounted, we also update the state to show all events (cache + missed).
          this._displayEvents();
        }
      })
      .catch(() => undefined);
  }

  componentDidMount = () => {
    this._mounted = true;

    socket.on('githubEvent', this._handleGithubEvent);
  }
  componentWillUnmount = () => {
    this._mounted = false;

    socket.removeListener('githubEvent', this._handleGithubEvent);
  }

  _handleGithubEvent = event => {
    if (this._mounted) {
      if (!this.props.visible) {
        event.isNew = true;
      }

      StorageDAO.saveEvents([event]);
      // Update State
      this._displayEvents();
    }
  }
  _handleFilterSelection = e => {
    const filter = (e.target.text === 'All' ? undefined : e.target.text.trim());
    this.setState({ eventFilter: filter });
  }

  _displayEvents = () => {
    this.setState({ loaded: true, shownEvents: StorageDAO.getEvents().slice(-MAXIMUM_EVENTS_DISPLAYED) });
    StorageDAO.markEventsAsRead();
  }

  _renderEventHeader = () => {
    return (
    <Row>
      <h2 className="mr-3 mb-2 text-left">Recent Events</h2>
      {
        this._renderFilterControls()
      }
      <small className="ml-2 text-muted align-self-center">{ this.state.eventFilter }</small>
    </Row>
    );
  }
  _renderFilterControls = () => {
    return (
    <DropdownButton drop="right" title="Filter">
      <DropdownItem key={`all-item`} onClick={this._handleFilterSelection}>All</DropdownItem>
      {
        this.state.userOrgs.map(a => (
          <DropdownItem key={`${a.code}-item`} onClick={this._handleFilterSelection}>{a.code}</DropdownItem>
        ))
      }
    </DropdownButton>
    );
  }
  _renderLoading = () => {
    return (
      <Container>
        <h2>Loading events...</h2>
        <ProgressBar variant="primary" animated now="100"></ProgressBar>
      </Container>
    );
  }
  _renderEventList = () => {
    return (
      <Container className="mt-1">
      {
        this._renderEventHeader() // !this.state.eventFilter || 
      }
      {
        this.state.userOrgs.length > 0
          ? this.state.shownEvents.filter(a => (!this.state.eventFilter || a.organization.code === this.state.eventFilter)).sort((a, b) => b.timestamp - a.timestamp).map(a => this._renderEvent(a))
          : this._renderNoOrgsNotice()
      }
      </Container>
    );
  }
  _renderNoOrgsNotice = () => {
    return (
      <Container className="text-left mt-0">
        It appears that you are currently not tracking any organizations. How odd. Why don't you head over to the Settings and try track some?
      </Container>
    );
  }
  _renderEvent = event => {
    return (
      <OverlayTrigger key={`${event.event}-${event.timestamp}-overlay`} placement="left" trigger="hover" overlay={this._renderTooltip(event)}>
      <Media className="mb-2 mt-2 EventCard">
        <img width={46} height={46} className="align-self-center mr-3" src={event.sender.avatar} alt="Event Sender Avatar"/>
        <Media.Body className="text-left mt-0">
        <h5 className="mb-0">{this._getEventBody(event)}{this._renderBadge(event)}</h5>
        <small className="mb-0 mt-0 font-italic">{this._timeToString(new Date() - new Date(event.timestamp))} ago</small>
        <small className="text-muted mt-0"> {this._getEventFooter(event)}</small>
        </Media.Body>
      </Media>
      </OverlayTrigger>
    );
  }
  _renderBadge = (event) => {
    return (
    <Badge className="ml-2" variant="info">
      {
        event.isNew
          ? "New!"
          : undefined
      }
    </Badge>
    );
  }
  _renderTooltip = event => {
    return (
      <Tooltip className="justify-content-center">
        {new Date(event.timestamp).toLocaleString()}
      </Tooltip>
    );
  }

  _getEventBody = event => {
    switch (event.event) {
      case 'repository':
        return `${event.sender.username} ${event.action} the repository "${event.repository.name}"`;
      case 'issues':
        return `${event.sender.username} ${event.action} the issue "${event.issue.title}"`;
      case 'issue_comment':
        return `${event.sender.username} ${event.action} a comment on the issue "${event.issue.title}"`;
      case 'organization':
        return `${event.membership ? event.membership.user.username : 'A member'} was ${event.action.replace('_member', '')}`;
      case 'push':
        return `${event.sender.username} pushed to ${event.repository.ref}`;
      case 'release':
      return `${event.sender.username} made a new release: ${event.release.name || 'unnamed'}`;
      default:
        return `${event.sender.username} ${event.action} ${event.event}`;
    }
  }
  _getEventFooter = event => {
    switch (event.event) {
      case "issues":
      case "issue_comment":
      case 'push':
      case 'release':
        return `in ${event.repository.name} of ${event.organization.code}.`;
      default:
        return `in ${event.organization.code}.`;
    }
  }

  _timeToString = ms => {
    const total = Math.max(1, ms / 1000);
  
    const days = Math.floor(total / (3600 * 24));
    const hours = Math.floor((total % (3600 * 24)) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = Math.floor(total % 3600 % 60);
  
    const results = [
      { value: days, type: `${days === 1 ? 'day' : 'days'}` },
      { value: hours, type: `${hours === 1 ? 'hour' : 'hours'}` },
      { value: minutes, type: `${minutes === 1 ? 'minute' : 'minutes'}` },
      { value: seconds, type: `${seconds === 1 ? 'second' : 'seconds'}` }
    ];
  
    return results
      .filter(a => a.value !== 0)
      .map(a => `${a.value} ${a.type}`)
      .reduce((a, b, i, arr) => {
        return i + 1 < arr.length
          ? `${a}, ${b}`
          : `${a}, and ${b}`
      });
  }
}

export default EventList;
