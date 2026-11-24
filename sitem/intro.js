/**
 * EGE BARAN — 3D SİNEMATİK AÇILIŞ DENEYİMİ (THREE.JS WEBGL INTRO)
 * Karakter: 3D Maskot Baykuş Barnaby
 * Özellikler: Gerçekçi tüy detayları, 3D göz kırpma, dinamik kanat aerodinamiği,
 *             sinematik 4 noktalı ışıklandırma, parçacık alanı ve ekranı kaplayan kanat geçişi.
 */

(function () {
  'use strict';

  // 1. Hareketi Azaltma Tercihi Kontrolü (prefers-reduced-motion)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.getElementById('introOverlay');

  if (prefersReducedMotion) {
    if (overlay) overlay.remove();
    document.body.classList.remove('intro-active');
    return;
  }

  // Sayfayı başlangıçta kaydırmaya karşı kitle
  document.body.classList.add('intro-active');

  const canvas = document.getElementById('threeCanvas');
  const progressBar = document.getElementById('introProgressFill');
  const percentageEl = document.getElementById('introPercentage');
  const statusTextEl = document.getElementById('introStatusText');
  const skipBtn = document.getElementById('introSkipBtn');

  if (!canvas || typeof THREE === 'undefined') {
    // Three.js yüklenemezse güvenli geri dönüş
    if (overlay) overlay.remove();
    document.body.classList.remove('intro-active');
    return;
  }

  let isDismissed = false;
  let animId = null;

  /* ==========================================================================
     2. THREE.JS SAHNE, KAMERA VE RENDERER KURULUMU
     ========================================================================== */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x141210, 0.022);

  const camera = new THREE.PerspectiveCamera(
    42,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 7.8);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ==========================================================================
     3. SİNEMATİK PİXAR TARZI IŞIKLANDIRMA (AYDINLIK VE CANLI)
     ========================================================================== */
  // Sıcak Ortam Işığı (Karakterin gölgede bile sıcacık karamel/krem kalmasını sağlar)
  const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.45);
  scene.add(ambientLight);

  // Ana Işık (Key Light - Sıcak gün ışığı)
  const keyLight = new THREE.DirectionalLight(0xfffaed, 2.4);
  keyLight.position.set(-3.5, 5.5, 6.0);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.001;
  scene.add(keyLight);

  // Güçlü Altın Kenar Işığı (Rim Light - Baykuşun tüm tüylerini arkadan ışıl ışıl ayırır)
  const rimLight = new THREE.DirectionalLight(0xffd899, 3.8);
  rimLight.position.set(4.5, 4.2, -5.2);
  scene.add(rimLight);

  // Alttan ve Önden Sıcak Doldurma Işığı (Fill Light - Göğüs ve ayakları aydınlatır)
  const fillLight = new THREE.DirectionalLight(0xffa866, 1.25);
  fillLight.position.set(0, -4.2, 4.5);
  scene.add(fillLight);

  // Göz Pırıltısı Nokta Işığı (Eye Specular Catchlight - Gözlerde büyüleyici çift ışıltı)
  const eyeCatchLight = new THREE.PointLight(0xffffff, 2.2, 7.5);
  eyeCatchLight.position.set(0, 1.25, 3.2);
  scene.add(eyeCatchLight);

  /* ==========================================================================
     4. PROSEDÜREL DOKU ÜRETİCİLERİ (SICAK KAHVERENGİ, KARAMEL VE ALTIN TONLARI)
     ========================================================================== */
  // Kanat Tüyü Dokusu (Sıcak kestane, karamel ve açık bej uçlu detaylı tüy dokusu)
  function createFeatherTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 256;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');

    ctx.clearRect(0, 0, 256, 512);

    // Tüy ana gövde silüeti
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(128, 256, 102, 240, 0, 0, Math.PI * 2);
    ctx.clip();

    // Sıcak kahverengi ve karamel degrade
    const grad = ctx.createLinearGradient(0, 0, 256, 512);
    grad.addColorStop(0, '#B87333');    // Bakır karamel uç
    grad.addColorStop(0.3, '#935116');  // Sıcak fındık kabuğu
    grad.addColorStop(0.7, '#6E3A0F');  // Zengin kestane
    grad.addColorStop(1, '#4A2508');    // Koyu çikolata kök
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Tüy ucunda yumuşak bej/krem aydınlığı
    const tipGrad = ctx.createRadialGradient(128, 40, 5, 128, 50, 95);
    tipGrad.addColorStop(0, 'rgba(255, 248, 230, 0.55)');
    tipGrad.addColorStop(1, 'rgba(255, 248, 230, 0)');
    ctx.fillStyle = tipGrad;
    ctx.fillRect(0, 0, 256, 150);

    // Tüy yan saçakları (Micro-barbs) - sıcak altın ve krem tonlarında
    ctx.lineWidth = 1.3;
    for (let y = 30; y < 490; y += 3.5) {
      const angle = (y / 512) * 0.42 + 0.35;
      ctx.strokeStyle = Math.random() > 0.45 
        ? 'rgba(255, 235, 195, 0.38)' 
        : 'rgba(90, 45, 12, 0.42)';

      // Sol saçaklar
      ctx.beginPath();
      ctx.moveTo(128, y);
      ctx.lineTo(24, y + Math.tan(angle) * 78);
      ctx.stroke();

      // Sağ saçaklar
      ctx.beginPath();
      ctx.moveTo(128, y);
      ctx.lineTo(232, y + Math.tan(angle) * 78);
      ctx.stroke();
    }

    // Tüy sapı (Rachis) - sıcak kemik / fildişi
    const shaftGrad = ctx.createLinearGradient(0, 0, 0, 512);
    shaftGrad.addColorStop(0, '#FFF5E0');
    shaftGrad.addColorStop(0.5, '#D4A373');
    shaftGrad.addColorStop(1, '#7A431D');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(125, 20, 6, 480);

    ctx.restore();

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  // Gövde Tüy Dokusu (Sıcak kahverengi ve karamel balıksırtı tüy pulları)
  function createPlumageTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');

    // Sıcak karamel taban
    ctx.fillStyle = '#8B4E1F';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 12;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (cellW / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * cellW + offsetX;
        const y = r * cellH;

        ctx.beginPath();
        ctx.arc(x + cellW / 2, y + cellH / 2, cellW * 0.56, 0, Math.PI);

        // Sıcak karamel, bal ve açık bej ton geçişleri
        const tone = (r + c) % 3;
        ctx.fillStyle = tone === 0 ? '#A8642D' : (tone === 1 ? '#96521E' : '#7D4014');
        ctx.fill();

        // Yumuşak bej tüy kenar ışıltısı
        ctx.strokeStyle = 'rgba(255, 240, 215, 0.3)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // Göz İris Dokusu (Büyük, parlak kehribar ve parıldayan altın tonları)
  function createIrisTexture() {
    const cvs = document.createElement('canvas');
    cvs.width = 512;
    cvs.height = 512;
    const ctx = cvs.getContext('2d');

    const cx = 256;
    const cy = 256;

    // Dış sıcak koyu kahve / kehribar sınır halkası
    ctx.fillStyle = '#3D1E05';
    ctx.fillRect(0, 0, 512, 512);

    // Parlak altın ve kehribar radyal gradyanı
    const irisGrad = ctx.createRadialGradient(cx, cy, 38, cx, cy, 236);
    irisGrad.addColorStop(0, '#8A3B00');   // İç sıcak kehribar
    irisGrad.addColorStop(0.25, '#FF8F00'); // Canlı kehribar turuncu
    irisGrad.addColorStop(0.55, '#FFB300'); // Zengin parlak altın sarısı
    irisGrad.addColorStop(0.82, '#FFCA28'); // Işıltılı güneş altını
    irisGrad.addColorStop(0.96, '#E65100'); // Dış sınır kehribarı
    irisGrad.addColorStop(1, '#2E1502');    // İnce dış kontrast halka
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 236, 0, Math.PI * 2);
    ctx.fill();

    // Parlak altın ve güneş ışını lifleri
    for (let a = 0; a < Math.PI * 2; a += 0.012) {
      const length = 115 + Math.random() * 95;
      const x2 = cx + Math.cos(a) * length;
      const y2 = cy + Math.sin(a) * length;

      ctx.strokeStyle = Math.random() > 0.35 
        ? 'rgba(255, 248, 190, 0.8)' 
        : 'rgba(235, 110, 0, 0.65)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 55, cy + Math.sin(a) * 55);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Merkez derin siyah göz bebeği (Pupil - yalnızca küçük detay)
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.arc(cx, cy, 70, 0, Math.PI * 2);
    ctx.fill();

    // İris içi minik parlama halkası
    ctx.strokeStyle = 'rgba(255, 235, 150, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 142, 0, Math.PI * 2);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(cvs);
    return tex;
  }

  const featherTex = createFeatherTexture();
  const plumageTex = createPlumageTexture();
  const irisTex = createIrisTexture();

  /* ==========================================================================
     5. 3D BAYKUŞ BARNABY MODELİNİN İNŞASI (PİXAR KALİTESİNDE SICAK RENKLER)
     ========================================================================== */
  const owlRoot = new THREE.Group();
  scene.add(owlRoot);

  // Sıcak Kahverengi & Karamel Gövde Materyali
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x9c5927,
    roughness: 0.68,
    metalness: 0.04,
    map: plumageTex
  });

  // Açık Krem Göğüs & Karın Materyali
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xfff8ed,
    roughness: 0.72,
    metalness: 0.02
  });

  // Sıcak Kahverengi Kanat Tüyü Materyali
  const featherMat = new THREE.MeshStandardMaterial({
    map: featherTex,
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide,
    roughness: 0.58,
    metalness: 0.05
  });

  // Canlı Sıcak Turuncu Gaga Materyali
  const beakMat = new THREE.MeshStandardMaterial({
    color: 0xff7a00,
    roughness: 0.22,
    metalness: 0.04
  });

  // Canlı Sıcak Turuncu Ayak Materyali
  const footMat = new THREE.MeshStandardMaterial({
    color: 0xee6800,
    roughness: 0.35,
    metalness: 0.02
  });

  // Kristal Berraklığında Göz Kornea Tabakası (Cam parlaklığı)
  const corneaMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.45,
    roughness: 0.02,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02
  });

  // 5.1 GÖVDE (Body)
  const bodyGroup = new THREE.Group();
  owlRoot.add(bodyGroup);

  const torsoGeo = new THREE.SphereGeometry(1.22, 32, 28);
  torsoGeo.scale(1.0, 1.28, 0.95);
  const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  bodyGroup.add(torsoMesh);

  // Göğüs / Karın Açık Krem Tüy Katmanı
  const bellyGeo = new THREE.SphereGeometry(1.02, 32, 24);
  bellyGeo.scale(0.88, 1.05, 0.42);
  const bellyMesh = new THREE.Mesh(bellyGeo, bellyMat);
  bellyMesh.position.set(0, -0.12, 0.58);
  bellyMesh.receiveShadow = true;
  bodyGroup.add(bellyMesh);

  // Göğüs Üzerindeki Açık Krem 3D Tekil Tüy Pulları
  const chestFeatherMat = new THREE.MeshStandardMaterial({
    color: 0xfffaee,
    roughness: 0.7,
    side: THREE.DoubleSide
  });

  for (let r = 0; r < 4; r++) {
    const rowY = 0.25 - r * 0.22;
    const count = 4 - (r === 3 ? 1 : 0);
    for (let c = 0; c < count; c++) {
      const angle = (c - (count - 1) / 2) * 0.32;
      const featherScale = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32, 0.28),
        chestFeatherMat
      );
      featherScale.position.set(
        Math.sin(angle) * 0.65,
        rowY,
        0.88 - Math.abs(angle) * 0.25
      );
      featherScale.rotation.x = 0.25;
      featherScale.rotation.y = angle * 0.6;
      bodyGroup.add(featherScale);
    }
  }

  // 5.2 BAŞ (Head Group)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0.12);
  owlRoot.add(headGroup);

  const headGeo = new THREE.SphereGeometry(1.12, 32, 28);
  headGeo.scale(1.16, 1.04, 1.05);
  const headMesh = new THREE.Mesh(headGeo, bodyMat);
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // Yüz Çevresi: Krem ve Açık Bej Çanak Maske (Facial Disc)
  const facialDiscGeo = new THREE.CircleGeometry(0.55, 32);
  const facialDiscMat = new THREE.MeshStandardMaterial({
    color: 0xfff6eb,
    roughness: 0.78,
    side: THREE.DoubleSide
  });

  const discLeft = new THREE.Mesh(facialDiscGeo, facialDiscMat);
  discLeft.position.set(-0.46, 0.12, 0.96);
  discLeft.rotation.y = 0.12;
  headGroup.add(discLeft);

  const discRight = new THREE.Mesh(facialDiscGeo, facialDiscMat);
  discRight.position.set(0.46, 0.12, 0.96);
  discRight.rotation.y = -0.12;
  headGroup.add(discRight);

  // Kulak Tüyleri (Sıcak Karamel ve Açık Uçlu Ear Tufts)
  function createEarTuft(isRight) {
    const group = new THREE.Group();
    const tuftCount = 4;
    for (let i = 0; i < tuftCount; i++) {
      const tuft = new THREE.Mesh(
        new THREE.PlaneGeometry(0.32 - i * 0.04, 0.7 - i * 0.08),
        featherMat
      );
      tuft.position.set((isRight ? 1 : -1) * i * 0.06, i * 0.12, i * 0.02);
      tuft.rotation.z = (isRight ? -1 : 1) * (0.35 + i * 0.08);
      tuft.rotation.y = (isRight ? -1 : 1) * 0.2;
      group.add(tuft);
    }
    return group;
  }

  const earLeft = createEarTuft(false);
  earLeft.position.set(-0.65, 0.88, 0.1);
  headGroup.add(earLeft);

  const earRight = createEarTuft(true);
  earRight.position.set(0.65, 0.88, 0.1);
  headGroup.add(earRight);

  // Turuncu Canlı Gaga (Beak)
  const beakGeo = new THREE.ConeGeometry(0.18, 0.52, 16);
  beakGeo.rotateX(Math.PI * 0.55);
  const beakMesh = new THREE.Mesh(beakGeo, beakMat);
  beakMesh.position.set(0, -0.06, 1.25);
  beakMesh.scale.set(0.85, 1.1, 1.2);
  beakMesh.castShadow = true;
  headGroup.add(beakMesh);

  // 5.3 BÜYÜK, PARLAK KEHRİBAR & ALTIN GÖZLER VE 3D GÖZ KAPAKLARI
  const eyeSockets = [];
  const eyelids = [];

  function createEye(isRight) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set((isRight ? 1 : -1) * 0.46, 0.12, 0.98);

    // Göz çerçevesi (Sıcak fındık/karamel halka)
    const ringGeo = new THREE.TorusGeometry(0.34, 0.055, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x5c3317,
      roughness: 0.45
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    eyeGroup.add(ringMesh);

    // Parlak Altın-Kehribar İris
    const irisMat = new THREE.MeshStandardMaterial({
      map: irisTex,
      roughness: 0.15,
      metalness: 0.1
    });
    const irisGeo = new THREE.CircleGeometry(0.32, 32);
    const irisMesh = new THREE.Mesh(irisGeo, irisMat);
    irisMesh.position.z = 0.02;
    eyeGroup.add(irisMesh);

    // Kornea (Cam küre parlaklığı)
    const corneaGeo = new THREE.SphereGeometry(0.33, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const corneaMesh = new THREE.Mesh(corneaGeo, corneaMat);
    corneaMesh.position.z = 0.02;
    eyeGroup.add(corneaMesh);

    // 3D Küresel Göz Kapağı (Sıcak karamel tonlarında, doğal kırpma)
    const eyelidPivot = new THREE.Group();
    eyelidPivot.position.set(0, 0, 0);

    const lidGeo = new THREE.SphereGeometry(0.355, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
    const lidMat = new THREE.MeshStandardMaterial({
      color: 0x8c4f27,
      roughness: 0.72,
      side: THREE.DoubleSide
    });
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.rotation.x = Math.PI; // Başlangıçta gözü örtecek şekilde ters
    eyelidPivot.add(lidMesh);

    eyeGroup.add(eyelidPivot);
    eyelids.push(eyelidPivot);
    eyeSockets.push(eyeGroup);

    return eyeGroup;
  }

  const eyeLeft = createEye(false);
  const eyeRight = createEye(true);
  headGroup.add(eyeLeft);
  headGroup.add(eyeRight);

  // 5.4 İKİ EKLEMLİ GERÇEKÇİ KANATLAR (2-Joint Dynamic Wings)
  function createWing(isRight) {
    const wingPivot = new THREE.Group();
    wingPivot.position.set((isRight ? 1 : -1) * 1.05, 0.55, -0.15);

    // Omuz / Üst Kol Grubu
    const armGroup = new THREE.Group();
    wingPivot.add(armGroup);

    // Ön Kol Grubu (Elbow Pivot)
    const forearmGroup = new THREE.Group();
    forearmGroup.position.set((isRight ? 1 : -1) * 0.85, -0.1, -0.05);
    armGroup.add(forearmGroup);

    // Birincil Uçuş Tüyleri (Primaries - Uzun kavisli tüyler)
    const primaryFeathers = [];
    const pCount = 9;
    for (let i = 0; i < pCount; i++) {
      const fGeo = new THREE.PlaneGeometry(0.38, 1.45 - i * 0.06);
      fGeo.translate(0, -0.65, 0);
      const feather = new THREE.Mesh(fGeo, featherMat);
      feather.castShadow = true;

      const spread = (i / (pCount - 1)) * 0.95 - 0.45;
      feather.position.set(
        (isRight ? 1 : -1) * (i * 0.16 + 0.2),
        -i * 0.05,
        -i * 0.04
      );
      feather.rotation.z = (isRight ? -1 : 1) * (0.45 + spread);
      feather.rotation.y = (isRight ? -1 : 1) * 0.18;
      forearmGroup.add(feather);
      primaryFeathers.push(feather);
    }

    // İkincil Örtü Tüyleri (Secondaries - Omuzdan çıkan destek tüyleri)
    const sCount = 6;
    for (let j = 0; j < sCount; j++) {
      const sGeo = new THREE.PlaneGeometry(0.34, 1.0 - j * 0.05);
      sGeo.translate(0, -0.45, 0);
      const sFeather = new THREE.Mesh(sGeo, featherMat);

      sFeather.position.set(
        (isRight ? 1 : -1) * (j * 0.14 + 0.1),
        -j * 0.04,
        0.05 - j * 0.02
      );
      sFeather.rotation.z = (isRight ? -1 : 1) * (0.25 + j * 0.08);
      armGroup.add(sFeather);
    }

    return {
      pivot: wingPivot,
      arm: armGroup,
      forearm: forearmGroup,
      feathers: primaryFeathers,
      isRight: isRight
    };
  }

  const wingLeft = createWing(false);
  const wingRight = createWing(true);
  owlRoot.add(wingLeft.pivot);
  owlRoot.add(wingRight.pivot);

  // 5.5 KUYRUK (Tail)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, -0.95, -0.75);
  for (let k = -2; k <= 2; k++) {
    const tGeo = new THREE.PlaneGeometry(0.36, 1.1);
    tGeo.translate(0, -0.45, 0);
    const tailFeather = new THREE.Mesh(tGeo, featherMat);
    tailFeather.position.set(k * 0.15, 0, -Math.abs(k) * 0.05);
    tailFeather.rotation.x = -0.55;
    tailFeather.rotation.z = k * 0.12;
    tailGroup.add(tailFeather);
  }
  owlRoot.add(tailGroup);

  // 5.6 PENÇELER (Canlı Sıcak Turuncu Ayaklar)
  function createFoot(isRight) {
    const foot = new THREE.Group();
    foot.position.set((isRight ? 1 : -1) * 0.38, -1.25, 0.45);
    for (let t = -1; t <= 1; t++) {
      const toeGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.35, 12);
      toeGeo.rotateX(Math.PI * 0.35);
      const toe = new THREE.Mesh(toeGeo, footMat);
      toe.position.set(t * 0.12, 0, t * 0.04);
      toe.castShadow = true;
      foot.add(toe);
    }
    return foot;
  }
  owlRoot.add(createFoot(false));
  owlRoot.add(createFoot(true));

  /* ==========================================================================
     6. SİNEMATİK 3D PARÇACIK ALANI (SICAK ALTIN KIVILCIMLAR / EMBER PARTICLES)
     ========================================================================== */
  const particleCount = 140;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  const particleVelocities = [];

  for (let p = 0; p < particleCount; p++) {
    particlePositions[p * 3] = (Math.random() - 0.5) * 16;
    particlePositions[p * 3 + 1] = (Math.random() - 0.5) * 12;
    particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 10 - 1;

    particleVelocities.push({
      y: Math.random() * 0.018 + 0.008,
      x: (Math.random() - 0.5) * 0.006,
      rot: Math.random() * 0.02
    });
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0xffd9a6,
    size: 0.15,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });

  const particleField = new THREE.Points(particleGeo, particleMat);
  scene.add(particleField);

  /* ==========================================================================
     7. ETKİLEŞİM VE FARE TAKİBİ (INTERACTIVE 3D HEAD LOOK-AT)
     ========================================================================== */
  let mouseX = 0;
  let mouseY = 0;
  let targetHeadRotY = 0;
  let targetHeadRotX = 0;

  function onMouseMove(e) {
    if (isDismissed) return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX = (e.clientX - cx) / cx;
    mouseY = (e.clientY - cy) / cy;
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize, { passive: true });

  /* ==========================================================================
     8. ANİMASYON ZAMAN ÇİZELGESİ VE KUŞ UÇUŞ FİZİĞİ (CHOREOGRAPHY)
     Toplam süre: ~3.8 saniye
     ========================================================================== */
  const duration = 3800; // ms
  const startTime = performance.now();

  // Kanat Çırpma Fonksiyonu
  function applyWingFlap(wing, flapPhase, intensity, spreadFactor) {
    const sign = wing.isRight ? -1 : 1;

    // Omuz hareketi
    wing.pivot.rotation.z = sign * (0.2 + Math.sin(flapPhase) * 0.85 * intensity + spreadFactor * 0.4);
    wing.pivot.rotation.x = Math.cos(flapPhase) * 0.4 * intensity;
    wing.pivot.rotation.y = sign * (Math.sin(flapPhase) * 0.35 * intensity);

    // Ön kol esnemesi (Gerçekçi faz gecikmesi)
    wing.forearm.rotation.z = sign * (0.25 + Math.sin(flapPhase - 0.45) * 0.55 * intensity);
    wing.forearm.rotation.x = Math.cos(flapPhase - 0.3) * 0.3 * intensity;
  }

  function tick(now) {
    if (isDismissed) return;

    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const percentage = Math.floor(progress * 100);

    // UI Güncelleme
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (percentageEl) percentageEl.textContent = `${percentage < 10 ? '0' : ''}${percentage}%`;

    // Parçacıkları yukarı doğru yüzdür
    const posAttr = particleGeo.attributes.position;
    for (let p = 0; p < particleCount; p++) {
      let py = posAttr.getY(p) + particleVelocities[p].y;
      if (py > 7) py = -7;
      posAttr.setY(p, py);
      posAttr.setX(p, posAttr.getX(p) + particleVelocities[p].x);
    }
    posAttr.needsUpdate = true;

    // Fare takibi pürüzsüzleştirme (Lerp)
    targetHeadRotY += (mouseX * 0.45 - targetHeadRotY) * 0.08;
    targetHeadRotX += (-mouseY * 0.35 - targetHeadRotX) * 0.08;

    // === FAZLAR ===

    // FAZ 0 (0.0s – 1.3s): Havalanma ve Kameraya Yükseliş
    if (progress < 0.35) {
      const pNorm = progress / 0.35;
      if (statusTextEl) statusTextEl.textContent = 'Barnaby Havalanıyor...';

      // Derinlikten ve aşağıdan kameraya doğru yükselir
      owlRoot.position.z = -5.5 + pNorm * 6.0; // -5.5 -> 0.5
      owlRoot.position.y = -3.0 + Math.sin(pNorm * Math.PI * 0.5) * 3.1; // -3.0 -> 0.1
      owlRoot.rotation.x = 0.35 * (1 - pNorm);

      // Güçlü kanat çırpışları (~3 Hz)
      const flapPhase = (elapsed / 1000) * Math.PI * 5.5;
      applyWingFlap(wingLeft, flapPhase, 1.0, 0);
      applyWingFlap(wingRight, flapPhase, 1.0, 0);

      // Gözler başlangıçta yarı kapalı, yükseldikçe açılır
      const lidAngle = (1 - pNorm) * 1.8;
      eyelids.forEach(lid => (lid.rotation.x = Math.min(Math.PI, lidAngle)));

      // Kulak tüyleri rüzgarla titreşir
      earLeft.rotation.z = Math.sin(flapPhase * 2) * 0.15;
      earRight.rotation.z = -Math.sin(flapPhase * 2) * 0.15;
    }
    // FAZ 1 (1.3s – 2.3s): Kameraya Yaklaşma, Süzülme ve Merak
    else if (progress < 0.62) {
      const pNorm = (progress - 0.35) / 0.27;
      if (statusTextEl) statusTextEl.textContent = 'Kanatlar Açılıyor & Rota Taranıyor...';

      owlRoot.position.z = 0.5 + pNorm * 0.6; // 0.5 -> 1.1
      owlRoot.position.y = 0.1 + Math.sin(pNorm * Math.PI) * 0.22;

      // Yumuşak süzülme ve kanat dalgalanması
      const glidePhase = (elapsed / 1000) * Math.PI * 2.2;
      applyWingFlap(wingLeft, glidePhase, 0.45, 0.35);
      applyWingFlap(wingRight, glidePhase, 0.45, 0.35);

      // Meraklı baş hareketi (Owl curiosity tilt)
      const curiosityTilt = Math.sin(pNorm * Math.PI * 2) * 0.22;
      headGroup.rotation.z = curiosityTilt + targetHeadRotY * 0.3;
      headGroup.rotation.y = targetHeadRotY;
      headGroup.rotation.x = targetHeadRotX;

      // Gözler tamamen açık
      eyelids.forEach(lid => (lid.rotation.x = 0));
    }
    // FAZ 2 (2.3s – 3.0s): Doğrudan Bakış ve Karizmatik Göz Kırpma
    else if (progress < 0.82) {
      const pNorm = (progress - 0.62) / 0.20;
      if (statusTextEl) statusTextEl.textContent = 'Keşif Kapıları Açılıyor...';

      owlRoot.position.z = 1.1;
      owlRoot.position.y = 0.1 + Math.sin((elapsed / 1000) * 3) * 0.05;

      // Havada asılı kalma (Hover)
      const hoverPhase = (elapsed / 1000) * Math.PI * 3.5;
      applyWingFlap(wingLeft, hoverPhase, 0.35, 0.5);
      applyWingFlap(wingRight, hoverPhase, 0.35, 0.5);

      headGroup.rotation.z = targetHeadRotY * 0.25;
      headGroup.rotation.y = targetHeadRotY;
      headGroup.rotation.x = targetHeadRotX;

      // Çift Göz Kırpma (Blink)
      let blinkAngle = 0;
      if (pNorm > 0.25 && pNorm < 0.55) {
        // İlk kırpma
        blinkAngle = Math.sin((pNorm - 0.25) / 0.3 * Math.PI) * Math.PI * 0.95;
      } else if (pNorm > 0.65 && pNorm < 0.88) {
        // İkinci hızlı kırpma
        blinkAngle = Math.sin((pNorm - 0.65) / 0.23 * Math.PI) * Math.PI * 0.8;
      }
      eyelids.forEach(lid => (lid.rotation.x = blinkAngle));
    }
    // FAZ 3 (3.0s – 3.8s): Kanatları Açarak Ekranı Kaplama & Geçiş (Screen-Cover Finale)
    else {
      const pNorm = (progress - 0.82) / 0.18;
      if (statusTextEl) statusTextEl.textContent = 'Rota Hazır — Hoş Geldiniz';

      // Baykuş devasa kanatlarını iki yana ardına kadar açar ve kameraya doğru hızla uçar
      const expandFactor = pNorm * 1.8;

      // Sol ve sağ kanatları devasa açıyla aç
      wingLeft.pivot.rotation.z = 1.4 + expandFactor * 0.6;
      wingLeft.pivot.rotation.y = 0.6 + expandFactor * 0.4;
      wingLeft.pivot.rotation.x = -0.2;
      wingLeft.forearm.rotation.z = 0.9 + expandFactor * 0.5;

      wingRight.pivot.rotation.z = -1.4 - expandFactor * 0.6;
      wingRight.pivot.rotation.y = -0.6 - expandFactor * 0.4;
      wingRight.pivot.rotation.x = -0.2;
      wingRight.forearm.rotation.z = -0.9 - expandFactor * 0.5;

      // Kameraya doğru atılış (Ekranı kanat tüyleri kaplar)
      owlRoot.position.z = 1.1 + pNorm * 5.2; // 1.1 -> 6.3 (Kameranın tam önüne geçer)
      owlRoot.position.y = 0.1 - pNorm * 0.4;

      eyelids.forEach(lid => (lid.rotation.x = 0));
    }

    renderer.render(scene, camera);

    if (progress < 1) {
      animId = requestAnimationFrame(tick);
    } else {
      // Tamamlandı: ana sayfaya yumuşak geçiş
      setTimeout(dismissIntro, 120);
    }
  }

  animId = requestAnimationFrame(tick);

  /* ==========================================================================
     9. YUMUŞAK GEÇİŞ VE ÇIKIŞ (SEAMLESS REVEAL TRANSITION)
     ========================================================================== */
  function dismissIntro() {
    if (isDismissed) return;
    isDismissed = true;

    if (progressBar) progressBar.style.width = '100%';
    if (percentageEl) percentageEl.textContent = '100%';
    if (statusTextEl) statusTextEl.textContent = 'Rota Hazır — Hoş Geldiniz';

    if (overlay) {
      overlay.classList.add('intro-fade-out');

      // Animasyon tamamlandığında DOM'u temizle ve kaynakları serbest bırak
      setTimeout(() => {
        overlay.style.display = 'none';
        document.body.classList.remove('intro-active');

        if (animId) cancelAnimationFrame(animId);

        // WebGL bellek temizliği
        featherTex.dispose();
        plumageTex.dispose();
        irisTex.dispose();
        renderer.dispose();

        // Navbar'daki maskota selamlama hareketi
        const navOwl = document.querySelector('.owl-svg-icon');
        if (navOwl) {
          navOwl.style.transform = 'scale(1.22) rotate(-8deg)';
          setTimeout(() => {
            navOwl.style.transform = '';
          }, 450);
        }
      }, 700);
    } else {
      document.body.classList.remove('intro-active');
    }
  }

  // "GEÇ →" Butonu Etkileşimi
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Anında kanat açılışını tetikle ve kapat
      dismissIntro();
    });
  }
})();