import React from 'react';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { connect } from 'react-redux';
import ColorPanel from '../components/ColorPanel/ColorPanel';
import SidePanel from '../components/SidePanel/SidePanel';
import Messages from '../components/Messages/Messages';
import MetaPanel from '../components/MetaPanel/MetaPanel';

// prettier-ignore
const App = ({ currentUser, currentChannel, isPrivateChannel, userPosts, primaryColor, secondaryColor }) => (
  <Grid className="app" columns="equal" style={{ background: secondaryColor }}>
    <ColorPanel key={currentUser && currentUser.name} currentUser={currentUser} />
    <SidePanel key={currentUser && currentUser.uid} currentUser={currentUser} primaryColor={primaryColor} />
    <Grid.Column style={{ marginLeft: 300 }}>
      <Messages
        key={currentChannel && currentChannel.id}
        currentChannel={currentChannel}
        currentUser={currentUser}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>
    <Grid.Column width={4}>
      <MetaPanel
        key={currentChannel && currentChannel.name}
        currentChannel={currentChannel}
        isPrivateChannel={isPrivateChannel}
        userPosts={userPosts}
      />
    </Grid.Column>
  </Grid>
);

const mapStateToProps = ({ user, channel, colors }) => ({
  currentUser: user.currentUser,
  currentChannel: channel.currentChannel,
  isPrivateChannel: channel.isPrivateChannel,
  userPosts: channel.userPosts,
  primaryColor: colors.primaryColor,
  secondaryColor: colors.secondaryColor
});

export default connect(mapStateToProps)(App);
