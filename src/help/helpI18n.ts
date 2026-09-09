import type {HelpContent} from "./helpRegistry";

export type HelpUiLanguage="tr"|"en"|"de"|"ru";

export const OFFICE_LANGUAGE_EVENT="office-ui-language";
export const OFFICE_LANGUAGE_KEY="office-ui-language";

export function parseOfficeUiLanguage(value:string|null|undefined):HelpUiLanguage|null{
  return value==="tr"||value==="en"||value==="de"||value==="ru"?value:null;
}

export function persistOfficeLanguageCookie(value:HelpUiLanguage){
  if(typeof document==="undefined")return;
  document.cookie=`${OFFICE_LANGUAGE_KEY}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function currentHelpLanguage():HelpUiLanguage{
  if(typeof document!=="undefined"){
    const lang=document.documentElement.lang;
    if(lang==="tr"||lang==="en"||lang==="de"||lang==="ru")return lang;
  }
  if(typeof localStorage!=="undefined"){
    const saved=localStorage.getItem(OFFICE_LANGUAGE_KEY);
    if(saved==="tr"||saved==="en"||saved==="de"||saved==="ru")return saved;
  }
  return "en";
}

export function helpSectionLabels(lang:HelpUiLanguage){
  if(lang==="tr")return {what:"Ne",how:"Nasıl",impact:"Etki"};
  if(lang==="de")return {what:"Was",how:"Wie",impact:"Wirkung"};
  if(lang==="ru")return {what:"Что",how:"Как",impact:"Эффект"};
  return {what:"What",how:"How",impact:"Impact"};
}

const GENERIC:Record<Exclude<HelpUiLanguage,"en">,{
  heading:Omit<HelpContent,"title">;
  status:Omit<HelpContent,"title">;
  checkbox:Omit<HelpContent,"title">;
  select:Omit<HelpContent,"title">;
  input:Omit<HelpContent,"title">;
  action:Omit<HelpContent,"title">;
}>= {
  tr:{
    heading:{purpose:"Bu panel ilgili Office durumunu ve işlemlerini gruplar.",how:"Başlığın altındaki değerlere bakın, sonra yanındaki düğmeleri kullanın. Her kontrolün kendi (i) açıklaması vardır.",impact:"Başlığın kendisi projeyi değiştirmez."},
    status:{purpose:"Bu öğenin o anki durumunu gösterir.",how:"Değer, ilgili proje / runtime / mağaza durumundan gelir.",impact:"Durum göstergeleri salt okunurdur."},
    checkbox:{purpose:"Bu seçeneği açar veya kapatır.",how:"İşaretliyse ilgili özellik açıktır; değilse kapalıdır.",impact:"Etki yalnızca bu panelin veya projenin ayarıyla sınırlıdır."},
    select:{purpose:"Bu ayar için kullanılacak değeri seçer.",how:"Seçilen değer ilgili iş akışına veya kayıtlı ayara gider.",impact:"Kaydet / Çalıştır denene kadar işlem başlamaz."},
    input:{purpose:"Bu alanın değerini sağlar.",how:"Girilen değer ilgili işlemde veya kayıtlı ayarda kullanılır.",impact:"Yalnızca yazmak iş akışını başlatmaz."},
    action:{purpose:"Seçilen işlemi çalıştırır.",how:"İşlem, bu panel üzerinden Office köprüsüne iletilir.",impact:"Sonuç aktif projeye ve güvenlik politikasına bağlıdır."}
  },
  de:{
    heading:{purpose:"Dieses Panel gruppiert zugehörige Office-Statuswerte und Aktionen.",how:"Lesen Sie die Werte unter der Überschrift und nutzen Sie die benachbarten Schaltflächen. Jedes Steuerelement hat ein eigenes i.",impact:"Die Überschrift selbst ändert das Projekt nicht."},
    status:{purpose:"Zeigt den aktuellen Zustand dieses Elements.",how:"Der Wert kommt aus dem zugehörigen Projekt-, Runtime- oder Store-Zustand.",impact:"Statusanzeigen sind schreibgeschützt."},
    checkbox:{purpose:"Schaltet diese Option ein oder aus.",how:"Aktiviert aktiviert die Funktion; deaktiviert schaltet sie aus.",impact:"Die Wirkung gilt nur für dieses Panel oder die Projektkonfiguration."},
    select:{purpose:"Wählt den Wert für diese Einstellung.",how:"Die Auswahl wird an den Workflow oder die gespeicherte Einstellung übergeben.",impact:"Ohne Speichern/Ausführen startet keine Aktion."},
    input:{purpose:"Liefert den Wert für dieses Feld.",how:"Der eingegebene Wert wird von der zugehörigen Aktion oder Einstellung verwendet.",impact:"Nur tippen startet in der Regel keinen Workflow."},
    action:{purpose:"Führt die ausgewählte Aktion aus.",how:"Die Aktion geht über dieses Panel an die Office-Bridge.",impact:"Die genaue Wirkung hängt vom Projekt und der Sicherheitsrichtlinie ab."}
  },
  ru:{
    heading:{purpose:"Эта панель группирует связанный статус и действия Office.",how:"Смотрите значения под заголовком и используйте соседние кнопки. У каждого элемента своя подсказка i.",impact:"Сам заголовок проект не меняет."},
    status:{purpose:"Показывает текущее состояние этого элемента.",how:"Значение берётся из состояния проекта, runtime или хранилища.",impact:"Индикаторы статуса только для чтения."},
    checkbox:{purpose:"Включает или выключает этот параметр.",how:"Галочка включает функцию; без неё функция выключена.",impact:"Эффект ограничен этой панелью или настройкой проекта."},
    select:{purpose:"Выбирает значение для этой настройки.",how:"Выбор передаётся в связанный процесс или сохранённую настройку.",impact:"Без Сохранить/Запустить действие не стартует."},
    input:{purpose:"Задаёт значение этого поля.",how:"Введённое значение используется действием или сохранённой настройкой.",impact:"Один ввод текста обычно ничего не запускает."},
    action:{purpose:"Выполняет выбранное действие.",how:"Действие уходит через эту панель на мост Office.",impact:"Результат зависит от проекта и политики безопасности."}
  }
};

const BY_TITLE:Record<Exclude<HelpUiLanguage,"en">,Record<string,HelpContent>>={
  tr:{
    "Task flow":{title:"Görev akışı",purpose:"Bu projedeki hazır ve aktif işleri gösterir.",how:"Ajanlar kartı alınca kartlar hazırdan aktife geçer.",impact:"Kartı açmak iş atayabilir veya başlatabilir."},
    "Cost ledger":{title:"Maliyet defteri",purpose:"Sağlayıcı başına token, tahmini masraf ve ortalama gecikmeyi gösterir.",how:"Office her sağlayıcı çağrısını kaydeder. Yenile yalnızca kaydı tekrar okur.",impact:"Salt okunur. Yenile ücretli model çağırmaz."},
    "Pixel office":{title:"Piksel ofis",purpose:"Ajanları masalarında, odalar arasında yürürken ve konuşurken gösterir.",how:"Ajana tıklayınca o masa açılır. Görevi yazın veya konuşun. Ajan işi CEO’ya iletir; CEO uygun olana verir — tıklanan ajan yanlış olabilir. Tekerlek yakınlaştırır, sürüklemek kaydırır.",impact:"CEO’ya ilet, aktif projede Office işi başlatır. Kim çalışacağını CEO seçer."},
    "Office theme":{title:"Ofis teması",purpose:"Canlı piksel katın renk, masa ve ışık görünümünü değiştirir.",how:"Bir kart seçin. Office görünümü kendisi çizer; ücretli sprite paketleri yüklenmez.",impact:"Yalnızca ofis görünümü değişir. Proje dosyalarına dokunulmaz."},
    "Mission runner":{title:"Görev yürütücü",purpose:"Aktif proje için bir Director görevini başlatır ve izler.",how:"Hedefi yazın, sonra görevi başlatın. Ajanlar planladıkça canlı olaylar görünür.",impact:"Gerçek başlatma güvenilen projeye yazabilir. Boş hedef çalışmaz."},
    "Project docs":{title:"Proje belgeleri",purpose:"README ve kit belgelerini okuyup sonraki güvenli işi önerir.",how:"Belgeleri tarar ve bir sonraki bulgudan görev hedefi doldurabilir.",impact:"Öneriden görev başlatmadıkça salt okunur."},
    "Stable gate":{title:"Stable kilidi",purpose:"Otomatik kontroller ve sizin son kabulünüz geçene kadar Stable'ı kilitli tutar.",how:"Satırları inceleyin; kanıt dürüst ve tam ise kabul edin.",impact:"Kabul, Stable yayınından önceki son insan kilididir."},
    "Approval inbox":{title:"Onay gelen kutusu",purpose:"Bir kişinin karar vermesi gereken engelleri toplar.",how:"Öğeyi onaylayın, reddedin veya yeniden deneyin.",impact:"Onay, korunan bir iş akışını açabilir."},
    "Team presence":{title:"Ekip varlığı",purpose:"Hangi ajanların çevrimiçi olduğunu ve son iddialarını gösterir.",how:"Varlık, kadro ve canlı runtime olaylarından gelir.",impact:"Ajan işlemi açmadıkça salt okunur."},
    "Findings":{title:"Bulgular",purpose:"İnceleme, güvenlik, kapsama ve karar sorunlarını listeler.",how:"Kanıt için bir bulgu açın. Çözmek yayın hazırlığını günceller.",impact:"Açık bulgular Stable'ı kilitli tutabilir."},
    "Skills hub":{title:"Yetenekler",purpose:"Ajanların kullanabileceği kit yeteneklerini ve adaptörleri listeler.",how:"Liste, proje veya köprü değişince yenilenir.",impact:"Yetenekleri görmek salt okunurdur."},
    "Queue":{title:"Kuyruk",purpose:"İşçi bekleyen görevleri tutar.",how:"İlk eşleşen işi başlatmak için Sonrakini Çalıştır veya otomasyon kullanın.",impact:"Başlatma güvenilen projede gerçek bir komut çalıştırabilir."},
    "nav.workspace":{title:"Çalışma alanı",purpose:"Dosyalar, düzenleyici, terminal ve Git değişiklikleri için ana kod alanı.",how:"Proje dosyalarını okur ve köprü üzerinden oturumlarla konuşur.",impact:"Dosya düzenlemek veya terminal kullanmak projeyi değiştirebilir."},
    "nav.collaboration":{title:"İş birliği",purpose:"Director planlarını, ajan mesajlarını ve devirleri koordine eder.",how:"İş birliği durumu ve runtime olaylarıyla ajanları hizalar.",impact:"Görev, plan ve ajan koordinasyonu oluşturabilir."},
    "nav.projects":{title:"Projeler",purpose:"Kayıtlı geliştirme projelerini yönetir.",how:"Office proje kaydını ve aktif seçimi okur.",impact:"Office'ten kaldırmak kaynak dosyaları silmez."},
    "nav.agents":{title:"Ajanlar",purpose:"Kullanılabilir AI ajanlarını, rolleri ve yetenekleri gösterir.",how:"Kayıtlı ajanları canlı runtime durumuyla birleştirir.",impact:"Ajan başlatmak gerçek bir sağlayıcı oturumu açabilir."},
    "nav.skills":{title:"Yetenekler",purpose:"Yeniden kullanılabilir Kit yeteneklerini gösterir.",how:"Aktif proje için keşfedilen yetenekleri okur.",impact:"Görüntülemek salt okunurdur."},
    "nav.tasks":{title:"Görevler",purpose:"Planlanan ve aktif geliştirme işini gösterir.",how:"Director / proje görev durumunu birleştirir.",impact:"Görev işlemleri ajan çalışmasını tetikleyebilir."},
    "nav.inbox":{title:"Gelen kutusu",purpose:"Karar, engel ve dikkat isteyen öğeleri toplar.",how:"Proje bildirim durumunu okur ve kararı ilgili iş akışına iletir.",impact:"Onaylamak işin devamını açabilir."},
    "nav.findings":{title:"Bulgular",purpose:"İnceleme, güvenlik ve karar bulgularını gösterir.",how:"Denetim ve ajan çıktılarını toplar.",impact:"Çözmek yayın hazırlığını etkiler."},
    "nav.analytics":{title:"Analitik",purpose:"Çalıştırma, güvenilirlik, maliyet ve kapsama bilgisi gösterir.",how:"Runtime, defter ve kanıtı birleştirir.",impact:"Analitik çoğunlukla salt okunurdur."},
    "nav.memory":{title:"Hafıza",purpose:"Kalıcı proje bilgisini saklar ve hatırlar.",how:"Proje kapsamlı kayıtlar ve anlamsal arama kullanır.",impact:"Kayıtlı anılar sonraki ajan bağlamını etkileyebilir."},
    "nav.release":{title:"Yayın",purpose:"Yayın hazırlığını ve son Stable uygunluğunu kontrol eder.",how:"Test, Git kanıtı, yönetişim ve kabulü birleştirir.",impact:"Gerekli kapılar geçmeden Stable çıkmaz."},
    "nav.settings":{title:"Ayarlar",purpose:"Office, sağlayıcılar, entegrasyonlar, işçiler ve güvenliği yapılandırır.",how:"Panele göre Office veya proje ayarı yazar.",impact:"Buradaki değişiklikler çalışma davranışını değiştirebilir."},
    "Refresh":{title:"Yenile",purpose:"Bu panelin son durumunu yeniden yükler.",how:"Office köprüsünden taze bir anlık görüntü ister.",impact:"Proje dosyaları değişmez."},
    "Adaptive routing":{title:"Uyarlanabilir yönlendirme",purpose:"Sonraki işi hangi sağlayıcı veya işçinin alacağını seçer.",how:"Sağlık, etiket, maliyet ve güveni puanlar, sonra bir rota önerir.",impact:"Öneri, siz bir iş başlatmadan çalıştırmaz."},
    "Execution boundaries":{title:"Yürütme sınırları",purpose:"Alt görev sözleşmelerini ve dosya sahipliğini gösterir.",how:"Hangi rolün hangi dosyayı yazabileceğini kontrol edin.",impact:"Sahiplik çakışması birleştirmeyi engelleyebilir."},
    "Execution order & blocked work":{title:"Yürütme sırası ve engelli iş",purpose:"Görevlerin hangi sırayla ve hangi bağımlılıkla yürüdüğünü gösterir.",how:"Grafikte bekleyen ve engellenen düğümlere bakın.",impact:"Bağımlılık çözülmeden sonraki iş başlamaz."},
    "Lead, coding collaborators & verification":{title:"Lider, kod iş birlikçileri ve doğrulama",purpose:"Bir görevde kim yazar, kim inceler ve kim doğrular.",how:"Lider, iş birlikçi ve doğrulayıcı durumunu okuyun.",impact:"Doğrulama geçmeden birleştirme kapalı kalır."},
    "Ready Work":{title:"Hazır İş",purpose:"Atanmayı bekleyen yapılacak işleri listeler.",how:"Bir kartı açın veya iş birliği ata ile kuyruğa alın.",impact:"Atama CEO’ya gerçek bir görev verebilir."},
    "Active Work":{title:"Aktif İş",purpose:"Şu anda yürütülen işi gösterir.",how:"Kartlar ajanlar aldıkça hazırdan aktife geçer.",impact:"Kartı açmak ayrıntıyı gösterir; tek başına durdurmaz."},
    "Activity Stream":{title:"Aktivite Akışı",purpose:"Canlı runtime olaylarını gösterir.",how:"En yeni olaylar üstte kalır.",impact:"Salt okunur telemetri."},
    "Quality gate":{title:"Kalite kapısı",purpose:"Plandan birleştirmeye ve yeniden denetime giden zorunlu yol.",how:"İş her aşamadan geçmelidir.",impact:"Atlanan aşama birleştirmeyi kapalı tutar."},
    "Stable Promotion Gate":{title:"Stable yükseltme kapısı",purpose:"Stable’a çıkmadan önceki son otomatik ve paket kontrolleri.",how:"Sürüm, paket ve kabul satırlarını okuyun.",impact:"Eksik kanıt Stable’ı kilitli tutar."},
    "Release status":{title:"Yayın durumu",purpose:"Zorunlu Office yayın kontrollerinin geçip geçmediğini söyler.",how:"Başarısız satırları okuyun, düzeltin, yenileyin.",impact:"Engelli kapı son Git yayın işlemini durdurur."},
    "Gate checks":{title:"Kapı kontrolleri",purpose:"Yayın kararının arkasındaki tek tek kanıtlar.",how:"Her satır test, git, bütünlük veya kabul kontrolüdür.",impact:"Başarısız bir satır yayını kapalı tutar."},
    "Final Git action":{title:"Son Git işlemi",purpose:"Kapılar geçtikten sonraki son açık Git adımı.",how:"İşlemi siz seçin. Office sessizce push veya tag yapmaz.",impact:"Commit, tag veya yayın oluşturabilir."},
    "Office backup":{title:"Office yedeği",purpose:"Office ayarlarını, geçmişi ve denetimi dışa aktarır; proje kaynağını değil.",how:"Saklayabileceğiniz bir kontrol düzlemi anlığı oluşturur.",impact:"Proje kaynak dosyaları kopyalanmaz."},
    "Governance":{title:"Yönetişim",purpose:"Yayından önce kimin neye karar verdiğini kanıtla kaydeder.",how:"Karar veya kanıt ekleyin, sonra gerekli onayları toplayın.",impact:"Kanıt veya onay eksikken imza kapalıdır."},
    "Release safety":{title:"Yayın güvenliği",purpose:"Kurtarma veya güvenlik kanıtı eksikken yayını durdurur.",how:"Kesilen işleri, snapshot’ları ve güvenlik bayraklarını yayınlamadan önce kontrol edin.",impact:"Başarısız satır Stable’ı kilitli tutar."},
    "System health":{title:"Sistem sağlığı",purpose:"Sağlayıcı, kit, git ve kurtarma hazırlığını tek listede gösterir.",how:"Her satır bir sondadır. Kırmızı satırlar gerçek görevden önce düzeltilmelidir.",impact:"Salt okunur. Projeyi değiştirmez."},
    "Agent routing":{title:"Ajan yönlendirme",purpose:"Her ajan rolünü tercih edilen AI sağlayıcısına bağlar.",how:"Rol → sağlayıcı çiftlerini değiştirin, sonra kaydedin.",impact:"Sonraki görevler bu roller için bu sağlayıcıları kullanır."},
    "Provider runtime":{title:"Sağlayıcı çalışma zamanı",purpose:"Hangi AI CLI’ların kurulu ve erişilebilir olduğunu gösterir.",how:"Office Cursor, Claude ve diğer yapılandırılmış ikilileri tarar.",impact:"Çevrimdışı sağlayıcılar iş yönlendirilirken atlanır."},
    "CallMe validation":{title:"CallMe doğrulama",purpose:"CallMe kabul projesine salt okunur kontroller çalıştırır.",how:"Kayıtlı CallMe yolunu kullanır. Tek başına yazma görevi başlatmaz.",impact:"Doğrulama CallMe dosyalarını okuyabilir. Görev başlatmadıkça düzenlemez."},
    "Provider streams":{title:"Sağlayıcı akışları",purpose:"Aktif sağlayıcıdan gelen canlı token akışını izler.",how:"Görev çalışırken bu paneli açık tutun; kısmi çıktıyı görürsünüz.",impact:"Salt okunur telemetri. Sağlayıcı başlatmaz."},
    "Provider credentials":{title:"Sağlayıcı kimlik bilgileri",purpose:"Sağlayıcılar için API anahtarlarını ve giriş bilgilerini saklar.",how:"Bir anahtar yapıştırın veya hesap bağlayın, sonra kaydedin.",impact:"Sırlar bu makinede kalır. Yalnızca o sağlayıcıya gider."},
    "Account connections":{title:"Hesap bağlantıları",purpose:"Office’in kullanabileceği GitHub, sohbet ve diğer hesapları bağlar.",how:"Bu listeden bir servisi bağlayın veya koparın.",impact:"Bağlı hesap, siz bir işlem çalıştırınca uzak veri oluşturabilir."},
    "Desktop runtime":{title:"Masaüstü çalışma zamanı",purpose:"Paketlenmiş Office masaüstü sürecini ve proje seçimini gösterir.",how:"Office yalnızca tarayıcıda değil masaüstü uygulama olarak çalışırken kullanılır.",impact:"Burada proje değiştirmek masaüstü penceresinin sürdüğü işi değiştirir."},
    "Mission history":{title:"Görev geçmişi",purpose:"Son görevleri ve sonuçlarını gösterir.",how:"En yeni öğeler görünür kalır; gelen kutusu dikkati gereken eski kartlar durur.",impact:"Geçmiş kayıttır. Görevi yeniden başlatmaz."},
    "Scheduled audits":{title:"Zamanlanmış denetimler",purpose:"Salt okunur kalite ve güvenlik kontrollerini tekrarlar.",how:"Her denetim bulgu yazar. Birleştirme veya dağıtım yapmaz.",impact:"Bulgular siz çözene kadar yayını engelleyebilir."},
    "Audit trail":{title:"Denetim izi",purpose:"Kimin ne yaptığını ve sonucunu kronolojik kaydeder.",how:"Son satırları çekmek için yenileyin.",impact:"Salt okunur."},
    "Recovery":{title:"Kurtarma",purpose:"Office durduğunda yarım kalan işleri bulur.",how:"Kesilen her komutu devam ettirin veya atın.",impact:"Devam gerçek işi yeniden deneyebilir. Atmak yalnızca kurtarma kaydını siler."},
    "Retention":{title:"Saklama",purpose:"Rapor, denetim günlüğü ve worktree’lerin ne kadar tutulacağını belirler.",how:"Gün sayılarını değiştirin, sonra temizliği çalıştırın.",impact:"Temizlik eski Office artefaktlarını siler, proje kaynağını değil."},
    "Installer":{title:"Kurulum",purpose:"Araçları kontrol eder, sağlayıcı kurar ve Office güncellemelerini hazırlar.",how:"Önce tanılamayı çalıştırın. Canlı dosyaları değiştirmeden önce güncellemeyi hazırlayın.",impact:"Kurulum ve uygulama bu makinedeki yazılımı değiştirebilir."},
    "Plugins":{title:"Eklentiler",purpose:"Office eklentilerini ve istedikleri izinleri yükler.",how:"Yalnızca kancalarına ve araçlarına güvendiğiniz eklentiyi etkinleştirin.",impact:"Eklenti arayüz ekleyebilir ve verdiğiniz araçları çalıştırabilir."},
    "Agent desk chat":{title:"Ajan masa sohbeti",purpose:"Ajanların gerçek ofis olgularından birbirleriyle konuştuğu canlı döküm.",how:"Sağdaki kaydı okuyun. Duraklat ile ipi dondurabilirsiniz. Yeni bulgu veya kırık kapı yeni tur başlatır.",impact:"Salt okunur. Görev başlatmaz, proje dosyası yazmaz."},
    "AI Development Kit":{title:"AI Geliştirme Kiti",purpose:"Proje yeteneklerini, adaptörleri ve kit manifestlerini yükler.",how:"Aktif proje için `.ai-kit` okur ve kullanılabilir yetenekleri listeler.",impact:"Kiti görmek salt okunurdur."},
    "Desktop runtime":{title:"Masaüstü çalışma zamanı",purpose:"Paketlenmiş Office masaüstü sürecini ve proje seçimini gösterir.",how:"Office yalnızca tarayıcıda değil masaüstü uygulama olarak çalışırken kullanılır.",impact:"Burada proje değiştirmek masaüstü penceresinin sürdüğü işi değiştirir."}
  },
  de:{
    "Task flow":{title:"Aufgabenfluss",purpose:"Zeigt bereite und aktive Arbeit des aktuellen Projekts.",how:"Karten wandern von Bereit nach Aktiv, wenn Agenten sie übernehmen.",impact:"Eine Karte zu öffnen kann Arbeit zuweisen oder starten."},
    "Cost ledger":{title:"Kostenbuch",purpose:"Zeigt Token, geschätzte Kosten und Latenz pro Anbieter.",how:"Office protokolliert jeden Anbieteraufruf. Aktualisieren lädt nur den Snapshot.",impact:"Schreibgeschützt. Aktualisieren ruft kein Modell auf."},
    "Pixel office":{title:"Pixel-Büro",purpose:"Zeigt Agenten an Schreibtischen, beim Gehen und Sprechen.",how:"Klick öffnet das Terminal, wenn eine Sitzung existiert. Rad zoomt, Ziehen schwenkt.",impact:"Die Etage ist eine Live-Ansicht und startet keine Mission."},
    "Office theme":{title:"Büro-Thema",purpose:"Ändert Farben, Schreibtische und Licht der Pixel-Etage.",how:"Wählen Sie eine Karte. Office zeichnet das Aussehen selbst.",impact:"Nur die Ansicht ändert sich. Projektdateien bleiben unberührt."},
    "Mission runner":{title:"Missionsläufer",purpose:"Startet und verfolgt eine Director-Mission.",how:"Ziel schreiben, dann starten. Live-Ereignisse erscheinen beim Planen.",impact:"Ein echter Start kann in ein vertrauenswürdiges Projekt schreiben."},
    "Project docs":{title:"Projektdokumente",purpose:"Liest README und Kit-Dokumente für die nächste sichere Arbeit.",how:"Scannt Dokumente und kann das Missionsziel füllen.",impact:"Schreibgeschützt, bis Sie eine Mission starten."},
    "Stable gate":{title:"Stable-Sperre",purpose:"Hält Stable gesperrt, bis Checks und Ihre Abnahme passen.",how:"Zeilen prüfen und nur bei ehrlichen Nachweisen akzeptieren.",impact:"Die Abnahme ist die letzte menschliche Sperre."},
    "Approval inbox":{title:"Freigabe-Posteingang",purpose:"Sammelt Entscheidungen, die eine Person brauchen.",how:"Freigeben, ablehnen oder erneut versuchen.",impact:"Eine Freigabe kann einen geschützten Ablauf entsperren."},
    "Team presence":{title:"Teampräsenz",purpose:"Zeigt, welche Agenten online sind und was sie zuletzt beansprucht haben.",how:"Präsenz kommt aus Roster und Runtime-Ereignissen.",impact:"Schreibgeschützt, außer Sie öffnen eine Agentenaktion."},
    "Findings":{title:"Befunde",purpose:"Review-, Sicherheits- und Entscheidungsprobleme.",how:"Einen Befund öffnen, um Nachweise zu sehen.",impact:"Offene Befunde können Stable sperren."},
    "Skills hub":{title:"Fähigkeiten",purpose:"Listet Kit-Skills und Adapter.",how:"Die Liste aktualisiert sich bei Projekt- oder Bridge-Wechsel.",impact:"Ansehen ist schreibgeschützt."},
    "Queue":{title:"Warteschlange",purpose:"Hält Aufgaben, die auf einen Worker warten.",how:"Mit Run Next oder Automation den ersten Job starten.",impact:"Ein Start kann einen echten Befehl ausführen."},
    "nav.workspace":{title:"Arbeitsbereich",purpose:"Haupt-Coding-Bereich für Dateien, Editor, Terminal und Git.",how:"Liest Projektdateien und spricht mit Runtime-Sitzungen.",impact:"Bearbeiten oder Terminal kann das Projekt ändern."},
    "nav.collaboration":{title:"Zusammenarbeit",purpose:"Koordiniert Director-Pläne, Agentennachrichten und Übergaben.",how:"Nutzt Kollaborationszustand und Runtime-Ereignisse.",impact:"Kann Aufgaben, Pläne und Koordination erzeugen."},
    "nav.projects":{title:"Projekte",purpose:"Verwaltet registrierte Entwicklungsprojekte.",how:"Liest die Office-Projektliste und die aktive Auswahl.",impact:"Entfernen aus Office löscht keine Quelldateien."},
    "nav.agents":{title:"Agenten",purpose:"Zeigt verfügbare KI-Agenten, Rollen und Fähigkeiten.",how:"Kombiniert registrierte Agenten mit Runtime-Zustand.",impact:"Starten kann eine echte Provider-Sitzung erzeugen."},
    "nav.skills":{title:"Fähigkeiten",purpose:"Zeigt wiederverwendbare Kit-Fähigkeiten.",how:"Liest entdeckte Skills des aktiven Projekts.",impact:"Ansehen ist schreibgeschützt."},
    "nav.tasks":{title:"Aufgaben",purpose:"Zeigt geplante und aktive Entwicklungsarbeit.",how:"Kombiniert Director- und Projektaufgaben.",impact:"Aktionen können Agentenausführung auslösen."},
    "nav.inbox":{title:"Posteingang",purpose:"Sammelt Entscheidungen und Blocker.",how:"Liest den Projekt-Inbox-Zustand.",impact:"Freigeben kann Arbeit fortsetzen."},
    "nav.findings":{title:"Befunde",purpose:"Zeigt Review-, Sicherheits- und Entscheidungsbefunde.",how:"Aggregiert Audits und Agentenergebnisse.",impact:"Lösen beeinflusst die Release-Bereitschaft."},
    "nav.analytics":{title:"Analytik",purpose:"Zeigt Ausführung, Zuverlässigkeit, Kosten und Abdeckung.",how:"Aggregiert Runtime, Ledger und Nachweise.",impact:"Überwiegend schreibgeschützt."},
    "nav.memory":{title:"Speicher",purpose:"Speichert dauerhaftes Projektwissen.",how:"Nutzt projektbezogene Speicher und semantische Suche.",impact:"Gespeicherte Erinnerungen können späteren Kontext beeinflussen."},
    "nav.release":{title:"Release",purpose:"Steuert Release-Bereitschaft und Stable-Eignung.",how:"Kombiniert Tests, Git, Governance und Abnahme.",impact:"Ohne erfüllte Gates kein Stable."},
    "nav.settings":{title:"Einstellungen",purpose:"Konfiguriert Office, Provider, Integrationen und Sicherheit.",how:"Schreibt Office- oder Projekteinstellungen je nach Panel.",impact:"Änderungen können das Laufzeitverhalten ändern."},
    "Refresh":{title:"Aktualisieren",purpose:"Lädt den neuesten Zustand dieses Panels.",how:"Fordert einen frischen Snapshot von der Office-Bridge.",impact:"Projektdateien werden nicht geändert."},
    "Adaptive routing":{title:"Adaptives Routing",purpose:"Wählt, welcher Provider oder Worker den nächsten Job übernimmt.",how:"Bewertet Gesundheit, Tags, Kosten und Vertrauen.",impact:"Eine Empfehlung startet keinen Job."},
    "Execution boundaries":{title:"Ausführungsgrenzen",purpose:"Zeigt Teilaufträge und Dateibesitz.",how:"Prüfen Sie, welche Rolle welche Datei schreiben darf.",impact:"Besitzkonflikte können den Merge blockieren."},
    "Execution order & blocked work":{title:"Ausführungsreihenfolge & blockierte Arbeit",purpose:"Zeigt Reihenfolge und Abhängigkeiten der Aufgaben.",how:"Schauen Sie auf wartende und blockierte Knoten.",impact:"Ohne gelöste Abhängigkeit startet die nächste Arbeit nicht."},
    "Lead, coding collaborators & verification":{title:"Lead, Coding-Mitarbeitende & Prüfung",purpose:"Zeigt, wer schreibt, prüft und verifiziert.",how:"Lesen Sie Lead-, Mitarbeiter- und Prüferstatus.",impact:"Ohne bestandene Prüfung bleibt der Merge gesperrt."},
    "Ready Work":{title:"Bereite Arbeit",purpose:"Listet TODO-Arbeit, die zugewiesen werden kann.",how:"Karte öffnen oder kollaborativ zuweisen.",impact:"Zuweisen kann dem CEO eine echte Aufgabe geben."},
    "Active Work":{title:"Aktive Arbeit",purpose:"Zeigt gerade laufende Arbeit.",how:"Karten wandern von Bereit nach Aktiv.",impact:"Öffnen zeigt Details und stoppt die Arbeit nicht."},
    "Activity Stream":{title:"Aktivitätsstrom",purpose:"Zeigt Live-Runtime-Ereignisse.",how:"Neueste Ereignisse bleiben oben.",impact:"Schreibgeschützte Telemetrie."},
    "Quality gate":{title:"Quality Gate",purpose:"Der erforderliche Weg von Plan zu Merge und erneuter Prüfung.",how:"Arbeit muss jede Stufe bestehen.",impact:"Übersprungene Stufen halten den Merge gesperrt."},
    "Plugins":{title:"Plugins",purpose:"Lädt Office-Plugins und die von ihnen angefragten Berechtigungen.",how:"Aktivieren Sie ein Plugin nur, wenn Sie seinen Hooks und Tools vertrauen.",impact:"Ein Plugin kann UI hinzufügen und gewährte Tools ausführen."},
    "Provider streams":{title:"Provider-Streams",purpose:"Zeigt Live-Token-Streams des aktiven Providers.",how:"Offen lassen, während eine Mission läuft, um Teilausgaben zu sehen.",impact:"Schreibgeschützte Telemetrie. Startet keinen Provider."}
  },
  ru:{
    "Task flow":{title:"Поток задач",purpose:"Показывает готовую и активную работу текущего проекта.",how:"Карточки переходят из готовых в активные, когда агенты их берут.",impact:"Открытие карточки может назначить или начать работу."},
    "Cost ledger":{title:"Книга затрат",purpose:"Показывает токены, оценку расходов и задержку провайдера.",how:"Office записывает каждый вызов. Обновить только перечитывает снимок.",impact:"Только чтение. Обновить не вызывает платную модель."},
    "Pixel office":{title:"Пиксельный офис",purpose:"Показывает агентов за столами, в ходьбе и в разговоре.",how:"Клик открывает терминал, если есть сессия. Колесо — масштаб, перетаскивание — панорама.",impact:"Этаж — живой вид, миссию сам не запускает."},
    "Office theme":{title:"Тема офиса",purpose:"Меняет цвета, столы и свет живого этажа.",how:"Выберите карточку. Office рисует вид сам.",impact:"Меняется только вид. Файлы проекта не трогаются."},
    "Mission runner":{title:"Запуск миссии",purpose:"Запускает и отслеживает миссию Director.",how:"Напишите цель и запустите. События появляются по мере плана.",impact:"Реальный запуск может писать в доверенный проект."},
    "Project docs":{title:"Документы проекта",purpose:"Читает README и kit-документы для следующей безопасной работы.",how:"Сканирует документы и может заполнить цель миссии.",impact:"Только чтение, пока вы не запустите миссию."},
    "Stable gate":{title:"Замок Stable",purpose:"Держит Stable закрытым, пока проверки и ваше принятие не пройдут.",how:"Проверьте строки и принимайте только при честных доказательствах.",impact:"Принятие — последний человеческий замок."},
    "Approval inbox":{title:"Входящие согласования",purpose:"Собирает решения, которые нужны человеку.",how:"Одобрите, отклоните или повторите элемент.",impact:"Одобрение может разблокировать защищённый процесс."},
    "Team presence":{title:"Присутствие команды",purpose:"Показывает, какие агенты онлайн и что они заявили.",how:"Присутствие берётся из состава и runtime-событий.",impact:"Только чтение, пока вы не откроете действие агента."},
    "Findings":{title:"Находки",purpose:"Проблемы обзора, безопасности и решений.",how:"Откройте находку, чтобы увидеть доказательства.",impact:"Открытые находки могут держать Stable закрытым."},
    "Skills hub":{title:"Навыки",purpose:"Список навыков kit и адаптеров.",how:"Список обновляется при смене проекта или моста.",impact:"Просмотр только для чтения."},
    "Queue":{title:"Очередь",purpose:"Держит задачи, ждущие исполнителя.",how:"Запустите первую подходящую работу через Run Next или автоматизацию.",impact:"Запуск может выполнить реальную команду."},
    "nav.workspace":{title:"Рабочая область",purpose:"Основная область кода: файлы, редактор, терминал и Git.",how:"Читает файлы проекта и говорит с runtime-сессиями.",impact:"П правки и терминал могут изменить проект."},
    "nav.collaboration":{title:"Сотрудничество",purpose:"Координирует планы Director, сообщения и передачи.",how:"Использует состояние сотрудничества и runtime-события.",impact:"Может создавать задачи, планы и координацию."},
    "nav.projects":{title:"Проекты",purpose:"Управляет зарегистрированными проектами.",how:"Читает реестр Office и активный выбор.",impact:"Удаление из Office не удаляет исходники."},
    "nav.agents":{title:"Агенты",purpose:"Показывает доступных ИИ-агентов, роли и навыки.",how:"Совмещает зарегистрированных агентов с runtime.",impact:"Запуск может создать сессию провайдера."},
    "nav.skills":{title:"Навыки",purpose:"Показывает повторно используемые навыки Kit.",how:"Читает найденные навыки активного проекта.",impact:"Просмотр только для чтения."},
    "nav.tasks":{title:"Задачи",purpose:"Показывает запланированную и активную работу.",how:"Совмещает задачи Director и проекта.",impact:"Действия могут запустить агента."},
    "nav.inbox":{title:"Входящие",purpose:"Собирает решения и блокеры.",how:"Читает состояние входящих проекта.",impact:"Одобрение может продолжить работу."},
    "nav.findings":{title:"Находки",purpose:"Показывает находки обзора, безопасности и решений.",how:"Собирает аудиты и результаты агентов.",impact:"Закрытие влияет на готовность релиза."},
    "nav.analytics":{title:"Аналитика",purpose:"Показывает выполнение, надёжность, стоимость и покрытие.",how:"Собирает runtime, книгу затрат и доказательства.",impact:"В основном только чтение."},
    "nav.memory":{title:"Память",purpose:"Хранит устойчивые знания проекта.",how:"Использует записи проекта и семантический поиск.",impact:"Сохранённые записи могут влиять на контекст."},
    "nav.release":{title:"Релиз",purpose:"Контролирует готовность релиза и Stable.",how:"Совмещает тесты, Git, управление и приёмку.",impact:"Без пройденных ворот Stable не выйдет."},
    "nav.settings":{title:"Настройки",purpose:"Настраивает Office, провайдеров, интеграции и безопасность.",how:"Пишет настройки Office или проекта в зависимости от панели.",impact:"Изменения могут изменить поведение runtime."},
    "Refresh":{title:"Обновить",purpose:"Перезагружает последнее состояние этой панели.",how:"Запрашивает свежий снимок у моста Office.",impact:"Файлы проекта не меняются."},
    "Adaptive routing":{title:"Адаптивная маршрутизация",purpose:"Выбирает, какой провайдер или воркер возьмёт следующую работу.",how:"Оценивает здоровье, теги, стоимость и доверие.",impact:"Рекомендация сама работу не запускает."},
    "Execution boundaries":{title:"Границы выполнения",purpose:"Показывает контракты подзадач и владение файлами.",how:"Проверьте, какая роль какие файлы пишет.",impact:"Конфликт владения может заблокировать слияние."},
    "Execution order & blocked work":{title:"Порядок выполнения и заблокированная работа",purpose:"Показывает порядок и зависимости задач.",how:"Смотрите ожидающие и заблокированные узлы.",impact:"Без снятой зависимости следующая работа не стартует."},
    "Lead, coding collaborators & verification":{title:"Лид, код-участники и проверка",purpose:"Показывает, кто пишет, кто ревьюит и кто проверяет.",how:"Читайте статусы лида, участников и проверяющего.",impact:"Без проверки слияние остаётся закрытым."},
    "Ready Work":{title:"Готовая работа",purpose:"Список TODO, которые можно назначить.",how:"Откройте карточку или назначьте совместно.",impact:"Назначение может дать CEO реальную задачу."},
    "Active Work":{title:"Активная работа",purpose:"Показывает работу, которая сейчас выполняется.",how:"Карточки переходят из готовых в активные.",impact:"Открытие показывает детали и не останавливает работу."},
    "Activity Stream":{title:"Поток активности",purpose:"Показывает живые runtime-события.",how:"Новые события остаются сверху.",impact:"Телеметрия только для чтения."},
    "Quality gate":{title:"Шлюз качества",purpose:"Обязательный путь от плана к слиянию и повторной проверке.",how:"Работа должна пройти каждый этап.",impact:"Пропущенный этап держит слияние закрытым."},
    "Plugins":{title:"Плагины",purpose:"Загружает плагины Office и запрошенные ими права.",how:"Включайте плагин только если доверяете его хукам и инструментам.",impact:"Плагин может добавить UI и запускать выданные инструменты."},
    "Provider streams":{title:"Потоки провайдера",purpose:"Следит за живым потоком токенов активного провайдера.",how:"Держите панель открытой во время миссии, чтобы видеть частичный вывод.",impact:"Телеметрия только для чтения. Провайдер не запускается."}
  }
};

const HEADING_PURPOSE="This panel groups related Office status and actions.";
const STATUS_PURPOSE="Shows the current state of this item.";

export function localizeHelp(content:HelpContent,lang:HelpUiLanguage):HelpContent{
  if(!content)return {title:"",purpose:"",how:""};
  if(lang==="en")return content;
  const key=content.id||content.title;
  const pack=BY_TITLE[lang]?.[key];
  if(pack)return pack;
  const purpose=content.purpose||"";
  if(purpose===HEADING_PURPOSE)return {title:content.title,...GENERIC[lang].heading};
  if(purpose===STATUS_PURPOSE)return {title:content.title,...GENERIC[lang].status};
  if(purpose.startsWith("Turns \""))return {title:content.title,...GENERIC[lang].checkbox};
  if(purpose.startsWith("Chooses the value"))return {title:content.title,...GENERIC[lang].select};
  if(purpose.startsWith("Provides the value"))return {title:content.title,...GENERIC[lang].input};
  if(purpose.startsWith("Runs the \""))return {title:content.title,...GENERIC[lang].action};
  return content;
}
