# BAT ESPORTS

BAT Esports site: ana sayfa, PUBG Mobile kadrosu, yönetim ve ekip, duyurular, başarılar, mağaza, başvuru formu ve yönetim paneli. Site verileri Netlify Blobs üzerinde kalıcı saklanır.

## Netlify'de yayınlama

1. Şu bağlantıyı aç: https://app.netlify.com/start/deploy?repository=https://github.com/tutukbugrahan-web/BAT-Esports-Site
2. GitHub deposuna erişim ver ve Netlify'de siteyi oluştur.
3. Site configuration → Environment variables bölümüne şu üç değişkeni ekle:
   - `BAT_ADMIN_USERNAME` — istediğin yönetici adı (ör. `batadmin`)
   - `BAT_ADMIN_INITIAL_PASSWORD` — uzun, benzersiz ve yalnızca senin bildiğin bir şifre
   - `BAT_SESSION_SECRET` — şifreden farklı, uzun rastgele bir gizli değer
4. Deploys → Trigger deploy → Deploy site ile yeniden yayınla.
5. `https://SİTE-ADRESİN/api/health` adresinde `{"ok":true,"service":"BAT Esports API"}` benzeri bir yanıt görmelisin.

## Yönetim paneli

- Yönetici girişi: `/login.html` (veya `/login`)
- Yönetim paneli: `/admin.html` (veya `/admin`)
- İçerikleri düzenledikten sonra **Kaydet ve Yayınla** düğmesine bas.
- Kadro, ekip, haber, başarı ve ürün kaydı ekleyebilir; metinleri ve görselleri düzenleyebilirsin.
- Başvurular **Başvurular** sekmesinde listelenir.

**Güvenlik:** Gerçek parolaları veya gizli değerleri GitHub dosyalarına yazma. Yalnızca Netlify Environment variables bölümünde sakla. Bu ortam değişkenlerini eklemeden önce yönetici girişi çalışmaz.

## Güncel dağıtım kontrolü

Kod güncellemesi GitHub'daki `main` dalına geldikten sonra Netlify > Deploys ekranında son dağıtımın commit kimliği kontrol edilir. Eski commit görünüyorsa site ayarlarında bağlı Git deposu ve production branch olarak `main` seçimi doğrulanır. Ardından `Trigger deploy` ile yeniden yayın yapılır.

Netlify Function test adresi: `/api/health`. Beklenen yanıt: `{"ok":true,"service":"BAT Esports API"}`.
