# Composants Bookings

Ce dossier contient tous les composants liés à la gestion des réservations.

## Structure

```
bookings/
├── BookingFilters.tsx       # Filtres de recherche et tri
├── BookingCard.tsx          # Carte mobile pour une réservation
├── BookingTable.tsx         # Tableau desktop des réservations
├── CreateBookingModal.tsx   # Modal de création de réservation
├── CreateUserModal.tsx      # Modal de création d'utilisateur
├── index.ts                 # Exports centralisés
└── README.md               # Documentation
```

## Composants

### BookingFilters
Composant de filtrage des réservations.

**Props:**
- `statusFilter`, `setStatusFilter` - Filtre par statut
- `guestFilter`, `setGuestFilter` - Filtre par voyageur
- `hostFilter`, `setHostFilter` - Filtre par hôte
- `startDate`, `setStartDate` - Date de début
- `endDate`, `setEndDate` - Date de fin

### BookingCard
Carte responsive pour afficher une réservation sur mobile.

**Props:**
- `booking` - Objet réservation
- `translateStatus` - Fonction de traduction du statut
- `getStatusColor` - Fonction pour obtenir la couleur du statut
- `onStatusChange` - Callback pour changer le statut

### BookingTable
Tableau desktop pour afficher les réservations.

**Props:**
- `bookings` - Liste des réservations
- `translateStatus` - Fonction de traduction du statut
- `getStatusColor` - Fonction pour obtenir la couleur du statut
- `editingDates`, `editCheckIn`, `editCheckOut` - État d'édition des dates
- `onStartEditDates`, `onSaveDates`, `onCancelEdit` - Callbacks d'édition
- `onStatusChange` - Callback pour changer le statut

### CreateBookingModal
Modal pour créer une nouvelle réservation.

**Props:**
- `show` - Afficher/masquer la modal
- `onClose` - Callback de fermeture
- `users`, `listings` - Données pour les sélections
- `selectedUserId`, `selectedListingId` - Sélections actuelles
- `bookingCheckIn`, `bookingCheckOut`, `bookingGuests` - Données du formulaire
- `onCreateBooking` - Callback de création
- `onShowCreateUser` - Callback pour ouvrir la modal utilisateur
- `isCreating` - État de chargement

### CreateUserModal
Modal pour créer un nouvel utilisateur.

**Props:**
- `show` - Afficher/masquer la modal
- `onClose` - Callback de fermeture
- `email`, `firstName`, `lastName`, `phone`, `password` - Champs du formulaire
- `onCreateUser` - Callback de création
- `isCreating` - État de chargement

## Utilisation

```tsx
import {
  BookingFilters,
  BookingCard,
  BookingTable,
  CreateBookingModal,
  CreateUserModal
} from '../components/bookings';

// Dans votre composant
<BookingFilters
  statusFilter={statusFilter}
  setStatusFilter={setStatusFilter}
  // ... autres props
/>
```

## Avantages de cette structure

1. **Maintenabilité** - Chaque composant a une responsabilité unique
2. **Réutilisabilité** - Les composants peuvent être utilisés ailleurs
3. **Testabilité** - Plus facile de tester des composants isolés
4. **Lisibilité** - Le code est plus clair et organisé
5. **Performance** - Optimisations possibles par composant
