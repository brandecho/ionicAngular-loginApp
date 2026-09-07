import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'inbox',
    loadComponent: () => import('./pages/inbox.page').then((m) => m.InboxPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin.page').then((m) => m.AdminPage),
  },
  {
    path: 'staff-status/:id',
    loadComponent: () => import('./pages/staff-status.page').then((m) => m.StaffStatusPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./pages/home.page').then((m) => m.HomePage),
      },
      {
        path: 'venues',
        loadComponent: () => import('./pages/venues.page').then((m) => m.VenuesPage),
      },
      {
        path: 'people',
        loadComponent: () => import('./pages/people.page').then((m) => m.PeoplePage),
      },
      {
        path: 'discover',
        loadComponent: () => import('./pages/discover.page').then((m) => m.DiscoverPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile.page').then((m) => m.ProfilePage),
      },
    ],
  },
  {
    path: 'venue/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/venue-detail.page').then((m) => m.VenueDetailPage),
  },
  {
    path: 'checkin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/checkin.page').then((m) => m.CheckinPage),
  },
  {
    // The venue manager's view — opened from the recognition push notification.
    path: 'manager/:id',
    loadComponent: () => import('./pages/manager.page').then((m) => m.ManagerPage),
  },
  {
    // Venue-side portal (separate persona — no member auth).
    path: 'venue-portal',
    loadComponent: () => import('./pages/venue-portal.page').then((m) => m.VenuePortalPage),
  },
  {
    path: 'venue-portal/:id',
    loadComponent: () =>
      import('./pages/venue-dashboard.page').then((m) => m.VenueDashboardPage),
  },
  { path: '**', redirectTo: 'login' },
];
