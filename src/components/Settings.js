import React, { Component } from 'react';
import socket from '../lib/Socket';
import * as notifications from '../lib/Notifications';
import { getOrganizations, getAccountEmail, getAccountSettings, updateAccountSettings, setAccountEmail, addOrgHook, deleteOrgHook, getAccountPushSubscription, addAccountPushSubscription, deleteAccountPushSubscription, createDefaultAccountSettings } from '../lib/Gateway';

// Import React Bootstrap stuff
import { InputGroup, FormControl, Button, Col, OverlayTrigger, Popover, Form, Container, ProgressBar, Card, Row, Collapse } from 'react-bootstrap';

const LOAD_NORMAL = 0;
const LOAD_SAVING = 1;
const LOAD_ERROR = 2;

class Settings extends Component {

  constructor (props) {
    super(props);

    this._mounted = false;
    this._selectedOrg = undefined;
    this._selectedOrgSettings = undefined;

    this.state = {
      loaded: false,
      loadType: LOAD_NORMAL,
      email: undefined,
      pushSub: undefined,
      emailChanged: false,
      orgs: undefined,
      settings: undefined,
      selectedOrg: undefined,
      selectedOrgSettings: undefined
    };

    this._loadData();
  }

  componentDidMount = () => {
    this._mounted = true;
  }
  componentWillUnmount = () => {
    this._mounted = false;
  }

  render() {
    return (
      <Container className="mt-5">
        {
          !this.state.loaded
            ? this._renderLoading()
            : this._renderSettings()
        }
      </Container>
    );
  }

  _loadData = () => {
    return Promise.all([
      getOrganizations(this.props.token),
      getAccountEmail(this.props.account, this.props.token),
      getAccountSettings(this.props.account, this.props.token),
      getAccountPushSubscription(this.props.account, this.props.token)
    ])
      .then(res => {
        if (this._mounted) {
          this.setState({ orgs: res[0].filter(a => a.hasHookPermissions), email: res[1], settings: res[2], pushSub: res[3], loaded: true, selectedOrg: undefined, selectedOrgSettings: undefined })
        }
      })
      .catch(err => this._handleLoadError(err));
  }
  // {Notification.permission}
  _renderLoading = () => {
    return (
    <Container>
      <h1 className="mt-3">
        {
          this.state.loadType === LOAD_NORMAL
            ? "Loading..."
            : this.state.loadType === LOAD_SAVING
              ? "Processing..."
              : this.state.loadType === LOAD_ERROR
                ? "Update failed."
                : undefined
        }
      </h1>
      <ProgressBar variant={ this.state.loadType === LOAD_ERROR ? "danger" : "primary" } animated now="100"></ProgressBar>
    </Container>
    );
  }
  _renderSettings = () => {
    return (
      <Container className="Settings-format">
        <Form className="Content-centered" onSubmit={this._formSubmit}>
          <Form.Group controlId="formGroupEmail">
            <Form.Label className="mb-3">Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" defaultValue={this.state.email} onChange={e => this.setState({ email: e.target.value, emailChanged: true })} />
            <Form.Text className="text-muted mt-3">
              Your e-mail is kept confidential and is only used for notification purposes. Also do note that your e-mail will not be verified and if an invalid e-mail is provided, no notifications will be received.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Push Notifications</Form.Label>
            {
              this._renderPushButton()
            }
            <Form.Text className="text-muted mt-3">
              Here you can choose to allow or disallow browser push notifications for events.
            </Form.Text>
          </Form.Group>
          <hr className="separator" style={{ background: "white" }} />
          <Form.Group>
            <Form.Label>Organization Settings</Form.Label>
            <Container className="mt-2">
              <Row className="justify-content-center">
                {
                  this.state.orgs.map(a => (
                  <OverlayTrigger key={`${a.code}-overlay`} trigger="hover" overlay={this._renderPopover(a.code, a.name)}>
                    {
                      this._renderOrganization(a)
                    }
                  </OverlayTrigger>))
                }
              </Row>
            </Container>
            <Form.Text className="text-muted mt-3">
              Select an organization to change its settings. Please note that only organizations that you are authorized to access are visible. Furthermore, those with yellow borders are untracked while those with green borders are tracked.
            </Form.Text>
          </Form.Group>
          {
            this.state.selectedOrg
              ? this._renderSelectedOrgSettings()
              : undefined
          }
          <Button type="submit" className="mt-4 mb-5" block>Save Changes</Button>
        </Form>
      </Container>
    );
  }
  _renderSelectedOrgSettings = () => {
    return (
    <Collapse in={this.state.selectedOrg !== undefined} appear={true}>
    <Container>
      <Form.Group>
        <Form.Label>{this.state.selectedOrg.name || this.state.selectedOrg.code}</Form.Label>
      </Form.Group>
      <Form.Group>
        {
          this._renderTrackButton()
        }
        <Form.Text className="text-muted mt-1">
          Here you can choose to track or untrack the selected organization. An untracked organization will produce no notifications and raise no events.
        </Form.Text>
        <hr className="separator" style={{ background: "white" }} />
      </Form.Group>
        {
          this.state.selectedOrg.hasHookRegistered
            ? this._renderNotificationSettings()
            : undefined
        }
    </Container>
    </Collapse>
    );
  }
  _renderNotificationSettings = () => {
    return (
    <Container>
      <Form.Label>Notifications</Form.Label>
      <Form.Row className="mt-2">
      <Col>
          { this._renderFancyCheckbox('organization_enabled', 'General events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.organization_enabled : true) }
          { this._renderFancyCheckbox('issues_enabled', 'Issue events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.issues_enabled : true) }
          { this._renderFancyCheckbox('issue_comment_enabled', 'Issue comment events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.issue_comment_enabled : true) }
        </Col>
        <Col>
          { this._renderFancyCheckbox('push_enabled', 'Push events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.push_enabled : true) }
          { this._renderFancyCheckbox('release_enabled', 'Release events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.release_enabled : true) }
          { this._renderFancyCheckbox('repository_enabled', 'Repository events', this.state.selectedOrgSettings !== undefined ? this.state.selectedOrgSettings.repository_enabled : true) }
        </Col>
      </Form.Row>
      <Form.Text className="text-muted mt-1">
        Select the events for which you wish to receive notifications. Selected events will be delivered through e-mail and/or browser push notifications, depending on settings.
      </Form.Text>
    </Container>);
  }
  _renderPushButton = () => {
    return (
      <Container className="mt-1">
      {
        notifications.isPushBlocked()
          ? <Button block variant="dark" disabled>Push blocked</Button>
          : (notifications.isPushAllowed() && this.state.pushSub)
            ? <Button variant="dark" block onClick={this._handleDisablePushClick}>Disable Push</Button>
            : <Button variant="info" block onClick={this._handleEnablePushClick}>Enable Push</Button>
      }  
      </Container>);
  }
  _renderTrackButton = () => {
    return (
    <Button block className="mt-1" variant={
      this.state.selectedOrg.hasHookRegistered
        ? "dark"
        : "primary"
    } onClick={this._handleTrackClick} >
      {
        this.state.selectedOrg.hasHookRegistered
          ? "Untrack"
          : "Track"
      }
    </Button>);
  }
  _renderFancyCheckbox = (id, value, active) => {
    return (
    <InputGroup className="mb-3">
    <InputGroup.Prepend>
      <InputGroup.Checkbox id={id} checked={active} onChange={e => this._handleOrgSettingChange(id, e.target.checked)}  />
    </InputGroup.Prepend>
      <FormControl value={value} disabled />
    </InputGroup>);
  }
  _renderPopover = (title, text) => {
    return (
    <Popover title={title}>
      {text}
    </Popover>);
  }
  _renderOrganization = (org) => {
    return (
    <Card key={`${org.code}-card`} className="mr-1 ml-1 mb-1 mt-1" border={ org.hasHookRegistered ? "success" : org.hasHookPermissions ? "warning" : "danger" } style={{ width: "5rem", borderWidth: "3px" }} onClick={() => this._selectOrg(org)}>
      <Card.Img variant="top" src={org.avatar} />
    </Card>);
  }

  _selectOrg = org => {
    if (this.state.selectedOrg && this.state.selectedOrg.code === org.code) {
      this.setState({
        selectedOrg: undefined,
        selectedOrgSettings: undefined
      });
    } else if (org.hasHookPermissions) {
      const settings = this.state.settings.find(a => a.orgCode === org.code);
      if (!settings) {
        console.log('No settings found for ', org.code, 'for account', this.props.account);
        // We need to create default.
        this._setLoading();
        createDefaultAccountSettings(this.props.account, org.code, this.props.token)
          .then(() => this._loadData())
          .catch(() => this._handleLoadError());
      } else {
        this.setState({
          selectedOrgSettings: settings,
          selectedOrg: org
        });
      }
    }
  }
  _handleOrgSettingChange = (id, value) => {
    const obj = this.state.selectedOrgSettings;
    obj[id] = value;
    this.setState({ selectedOrgSettings: obj });
  }
  _formSubmit = e => {
    e.preventDefault();
    e.stopPropagation();

    if (e.target.checkValidity()) {
      // Save changes.
      this._setLoading();

      Promise.all([
        this.state.selectedOrgSettings ? updateAccountSettings(this.props.account, this.state.selectedOrg.code, this.props.token, this.state.selectedOrgSettings) : undefined,
        this.state.emailChanged ? setAccountEmail(this.props.account, this.props.token, this.state.email) : undefined
      ])
        .then(() => this.setState({ loaded: true, selectedOrg: undefined, selectedOrgSettings: undefined }))
        .catch(() => this._handleLoadError());
    }
  }
  _handleTrackClick = () => {
    this._setLoading();

    (this.state.selectedOrg.hasHookRegistered
      ? deleteOrgHook(this.state.selectedOrg.code, this.props.token)
      : addOrgHook(this.state.selectedOrg.code, this.props.token))
      .then(() => this._loadData())
      .then(() => socket.emit('subscribe', { authentication: `bearer ${this.props.token}` }))
      .catch(() => this._handleLoadError());
  }
  _handleDisablePushClick = () => {
    this._setLoading();

    notifications.getPushSubscription()
      .then(res => {
        if (res) return res.unsubscribe();
      })
      .catch(() => this._handleLoadError())
      .then(() => deleteAccountPushSubscription(this.props.account, this.props.token))
      .then(() => this._loadData())
      .catch(() => this._handleLoadError());
  }
  _handleEnablePushClick = () => {
    this._setLoading();

    notifications.getPushSubscription()
      .then(res => {
        if (res) {
          return addAccountPushSubscription(this.props.account, this.props.token, res);
        }
      })
      .then(() => this._loadData())
      .catch(() => this._handleLoadError());
  }
  _handleLoadError = (err) => {
    if (this._mounted) {
      this.setState({ loadType: LOAD_ERROR });
      setTimeout(() => this.props.onError(err), 2000);
    }
  }
  _setLoading = () => {
    this.setState({ 
      loaded: false,
      loadType: LOAD_SAVING
    });
  }
}

export default Settings;
