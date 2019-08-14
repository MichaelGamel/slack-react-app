import React, { Component } from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { connect } from 'react-redux';
import firebase from '../../firebase';
import { setCurrentChannel, setPrivateChannel } from '../../actions';

class DirectMessages extends Component {
  state = {
    user: this.props.currentUser,
    users: [],
    usersRef: firebase.database().ref('users'),
    connectedRef: firebase.database().ref('.info/connected'),
    presenceRef: firebase.database().ref('presence')
  };

  componentDidMount() {
    if (this.state.user) {
      this.addListeners(this.state.user.uid);
    }
  }

  addStatusToUser = (userId, connected = true) => {
    const updatedUsers = this.state.users.reduce((acc, user) => {
      if (user.uid === userId) {
        user['status'] = `${connected ? 'online' : 'offline'}`;
      }
      return acc.concat(user);
    }, []);
    this.setState({ users: updatedUsers });
  };

  addListeners = currentUserId => {
    let loadedUsers = [];
    this.state.usersRef.on('child_added', snap => {
      if (currentUserId !== snap.key) {
        let user = snap.val();
        user['uid'] = snap.key;
        user['status'] = 'offline';
        loadedUsers.push(user);
        this.setState({ users: loadedUsers });
      }
    });

    this.state.connectedRef.on('value', snap => {
      if (snap.val() === true) {
        const ref = this.state.presenceRef.child(currentUserId);
        ref.set(true);
        ref.onDisconnect().remove(error => {
          if (error != null) {
            console.error(error);
          }
        });
      }
    });

    this.state.presenceRef.on('child_added', snap => {
      if (currentUserId !== snap.key) {
        this.addStatusToUser(snap.key);
      }
    });

    this.state.presenceRef.on('child_removed', snap => {
      if (currentUserId !== snap.key) {
        this.addStatusToUser(snap.key, false);
      }
    });
  };

  changeChannel = user => {
    const channelId = this.getChannelId(user.uid);
    const channelData = {
      id: channelId,
      name: user.name
    };
    this.props.setCurrentChannel(channelData);
    this.props.setPrivateChannel(true);
  };

  getChannelId = userId => {
    const connectedUserId = this.state.user.uid;
    return userId > connectedUserId
      ? `${userId}/${connectedUserId}`
      : `${connectedUserId}/${userId}`;
  };

  isUserOnline = user => user.status === 'online';

  render() {
    const { users } = this.state;
    return (
      <Menu.Menu className="menu">
        <Menu.Item>
          <span>
            <Icon name="mail" /> DIRECT MESSAGE
          </span>{' '}
          ({users.length})
        </Menu.Item>
        {users.map(user => (
          <Menu.Item
            key={user.uid}
            onClick={() => this.changeChannel(user)}
            style={{ opacity: 0.7, fontStyle: 'italic' }}
          >
            <Icon
              name="circle"
              color={this.isUserOnline(user) ? 'green' : 'red'}
            />
            @ {user.name}
          </Menu.Item>
        ))}
      </Menu.Menu>
    );
  }
}

export default connect(
  null,
  { setCurrentChannel, setPrivateChannel }
)(DirectMessages);
