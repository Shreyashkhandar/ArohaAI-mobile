import React from 'react';
import UserHomeScreen from '../screens/UserHomeScreen';

export default function UserNavigator({ profile, user, onLogoutSuccess }) {
  return (
    <UserHomeScreen
      profile={profile}
      user={user}
      onLogoutSuccess={onLogoutSuccess}
    />
  );
}
