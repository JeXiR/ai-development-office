import type {
  FloorChatAgent,
  FloorChatKind,
  FloorChatLang,
  FloorChatMemory,
  FloorChatMessage,
  FloorChatTopic
} from "./floor-chat-types";

const ROLE_ORDER=["CEO","CTO","Architect","QA","Security","DevOps","PM","Docs"];

function clip(value:string,max=86){
  const text=String(value||"").replace(/\s+/g," ").trim();
  return text.length>max?`${text.slice(0,max-1)}…`:text;
}

function hash(value:string){
  let n=0;
  for(let i=0;i<value.length;i++)n=((n<<5)-n)+value.charCodeAt(i)|0;
  return Math.abs(n);
}

function pick<T>(items:T[],seed:string){
  return items[hash(seed)%items.length];
}

function roleKey(agent:FloorChatAgent){
  return String(agent.role||agent.id||"").toLowerCase();
}

function displayRole(agent:FloorChatAgent){
  return String(agent.displayName||agent.role||agent.id||"Agent");
}

function findAgent(agents:FloorChatAgent[],hints:string[]){
  for(const hint of hints){
    const re=new RegExp(hint,"i");
    const hit=agents.find(a=>re.test(`${a.id} ${a.role} ${a.displayName||""}`));
    if(hit)return hit;
  }
  return null;
}

const STATUS_WORDS:Record<FloorChatLang,Record<string,string>>={
  tr:{
    planning:"planlıyor",running:"çalışıyor",verifying:"doğruluyor",completed:"bitti",failed:"başarısız",
    todo:"bekliyor",queued:"kuyrukta",working:"üzerinde",blocked:"engelli",done:"bitti",open:"açık",
    healthy:"sağlıklı",warning:"uyarı",critical:"kritik",unknown:"bilinmiyor",degraded:"zayıf",
    continue:"devam",watch:"izliyoruz",validate:"doğrula",status:"durum","fix next":"sıradaki düzeltme",
    unblock:"engeli kaldır","re-audit":"yeniden denetle","re-run with evidence":"kanıtla yeniden çalıştır",
    review:"incele",doctor:"doctor","recover or discard":"devam veya at","add coverage":"kapsama ekle",
    "keep the assert":"assert kalsın"
  },
  en:{
    planning:"planning",running:"running",verifying:"verifying",completed:"done",failed:"failed",
    todo:"waiting",queued:"queued",working:"in progress",blocked:"blocked",done:"done",open:"open",
    healthy:"healthy",warning:"warning",critical:"critical",unknown:"unknown",degraded:"degraded",
    continue:"continue",watch:"watching",validate:"validate",status:"status","fix next":"fix next",
    unblock:"unblock","re-audit":"re-audit","re-run with evidence":"re-run with evidence",
    review:"review",doctor:"doctor","recover or discard":"resume or discard","add coverage":"add coverage",
    "keep the assert":"keep the assert"
  },
  de:{
    planning:"plant",running:"läuft",verifying:"prüft",completed:"fertig",failed:"fehlgeschlagen",
    todo:"wartet",queued:"in Warteschlange",working:"in Arbeit",blocked:"blockiert",done:"fertig",open:"offen",
    healthy:"gesund",warning:"Warnung",critical:"kritisch",unknown:"unbekannt",degraded:"schwach",
    continue:"fortsetzen",watch:"beobachten",validate:"prüfen",status:"Status","fix next":"nächste Korrektur",
    unblock:"entblocken","re-audit":"neu prüfen","re-run with evidence":"mit Nachweis neu laufen",
    review:"prüfen",doctor:"Doctor","recover or discard":"fortsetzen oder verwerfen","add coverage":"Abdeckung ergänzen",
    "keep the assert":"Assert behalten"
  },
  ru:{
    planning:"планирует",running:"работает",verifying:"проверяет",completed:"готово",failed:"ошибка",
    todo:"ждёт",queued:"в очереди",working:"в работе",blocked:"заблокировано",done:"готово",open:"открыто",
    healthy:"здорово",warning:"предупреждение",critical:"критично",unknown:"неизвестно",degraded:"слабо",
    continue:"продолжить",watch:"смотрим",validate:"проверить",status:"статус","fix next":"следующее исправление",
    unblock:"снять блок","re-audit":"перепроверить","re-run with evidence":"повторить с доказательством",
    review:"обзор",doctor:"doctor","recover or discard":"продолжить или отбросить","add coverage":"добавить покрытие",
    "keep the assert":"оставить assert"
  }
};

function localizeWord(lang:FloorChatLang,value:string){
  const key=String(value||"").trim();
  if(!key)return key;
  return STATUS_WORDS[lang]?.[key]||STATUS_WORDS.en[key]||key;
}

function isHarvestNoise(item:{title?:string;status?:string;source?:string}){
  if(["working","queued","blocked"].includes(String(item.status||"")))return false;
  const source=String(item.source||"");
  if(["frontend-audit","coverage","feature-contract"].includes(source))return true;
  return /^(Frontend audit:|TODO: Decide|devops:|tests:|docs:|frontend:|backend:)/i.test(String(item.title||""));
}

function pairFor(topic:FloorChatTopic,agents:FloorChatAgent[],seed:string){
  if(agents.length<2)return null;
  const from=findAgent(agents,topic.preferredRoles)||agents[hash(seed)%agents.length];
  const rest=agents.filter(a=>a.id!==from.id);
  const to=findAgent(rest,topic.preferredRoles.slice(1))||rest[hash(seed+"b")%rest.length];
  if(!to)return null;
  return {from,to};
}

export function collectFloorTopics(input:{
  findings:Array<{id:string;title:string;status:string;severity?:string;lastResult?:string|null}>;
  workItems:Array<{id:string;title:string;status:string;priority?:string;type?:string;source?:string;verificationStatus?:string|null;blockedBy?:string[]}>;
  events:Array<{event_id?:string;event_type?:string;message?:string|null;task?:string|null;severity?:string|null;status?:string}>;
  commands:Array<{id:string;command?:string;status:string;message?:string|null;workItemTitle?:string|null;findingTitle?:string|null;qualityGateStatus?:string|null;verifierStatus?:string|null;assignedRole?:string|null}>;
  gate?:{ready?:boolean;checks?:Array<{id:string;label:string;ok:boolean;value:string}>}|null;
  doctor?:{overall?:string;checks?:Array<{id:string;label:string;status:string;detail:string}>}|null;
  recovery?:{interrupted?:Array<{id:string;title:string;status:string;message?:string|null}>}|null;
  coverage?:Array<{id:string;label:string;status:string;gaps?:string[]}>;
  project?:{name?:string;health?:string;milestone?:string|null;activeTask?:string|null;counts?:{todo?:number;bugs?:number;blockers?:number}}|null;
}):FloorChatTopic[]{
  const topics:FloorChatTopic[]=[];
  const commandRows=input.commands||[];
  const liveCommands=[
    ...commandRows.filter(command=>["planning","running","verifying","failed"].includes(command.status)),
    ...commandRows.filter(command=>command.status==="completed").slice(0,2)
  ];
  const hasLiveWork=liveCommands.some(c=>["planning","running","verifying"].includes(c.status));

  if(!hasLiveWork&&(input.project?.activeTask||input.project?.milestone||input.project?.health)){
    const health=input.project.health||"unknown";
    const task=clip(input.project.activeTask||input.project.milestone||input.project.name||"project");
    topics.push({
      key:`pulse:${input.project.name||"project"}`,
      fingerprint:`pulse:${health}:${task}:${input.project.counts?.blockers||0}:${input.project.counts?.todo||0}`,
      kind:"work",
      title:task,
      detail:clip(`health ${health} · todo ${input.project.counts?.todo??0} · blockers ${input.project.counts?.blockers??0}`),
      status:health,
      severity:Number(input.project.counts?.blockers||0)>0?"HIGH":health==="critical"?"HIGH":"MEDIUM",
      next:"status",
      preferredRoles:["ceo","qa","architect"]
    });
  }

  for(const finding of input.findings||[]){
    if(!["open","working"].includes(finding.status))continue;
    const title=clip(finding.title);
    topics.push({
      key:`finding:${finding.id}`,
      fingerprint:`finding:${finding.id}:${finding.status}:${finding.severity||""}:${clip(finding.lastResult||"",40)}`,
      kind:"finding",
      title,
      detail:clip(finding.lastResult||finding.severity||"open"),
      status:finding.status,
      severity:finding.severity,
      next:finding.severity==="BLOCKER"||finding.severity==="HIGH"?"validate":"fix next",
      preferredRoles:/secur|auth|permis|mfa/i.test(title)?["security","qa","ceo"]:["qa","architect","ceo"]
    });
  }

  for(const item of input.workItems||[]){
    if(!["todo","queued","working","blocked"].includes(item.status))continue;
    if(isHarvestNoise(item))continue;
    const blocked=item.blockedBy?.length?`blocked:${item.blockedBy.join(",")}`:"";
    topics.push({
      key:`work:${item.id}`,
      fingerprint:`work:${item.id}:${item.status}:${item.verificationStatus||""}:${blocked}`,
      kind:"work",
      title:clip(item.title),
      detail:clip([item.type,item.priority,item.verificationStatus,blocked].filter(Boolean).join(" · ")),
      status:item.status,
      severity:item.priority,
      next:item.status==="blocked"?"unblock":item.verificationStatus==="failed"?"re-audit":"continue",
      preferredRoles:item.type==="security"?["security","qa"]:item.type==="test"?["qa","architect"]:item.type==="docs"?["docs","pm"]:["architect","ceo","qa"]
    });
  }

  for(const event of (input.events||[]).slice(-12)){
    if(!/error|blocked|finding|decision|validation/.test(String(event.event_type||"")))continue;
    const title=clip(event.message||event.task||event.event_type||"event");
    topics.push({
      key:`event:${event.event_id||title}`,
      fingerprint:`event:${event.event_id||title}:${event.status||""}:${event.severity||""}`,
      kind:"event",
      title,
      detail:clip(event.event_type||""),
      status:event.status||"open",
      severity:event.severity||undefined,
      next:"review",
      preferredRoles:["ceo","qa","architect"]
    });
  }

  for(const command of liveCommands){
    const failed=command.status==="failed"||command.qualityGateStatus==="failed"||command.verifierStatus==="failed";
    const title=clip(command.workItemTitle||command.findingTitle||command.command||command.id);
    const live=["planning","running","verifying"].includes(command.status);
    topics.push({
      key:`command:${command.id}`,
      fingerprint:`command:${command.id}:${command.status}:${command.qualityGateStatus||""}:${command.verifierStatus||""}:${clip(command.message||"",36)}`,
      kind:live||command.status==="completed"?"progress":"command",
      title,
      detail:clip(command.message||command.status),
      status:command.status,
      next:failed?"re-run with evidence":command.status==="completed"?"status":"watch",
      preferredRoles:command.assignedRole?[command.assignedRole,"ceo","qa"]:["ceo","qa","devops"]
    });
  }

  for(const check of input.gate?.checks||[]){
    if(check.ok)continue;
    topics.push({
      key:`gate:${check.id}`,
      fingerprint:`gate:${check.id}:${check.value}`,
      kind:"gate",
      title:clip(check.label),
      detail:clip(check.value),
      status:"blocked",
      severity:"HIGH",
      next:"recheck",
      preferredRoles:["ceo","qa","security"]
    });
  }

  for(const check of input.doctor?.checks||[]){
    if(check.status==="pass")continue;
    topics.push({
      key:`doctor:${check.id}`,
      fingerprint:`doctor:${check.id}:${check.status}:${clip(check.detail,40)}`,
      kind:"doctor",
      title:clip(check.label),
      detail:clip(check.detail),
      status:check.status,
      severity:check.status==="fail"?"HIGH":"MEDIUM",
      next:"doctor",
      preferredRoles:["devops","cto","ceo"]
    });
  }

  for(const row of input.recovery?.interrupted||[]){
    topics.push({
      key:`recovery:${row.id}`,
      fingerprint:`recovery:${row.id}:${row.status}:${clip(row.message||"",30)}`,
      kind:"recovery",
      title:clip(row.title),
      detail:clip(row.message||row.status),
      status:row.status,
      severity:"HIGH",
      next:"recover or discard",
      preferredRoles:["devops","ceo","cto"]
    });
  }

  for(const row of input.coverage||[]){
    if(row.status==="verified")continue;
    topics.push({
      key:`coverage:${row.id}`,
      fingerprint:`coverage:${row.id}:${row.status}:${(row.gaps||[]).slice(0,2).join("|")}`,
      kind:"coverage",
      title:clip(row.label),
      detail:clip((row.gaps||[]).join(" · ")||row.status),
      status:row.status,
      next:"add coverage",
      preferredRoles:["qa","architect","docs"]
    });
  }

  const rank=(topic:FloorChatTopic)=>{
    const sev=String(topic.severity||"").toUpperCase();
    if(sev==="BLOCKER"||sev==="CRITICAL")return 0;
    if(["planning","running","verifying"].includes(topic.status))return 1;
    if(topic.kind==="progress"&&topic.status==="completed")return 2;
    if(sev==="HIGH")return 3;
    if(topic.kind==="gate"||topic.kind==="recovery")return 4;
    if(topic.kind==="finding"||topic.kind==="command")return 5;
    if(topic.kind==="progress")return 2;
    return 6;
  };
  return topics.sort((a,b)=>rank(a)-rank(b)||a.key.localeCompare(b.key));
}

function lines(lang:FloorChatLang,kind:FloorChatKind,angle:number,status?:string){
  const banks:Record<FloorChatLang,Record<string,string[][]>>={
    tr:{
      finding:[
        ["{from}: {title} hâlâ {status}. Şiddet {severity}. Aynı cümleyi tekrar etmeyelim — eksik olan {detail}.","{to}: Kabul. Alışkanlığı değiştiriyoruz: fix yazmadan önce odaklı test. Sonraki adım {next}."],
        ["{from}: Bu açık {title}. Yayın bunu geçemez. Kanıt satırı boşsa iş bitmiş sayılmaz.","{to}: Drift var mı bakacağım. Varsayım yok; {detail} üzerinden gideceğim."],
        ["{from}: {title} tekrar gündemde. Dün konuştuğumuz genel 'incele' işe yaramadı.","{to}: O zaman somut: kim sahipleniyor, hangi dosya, hangi assert. Ben {next}."]
      ],
      work:[
        ["{from}: Sıradaki iş {title} ({status}). Öncelik {severity}.","{to}: Bloke eden varsa önce onu. Yoksa ben {detail} tarafını ayırırım, sen {next}."],
        ["{from}: {title} kuyrukta bekliyor. Aynı işi ikinci kez planlamayalım.","{to}: Plan yeter. Çalıştırma kanıtı yoksa TODO olarak kalsın, done yazmayalım."],
        ["{from}: {title} için sahiplik net değil. İki ajan aynı dosyaya girerse birleşme durur.","{to}: Sözleşme: bir yazar, bir doğrular. Ben doğrulama tarafındayım."]
      ],
      event:[
        ["{from}: Az önce olay: {title}. Tip {detail}.","{to}: Bunu sohbette gömüp geçmeyelim. Kök neden bir satırlık mı, yoksa kapı mı?"],
        ["{from}: {title} runtime'da göründü. Sessiz kalırsak tekrarlar.","{to}: Log'u sakla, aynı hatayı üçüncü kez görürsek alışkanlık değiştiririz."]
      ],
      command:[
        ["{from}: Komut {title} → {status}. Mesaj: {detail}.","{to}: {title} için aynı komutu tekrar basmak yetmez. Ortam/Git şartı: {detail}. Sonra {next}."],
        ["{from}: {title} doğrulayıcıdan geçmedi.","{to}: {title} tarafında kod drift olabilir, test değil. Kanıt: {detail}. Sonra {next}."]
      ],
      gate:[
        ["{from}: Yayın kapısı kırmızı: {title}. Değer: {detail}.","{to}: Baseline ile canlı ağaç ayrışmış. Commit veya kabul olmadan Stable yok."],
        ["{from}: {title} yüzünden yayın kilitli. Bunu 'sonra bakarız' diye bırakmayalım.","{to}: Kapı satırını dürüst tut. Yeşil boyamak yasak."]
      ],
      doctor:[
        ["{from}: Doctor {title} = {status}. {detail}","{to}: Bu sağlık, görev değil. Önce runtime'ı ayakta tut, sonra iş kuyruğu."],
        ["{from}: {title} uyarıyor. Ofis konuşuyor ama koşucu topallıyorsa konuşma iş bitirmez.","{to}: Anlaşıldı. {next} ile başlarım."]
      ],
      recovery:[
        ["{from}: Kesilen iş: {title}. Durum {status}.","{to}: Devam mı, at mı? Ortada bırakmak ikinci hayalet kuyruk üretir."],
        ["{from}: {title} yarım kaldı. {detail}","{to}: Stale worktree varsa temizle, sonra tek komutla devam."]
      ],
      coverage:[
        ["{from}: Kapsama boş: {title}. {detail}","{to}: Ekran var diye bitmiş sayma. Etkileşim + assert yoksa missing kalır."],
        ["{from}: {title} hâlâ {status}.","{to}: Bir test adı yazmadan 'covered' demeyelim."]
      ],
      progress:[
        ["{from}: Şu an bunu yapıyoruz: {title}. Durum {status}.","{to}: Not aldım. Kanıt: {detail}. Bitince doğrularız."],
        ["{from}: {title} işi {status}.","{to}: Aynı işi ikinci kez anlatmayalım. Ben {next} tarafını izlerim."],
        ["{from}: {title} kapandı. Sonuç: {detail}.","{to}: Tamam. Sonraki işe geçebiliriz, done'u kanıtsız yazmayalım."]
      ],
      lesson:[
        ["{from}: {title} kapandı. Tekrar açılmasın diye not: {detail}.","{to}: Alışkanlık: her benzer fix'ten sonra aynı assert'i koş. Ben kopyasını kuyruğa eklerim."],
        ["{from}: Dün konuştuğumuz {title} artık {status}.","{to}: İyi. Aynı sınıf bir daha gelirse ilk soru 'test var mı' olacak."]
      ]
    },
    en:{
      finding:[
        ["{from}: {title} is still {status}. Severity {severity}. Don't repeat the headline — the gap is {detail}.","{to}: Agreed. New habit: focused test before calling it fixed. Next: {next}."],
        ["{from}: Open issue {title}. Release cannot pass this. No evidence means not done.","{to}: I'll check drift. No assumptions — only {detail}."],
        ["{from}: {title} is back. Vague 'review it' didn't move anything.","{to}: Concrete now: owner, file, assert. I'll take {next}."]
      ],
      work:[
        ["{from}: Next work is {title} ({status}). Priority {severity}.","{to}: Unblock first if needed. I'll split {detail}; you take {next}."],
        ["{from}: {title} is waiting. Let's not re-plan the same card.","{to}: Plan is enough. No run evidence → it stays TODO."],
        ["{from}: Ownership on {title} is fuzzy. Two writers will stall merge.","{to}: Contract: one writes, one verifies. I'm on verify."]
      ],
      event:[
        ["{from}: Just now: {title}. Kind {detail}.","{to}: Don't bury it in chat. One-line root cause or a gate?"],
        ["{from}: {title} showed up in runtime. Silence lets it repeat.","{to}: Keep the log. Third time → we change the habit."]
      ],
      command:[
        ["{from}: Command {title} → {status}. {detail}","{to}: Retrying {title} blindly won't help. Constraint: {detail}. Then {next}."],
        ["{from}: {title} failed the verifier.","{to}: For {title}, treat {detail} as drift until proven otherwise. Then {next}."]
      ],
      gate:[
        ["{from}: Release gate red: {title}. {detail}","{to}: Baseline and tree diverged. No Stable without commit or honest accept."],
        ["{from}: {title} is locking release. Don't park it as later.","{to}: Keep the gate honest. No painting it green."]
      ],
      doctor:[
        ["{from}: Doctor {title} = {status}. {detail}","{to}: This is health, not a task. Steady the runtime, then the queue."],
        ["{from}: {title} is warning. Talk without a runner is theater.","{to}: Understood. Starting with {next}."]
      ],
      recovery:[
        ["{from}: Interrupted: {title} ({status}).","{to}: Resume or discard. Half-open work breeds ghost queues."],
        ["{from}: {title} stopped mid-flight. {detail}","{to}: Clean stale worktrees, then one command to continue."]
      ],
      coverage:[
        ["{from}: Coverage gap: {title}. {detail}","{to}: A screen is not done. No interaction + assert → missing."],
        ["{from}: {title} is still {status}.","{to}: Don't say covered without a test name."]
      ],
      progress:[
        ["{from}: We're doing this now: {title}. Status {status}.","{to}: Noted. Evidence: {detail}. We'll verify when it lands."],
        ["{from}: {title} is {status}.","{to}: Don't re-narrate the same card. I'll watch {next}."],
        ["{from}: {title} is done. Result: {detail}.","{to}: Good. Next work can start — no done without evidence."]
      ],
      lesson:[
        ["{from}: {title} closed. Keep it closed: {detail}.","{to}: Habit: same assert after every similar fix. I'll queue the copy."],
        ["{from}: {title} we discussed is now {status}.","{to}: Good. Next time this class appears, first question is 'where's the test'."]
      ]
    },
    de:{
      finding:[
        ["{from}: {title} ist noch {status}. Schwere {severity}. Nicht die Überschrift wiederholen — Lücke: {detail}.","{to}: Einverstanden. Neue Gewohnheit: gezielter Test vor 'fertig'. Als Nächstes {next}."],
        ["{from}: Offen: {title}. Release geht so nicht. Ohne Nachweis nicht erledigt.","{to}: Ich prüfe Drift. Keine Annahmen — nur {detail}."]
      ],
      work:[
        ["{from}: Nächste Arbeit {title} ({status}). Prio {severity}.","{to}: Erst entblocken. Ich teile {detail}; du {next}."],
        ["{from}: {title} wartet. Nicht denselben Plan nochmal.","{to}: Ohne Lauf-Nachweis bleibt es TODO."]
      ],
      event:[
        ["{from}: Gerade: {title}. Art {detail}.","{to}: Nicht im Chat begraben. Ursache oder Gate?"],
        ["{from}: {title} in der Runtime. Schweigen wiederholt es.","{to}: Log behalten. Beim dritten Mal Gewohnheit ändern."]
      ],
      command:[
        ["{from}: Befehl {title} → {status}. {detail}","{to}: {title} nicht stumpf wiederholen. Bedingung: {detail}. Dann {next}."],
        ["{from}: {title} am Verifier gescheitert.","{to}: Bei {title} zuerst Drift ({detail}), dann {next}."]
      ],
      gate:[
        ["{from}: Release-Gate rot: {title}. {detail}","{to}: Baseline und Baum drift. Kein Stable ohne ehrliche Spur."],
        ["{from}: {title} sperrt das Release.","{to}: Gate ehrlich lassen. Nicht grün malen."]
      ],
      doctor:[
        ["{from}: Doctor {title} = {status}. {detail}","{to}: Das ist Gesundheit, keine Aufgabe. Erst Runtime."],
        ["{from}: {title} warnt. Reden ohne Runner ist Theater.","{to}: Verstanden. Start {next}."]
      ],
      recovery:[
        ["{from}: Unterbrochen: {title} ({status}).","{to}: Fortsetzen oder verwerfen. Halboffen erzeugt Geister."],
        ["{from}: {title} mittendrin stoppte. {detail}","{to}: Stale Worktrees, dann ein Befehl."]
      ],
      coverage:[
        ["{from}: Lücke: {title}. {detail}","{to}: Ein Screen ist nicht fertig ohne Assert."],
        ["{from}: {title} bleibt {status}.","{to}: Ohne Testnamen kein 'covered'."]
      ],
      progress:[
        ["{from}: Wir machen gerade: {title}. Status {status}.","{to}: Notiert. Nachweis: {detail}. Danach prüfen."],
        ["{from}: {title} ist {status}.","{to}: Nicht dieselbe Karte nochmal erzählen. Ich achte auf {next}."],
        ["{from}: {title} ist fertig. Ergebnis: {detail}.","{to}: Gut. Nächste Arbeit — ohne Nachweis kein Done."]
      ],
      lesson:[
        ["{from}: {title} ist zu. Merker: {detail}.","{to}: Gewohnheit: gleicher Assert nach jedem ähnlichen Fix."],
        ["{from}: {title} ist jetzt {status}.","{to}: Gut. Nächste Frage immer: wo ist der Test."]
      ]
    },
    ru:{
      finding:[
        ["{from}: {title} всё ещё {status}. Тяжесть {severity}. Не повторяем заголовок — дыра: {detail}.","{to}: Ок. Привычка: целевой тест до 'готово'. Дальше {next}."],
        ["{from}: Открыто: {title}. Релиз так не пройдёт. Нет доказательства — не сделано.","{to}: Проверю drift. Без догадок, только {detail}."]
      ],
      work:[
        ["{from}: Следующая работа {title} ({status}). Приоритет {severity}.","{to}: Сначала блокер. Я беру {detail}, ты {next}."],
        ["{from}: {title} ждёт. Не планируем то же самое снова.","{to}: Нет прогона — остаётся TODO."]
      ],
      event:[
        ["{from}: Сейчас: {title}. Тип {detail}.","{to}: Не хоронить в чате. Причина или шлюз?"],
        ["{from}: {title} в runtime. Молчание повторит это.","{to}: Лог оставить. В третий раз меняем привычку."]
      ],
      command:[
        ["{from}: Команда {title} → {status}. {detail}","{to}: {title} снова жать бесполезно. Условие: {detail}. Потом {next}."],
        ["{from}: {title} не прошёл verifier.","{to}: Для {title} сначала drift ({detail}), потом {next}."]
      ],
      gate:[
        ["{from}: Шлюз красный: {title}. {detail}","{to}: Baseline и дерево разошлись. Без честного следа Stable нет."],
        ["{from}: {title} держит релиз.","{to}: Шлюз честный. Не красить в зелёный."]
      ],
      doctor:[
        ["{from}: Doctor {title} = {status}. {detail}","{to}: Это здоровье, не задача. Сначала runtime."],
        ["{from}: {title} предупреждает. Разговор без runner — театр.","{to}: Понял. Начинаю с {next}."]
      ],
      recovery:[
        ["{from}: Прервано: {title} ({status}).","{to}: Продолжить или отбросить. Полуоткрытое плодит очереди."],
        ["{from}: {title} остановилось. {detail}","{to}: Устаревшие worktree, затем одна команда."]
      ],
      coverage:[
        ["{from}: Дыра покрытия: {title}. {detail}","{to}: Экран ≠ готово. Нет assert — missing."],
        ["{from}: {title} всё ещё {status}.","{to}: Без имени теста не говорим covered."]
      ],
      progress:[
        ["{from}: Сейчас делаем: {title}. Статус {status}.","{to}: Принял. Доказательство: {detail}. Потом проверим."],
        ["{from}: {title} сейчас {status}.","{to}: Не пересказываем ту же карточку. Я смотрю {next}."],
        ["{from}: {title} готово. Результат: {detail}.","{to}: Хорошо. Дальше — без доказательства не done."]
      ],
      lesson:[
        ["{from}: {title} закрыто. Чтобы не открылось: {detail}.","{to}: Привычка: тот же assert после похожего фикса."],
        ["{from}: {title} теперь {status}.","{to}: Хорошо. Следующий вопрос всегда: где тест."]
      ]
    }
  };
  const pack=banks[lang]||banks.en;
  const set=pack[kind]||pack.finding;
  if(kind==="progress"&&set.length>=3){
    if(status==="completed")return set[2];
    return set[angle%2];
  }
  return set[angle%set.length];
}

function fill(template:string,topic:FloorChatTopic,from:FloorChatAgent,to:FloorChatAgent,lang:FloorChatLang){
  return template
    .replaceAll("{from}",displayRole(from))
    .replaceAll("{to}",displayRole(to))
    .replaceAll("{title}",topic.title)
    .replaceAll("{detail}",topic.detail||"—")
    .replaceAll("{status}",localizeWord(lang,topic.status))
    .replaceAll("{severity}",topic.severity||"—")
    .replaceAll("{next}",localizeWord(lang,topic.next||"status"));
}

export function collectLessons(
  memory:FloorChatMemory,
  previous:Array<{id:string;status:string;title:string}>
):FloorChatTopic[]{
  const lessons:FloorChatTopic[]=[];
  for(const row of previous){
    if(!memory.lastStatus[row.id])continue;
    const was=memory.lastStatus[row.id];
    const now=row.status;
    if(["open","working","todo","blocked","failed"].includes(was)&&["fixed","done","verified"].includes(now)){
      lessons.push({
        key:`lesson:${row.id}`,
        fingerprint:`lesson:${row.id}:${now}`,
        kind:"lesson",
        title:clip(row.title),
        detail:`${was} → ${now}`,
        status:now,
        next:"keep the assert",
        preferredRoles:["qa","ceo","architect"]
      });
    }
  }
  return lessons;
}

export function nextFloorExchange(input:{
  projectId:string;
  lang:FloorChatLang;
  agents:FloorChatAgent[];
  topics:FloorChatTopic[];
  memory:FloorChatMemory;
  now?:number;
}):{messages:FloorChatMessage[];memory:FloorChatMemory}|null{
  const agents=input.agents.filter(a=>a.id);
  if(agents.length<2)return null;
  const now=input.now??Date.now();
  const fingerprints=new Set(input.memory.fingerprints);
  const texts=new Set(input.memory.texts);
  const lastAt=input.memory.lastAt;
  const angle={...input.memory.angle};
  const lastStatus={...input.memory.lastStatus};

  const fresh=input.topics.filter(topic=>{
    if(fingerprints.has(topic.fingerprint))return false;
    const prev=lastAt[topic.key]||0;
    if(prev&&now-prev<90_000&&lastStatus[topic.key]===topic.status)return false;
    return true;
  });
  if(!fresh.length)return null;

  const topic=fresh[0];
  const seed=`${topic.fingerprint}:${now}`;
  const pair=pairFor(topic,agents,seed);
  if(!pair)return null;
  const turn=angle[topic.key]||0;
  const pairLines=lines(input.lang,topic.kind,turn+hash(seed),topic.status);
  const rendered=pairLines.map(line=>fill(line,topic,pair.from,pair.to,input.lang));
  if(rendered.some(line=>texts.has(line))){
    const retry=pairLines.map(line=>fill(line,topic,pair.to,pair.from,input.lang));
    if(retry.every(line=>texts.has(line)))return null;
    rendered[0]=retry[0];
    rendered[1]=retry[1];
  }

  const messages:FloorChatMessage[]=rendered.map((text,index)=>({
    id:`floor-${now}-${index}-${hash(text).toString(36)}`,
    projectId:input.projectId,
    fromId:index===0?pair.from.id:pair.to.id,
    fromRole:index===0?displayRole(pair.from):displayRole(pair.to),
    toId:index===0?pair.to.id:pair.from.id,
    toRole:index===0?displayRole(pair.to):displayRole(pair.from),
    text,
    kind:topic.kind,
    topicKey:topic.key,
    createdAt:now+index*420
  }));

  return {
    messages,
    memory:{
      fingerprints:[...input.memory.fingerprints,topic.fingerprint].slice(-240),
      texts:[...input.memory.texts,...rendered].slice(-160),
      lastStatus:{...lastStatus,[topic.key]:topic.status},
      lastAt:{...lastAt,[topic.key]:now},
      angle:{...angle,[topic.key]:turn+1}
    }
  };
}

export function emptyFloorMemory():FloorChatMemory{
  return {fingerprints:[],texts:[],lastStatus:{},lastAt:{},angle:{}};
}

export function rosterLabel(agents:FloorChatAgent[]){
  return ROLE_ORDER.filter(role=>agents.some(a=>roleKey(a).includes(role.toLowerCase()))).join(" · ");
}
