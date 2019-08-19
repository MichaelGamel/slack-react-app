import React, { Component } from 'react';
import { Segment, Button, Input } from 'semantic-ui-react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import FileModal from './FileModal';
import ProgressBar from './ProgressBar';
import { Picker, emojiIndex } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';
import anchorme from 'anchorme';

class MessageForm extends Component {
  state = {
    storageRef: firebase.storage().ref(),
    message: '',
    channel: this.props.currentChannel,
    user: this.props.currentUser,
    loading: false,
    errors: [],
    modal: false,
    uploadState: '',
    uploadTask: null,
    percentUploaded: 0,
    emojiPicker: false
  };

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  createMessage = (fileUrl = null) => {
    const ref = this.props.getMessagesRef();
    const key = ref.child(this.state.channel.id).push().key
    
    const message = {
      id: key,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL
      }
    };

    if (fileUrl !== null) {
      message['image'] = fileUrl;
    } else {
      message['content'] = anchorme(this.state.message);
    }

    return message;
  };

  getPath = () => {
    if (this.props.isPrivateChannel) {
      return `chat/private-${this.state.channel.id}`;
    } else {
      return `chat/public`;
    }
  };

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.getMessagesRef();
    const filePath = `${this.getPath()}${uuidv4()}.jpg`;

    this.setState(
      {
        uploadState: 'uploading',
        uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
      },
      () => {
        this.state.uploadTask.on(
          'state_changed',
          snap => {
            const percentUploaded = Math.round(
              (snap.bytesTransferred / snap.totalBytes) * 100
            );
            this.props.isProgressBarVisible(percentUploaded);
            this.setState({ percentUploaded });
          },
          error => {
            console.error(error);
            this.setState({
              errors: this.state.errors.concat(error),
              uploadState: 'error',
              uploadTask: null
            });
          },
          async () => {
            try {
              const downloadUrl = await this.state.uploadTask.snapshot.ref.getDownloadURL();
              this.sendFileMessage(downloadUrl, ref, pathToUpload);
            } catch (error) {
              console.error(error);
              this.setState({
                errors: this.state.errors.concat(error),
                uploadState: 'error',
                uploadTask: null
              });
            }
          }
        );
      }
    );
  };

  sendFileMessage = async (fileUrl, ref, pathToUpload) => {
    try {
      const messageObj = this.createMessage(fileUrl);

      await ref
      .child(pathToUpload)
      .child(messageObj.id)
      .update(messageObj);

      this.setState({ uploadState: 'done' });
      this.props.isProgressBarVisible(0);
    } catch (error) {
      console.error(error);
      this.setState({
        errors: this.state.errors.concat(error)
      });
    }
  };

  sendMessage = async () => {
    const { getMessagesRef } = this.props;
    const { message, channel } = this.state;

    if (message) {
      this.setState({ loading: true });
      try {
        const messageObj = this.createMessage();

        const linksCount = anchorme(message, {
          list: true
        });

        if (linksCount.length > 0) {
          const res = await fetch(
            process.env.REACT_APP_SCRAPE_METATAGS_FUNCTION_URL,
            {
              method: 'POST',
              body: JSON.stringify({ text: message })
            }
          );

          const data = await res.json();

          if (data.length > 0) {
            messageObj['metadata'] = data;
          }
        }

        await getMessagesRef()
          .child(channel.id)
          .child(messageObj.id)
          .update(messageObj);

        this.setState({ loading: false, message: '', errors: [] });
      } catch (error) {
        this.setState({
          loading: false,
          errors: this.state.errors.concat(error)
        });
      }
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: 'Add a message' })
      });
    }
  };

  handleAddEmoji = emoji => {
    const oldMessage = this.state.message;
    const newMessage = this.colonToUnicode(` ${oldMessage} ${emoji.colons}`);
    this.setState({ message: newMessage, emojiPicker: false });
    setTimeout(() => this.messageInputRef.focus(), 0);
  };

  colonToUnicode = message => {
    return message.replace(/:[A-Za-z0-9_+-]+:/g, x => {
      x = x.replace(/:/g, '');
      let emoji = emojiIndex.emojis[x];
      if (typeof emoji !== 'undefined') {
        let unicode = emoji.native;
        if (typeof unicode !== 'undefined') {
          return unicode;
        }
      }
      x = ':' + x + ':';
      return x;
    });
  };

  handleKeyDown = event => {
    if (event.ctrlKey && event.keyCode === 13) {
      this.sendMessage();
    }
  };

  handleTogglePicker = () => {
    this.setState({ emojiPicker: !this.state.emojiPicker });
  };

  render() {
    const {
      errors,
      message,
      loading,
      modal,
      uploadState,
      percentUploaded,
      emojiPicker
    } = this.state;
    return (
      <Segment className="message__form">
        {emojiPicker && (
          <Picker
            set="apple"
            className="emojipicker"
            title="Pick your emoji"
            emoji="point_up"
            onSelect={this.handleAddEmoji}
          />
        )}
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          ref={node => (this.messageInputRef = node)}
          style={{ marginBottom: '0.7em' }}
          label={<Button icon={'add'} onClick={this.handleTogglePicker} />}
          labelPosition="left"
          value={message}
          className={
            errors.some(error =>
              error.message.toLowerCase().includes('message')
            )
              ? 'error'
              : ''
          }
          placeholder="Write your message"
        />
        <Button.Group icon widths="2">
          <Button
            onClick={this.sendMessage}
            color="orange"
            content="Add Reply"
            labelPosition="left"
            disabled={loading}
            icon="edit"
          />
          <Button
            disabled={uploadState === 'uploading'}
            color="teal"
            onClick={this.openModal}
            content="Upload Media"
            labelPosition="right"
            icon="cloud upload"
          />
        </Button.Group>
        <FileModal
          uploadFile={this.uploadFile}
          modal={modal}
          closeModal={this.closeModal}
        />

        <ProgressBar
          uploadState={uploadState}
          percentUploaded={percentUploaded}
        />
      </Segment>
    );
  }
}

export default MessageForm;
