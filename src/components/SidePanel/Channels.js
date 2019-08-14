import React, { Component } from 'react';
import { Menu, Icon, Modal, Form, Input, Button } from 'semantic-ui-react';
import { connect } from 'react-redux';
import firebase from '../../firebase';
import { setCurrentChannel, setPrivateChannel } from '../../actions';
class Channels extends Component {
  state = {
    user: this.props.currentUser,
    channels: [],
    modal: false,
    channelName: '',
    channelDetails: '',
    channelsRef: firebase.database().ref('channels'),
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
    });
  };

  setFirstChannel = () => {
    let firstChannel = this.state.channels[0];
    if (this.state.firstLoad && this.state.channels.length > 0) {
      this.props.setCurrentChannel(firstChannel);
      this.setActiveChannel(firstChannel);
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
    this.props.setCurrentChannel(channel);
    this.props.setPrivateChannel(false);
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
      </Menu.Item>
    ));

  render() {
    const { channels, modal } = this.state;
    return (
      <React.Fragment>
        <Menu.Menu className="menu" >
          <Menu.Item>
            <span>
              <Icon name="exchange" /> CHANNELS
            </span>{' '}
            ({channels.length}) <Icon onClick={this.openModal} name="add" />
          </Menu.Item>

          {this.displayChannels(channels)}
        </Menu.Menu>

        <Modal basic open={modal} onClose={this.closeModal}>
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
            <Button onClick={this.handleSubmit} color="green" inverted>
              <Icon name="checkmark" /> Add
            </Button>
            <Button onClick={this.closeModal} color="red" inverted>
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
