import React from 'react';
import GenericLayout from './GenericLayout';
import navItems from './navConfigs/studentNav';

export default function StudentLayout() {
    return <GenericLayout navItems={navItems} />;
}