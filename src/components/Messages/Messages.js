import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Segment, Comment } from 'semantic-ui-react';
import { setUserPosts } from '../../actions';
import MessagesHeader from './MessagesHeader';
import MessageForm from './MessageForm';
import firebase from '../../firebase';
import Message from './Message';
import Skeleton from './Skeleton';
import Typing from './Typing';

class Messages extends Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    messagesRef: firebase.database().ref('messages'),
    privateMessagesRef: firebase.database().ref('privateMessages'),
    typingRef: firebase.database().ref('typing'),
    connectedRef: firebase.database().ref('.info/connected'),
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    messages: [],
    messagesLoading: true,
    progressBar: false,
    numberUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: [],
    typingUsers: []
  };

  componentDidMount() {
    const { channel, user } = this.state;
    if (channel && user) {
      this.addListeners(channel.id);
    }
  }

  componentWillUnmount() {
    this.state.messagesRef.off();
  }

  componentDidUpdate(privateProps, privateState) {
    setTimeout(() => {
      if (this.messagesEnd) {
        this.scrollToBottom();
      }
    }, 1000);
  }

  scrollToBottom = () => {
    this.messagesEnd.scrollIntoView({ behavior: 'smooth' });
  };

  addListeners = channelId => {
    this.addMessageListener(channelId);
    this.addTypingListener(channelId);
  };

  addTypingListener = channelId => {
    let typingUsers = [];
    this.state.typingRef.child(channelId).on('child_added', snap => {
      if (snap.key !== this.state.user.uid) {
        typingUsers = typingUsers.concat({
          id: snap.key,
          name: snap.val()
        });
        this.setState({ typingUsers });
      }
    });

    this.state.typingRef.child(channelId).on('child_removed', snap => {
      const index = typingUsers.findIndex(user => user.id === snap.key);
      if (index !== -1) {
        typingUsers = typingUsers.filter(user => user.id !== snap.key);
        this.setState({ typingUsers });
      }
    });

    this.state.connectedRef.on('value', snap => {
      if (snap.val() === true) {
        this.state.typingRef
          .child(channelId)
          .child(this.state.user.uid)
          .onDisconnect()
          .remove(err => {
            if (err !== null) {
              console.error(err);
            }
          });
      }
    });
  };

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();
    let data;
    ref.child(channelId).on('value', snap => {
      data = snap.val();
      loadedMessages = [];
      for (const key in data) {
        loadedMessages.push(data[key]);
      }
      this.setState({
        messages: loadedMessages,
        messagesLoading: false
      });
      this.countUniqueUsers(loadedMessages);
      this.countUserPoster(loadedMessages);
    });
  };

  handleSearchChange = event => {
    this.setState({ searchTerm: event.target.value, searchLoading: true }, () =>
      this.handleSearchMessages()
    );
  };

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message);
      }
      return acc;
    }, []);
    this.setState({ searchResults });
    setTimeout(() => {
      this.setState({ searchLoading: false });
    }, 1000);
  };

  handleRemoveLinkMetadata = async (message, data) => {
    const { channel } = this.state;
    const newMessage = { ...message };
    if (newMessage.metadata.length > 1) {
      newMessage.metadata.splice(
        newMessage.metadata.findIndex(meta => meta.url === data.url),
        1
      );
    } else {
      delete newMessage.metadata;
    }
    const ref = this.getMessagesRef();
    await ref
      .child(channel.id)
      .child(message.id)
      .set(newMessage);
  };

  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numberUniqueUsers = `${uniqueUsers.length} User${plural ? 's' : ''}`;
    this.setState({ numberUniqueUsers });
  };

  countUserPoster = messages => {
    let userPosts = messages.reduce((acc, message) => {
      if (message.user.name in acc) {
        acc[message.user.name].count += 1;
      } else {
        acc[message.user.name] = {
          avatar: message.user.avatar,
          count: 1
        };
      }
      return acc;
    }, {});
    this.props.setUserPosts(userPosts);
  };

  displayMessages = messages =>
    messages.length > 0 &&
    messages.map(message => (
      <Message
        key={message.timestamp}
        message={message}
        user={this.state.user}
        removeMetaData={this.handleRemoveLinkMetadata}
      />
    ));

  getMessagesRef = () => {
    const { privateChannel, messagesRef, privateMessagesRef } = this.state;
    return privateChannel ? privateMessagesRef : messagesRef;
  };

  isProgressBarVisible = percent => {
    if (percent > 0) {
      this.setState({ progressBar: true });
    } else {
      this.setState({ progressBar: false });
    }
  };

  displayChannelName = channel => {
    return channel
      ? `${this.state.privateChannel ? `@` : `#`}${channel.name}`
      : '';
  };

  displayTypingUsers = users =>
    users.length > 0 &&
    users.map(user => (
      <div
        key={user.id}
        style={{ display: 'flex', alignItems: 'center', marginBottom: '0.2em' }}
      >
        <span className="user__typing">{user.name} is typing</span> <Typing />
      </div>
    ));

  displayMessageSkeleton = loading =>
    loading ? (
      <React.Fragment>
        {[...Array(15)].map((_, i) => (
          <Skeleton key={i} />
        ))}
      </React.Fragment>
    ) : null;

  render() {
    const {
      messagesRef,
      channel,
      user,
      messages,
      progressBar,
      numberUniqueUsers,
      searchTerm,
      searchResults,
      searchLoading,
      privateChannel,
      messagesLoading,
      typingUsers
    } = this.state;
    return (
      <React.Fragment>
        <MessagesHeader
          handleSearchChange={this.handleSearchChange}
          numberUniqueUsers={numberUniqueUsers}
          channelName={this.displayChannelName(channel)}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
        />
        <Segment>
          <Comment.Group
            className={progressBar ? 'message__progress' : 'messages'}
          >
            {this.displayMessageSkeleton(messagesLoading)}
            {searchTerm
              ? this.displayMessages(searchResults)
              : this.displayMessages(messages)}
            {this.displayTypingUsers(typingUsers)}
            <div ref={node => (this.messagesEnd = node)} />
          </Comment.Group>
        </Segment>
        <MessageForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isProgressBarVisible={this.isProgressBarVisible}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    );
  }
}

export default connect(
  null,
  { setUserPosts }
)(Messages);
