import React from 'react';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { connect } from 'react-redux';
import ColorPanel from '../components/ColorPanel/ColorPanel';
import SidePanel from '../components/SidePanel/SidePanel';
import Messages from '../components/Messages/Messages';
import MetaPanel from '../components/MetaPanel/MetaPanel';

const App = ({ currentUser, currentChannel, isPrivateChannel }) => (
  <Grid className="app" columns="equal" style={{ background: '#eee' }}>
    <ColorPanel />
    <SidePanel key={currentUser && currentUser.uid} currentUser={currentUser} />
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
        key={currentChannel && currentChannel.id}
        currentChannel={currentChannel}
        isPrivateChannel={isPrivateChannel}
      />
    </Grid.Column>
  </Grid>
);

const mapStateToProps = ({ user, channel }) => ({
  currentUser: user.currentUser,
  currentChannel: channel.currentChannel,
  isPrivateChannel: channel.isPrivateChannel
});

export default connect(mapStateToProps)(App);
