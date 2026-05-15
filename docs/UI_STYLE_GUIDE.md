# MediShift / MediPlan UI Tasarım Rehberi

Bu doküman, MediShift / MediPlan hastane vardiya yönetim sistemi için ortak UI tasarım yaklaşımını tanımlar. Hedef stil: **Modern Light Admin SaaS + Soft Medical Desktop Feel**.

Amaç; mevcut koyu/mavi blok sidebar ve parçalı admin template hissini azaltmak, bunun yerine daha profesyonel, açık temalı, ferah, veri odaklı ve kurumsal bir sağlık yönetim paneli görünümü oluşturmaktır.

## 1. Genel Tasarım Yaklaşımı

Arayüz genelinde açık gri-mavi arka plan kullanılmalıdır. Sayfa zemini saf beyaz yerine `#F5F7FB` veya `#F7F9FD` gibi yumuşak bir medical SaaS tonu taşımalıdır. Bu yaklaşım, yoğun veri tabloları ve takvim ekranlarında göz yorgunluğunu azaltır.

Tasarım dili temiz, kurumsal ve veri odaklı olmalıdır. Büyük dekoratif bloklar, aşırı gradient kullanımı, gereksiz wrapper katmanları ve alanı daraltan iç içe card yapılarından kaçınılmalıdır.

Sayfalar mümkün olduğunca tam viewport alanını kullanmalıdır. Özellikle takvim, tablo ve dashboard gibi veri yoğun ekranlarda ana içerik alanı ekran dışına taşmadan büyüyüp küçülebilmelidir. Scroll gerekiyorsa sayfa genelinden çok ilgili data surface içinde kontrollü oluşmalıdır.

Card ve surface kullanımı kontrollü olmalıdır. Her bölüm ayrı ayrı büyük kartlara bölünmemeli; yalnızca anlamlı veri grupları, KPI blokları, filtre yüzeyleri ve ana data alanları yüzey olarak ayrılmalıdır.

## 2. Layout Sistemi

Ana yapı `AppShell` mantığıyla kurulmalıdır. Sidebar, ana içerik ve gerektiğinde sağ insight panel birbirinden net ayrılmalı; ancak bu ayrım sert renk bloklarıyla değil soft border, light surface ve boşluk yönetimiyle yapılmalıdır.

Önerilen ana layout parçaları:

- `AppShell`: Sidebar ve main content alanını yöneten genel iskelet.
- `LightSidebar`: Açık temalı veya çok soft gradient menü alanı.
- `MainContent`: Sayfanın asıl veri ve işlem alanı.
- `PageHeader`: Sayfa başlığı, kısa açıklama veya tooltip, sağ aksiyonlar.
- `KpiRow`: Kompakt metrik kartları.
- `ControlSurface`: Filtre, arama, tarih ve sayfa aksiyonları.
- `MainDataSurface`: Tablo, takvim, liste veya ana çalışma alanı.
- `RightInsightPanel`: Özet, grafik, hızlı işlem veya detay kartları için opsiyonel panel.

Calendar sayfalarında geniş takvim alanı önceliklidir. Başlık, legend, açıklama ve aksiyonlar minimum dikey alan kullanmalı; takvim grid yapısı boşalan alanı doldurmalıdır.

## 3. Renk Paleti

Ana renkler:

| Kullanım | Renk |
| --- | --- |
| Background | `#F5F7FB`, `#F7F9FD` |
| Surface | `#FFFFFF`, `rgba(255,255,255,0.92)` |
| Border | `#DFE7F4`, `#E6ECF5` |
| Text Primary | `#0F172A`, `#101A3C` |
| Text Secondary | `#64748B`, `#72809A` |
| Accent Blue | `#3157E8`, `#365EFF` |
| Accent Purple | `#6D5DF6`, `#7C3AED` |

Durum renkleri:

- Success / Onaylı / Mesai: green tonları.
- Nöbet: purple veya indigo tonları.
- İzin / Uyarı: orange tonları.
- Reddedildi / Hata: red tonları.
- Pasif / Boş / Dinlenme: gray tonları.

Durum renkleri yüksek kontrastlı ama soft uygulanmalıdır. Badge ve chip arka planları pastel, metinleri daha koyu ton olmalıdır.

## 4. Sidebar Kuralları

Sidebar için koyu full-blue blok görünüm yerine light professional shell tercih edilmelidir. Arka plan beyaz, kırık beyaz veya çok soft blue/purple gradient olabilir.

Sidebar collapsed mod desteklemelidir. Collapsed durumda ikonlar okunabilir kalmalı, active state net görünmeli ve ana içerik alanı genişlemelidir.

Active item görünümü:

- Soft blue/purple background.
- Sol accent çizgisi veya küçük accent marker.
- Hafif border veya shadow.
- Metin ve ikon accent blue/purple.

Menü grupları:

**GENEL**

- Dashboard
- Onaylar
- Vardiyalar
- Personel
- Otomatik Liste
- Vardiya Pazarı
- Analiz

**KULLANICI**

- Kurumsal Chat
- Takvim

Gerekirse üçüncü grup olarak **YÖNETİM** eklenebilir.

Sidebar alt alanında kullanıcı profil kartı bulunmalıdır. Profil kartı, rol ve kısa kullanıcı bilgisini göstermeli; birim yöneticisi gibi yetkili profillerde ayarlar, arşiv/evrak ve birim kontrolü gibi menülere geçiş sağlayabilir.

Logout aksiyonu profil kartından ayrı, soft red action card veya sade danger button olarak konumlanmalıdır.

## 5. Card / Surface Kuralları

Card ve surface tasarımında radius değerleri 12px - 20px aralığında tutulmalıdır. Çok yuvarlak, oyuncak hissi veren radiuslardan kaçınılmalıdır.

Standart surface yapısı:

- Background: `#FFFFFF` veya `rgba(255,255,255,0.92)`.
- Border: `1px solid #DFE7F4` veya `#E6ECF5`.
- Shadow: çok hafif, düşük opacity.
- Radius: 14px - 18px.

KPI kartları kompakt, ikonlu ve hızlı okunabilir olmalıdır. Büyük boşluklar ve gereksiz açıklama metinleri azaltılmalıdır. İkonlar renkli soft icon container içinde kullanılabilir.

Gradient yalnızca primary action, aktif vurgu veya sınırlı dekoratif efektlerde kullanılmalıdır. Yoğun gradient yüzeyler ana veri ekranlarında kullanılmamalıdır.

## 6. Table Kuralları

Tablolarda sticky header desteklenmelidir. Kullanıcı liste içinde scroll yaptığında kolon başlıkları görünür kalmalıdır.

Satır yüksekliği kompakt ama okunabilir olmalıdır. Verinin yoğun olduğu sayfalarda satırlar gereksiz yüksek olmamalı; avatar, badge ve action button alanları hizalı kalmalıdır.

Alternatif row background çok hafif uygulanabilir. Örneğin `#FBFDFF` veya düşük opacity blue-gray.

Durumlar badge ile gösterilmelidir:

- Onaylandı: soft green badge.
- Reddedildi: soft red badge.
- Taslak / Beklemede: soft purple veya orange badge.

Vardiya tipi chip ile gösterilmelidir. Chip rengi vardiya tipiyle tutarlı olmalıdır.

İşlem butonları icon button olmalıdır. Düzenle, sil, indir, daha fazla gibi aksiyonlarda küçük rounded icon card kullanılmalıdır. Tehlikeli aksiyonlarda ikinci tıklama onayı veya belirgin danger state önerilir.

Pagination alt alanda modern ve sade olmalıdır. Sol tarafta toplam kayıt ve görünüm aralığı, orta veya sağ alanda sayfa geçişleri, en sağda sayfa başına kayıt seçimi yer alabilir.

## 7. Calendar Kuralları

Takvim sayfalarında takvim en geniş alanı kullanmalıdır. Gereksiz KPI kartları, büyük açıklama blokları ve legend alanları kaldırılmalı veya tooltip içine taşınmalıdır.

Event chip sistemi kullanılmalıdır. Gün hücreleri içinde personel, vardiya tipi, izin ve tatil gibi bilgiler küçük, okunabilir ve renk kodlu chiplerle gösterilmelidir.

Gün hücre sayısı yalnızca seçili ayın görünüm gereksinimine göre olmalıdır. Önceki veya sonraki ay günleri gerçek hücre gibi vurgulanmamalı; gerekiyorsa pasif ve düşük kontrast görünmelidir.

Fazla event varsa `+4 daha fazla` gibi overflow yapısı kullanılmalıdır. Bu yapıya tıklandığında açılan popover veya modal estetik, kompakt ve ilgili günün tüm event chiplerini rahat okunur şekilde göstermelidir.

Day header alanı kompakt tutulmalı ve kendi içinde scroll oluşturmamalıdır. Scroll gerekiyorsa ana takvim alanında kontrollü oluşmalıdır.

Calendar header içinde tarih, navigation, filtreler ve kısa legend tooltip gibi yardımcı kontroller tek satırda toplanmalıdır.

## 8. Form / Filter Kuralları

Filtreler tek bir `ControlSurface` içinde toplanmalıdır. Arama, tarih aralığı, select/dropdown ve primary action aynı görsel sistemde hizalanmalıdır.

Büyük form görünümünden kaçınılmalıdır. Filtreleme veya hızlı işlem alanları kompakt olmalı, sayfanın ana data alanını daraltmamalıdır.

Primary action sağda veya ilgili bölümde net konumlanmalıdır. Örneğin `Yeni Vardiya`, `Analiz Et`, `Otomatik Liste Oluştur` gibi butonlar kullanıcı akışında tahmin edilebilir yerde olmalıdır.

Date input, select ve search alanları aynı border, radius, shadow ve hover sistemini kullanmalıdır.

Dropdown menüler modern görünmeli:

- Soft border.
- White surface.
- Hafif shadow.
- Animated open/close.
- Hover state net ama abartısız.
- Chevron/icon alanları tıklanabilir olmalı.

## 9. Button Kuralları

Primary button:

- Solid blue veya blue/purple gradient.
- Net hover ve pressed state.
- Gereksiz büyük olmamalı.

Success button:

- Green tonları.
- Onay, tamamlandı, kaydetme başarı durumları için.

Danger button:

- Red tonları.
- Silme, reddetme, pasife alma gibi riskli işlemler için.

Secondary button:

- White surface + soft border.
- Text primary veya accent blue.
- Hover sonrası hafif background değişimi.

Icon button:

- Küçük, rounded, soft border.
- 36px - 42px aralığı çoğu desktop admin UI için uygundur.
- Hover ve onClick hissiyatı olmalı, ancak layout kayması oluşturmamalıdır.

## 10. Sayfa Tiplerine Göre Layout

### Dashboard

Dashboard ekranı veri özetini hızlı okutmalıdır. Üstte kısa analiz/özet bandı, altında ana haftalık plan grid yapısı ve sağda kompakt insight panel önerilir. Haftalık görünüm viewport büyüdükçe alanı doldurmalı, boş alt alan bırakmamalıdır.

### Calendar

Calendar ekranında takvim ana yüzeydir. Header kontrolleri minimum dikey alan kullanmalı; legend tooltip içine alınmalı; event chipler okunabilir ve kompakt olmalıdır. Fazla event popover estetik ve kullanılabilir olmalıdır.

### Staff List

Personel listesi; arama, filtre, KPI kartları ve sticky table header içermelidir. Personel avatarları, birim, görev, durum ve işlem aksiyonları hizalı olmalıdır. Satırlar hover sonrası hafif öne çıkmalıdır.

### Staff Profile

Personel profil ekranı tek parent surface içinde sol profil kartı, orta takvim/tercih alanı ve sağ kısa çalışma kuralları paneli olarak kurgulanabilir. Takvim ve tercih seçimleri ana odak olmalıdır. Kişisel bilgiler kompakt listelenmelidir.

### Auto Schedule

Otomatik liste ekranı iki kolonlu olabilir. Sol tarafta liste oluşturma formu ve planlama kuralları, sağ tarafta vardiya tipleri ve son oluşturulan listeler yer almalıdır. Vardiya tipi yönetimi aynı sayfada entegre ama ayrı yüzey olarak görünmelidir.

### My Availability

Kullanıcı uygunluk ekranında takvim ve talep formu birlikte çalışmalıdır. Takvim geniş alan kullanmalı, talep formu sağ panel veya alt kompakt surface olarak yer almalıdır. Talep sayısı artarsa panel içinde scroll oluşmalıdır.

### Assignments / Vardiyalar

Vardiyalar sayfasında filtreler ve toplu işlemler tek control surface içinde toplanmalıdır. Liste sticky header, list footer ve compact action icon sistemi kullanmalıdır. Yeni vardiya modalı modern, validasyonları inline ve açık olmalıdır.

### Admin Archive / Settings / Unit Control

Yönetim sayfalarında light sidebar, üst arama ve sağ profil aksiyonları korunmalıdır. Arşiv/Evrak sayfası klasör sol paneli + belge listesi + KPI kartlarıyla kurgulanabilir. Ayarlar sayfası tab-based surface kullanmalıdır. Birim kontrolü sayfasında özet kartlar, tab içerikleri ve sağ insight panel dengeli yerleştirilmelidir.

## 11. Uygulama Notları

Inline style kullanımı varsa mümkün olduğunca ortak component veya class yapısına taşınmalıdır. Özellikle card, button, badge, dropdown, table, sidebar ve modal stilleri tekrar ediyorsa reusable component haline getirilmelidir.

Tekrarlanan UI parçaları için önerilen component isimleri:

- `AppShell`
- `Sidebar`
- `PageHeader`
- `KpiCard`
- `ControlSurface`
- `DataTable`
- `StatusBadge`
- `ShiftChip`
- `IconButton`
- `EmptyState`
- `ConfirmModal`

Mevcut işlevsellik bozulmamalıdır. UI refactor sırasında API çağrıları, business logic, veri formatları ve yetki kontrolleri değiştirilmemelidir.

Refactor kapsamı yalnızca UI, layout ve styling olmalıdır. Veri işleme, otomatik listeleme algoritması, drag-drop swap kuralları, izin/onay akışı ve authentication mantığı ayrı teknik karar olarak ele alınmalıdır.

Her UI değişikliği sonrası ilgili sayfada şu kontroller yapılmalıdır:

- Viewport içinde taşma var mı?
- Table veya calendar header sticky/scroll davranışı doğru mu?
- Dropdown ve modal z-index çakışması var mı?
- Hover/onClick state layout kaydırıyor mu?
- Türkçe karakterler doğru görünüyor mu?
- Mobile/responsive görünüm minimum kabul edilebilir durumda mı?
