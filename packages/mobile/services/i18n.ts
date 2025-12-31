
// Simple lightweight i18n service
// Fallback solution since adding dependencies caused environment issues

const tr = {
    common: {
        error: "Hata",
        loading: "Yükleniyor...",
        cancel: "İptal",
        confirm: "Onayla",
        save: "Kaydet",
        delete: "Sil",
        edit: "Düzenle"
    },
    welcome: {
        title: "Cinetron",
        subtitle: "Kişisel sinemanıza hoş geldiniz"
    },
    home: {
        featured: "Öne Çıkan",
        continueWatching: "Kaldığın Yerden Devam Et",
        recentlyAdded: "Son Eklenenler",
        movies: "Filmler",
        series: "Diziler",
        watch: "İzle",
        details: "Detaylar"
    },
    media: {
        notFound: "Medya Bulunamadı",
        overview: "Özet",
        noOverview: "Özet bulunamadı.",
        episodes: "Bölümler",
        watchNow: "Hemen İzle",
        season: "Sezon",
        episode: "Bölüm"
    },
    player: {
        subtitles: "Altyazılar",
        off: "Kapalı",
        noSubtitles: "Altyazı bulunamadı",
        speed: "Hız",
        locked: "Ekran Kilitli",
        settings: "Ayarlar",
        resume: "Devam Et",
        startOver: "Baştan Başla",
        resumeTitle: "İzlemeye Devam Et?"
    },
    login: {
        title: "Giriş Yap",
        subtitle: "Kişisel Sinemanız",
        email: "E-posta",
        emailPlaceholder: "E-posta adresiniz",
        password: "Şifre",
        passwordPlaceholder: "Şifreniz",
        serverAddress: "Sunucu Adresi",
        serverAddressPlaceholder: "http://192.168.1.xxx:3000",
        localIpHint: "Yerel ağ IP adresinizi kullanın (localhost mobilde çalışmaz)",
        submit: "Giriş Yap",
        showSettings: "Sunucu Ayarları",
        hideSettings: "Ayarları Gizle",
        errorEmpty: "Lütfen e-posta ve şifrenizi girin",
        errorServer: "Sunucuya bağlanılamadı. Lütfen sunucu adresini kontrol edin.",
        errorTitle: "Giriş Başarısız"
    }
};

const en = {
    common: {
        error: "Error",
        loading: "Loading...",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        delete: "Delete",
        edit: "Edit"
    },
    welcome: {
        title: "Cinetron",
        subtitle: "Welcome to your personal cinema"
    },
    home: {
        featured: "Featured",
        continueWatching: "Continue Watching",
        recentlyAdded: "Recently Added",
        movies: "Movies",
        series: "Series",
        watch: "Watch",
        details: "Details"
    },
    media: {
        notFound: "Media Not Found",
        overview: "Overview",
        noOverview: "No overview available.",
        episodes: "Episodes",
        watchNow: "Watch Now",
        season: "Season",
        episode: "Episode"
    },
    player: {
        subtitles: "Subtitles",
        off: "Off",
        noSubtitles: "No subtitles available",
        speed: "Speed",
        locked: "Screen Locked",
        settings: "Settings",
        resume: "Resume",
        startOver: "Start Over",
        resumeTitle: "Resume Watching?"
    },
    login: {
        title: "Login",
        subtitle: "Your Personal Cinema",
        email: "Email",
        emailPlaceholder: "Your email address",
        password: "Password",
        passwordPlaceholder: "Your password",
        serverAddress: "Server Address",
        serverAddressPlaceholder: "http://192.168.1.xxx:3000",
        localIpHint: "Use local network IP (localhost won't work on mobile)",
        submit: "Login",
        showSettings: "Server Settings",
        hideSettings: "Hide Settings",
        errorEmpty: "Please enter email and password",
        errorServer: "Could not connect to server. Please check server address.",
        errorTitle: "Login Failed"
    }
};

// Allow changing language later if needed (simple state)
let currentLocale = 'tr'; 

export const setLocale = (locale: 'tr' | 'en') => {
    currentLocale = locale;
};

export const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = currentLocale === 'tr' ? tr : en;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key; // Fallback to key if not found
        }
    }

    if (typeof value === 'string' && params) {
        Object.keys(params).forEach(param => {
            value = value.replace(`{{${param}}}`, String(params[param]));
        });
    }

    return value;
};

export default { t, setLocale };
