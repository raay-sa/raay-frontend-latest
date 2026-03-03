import React from 'react';
import GenericLayout from './GenericLayout';
import navItems from './navConfigs/adminNav';

export default function AdminLayout() {
    return <GenericLayout navItems={navItems} />;
}