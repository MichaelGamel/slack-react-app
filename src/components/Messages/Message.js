import React from 'react';
import { Comment, Image } from 'semantic-ui-react';
import moment from 'moment';
import LinksMetaData from './LinksMetaData';

const isOwnMessage = (message, user) => {
  return message.user.id === user.uid ? 'message__self' : '';
};

const timeFromNow = timestamp => moment(timestamp).fromNow();

const isImage = message =>
  message.hasOwnProperty('image') && !message.hasOwnProperty('content');

const hasMetadata = message =>
  message.hasOwnProperty('metadata') && message.metadata.length > 0;

const Message = ({ user, message }) => (
  <Comment>
    <Comment.Avatar src={message.user.avatar} />
    <Comment.Content className={isOwnMessage(message, user)}>
      <Comment.Author as="a">{message.user.name}</Comment.Author>
      <Comment.Metadata>{timeFromNow(message.timestamp)}</Comment.Metadata>
      {isImage(message) ? (
        <Image src={message.image} className="message__image" />
      ) : (
        <React.Fragment>
          <Comment.Text>{message.content}</Comment.Text>
          {hasMetadata(message) && (
            <LinksMetaData metadata={message.metadata} />
          )}
        </React.Fragment>
      )}
    </Comment.Content>
  </Comment>
);

export default Message;
