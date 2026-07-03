'use client';

import { type ReactNode, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';
import FloatingCRMChatbot from './FloatingCRMChatbot';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import CampaignIcon from '@mui/icons-material/Campaign';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkIcon from '@mui/icons-material/Work';
import TaskIcon from '@mui/icons-material/Task';
import ContactsIcon from '@mui/icons-material/Contacts';
import InventoryIcon from '@mui/icons-material/Inventory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DescriptionIcon from '@mui/icons-material/Description';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ForumIcon from '@mui/icons-material/Forum';
import WidgetsIcon from '@mui/icons-material/Widgets';
import BarChartIcon from '@mui/icons-material/BarChart';
import WebIcon from '@mui/icons-material/Web';
import FolderIcon from '@mui/icons-material/Folder';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import DevicesIcon from '@mui/icons-material/Devices';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PortalIcon from '@mui/icons-material/AccountBox';
import EventIcon from '@mui/icons-material/Event';
import RouteIcon from '@mui/icons-material/Route';
import PollIcon from '@mui/icons-material/Poll';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GavelIcon from '@mui/icons-material/Gavel';
import SyncIcon from '@mui/icons-material/Sync';
import CategoryIcon from '@mui/icons-material/Category';
import BuildIcon from '@mui/icons-material/Build';
import MapIcon from '@mui/icons-material/Map';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import BookOnlineIcon from '@mui/icons-material/BookOnline';
import InsightsIcon from '@mui/icons-material/Insights';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MessageIcon from '@mui/icons-material/Message';
import AbcIcon from '@mui/icons-material/Abc';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import RuleIcon from '@mui/icons-material/Rule';
import { Collapse } from '@mui/material';

const drawerWidth = 240;

type MenuSubItem = {
  text: string;
  path: string;
};

type MenuItemConfig = {
  text: string;
  icon: ReactNode;
  path: string;
  submenu?: MenuSubItem[];
};

const menuItems: MenuItemConfig[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Clients', icon: <BusinessIcon />, path: '/clients' },
  { text: 'Campaigns', icon: <CampaignIcon />, path: '/campaigns' },
  { text: 'Leads', icon: <PeopleIcon />, path: '/leads' },
  {
    text: 'Opportunities',
    icon: <WorkIcon />,
    path: '/opportunities',
    submenu: [
      { text: 'All Opportunities', path: '/opportunities' },
      { text: 'Pipeline View', path: '/opportunities/pipeline' },
    ]
  },
  { text: 'Tasks', icon: <TaskIcon />, path: '/tasks' },
  { text: 'Contacts', icon: <ContactsIcon />, path: '/contacts' },
  { text: 'Products', icon: <InventoryIcon />, path: '/products' },
  { text: 'Calendar', icon: <CalendarMonthIcon />, path: '/calendar' },
  {
    text: 'Sales',
    icon: <RequestQuoteIcon />,
    path: '/quotes',
    submenu: [
      { text: 'Quotes', path: '/quotes' },
      { text: 'Contracts', path: '/contracts' },
      { text: 'Orders', path: '/orders' },
      { text: 'Invoices', path: '/invoices' },
      { text: 'Forecasting', path: '/forecasting' },
      { text: 'CPQ', path: '/cpq' },
      { text: 'Pipeline Inspection', path: '/pipeline-inspection' },
      { text: 'Revenue Intelligence', path: '/revenue-intelligence' },
      { text: 'Deal Risk Room', path: '/deal-risk-room' },
      { text: 'Opportunity Contact Roles', path: '/opportunity-contact-roles' },
      { text: 'Financial Sync', path: '/financial-sync' },
      { text: 'Price Books', path: '/price-books' },
      { text: 'Sales Territories', path: '/territories' },
      { text: 'Sales Cadences', path: '/sales-cadences' },
      { text: 'Conversation Insights', path: '/conversation-insights' },
    ]
  },
  {
    text: 'Service',
    icon: <SupportAgentIcon />,
	    path: '/cases',
	    submenu: [
	      { text: 'Cases', path: '/cases' },
	      { text: 'Case Queues', path: '/case-queues' },
	      { text: 'Case Milestones', path: '/case-milestones' },
	      { text: 'Service Operations', path: '/service-operations' },
	      { text: 'Knowledge Base', path: '/knowledge' },
      { text: 'Entitlements', path: '/entitlements' },
      { text: 'Assets', path: '/assets' },
      { text: 'Live Chat', path: '/live-chat' },
      { text: 'Service Contracts', path: '/service-contracts' },
      { text: 'Einstein Bots', path: '/einstein-bots' },
      { text: 'Social Service', path: '/social-service' },
      { text: 'Messaging', path: '/messaging' },
    ]
  },
  {
    text: 'Field Service',
    icon: <BuildIcon />,
    path: '/work-orders',
    submenu: [
      { text: 'Work Orders', path: '/work-orders' },
      { text: 'Service Appointments', path: '/service-appointments' },
      { text: 'Scheduling Wizard', path: '/scheduling' },
      { text: 'Service Territories', path: '/service-territories' },
      { text: 'Service Resources', path: '/service-resources' },
      { text: 'Service Crews', path: '/service-crews' },
      { text: 'Work Types', path: '/work-types' },
      { text: 'Skills', path: '/skills' },
      { text: 'Shifts', path: '/shifts' },
      { text: 'Time Sheets', path: '/time-sheets' },
      { text: 'Resource Absences', path: '/resource-absences' },
      { text: 'Field Service Assets', path: '/field-service-assets' },
      { text: 'Maintenance Plans', path: '/maintenance-plans' },
      { text: 'Scheduling Policies', path: '/scheduling-policies' },
      { text: 'Mobile Field Service', path: '/mobile-field-service' },
    ]
  },
  {
    text: 'Marketing',
    icon: <EmailIcon />,
    path: '/email-center',
    submenu: [
      { text: 'Email Center', path: '/email-center' },
      { text: 'Email Templates', path: '/email-templates' },
      { text: 'Mass Email', path: '/mass-email' },
      { text: 'Web Forms', path: '/web-forms' },
      { text: 'Journeys', path: '/journeys' },
      { text: 'Marketing Events', path: '/marketing-events' },
      { text: 'Surveys', path: '/surveys' },
      { text: 'Campaign Influence', path: '/campaign-influence' },
      { text: 'A/B Tests', path: '/ab-tests' },
      { text: 'Landing Pages', path: '/landing-pages' },
      { text: 'Marketing Analytics', path: '/marketing-analytics' },
    ]
  },
  {
    text: 'Portals',
    icon: <PortalIcon />,
    path: '/partner-portal',
    submenu: [
      { text: 'Partner Portal', path: '/partner-portal' },
      { text: 'Customer Portal', path: '/customer-portal' },
    ]
  },
  {
    text: 'Activities',
    icon: <TimelineIcon />,
    path: '/activities',
    submenu: [
      { text: 'Activities', path: '/activities' },
      { text: 'CRM Timeline', path: '/timeline' },
      { text: 'Record Activity Center', path: '/record-activity' },
    ],
  },
	  {
	    text: 'Chatter',
	    icon: <ForumIcon />,
	    path: '/chatter',
	    submenu: [
	      { text: 'Chatter Feed', path: '/chatter' },
	      { text: 'Chatter Groups', path: '/chatter-groups' },
	    ],
	  },
  { text: 'Notifications', icon: <NotificationsActiveIcon />, path: '/notifications' },
  { text: 'Files', icon: <FolderIcon />, path: '/files' },
  {
    text: 'Automation',
    icon: <AccountTreeIcon />,
    path: '/workflows',
    submenu: [
      { text: 'Workflows', path: '/workflows' },
      { text: 'Workflow Rules', path: '/workflow-rules' },
      { text: 'Process Builder', path: '/process-builder' },
      { text: 'Lead Assignment', path: '/lead-assignment' },
      { text: 'Approvals', path: '/approvals' },
    ]
  },
  { text: 'Agentforce', icon: <AutoAwesomeIcon />, path: '/einstein' },
  { text: 'Agent Studio', icon: <AutoAwesomeIcon />, path: '/ai-studio' },
  {
    text: 'Data',
    icon: <CloudUploadIcon />,
    path: '/data-import',
    submenu: [
      { text: 'Data Import', path: '/data-import' },
      { text: 'Data Mask & Seed', path: '/data-mask-seed' },
      { text: 'Duplicate Management', path: '/duplicates' },
      { text: 'AppExchange', path: '/appexchange' },
      { text: 'Vertical Solution Packs', path: '/vertical-pack' },
      { text: 'Privacy Benchmarks', path: '/privacy-benchmark' },
      { text: 'Custom Objects', path: '/custom-objects' },
    ]
  },
  {
    text: 'Reports',
    icon: <AssessmentIcon />,
    path: '/reports',
    submenu: [
      { text: 'All Reports', path: '/reports' },
      { text: 'Create Report', path: '/report-builder' },
      { text: 'Scheduled Reports', path: '/scheduled-reports' },
      { text: 'Dynamic Dashboards', path: '/dynamic-dashboards' },
    ]
  },
  {
    text: 'Admin',
    icon: <SecurityIcon />,
    path: '/roles',
    submenu: [
      { text: 'Platform Setup Center', path: '/platform-setup' },
      { text: 'Setup with AI', path: '/setup-ai' },
      { text: 'Security Center', path: '/security-center' },
      { text: 'Roles & Hierarchy', path: '/roles' },
      { text: 'Validation Rules', path: '/validation-rules' },
    ]
  },
  { text: 'Loyalty', icon: <LoyaltyIcon />, path: '/loyalty' },
  { text: 'Maps', icon: <MapIcon />, path: '/maps' },
	  {
	    text: 'Scheduler',
	    icon: <BookOnlineIcon />,
	    path: '/scheduler',
	    submenu: [
	      { text: 'Scheduler', path: '/scheduler' },
	      { text: 'Booking Calendars', path: '/booking-calendars' },
	    ],
	  },
  {
    text: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
    submenu: [
      { text: 'General Settings', path: '/settings' },
      { text: 'Email & Calendar Sync', path: '/sync-settings' },
    ]
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleSubmenuToggle = (text: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [text]: !prev[text],
    }));
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          LeadGenFlow AI
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isActive = !item.submenu && pathname === item.path;
          const hasActiveChild = item.submenu?.some((sub) => pathname === sub.path);

          return (
            <div key={item.text}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (item.submenu) {
                      handleSubmenuToggle(item.text);
                    } else {
                      handleMenuClick(item.path);
                    }
                  }}
                  sx={{
                    ...(isActive && {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { bgcolor: 'primary.dark' },
                      '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    }),
                    ...(hasActiveChild && {
                      bgcolor: 'action.selected',
                    }),
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.submenu && (
                    openSubmenus[item.text] ? <ExpandLess /> : <ExpandMore />
                  )}
                </ListItemButton>
              </ListItem>
              {item.submenu && (
                <Collapse in={openSubmenus[item.text] || hasActiveChild} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem) => {
                      const isSubActive = pathname === subItem.path;
                      return (
                        <ListItemButton
                          key={subItem.text}
                          sx={{
                            pl: 4,
                            ...(isSubActive && {
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              fontWeight: 'bold',
                              '&:hover': { bgcolor: 'primary.main' },
                            }),
                          }}
                          onClick={() => handleMenuClick(subItem.path)}
                        >
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={isSubActive ? { fontWeight: 'bold' } : undefined}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </div>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {session?.user?.name || ''}
          </Typography>
          <Tooltip title="Search (Cmd+K)">
            <IconButton
              color="inherit"
              onClick={() => setSearchOpen(true)}
              sx={{ mr: 1 }}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <NotificationBell />
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 2 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">{session?.user?.email}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Role: {session?.user?.role}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <FloatingCRMChatbot />
    </Box>
  );
}
