import React, { Component } from 'react';
import { Segment, Header, Icon, Input } from 'semantic-ui-react';
class MessagesHeader extends Component {
  render() {
    const {
      channelName,
      numberUniqueUsers,
      handleSearchChange,
      searchLoading,
      isPrivateChannel
    } = this.props;
    return (
      <Segment clearing>
        {/* Channel Title */}
        <Header fluid="true" as="h2" floated="left" style={{ marginBottom: 0 }}>
          <span>
            {channelName}
            {!isPrivateChannel && <Icon name={'star outline'} />}
          </span>
          <Header.Subheader>{numberUniqueUsers}</Header.Subheader>
        </Header>

        {/* Channel Search Input */}
        <Header floated="right">
          <Input
            loading={searchLoading}
            onChange={handleSearchChange}
            size="mini"
            icon="search"
            name="searchTerm"
            placeholder="Search Messages"
          />
        </Header>
      </Segment>
    );
  }
}

export default MessagesHeader;
