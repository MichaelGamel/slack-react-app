import React, { Component } from 'react';
import {
  Menu,
  Icon,
  Modal,
  Form,
  Input,
  Button,
  Label
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import firebase from '../../firebase';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
class Channels extends Component {
  state = {
    user: this.props.currentUser,
    channel: null,
    channels: [],
    modal: false,
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref('channels'),
    messagesRef: firebase.database().ref('messages'),
    typingRef: firebase.database().ref('typing'),
    notifications: [],
    firstLoad: true,
    activeChannel: ''
  };

  componentDidMount() {
    this.addListeners();
  }

  componentWillUnmount() {
    this.removeListeners();
  }

  removeListeners = () => {
    this.state.channelsRef.off();
  };

  addListeners = () => {
    let loadedChannels = [];
    this.state.channelsRef.on('child_added', snap => {
      loadedChannels.push(snap.val());
      this.setState({ channels: loadedChannels }, () => this.setFirstChannel());
      this.addNotificationListeners(snap.key);
    });
  };

  addNotificationListeners = channelId => {
    this.state.messagesRef.child(channelId).on('value', snap => {
      if (this.state.channel) {
        this.handleNotifications(
          channelId,
          this.state.channel.id,
          this.state.notifications,
          snap
        );
      }
    });
  };

  handleNotifications = (channelId, currentChannelId, nottifications, snap) => {
    let lastTotal = 0;
    let index = nottifications.findIndex(
      notification => notification.id === channelId
    );
    if (index !== -1) {
      if (channelId !== currentChannelId) {
        lastTotal = nottifications[index].total;
        if (snap.numChildren() - lastTotal > 0) {
          nottifications[index].count = snap.numChildren() - lastTotal;
        }
      }
      nottifications[index].lastKnownTotal = snap.numChildren();
    } else {
      nottifications.push({
        id: channelId,
        total: snap.numChildren(),
        lastKnownTotal: snap.numChildren(),
        count: 0
      });
    }

    this.setState({ nottifications });
  };

  setFirstChannel = () => {
    let firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
      this.setState({ channel: firstChannel });
    }

    this.setState({ firstLoad: false });
  };

  closeModal = () => this.setState({ modal: false });

  openModal = () => this.setState({ modal: true });

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  handleSubmit = event => {
    event.preventDefault();
    if (this.isFormValid(this.state)) {
      this.addChannel();
    }
  };

  changeChannel = channel => {
    this.setActiveChannel(channel);
    this.state.typingRef
    .child(this.state.channel.id)
    .child(this.state.user.uid)
    .remove();

    this.clearNotifications();
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
    this.setState({ channel });
  };

  clearNotifications = () => {
    let index = this.state.notifications.findIndex(
      notification => notification.id === this.state.channel.id
    );

    if (index !== -1) {
      let updateNotifications = [...this.state.notifications];
      updateNotifications[index].total =
        updateNotifications[index].lastKnownTotal;
      updateNotifications[index].count = 0;
      this.setState({ updateNotifications });
    }
  };

  setActiveChannel = channel => {
    this.setState({ activeChannel: channel.id });
  };

  addChannel = async () => {
    try {
      const { channelsRef, channelName, channelDetails, user } = this.state;
      const key = channelsRef.push().key;
      const newChannel = {
        id: key,
        name: channelName,
        details: channelDetails,
        createdBy: {
          name: user.displayName,
          avatar: user.photoURL
        }
      };

      await channelsRef.child(key).update(newChannel);
      this.setState({ channelName: '', channelDetails: '' });
      this.closeModal();
      console.log('channel added');
    } catch (error) {
      console.error(error);
    }
  };

  isFormValid = ({ channelName, channelDetails }) => {
    return channelName || channelDetails;
  };

  getNotificationCount = channel => {
    let count = 0;
    this.state.notifications.forEach(notification => {
      if (notification.id === channel.id) {
        count = notification.count;
      }
    });
    if (count > 0) return count;
  };

  displayChannels = channels =>
    channels.map(channel => (
      <Menu.Item
        key={channel.id}
        onClick={() => this.changeChannel(channel)}
        name={channel.name}
        style={{ opacity: 0.7 }}
        active={channel.id === this.state.activeChannel}
      > 
        # {channel.name}
        {this.getNotificationCount(channel) && (
          <Label color="red">{this.getNotificationCount(channel)}</Label>
        )}
      </Menu.Item>
    ));

  render() {
    const { channels, modal } = this.state;
    return (
      <React.Fragment>
        <Menu.Menu className="menu">
          <Menu.Item>
            <span>
              <Icon name="exchange" /> CHANNELS
            </span>{' '}
            ({channels.length}) <Icon onClick={this.openModal} name="add" />
          </Menu.Item>

          {this.displayChannels(channels)}
        </Menu.Menu>

        <Modal open={modal} onClose={this.closeModal}>
          <Modal.Header>Add a Channel</Modal.Header>
          <Modal.Content>
            <Form onSubmit={this.handleSubmit}>
              <Form.Field>
                <Input
                  fluid
                  label="Name of Channel"
                  name="channelName"
                  onChange={this.handleChange}
                />
              </Form.Field>

              <Form.Field>
                <Input
                  fluid
                  label="About the Channel"
                  name="channelDetails"
                  onChange={this.handleChange}
                />
              </Form.Field>
            </Form>
          </Modal.Content>
          <Modal.Actions>
            <Button onClick={this.handleSubmit} color="green">
              <Icon name="checkmark" /> Add
            </Button>
            <Button onClick={this.closeModal} color="red">
              <Icon name="remove" /> Cancel
            </Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

export default connect(
  null,
  { setCurrentChannel, setPrivateChannel }
)(Channels);
