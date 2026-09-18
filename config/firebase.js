const admin = require('firebase-admin');

// Initialiser Firebase Admin SDK
const initializeFirebase = () => {
  try {
    if (admin.apps.length === 0) {
      // Construire le service account depuis les variables d'environnement
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID || "eliotel-4c571",
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCpe1xbCbGcQrai\nJtdIuGzQ4iRLKdHrjJFUuSGKACPlOp14F++K5e63O2lpEKI1oShRGYeiwkh/GzLt\nMdoZZW7+XxhA2f8YtKGdZOicq434R6IiEdvh4krLk5k5aM+UKU4rj6J7w27GTS23\nLynjVIET+DwJ9TbvF8Fa9wYSN8WzJo700MIrR1QEzXOaZBjYNjwwjR2aACdAywxk\n6F3yESH4kSMidN91EOdkwgidx0rTgA4++yXup/kWmVhgnA7O6Wf2dHv30Km/eAYi\nai/+sg9J8PLELxq2nNDHdj3PoKCRqyflkFe74lfpmJTu/Ba39KHHuGCr8uUOV7sE\nTWomLkgvAgMBAAECggEAQp6ECiEAWLz8jzaXTzV3SJBr1cPFiUKC6fuvjFBLy9JD\nja5S8ZU6RXosECmCqXQEpgRUBY069AOb/BKpeWweugxlOzC1jl+KW5ULvnHM53g4\n6g19EghigC0vgJqLZeDqokLeiqmihH5X5va6D2rrJg9ggkWKZ2c+EOSi1UxpAOcW\nJWJfbIwzbCISxQcjT07W4hIzY9WCG3bDTkylYDJjacKD5d2fThuGrcDzY664fHne\n75EE/K2HsQ+VGdxzTviGGIqQNdOPnlOV3SI2gR+c+c+gNFjiF7SnOz9iOoar4hu3\nSNR7Zv6JHbZrVE41+vS5WpLq1yUje23kDlFpA0z7UQKBgQDdB0VdZAE7pO62X+FT\nOOGRxBcEgdVaZdt727btt4g4QN2cxmE6n4pDyl+SNwcbeM4OhaoyTk+ODRYE+Fx3\neDfjKJN3A0yNMqCr90YZEDMgNnQ57YQsEj3BqNROfVT/eny1eGt9gLhTI63CCdkj\nLrvvVtouee27rwo9ehhOqvqFJwKBgQDETDQ5Su34QM955Brr9PNlQnHZohc+aU0/\naluG5czR3bkNsdoiRJbRx6TIso2KsqYKPkzhuNOFLUZ8n6JyoBVj10NsSAsExVV6\nI+fcqioWJWsc1Hh8LRL6aTABr9aPuNQuRP+vE+bUgRMrblaX+utcPXLY2MB1Ga/R\nMRLHqUrZuQKBgH0NOxKOnR/4vdJTRvHF8eF91yQGrQZbMKXP9pxiRWDGWlvz5Vi8\noQafvhjEp3HElJikyVly8xHEl5uyROaXDs+nyl8Ab9RHO55v5aoSf0qPZIzNtAUX\nQPeLpKrPwEJXM62cdvxn0mG/gvSQi9ia/Vt5gTHgbD/O1fVYWd5QYDLrAoGBAL0+\nckKh2FYztVJf9QxyNIz0x+n2+M20m0J9+QtOVG4nghaP1iqfUX+hJ15NtWN349eQ\nRHKAy3tjMMdI50X2y2hbyaaEtgq9bDC6mPgGHVkIbgF3XUjp85fy/NNDgGlC2Vxa\nLN3PJATPA3olf9o5j9p3a1dfb/v07amR0/clYQIRAoGALb3XltIFPG2xviaWJ1Pu\nGTlOTW620OlOev1zwGpGxSWaqA2Mvhyi448wuEAlVXpEKfkCXFpYgUVpxeOB7Gwp\nhWM53UisgBlS2qHRWyTPOyK2EHexXsyS4BniJLEC698ugiS35H5ftcpTTBKJMwku\npUacKVCo7c04WfvAH7gqhd4=\n-----END PRIVATE KEY-----\n",
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
        universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
      };

      // Vérifier que les credentials essentiels sont présents
      if (!serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Firebase credentials manquants dans .env (FIREBASE_PRIVATE_KEY et FIREBASE_CLIENT_EMAIL requis)');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });

      console.log('✅ Firebase Admin SDK initialisé avec succès');
      console.log(`📧 Client Email: ${serviceAccount.client_email}`);
      console.log(`🔑 Project ID: ${serviceAccount.project_id}`);
    } else {
      console.log('ℹ️  Firebase Admin SDK déjà initialisé');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation Firebase Admin SDK:', error.message);
    console.error('💡 Vérifiez que les variables FIREBASE_* sont correctement définies dans .env');
  }
};

module.exports = { initializeFirebase, admin };
