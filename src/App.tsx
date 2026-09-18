import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Payment from './pages/Payment';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DeleteAccount from './pages/DeleteAccount';
import ListingDetail from './pages/ListingDetail';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users';
import ListingsPage from './pages/Listings';
import BookingsPage from './pages/Bookings';
import CreateBookingPage from './pages/CreateBooking';
import BillingPage from './pages/Billing';
import PaymentHistoryPage from './pages/PaymentHistory';
import ReviewsPage from './pages/Reviews';
import ReportsPage from './pages/Reports';
import SendNotificationPage from './pages/SendNotification';
import './responsive.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetail />} />
            <Route path="/payment/:bookingId" element={<Payment />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
            
            {/* Routes admin */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/signup" element={<Signup />} />

            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="listings" element={<ListingsPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route path="bookings/new" element={<CreateBookingPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="billing/history" element={<PaymentHistoryPage />} />
              <Route path="reviews" element={<ReviewsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<SendNotificationPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
