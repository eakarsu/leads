'use client';

import { ReactNode, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppBar, Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Toolbar, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SendIcon from '@mui/icons-material/Send';
import SyncIcon from '@mui/icons-material/Sync';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;
const navigation = [
  { label: 'Operations dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Governed leads', path: '/leads', icon: <PeopleIcon /> },
  { label: 'Outreach review', path: '/outreach', icon: <SendIcon /> },
  { label: 'Sync & policies', path: '/settings', icon: <SyncIcon /> },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const drawer = (
    <Box>
      <Toolbar><Typography variant="h6" fontWeight={700}>Lead Operations</Typography></Toolbar>
      <Divider />
      <List>
        {navigation.map((item) => (
          <ListItemButton
            key={item.path}
            selected={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(`${item.path}/`))}
            onClick={() => { router.push(item.path); setMobileOpen(false); }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon><ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, display: { md: 'none' } }}><MenuIcon /></IconButton>
          <Typography sx={{ flexGrow: 1 }} fontWeight={600}>Governed lead-to-conversion workflow</Typography>
          <IconButton color="inherit" onClick={(event) => setAnchor(event.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32 }}>{session?.user?.name?.slice(0, 1).toUpperCase() || '?'}</Avatar>
          </IconButton>
          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <MenuItem disabled>{session?.user?.email}</MenuItem>
            <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width: drawerWidth, '& .MuiDrawer-paper': { width: drawerWidth } }}>{drawer}</Drawer>
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>{drawer}</Drawer>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 }, mt: 8 }}>{children}</Box>
    </Box>
  );
}
