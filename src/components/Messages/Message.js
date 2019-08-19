import React from 'react';
import { Comment, Image } from 'semantic-ui-react';
import moment from 'moment';
import LinksMetaData from './LinksMetaData';

const isOwnMessage = (message, user, className) => {
  return message.user.id === user.uid ? className : '';
};

const timeFromNow = timestamp => moment(timestamp).fromNow();

const isImage = message =>
  message.hasOwnProperty('image') && !message.hasOwnProperty('content');

const hasMetadata = message =>
  message.hasOwnProperty('metadata') && message.metadata.length > 0;

const Message = ({ user, message, removeMetaData }) => (
  <Comment className={isOwnMessage(message, user, 'message')}>
    <Comment.Avatar src={message.user.avatar} />
    <Comment.Content className={isOwnMessage(message, user, 'message__self')}>
      <Comment.Author as="a">{message.user.name}</Comment.Author>
      <Comment.Metadata>{timeFromNow(message.timestamp)}</Comment.Metadata>
      {isImage(message) ? (
        <Image src={message.image} className="message__image" />
      ) : (
        <React.Fragment>
          <Comment.Text dangerouslySetInnerHTML={{ __html: message.content }} />
          {hasMetadata(message) && (
            <LinksMetaData removeMetaData={(data) => removeMetaData(message, data)} metadata={message.metadata} />
          )}
        </React.Fragment>
      )}
    </Comment.Content>
  </Comment>
);

export default Message;
