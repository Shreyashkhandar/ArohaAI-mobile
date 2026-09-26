import React from 'react';
import CounsellorHomeScreen from '../screens/CounsellorHomeScreen';

export default function CounsellorNavigator({ profile, user, onLogoutSuccess }) {
  return (
    <CounsellorHomeScreen
      profile={profile}
      user={user}
      onLogoutSuccess={onLogoutSuccess}
    />
  );
}
