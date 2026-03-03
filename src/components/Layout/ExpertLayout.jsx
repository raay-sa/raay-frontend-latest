import React from 'react';
import GenericLayout from './GenericLayout';
import navItems from './navConfigs/expertNav';

export default function ExpertLayout() {
  return <GenericLayout navItems={navItems} />;
}