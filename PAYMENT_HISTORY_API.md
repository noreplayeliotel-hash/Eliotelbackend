# API Historique de Paiement pour les Hôtes - Backend

## 📋 Résumé

Création d'une nouvelle API dédiée aux hôtes pour consulter leur historique de paiement, séparée de l'API administrateur.

## 🆕 Nouveau Endpoint

### Route
```
GET /bookings/payment-history
```

### Authentification
- **Middleware** : `auth` (authentification JWT)
- **Middleware** : `requireHost` (vérification du rôle hôte)
- **Accès** : Hôtes authentifiés uniquement

### Paramètres de requête
| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `month` | Integer | Non | Numéro du mois (1-12) |
| `year` | Integer | Non | Année (ex: 2026) |

### Réponse

#### Succès (200)
```json
{
  "success": true,
  "data": [
    {
      "host": {
        "_id": "host_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+33123456789",
        "avatar": "https://...",
        "rib": "FR76...",
        "ribImage": "https://..."
      },
      "totalAmount": 1250.50,
      "bookingsCount": 3,
      "bookings": [
        {
          "_id": "booking_id",
          "checkIn": "2026-02-15T00:00:00.000Z",
          "checkOut": "2026-02-20T00:00:00.000Z",
          "total": 450.00,
          "status": "completed",
          "guest": {
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com",
            "phone": "+33987654321"
          },
          "listing": {
            "title": "Appartement cosy à Paris"
          }
        }
      ]
    }
  ]
}
```

#### Erreur (401/403)
```json
{
  "success": false,
  "message": "Non autorisé"
}
```

## 📁 Fichiers Modifiés

### 1. `backend/controllers/bookingController.js`

#### Nouvelle méthode : `getHostPaymentHistory`

**Fonctionnalités** :
- Récupère l'ID de l'hôte depuis le token JWT (`req.user.userId`)
- Filtre automatiquement les réservations par `host` et `eliotelPaid: true`
- Supporte le filtrage optionnel par mois et année
- Utilise MongoDB Aggregation Pipeline pour :
  - Joindre les informations des voyageurs (guests)
  - Joindre les informations des annonces (listings)
  - Grouper par hôte
  - Calculer le montant total et le nombre de réservations
  - Récupérer les détails de l'hôte (RIB, avatar, etc.)

**Pipeline d'agrégation** :
1. `$match` : Filtre les réservations de l'hôte avec paiement validé
2. `$lookup` : Joint les données des voyageurs
3. `$lookup` : Joint les données des annonces
4. `$group` : Groupe par hôte et calcule les totaux
5. `$lookup` : Récupère les détails complets de l'hôte
6. `$project` : Formate la réponse finale
7. `$sort` : Trie par montant décroissant

### 2. `backend/routes/bookingRoutes.js`

#### Nouvelle route
```javascript
router.get('/payment-history', requireHost, bookingController.getHostPaymentHistory);
```

**Caractéristiques** :
- Placée après les routes de gestion des réservations
- Protégée par le middleware `requireHost`
- Accessible uniquement aux hôtes authentifiés

## 🔒 Sécurité

### Isolation des données
- Chaque hôte ne peut voir **que ses propres** paiements
- Le `hostId` est extrait du token JWT (impossible de falsifier)
- Pas besoin de passer l'ID de l'hôte en paramètre

### Validation
- Authentification JWT obligatoire
- Vérification du rôle "host"
- Validation des paramètres de date (month, year)

### Différences avec l'API Admin

| Aspect | API Host | API Admin |
|--------|----------|-----------|
| **Endpoint** | `/bookings/payment-history` | `/admin/billing/history` |
| **Accès** | Hôtes authentifiés | Administrateurs uniquement |
| **Données** | Propres paiements uniquement | Tous les paiements |
| **Filtrage** | Automatique par hostId | Manuel par hostId |
| **Middleware** | `auth` + `requireHost` | `auth` + `requireAdmin` |

## 🎯 Avantages

### Sécurité
✅ Principe de moindre privilège  
✅ Isolation des données par hôte  
✅ Pas de risque d'accès aux données d'autres hôtes  

### Performance
✅ Moins de données à traiter (un seul hôte)  
✅ Requête optimisée pour un cas d'usage spécifique  
✅ Index MongoDB utilisés efficacement  

### Maintenabilité
✅ Séparation claire des responsabilités  
✅ Code dédié pour chaque type d'utilisateur  
✅ Plus facile à tester et à déboguer  

## 🧪 Test de l'API

### Avec cURL
```bash
curl -X GET "http://localhost:5000/api/bookings/payment-history?month=2&year=2026" \
  -H "Authorization: Bearer YOUR_HOST_JWT_TOKEN"
```

### Avec Postman
1. **Method** : GET
2. **URL** : `http://localhost:5000/api/bookings/payment-history`
3. **Headers** :
   - `Authorization: Bearer YOUR_HOST_JWT_TOKEN`
4. **Query Params** (optionnels) :
   - `month`: 2
   - `year`: 2026

## 📊 Exemple de Données

### Requête
```
GET /api/bookings/payment-history?month=2&year=2026
Authorization: Bearer eyJhbGc...
```

### Réponse
```json
{
  "success": true,
  "data": [
    {
      "host": {
        "_id": "65abc123...",
        "firstName": "Marie",
        "lastName": "Dupont",
        "email": "marie.dupont@example.com",
        "phone": "+33612345678",
        "avatar": "https://storage.example.com/avatars/marie.jpg",
        "rib": "FR7612345678901234567890123",
        "ribImage": "https://storage.example.com/ribs/marie_rib.jpg"
      },
      "totalAmount": 2450.00,
      "bookingsCount": 5,
      "bookings": [
        {
          "_id": "65def456...",
          "checkIn": "2026-02-10T00:00:00.000Z",
          "checkOut": "2026-02-15T00:00:00.000Z",
          "total": 650.00,
          "status": "completed",
          "guest": {
            "firstName": "Pierre",
            "lastName": "Martin",
            "email": "pierre.martin@example.com",
            "phone": "+33698765432"
          },
          "listing": {
            "title": "Studio lumineux centre-ville"
          }
        }
      ]
    }
  ]
}
```

## 🔄 Migration depuis l'API Admin

### Avant (API Admin - Non recommandé pour les hôtes)
```javascript
// ❌ Nécessite des privilèges admin
GET /api/admin/billing/history?month=2&year=2026
```

### Après (API Host - Recommandé)
```javascript
// ✅ Accessible aux hôtes, sécurisé
GET /api/bookings/payment-history?month=2&year=2026
```

## 📝 Notes Techniques

### Modèles utilisés
- `Booking` : Modèle principal des réservations
- `User` : Informations des hôtes et voyageurs
- `Listing` : Informations des annonces

### Champs importants
- `eliotelPaid` : Boolean indiquant si le paiement a été effectué par Eliotel
- `pricing.total` : Montant total de la réservation
- `checkIn` : Date d'arrivée (utilisée pour le filtrage par période)

### Optimisations possibles
- Ajouter un index sur `{ host: 1, eliotelPaid: 1, checkIn: 1 }`
- Mettre en cache les résultats pour les requêtes fréquentes
- Paginer les résultats si le nombre de réservations est très élevé
