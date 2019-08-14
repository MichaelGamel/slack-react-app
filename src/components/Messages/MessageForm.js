import React, { Component } from 'react';
import { Segment, Button, Input } from 'semantic-ui-react';
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase';
import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

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
    percentUploaded: 0
  };

  openModal = () => this.setState({ modal: true });

  closeModal = () => this.setState({ modal: false });

  handleChange = event => {
    this.setState({ [event.target.name]: event.target.value });
  };

  createMessage = (fileUrl = null) => {
    const message = {
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
      message['content'] = this.state.message;
    }

    return message;
  };

  uploadFile = (file, metadata) => {
    console.log(file, metadata);
    const pathToUpload = this.state.channel.id;
    const ref = this.props.messagesRef;
    const filePath = `chat/public/${uuidv4()}.jpg`;

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
      await ref
        .child(pathToUpload)
        .push()
        .set(this.createMessage(fileUrl));

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
    const { messagesRef } = this.props;
    const { message, channel } = this.state;

    if (message) {
      this.setState({ loading: true });
      try {
        const messageObj = this.createMessage();

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

        await messagesRef
          .child(channel.id)
          .push()
          .set(messageObj);

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

  render() {
    const {
      errors,
      message,
      loading,
      modal,
      uploadState,
      percentUploaded
    } = this.state;
    return (
      <Segment className="message__form">
        <Input
          fluid
          name="message"
          onChange={this.handleChange}
          style={{ marginBottom: '0.7em' }}
          label={<Button icon={'add'} />}
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
