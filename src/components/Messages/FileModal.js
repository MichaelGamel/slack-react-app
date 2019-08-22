import React, { Component } from 'react';
import { Button, Icon, Modal, Input } from 'semantic-ui-react';
import mime from 'mime-types';

class FileModal extends Component {
  state = {
    file: null,
    authorized: ['image/jpeg', 'image/png']
  };

  addFile = event => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ file });
    }
  };

  sendFile = () => {
    const { file } = this.state;
    const { uploadFile, closeModal } = this.props;
    if (file) {
      if (this.isAuthorized(file.name)) {
        const metadata = { contentType: mime.lookup(file.name) };
        uploadFile(file, metadata);
        closeModal();
        this.clearFile();
      }
    }
  };

  clearFile = () => this.setState({ file: null });

  isAuthorized = filename =>
    this.state.authorized.includes(mime.lookup(filename));

  render() {
    const { modal, closeModal } = this.props;
    return (
      <Modal open={modal} onClose={closeModal}>
        <Modal.Header>Select an image file</Modal.Header>
        <Modal.Content>
          <Input
            onChange={this.addFile}
            fluid
            label="File types: jpg, png"
            name="file"
            type="file"
          />
        </Modal.Content>
        <Modal.Actions>
          <Button color="green" onClick={this.sendFile}>
            <Icon name="checkmark" /> Send
          </Button>
          <Button color="red" onClick={closeModal}>
            <Icon name="remove" /> Cancle
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default FileModal;
