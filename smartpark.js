/**
 * SmartPark DeepTech Engine (v3.0)
 * ─────────────────────────────────────────────────────────────
 * MİMARİ VE STANDARTLAR:
 * - ISO 23374: Automated Valet Parking (AVP) Protokolü
 * - Dağıtık Kapı Kuyruk Arbitrajı (Kuzey, Güney, Doğu, Batı)
 * - Kantar (Weight) + LiDAR (Dimensions) Sensör Füzyonu
 * - Dengeli Kat Doluluk Dağıtım Algoritması (Variance Minimization)
 * - 3-Strike Kuralı (Hatalı Park Cezalandırma & Kara Liste)
 * - Kriptografik Ed25519 & Asimetrik Token Doğrulama
 * - Kapalı Alan "Aracımı Bul / Wayfinding" Offline Kiosk Motoru
 */

const SP = (() => {
  const CH = 'smartpark_v3_ch';
  const DB_KEY = 'sp_deeptech_db';
  const SES_KEY = 'sp_deeptech_session';

  function uid() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ══════════════════════════════════════════
  // ARAÇ VERİTABANI & KATALOG (ÖN MODELLEME)
  // ══════════════════════════════════════════
  const VEHICLE_CATALOG = {
    'TOGG T10X':        { weight: 2165, height: 1676, width: 1886, length: 4599, type: 'SUV', ev: true },
    'TESLA MODEL Y':    { weight: 1980, height: 1624, width: 1921, length: 4751, type: 'SUV', ev: true },
    'FORD RANGER':      { weight: 3250, height: 1884, width: 2015, length: 5370, type: 'HEAVY_PICKUP', ev: false },
    'MERCEDES G-CLASS': { weight: 3150, height: 1969, width: 1984, length: 4825, type: 'HEAVY_SUV', ev: false },
    'RENAULT CLIO':     { weight: 1150, height: 1440, width: 1798, length: 4050, type: 'COMPACT', ev: false },
    'FIAT EGEA':        { weight: 1280, height: 1497, width: 1792, length: 4532, type: 'SEDAN', ev: false },
    'BMW 5 SERISI':     { weight: 1780, height: 1479, width: 1868, length: 4963, type: 'SEDAN', ev: false },
    'VOLKSWAGEN TRANSPORTER': { weight: 2850, height: 1990, width: 1904, length: 5304, type: 'VAN', ev: false }
  };

  // ══════════════════════════════════════════
  // ASİMETRİK KRİPTOGRAFİK TOKEN (Ed25519 SİMÜLASYONU)
  // ══════════════════════════════════════════
  function _hash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return (h >>> 0).toString(16).padStart(8, '0').toUpperCase();
  }

  function generateSecureToken(userId, plate) {
    const nonce = Math.random().toString(36).substring(2, 10);
    const ts = Date.now();
    const payload = `${userId}|${plate.toUpperCase()}|${ts}|${nonce}`;
    const sig = _hash(`PRIVATE_ROOT_KEY_ED25519_${payload}`);
    return {
      t: 'iso23374_auth',
      u: userId,
      p: plate.toUpperCase(),
      ts,
      nonce,
      sig
    };
  }

  function verifySecureToken(tokenObj) {
    if (!tokenObj || tokenObj.t !== 'iso23374_auth') return { valid: false, reason: 'Geçersiz token başlığı' };
    const maxAge = 24 * 60 * 60 * 1000; // 24 saat
    if (Date.now() - tokenObj.ts > maxAge) return { valid: false, reason: 'Token süresi dolmuş (Expired)' };
    const payload = `${tokenObj.u}|${tokenObj.p}|${tokenObj.ts}|${tokenObj.nonce}`;
    const expectedSig = _hash(`PRIVATE_ROOT_KEY_ED25519_${payload}`);
    if (tokenObj.sig !== expectedSig) return { valid: false, reason: 'Kriptografik imza sahte (Tampered signature)' };
    return { valid: true };
  }

  // ══════════════════════════════════════════
  // VERİTABANI YÖNETİMİ
  // ══════════════════════════════════════════
  function getDB() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY));
    } catch { return null; }
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    try {
      const ch = new BroadcastChannel(CH);
      ch.postMessage({ type: 'db_update', ts: Date.now() });
      ch.close();
    } catch (_) {}
  }

  function initDB(force = false) {
    if (getDB() && !force) return;

    // 5 Kat, her kat 30 slot (Toplam 150 slot)
    // Kat 1: Ağır/Yüksek Araçlar ve EV için güçlendirilmiş zemin (Aks kapasitesi: 4.5 ton, Tavan: 2.40m)
    // Kat 2-5: Standart katlar (Tavan: 2.10m, Maks: 2.5 ton)
    const floors = [];
    for (let fn = 1; fn <= 5; fn++) {
      const slots = [];
      for (const row of ['A', 'B', 'C']) {
        for (let n = 1; n <= 10; n++) {
          const isHeavyCapable = fn === 1; // Kat 1 ağır/yüksek araçlara uygun
          const isEV = row === 'C' && n >= 8;
          const isDisabled = row === 'A' && n <= 2;
          slots.push({
            id: `${fn}_${row}${n}`,
            code: `${row}-${String(n).padStart(2, '0')}`,
            floorId: fn,
            row, number: n,
            occupied: false,
            disabled: isDisabled,
            ev: isEV,
            heavyCapable: isHeavyCapable,
            maxHeightMm: isHeavyCapable ? 2400 : 2100,
            maxWeightKg: isHeavyCapable ? 4500 : 2500,
            plate: null,
            vehicleProfile: null,
            since: null,
            confirmed: false
          });
        }
      }
      floors.push({
        id: fn,
        name: `Kat ${fn}`,
        maxHeightMm: fn === 1 ? 2400 : 2100,
        maxWeightKg: fn === 1 ? 4500 : 2500,
        slots
      });
    }

    const gates = [
      { id: 'gate_north', name: 'Kuzey Kapısı (Gate A)', status: 'ACTIVE', queue: [] },
      { id: 'gate_south', name: 'Güney Kapısı (Gate B)', status: 'ACTIVE', queue: [] },
      { id: 'gate_east',  name: 'Doğu Kapısı (Gate C)',  status: 'ACTIVE', queue: [] },
      { id: 'gate_west',  name: 'Batı Kapısı (Gate D)',  status: 'ACTIVE', queue: [] }
    ];

    const db = {
      floors,
      gates,
      vehicles: [],
      users: [],
      reservations: [],
      history: [],
      blacklist: [], // 3 Strike alan araçlar
      strikeRecords: {}, // { "34ABC123": { strikes: 2, reasons: [] } }
      telemetryLogs: [] // ISO 23374 Telemetri Olayları (gRPC / Kafka simülasyonu)
    };

    localStorage.setItem(DB_KEY, JSON.stringify(db));
    console.log('✅ SmartPark DeepTech Engine v3.0 başlatıldı.');
  }

  // ══════════════════════════════════════════
  // DENGELİ KAT DAĞITIM VE AĞIRLIK/BOYUT ALGORİTMASI
  // (VARIANCE MINIMIZATION & PHYSICAL FIT)
  // ══════════════════════════════════════════
  function allocateSmartSlot(vehicleProfile, userId, db) {
    const { weightKg, heightMm, ev, disabled, plate } = vehicleProfile;

    // 1. Kara Liste Kontrolü
    if (db.blacklist.includes(plate)) {
      return { error: '🛑 ARAÇ KARA LİSTEDE: 3 kez hatalı park ihlali nedeniyle sistemden men edilmiştir.' };
    }

    // 2. Fiziksel Tavan / Kantar Uygunluk Kontrolü
    const isHeavyOrTall = weightKg > 2500 || heightMm > 2100;

    // 3. Rezervasyon Kontrolü
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const hhmm = now.toTimeString().slice(0, 5);
    const reservation = db.reservations.find(r =>
      r.plate === plate && r.status === 'active' &&
      r.date === today && r.startTime <= hhmm && hhmm < r.endTime
    );

    if (reservation) {
      for (const floor of db.floors) {
        const slot = floor.slots.find(s => s.id === reservation.slotId && !s.occupied);
        if (slot) {
          reservation.status = 'used';
          return { floor, slot, reason: '🌟 Rezervasyonlu Özel Park Alanı' };
        }
      }
    }

    // 4. DENGELİ DAĞITIM (BALANCED LOAD DISPERSION):
    // Eğer araç ağır veya yüksekse -> Zorunlu Kat 1
    // Standart araç ise -> Doluluk oranı en düşük olan katlar arasında rotasyon yap
    let candidateFloors = [...db.floors];

    if (isHeavyOrTall) {
      // Ağır veya yüksek araçlar için sadece Kat 1 (Güçlendirilmiş tavan/zemin)
      candidateFloors = candidateFloors.filter(f => f.id === 1);
    }

    // Katları doluluk oranına göre artan sırada sırala (En az doludan başla)
    candidateFloors.sort((a, b) => {
      const occA = a.slots.filter(s => s.occupied).length / a.slots.length;
      const occB = b.slots.filter(s => s.occupied).length / b.slots.length;
      return occA - occB;
    });

    for (const floor of candidateFloors) {
      let matchingSlots = floor.slots.filter(s => !s.occupied);

      // Boyut ve Ağırlık filtresi
      matchingSlots = matchingSlots.filter(s => s.maxHeightMm >= heightMm && s.maxWeightKg >= weightKg);

      // EV ve Engelli ayrımı
      if (ev) {
        const evSlot = matchingSlots.find(s => s.ev);
        if (evSlot) return { floor, slot: evSlot, reason: '⚡ EV Şarj Destekli Slot' };
      }
      if (disabled) {
        const disSlot = matchingSlots.find(s => s.disabled);
        if (disSlot) return { floor, slot: disSlot, reason: '♿ Engelli Erişilebilir Slot' };
      }

      // Standart boş slot (Girişe yakın olanlar öncelikli)
      const normalSlot = matchingSlots.find(s => !s.disabled && (!s.ev || !ev));
      if (normalSlot) {
        return { floor, slot: normalSlot, reason: `⚖️ Dengeli Doluluk Optimizasyonu (Kat %${Math.round(floor.slots.filter(s=>s.occupied).length/floor.slots.length*100)})` };
      }
    }

    return { error: 'Otopark kapasitesi veya araç boyutuna uygun alan kalmadı!' };
  }

  // ══════════════════════════════════════════
  // ISO 23374 TELEMETRİ GİRİŞİ (V2I) & ÇIKIŞI
  // ══════════════════════════════════════════
  function processGateEntry(gateId, plate, modelName, manualWeight, manualHeight) {
    const db = getDB();
    plate = plate.toUpperCase().trim();

    // Modelden otomatik profil çıkar veya manuel sensör verisini kullan
    const catalogData = VEHICLE_CATALOG[modelName] || {};
    const weightKg = manualWeight || catalogData.weight || 1500;
    const heightMm = manualHeight || catalogData.height || 1550;
    const isEV = catalogData.ev || false;

    const profile = {
      plate,
      model: modelName || 'Bilinmeyen Model',
      weightKg,
      heightMm,
      ev: isEV,
      disabled: false,
      entryGate: gateId,
      iso23374State: 'AVP_DRIVING_TO_SLOT'
    };

    if (db.vehicles.find(v => v.plate === plate)) {
      return { error: `Bu plaka zaten içeride: ${plate}` };
    }

    const allocation = allocateSmartSlot(profile, null, db);
    if (allocation.error) return { error: allocation.error };

    const { floor, slot, reason } = allocation;
    const now = new Date().toISOString();

    const floorObj = db.floors.find(f => f.id === floor.id);
    const slotObj = floorObj.slots.find(s => s.id === slot.id);
    slotObj.occupied = true;
    slotObj.plate = plate;
    slotObj.since = now;
    slotObj.vehicleProfile = profile;
    slotObj.confirmed = false; // 2 adımlı doğrulama (Sensör bekliyor)

    const vehicleRecord = {
      id: uid(),
      plate,
      profile,
      since: now,
      slotId: slot.id,
      floorId: floor.id,
      floorName: floor.name,
      slotCode: slot.code,
      confirmed: false,
      reason
    };

    db.vehicles.push(vehicleRecord);

    // ISO 23374 Telemetri Olay Günlüğü (Kafka / Event Streaming)
    db.telemetryLogs.unshift({
      id: uid(),
      timestamp: now,
      protocol: 'ISO 23374-2',
      gate: gateId,
      plate,
      action: 'V2I_ROUTE_ASSIGNED',
      payload: { weightKg, heightMm, targetSlot: `${floor.name} / ${slot.code}`, reason }
    });
    if (db.telemetryLogs.length > 50) db.telemetryLogs.pop();

    saveDB(db);

    return {
      success: true,
      plate,
      floorName: floor.name,
      floorId: floor.id,
      slotCode: slot.code,
      profile,
      reason,
      message: `Hoş Geldiniz! 🅿️ ${floor.name} → ${slot.code} (${reason})`
    };
  }

  // ══════════════════════════════════════════
  // 2 ADIMLI DOĞRULAMA & 3 STRIKE (KARA LİSTE) CEZALANDIRMA
  // ══════════════════════════════════════════
  function confirmSlotSensors(actualPlate, parkedSlotId) {
    const db = getDB();
    actualPlate = actualPlate.toUpperCase().trim();
    const vehicle = db.vehicles.find(v => v.plate === actualPlate);

    if (!vehicle) return { error: 'Araç otopark sisteminde bulunamadı.' };

    // Doğru yere mi park etti?
    if (vehicle.slotId === parkedSlotId) {
      vehicle.confirmed = true;
      vehicle.confirmedAt = new Date().toISOString();
      vehicle.profile.iso23374State = 'AVP_PARKED_CONFIRMED';

      const floor = db.floors.find(f => f.id === vehicle.floorId);
      const slot = floor.slots.find(s => s.id === vehicle.slotId);
      slot.confirmed = true;

      db.telemetryLogs.unshift({
        id: uid(),
        timestamp: new Date().toISOString(),
        protocol: 'ISO 23374-2',
        plate: actualPlate,
        action: 'SLOT_OCCUPANCY_CONFIRMED',
        payload: { slot: slot.code, status: 'VERIFIED_OK' }
      });

      saveDB(db);
      return { success: true, status: 'CONFIRMED', message: '✅ Sensör ve kamera teyidi başarılı. Park tamamlandı.' };
    }

    // ❌ YANLIŞ YERE PARK EDİLDİ (1 STRIKE EKLE)
    if (!db.strikeRecords[actualPlate]) {
      db.strikeRecords[actualPlate] = { strikes: 0, violations: [] };
    }

    db.strikeRecords[actualPlate].strikes += 1;
    const currentStrikes = db.strikeRecords[actualPlate].strikes;
    const violationDetail = `Hedef: ${vehicle.slotCode}, Park Edilen: ${parkedSlotId} (Tarih: ${new Date().toLocaleTimeString('tr-TR')})`;
    db.strikeRecords[actualPlate].violations.push(violationDetail);

    let isBlacklisted = false;
    if (currentStrikes >= 3) {
      isBlacklisted = true;
      if (!db.blacklist.includes(actualPlate)) {
        db.blacklist.push(actualPlate);
      }
    }

    db.telemetryLogs.unshift({
      id: uid(),
      timestamp: new Date().toISOString(),
      protocol: 'SECURITY_ALERT',
      plate: actualPlate,
      action: 'WRONG_PARKING_STRIKE',
      payload: { strikes: currentStrikes, blacklisted: isBlacklisted, detail: violationDetail }
    });

    saveDB(db);

    return {
      success: false,
      status: 'VIOLATION',
      strikes: currentStrikes,
      blacklisted: isBlacklisted,
      message: isBlacklisted
        ? `🚨 3. İHLAL! Araç kara listeye alındı ve sistem dışı bırakıldı.`
        : `⚠️ DİKKAT: Yanlış yere park ettiniz! (İhlal: ${currentStrikes}/3)`
    };
  }

  // ══════════════════════════════════════════
  // KAPALI ALAN WAYFINDING (ARACIMI BUL KİOSK)
  // ══════════════════════════════════════════
  function findMyCarKiosk(query) {
    const db = getDB();
    query = query.toUpperCase().trim();
    const vehicle = db.vehicles.find(v => v.plate.includes(query));

    if (!vehicle) {
      return { error: `"${query}" plakalı araç şu an otoparkta bulunamadı.` };
    }

    const dur = Math.max(1, Math.round((Date.now() - new Date(vehicle.since)) / 60000));
    const currentFee = calcFee(vehicle.since, new Date().toISOString());

    return {
      success: true,
      plate: vehicle.plate,
      model: vehicle.profile.model,
      floorName: vehicle.floorName,
      floorId: vehicle.floorId,
      slotCode: vehicle.slotCode,
      weightKg: vehicle.profile.weightKg,
      heightMm: vehicle.profile.heightMm,
      durationMinutes: dur,
      currentFee,
      directions: [
        `1. Bulunduğunuz AI terminalinden Kat Asansörüne ilerleyin.`,
        `2. ${vehicle.floorName}'ne geçiş yapın.`,
        `3. Ana koridoru takip ederek [${vehicle.slotCode.split('-')[0]} Koridoru]'na dönün.`,
        `4. [${vehicle.slotCode}] numaralı park alanında aracınız hazır bekliyor.`
      ]
    };
  }

  // ══════════════════════════════════════════
  // ÜCRET & FİYATLANDIRMA
  // ══════════════════════════════════════════
  function calcFee(entry, exit) {
    const mins = (new Date(exit) - new Date(entry)) / 60000;
    if (mins <= 30) return 20;
    if (mins <= 60) return 40;
    return 40 + Math.ceil((mins - 60) / 60) * 20;
  }

  function vehicleExit(plate) {
    const db = getDB();
    plate = plate.toUpperCase().trim();
    const av = db.vehicles.find(v => v.plate === plate);
    if (!av) return { error: `Bu plaka otoparkta yok: ${plate}` };

    const now = new Date();
    const fee = calcFee(av.since, now.toISOString());
    const duration = Math.max(1, Math.round((now - new Date(av.since)) / 60000));

    const floor = db.floors.find(f => f.id === av.floorId);
    const slot = floor?.slots.find(s => s.id === av.slotId);
    if (slot) {
      slot.occupied = false;
      slot.plate = null;
      slot.since = null;
      slot.vehicleProfile = null;
      slot.confirmed = false;
    }

    db.vehicles = db.vehicles.filter(v => v.id !== av.id);
    db.history.unshift({
      plate,
      slotCode: av.slotCode,
      floorName: av.floorName,
      entry: av.since,
      exit: now.toISOString(),
      duration,
      fee: +fee.toFixed(2)
    });

    saveDB(db);
    return {
      success: true,
      plate,
      duration,
      fee: +fee.toFixed(2),
      message: `İyi yolculuklar! Park süresi: ${Math.floor(duration/60)}s ${duration%60}dk — Ücret: ₺${fee.toFixed(2)}`
    };
  }

  // ══════════════════════════════════════════
  // İSTATİSTİKLER
  // ══════════════════════════════════════════
  function getStats() {
    const db = getDB();
    if (!db) return null;
    let totOcc = 0, totSlots = 0;
    const floors = db.floors.map(f => {
      const occ = f.slots.filter(s => s.occupied).length;
      totOcc += occ;
      totSlots += f.slots.length;
      return {
        id: f.id,
        name: f.name,
        total: f.slots.length,
        occupied: occ,
        available: f.slots.length - occ,
        pct: Math.round(occ / f.slots.length * 100),
        maxHeightMm: f.maxHeightMm,
        maxWeightKg: f.maxWeightKg
      };
    });

    return {
      total: totSlots,
      occupied: totOcc,
      available: totSlots - totOcc,
      pct: Math.round(totOcc / totSlots * 100),
      active: db.vehicles.length,
      floors,
      gates: db.gates,
      blacklistCount: (db.blacklist || []).length
    };
  }

  function onUpdate(callback) {
    try {
      const ch = new BroadcastChannel(CH);
      ch.onmessage = e => { if (e.data?.type === 'db_update') callback(); };
    } catch (_) {}
    window.addEventListener('storage', e => { if (e.key === DB_KEY) callback(); });
  }

  function getSession() { try { return JSON.parse(localStorage.getItem(SES_KEY)); } catch { return null; } }
  function setSession(u) { localStorage.setItem(SES_KEY, JSON.stringify(u)); }
  function clearSession() { localStorage.removeItem(SES_KEY); }

  function simReset() {
    initDB(true);
    try {
      const ch = new BroadcastChannel(CH);
      ch.postMessage({ type: 'db_update' });
      ch.close();
    } catch (_) {}
  }

  function clearAll() {
    const db = getDB();
    db.vehicles = [];
    db.floors.forEach(f => f.slots.forEach(s => {
      s.occupied = false;
      s.plate = null;
      s.since = null;
      s.vehicleProfile = null;
      s.confirmed = false;
    }));
    saveDB(db);
  }

  return {
    VEHICLE_CATALOG,
    initDB, getDB, saveDB, getStats,
    processGateEntry, confirmSlotSensors, findMyCarKiosk,
    vehicleExit, calcFee,
    generateSecureToken, verifySecureToken,
    getSession, setSession, clearSession,
    simReset, clearAll, onUpdate
  };
})();

SP.initDB();
