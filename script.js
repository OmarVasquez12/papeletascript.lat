// =============================================
//          PROTECCIÓN ANTI-SPAM / RATE LIMITING (ANTI-DDoS APP)
// =============================================
const _rateLimits = {};

function checkRateLimit(action, limitMs = 1000) {
    const now = Date.now();
    if (_rateLimits[action] && (now - _rateLimits[action]) < limitMs) {
        console.warn(`[Papeleta] Rate limit exceeded for: ${action}`);
        return false; // Bloquea la acción
    }
    _rateLimits[action] = now;
    return true; // Permite la acción
}

// Sobrescribir fetch para proteger Webhooks y API
const _originalFetch = window.fetch;
window.fetch = async function(url, options) {
    // Proteger endpoints sensibles
    if (url.includes('discord.com/api/webhooks') || url.includes('api.telegram.org')) {
        if (!checkRateLimit('webhook', 2000)) {
            console.warn('[Papeleta] Webhook spam detectado y bloqueado.');
            return Promise.resolve(new Response(null, { status: 429 }));
        }
    }
    // Proteger llamadas a Firebase (escritura)
    if (options && options.method === 'POST' && url.includes('firestore.googleapis.com')) {
        if (!checkRateLimit('firebase_write', 800)) {
            console.warn('[Papeleta] Escritura masiva a Firebase bloqueada.');
            return Promise.resolve(new Response(null, { status: 429 }));
        }
    }
    return _originalFetch.apply(this, arguments);
};

// =============================================
//          CONFIGURACIÓN TELEGRAM
// =============================================
const TELEGRAM_BOT_TOKEN = "TU_BOT_TOKEN_AQUI"; 
const TELEGRAM_CHAT_ID = "TU_CHAT_ID_AQUI";     

async function sendTelegramNotification(message) {
    if (TELEGRAM_BOT_TOKEN === "TU_BOT_TOKEN_AQUI") return;
    
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Error enviando notificación a Telegram:', error);
    }
}

// =============================================
//          BLOQUEO DEVTOOLS MEJORADO (NATIVO)
// =============================================

// 1. Detección por Debugger Loop Ofuscado
(function() {
    const _0x5f2a = ['log', 'warn', 'error', 'info', 'debug'];
    _0x5f2a.forEach(m => {
        const orig = console[m];
        console[m] = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('Papeleta')) {
                return; // Permitir logs internos
            }
            orig.apply(console, args);
        };
    });

    setInterval(() => {
        const _start = performance.now();
        debugger; // Esto pausará la ejecución si DevTools está abierto
        const _end = performance.now();
        
        if ((_end - _start) > 100) {
            document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#f00;font-size:48px;text-align:center;padding-top:30vh;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;"><h1>ACCESO DENEGADO</h1><p>Herramientas de desarrollador detectadas.</p></div>';
            setTimeout(() => location.reload(), 2000);
        }
    }, 500);
})();

// 2. Detección por Tamaño de Ventana
setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
        document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#f00;font-size:48px;text-align:center;padding-top:30vh;z-index:99999;">DEVTOOLS DETECTADO<br>ACCESO BLOQUEADO</div>';
        setTimeout(() => location.reload(), 2000);
    }
}, 1000);

// 3. Bloqueo de Atajos de Teclado
document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) { 
        e.preventDefault(); 
        showDevWarning(); 
        return false; 
    }
    // Ctrl+Shift+I/J/C
    if (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) { 
        e.preventDefault(); 
        showDevWarning(); 
        return false; 
    }
    // Ctrl+U (Ver código fuente)
    if (e.ctrlKey && e.key.toLowerCase() === 'u') { 
        e.preventDefault(); 
        showDevWarning(); 
        return false; 
    }
    // Ctrl+S (Guardar página)
    if (e.ctrlKey && e.key.toLowerCase() === 's') { 
        e.preventDefault(); 
        showDevWarning(); 
        return false; 
    }
}, true);

function showDevWarning() {
    openPapeletaModal('PROHIBIDO', false, null, '', 'Esta funcion esta bloqueada por (PapeletaProgrmado)');
}

// Deshabilitar menú contextual (Click derecho)
document.addEventListener('contextmenu', e => e.preventDefault());


// =============================================
//          PARTÍCULAS
// =============================================
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 26, 26, ${p.alpha})`;
            ctx.fill();
            
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(255, 26, 26, ${0.2 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(animate);
    }
    animate();
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// =============================================
//          DISCORD WEBHOOKS
// =============================================
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1515757678935277818/NUG-PKCejzXNcKwIF0WKvugQ0H30Usyumki75uGr1cLD8fllMY-Rd5HYGm_db2ZbFCxb";

async function sendDiscordNotification(tipo, licencia) {
    try {
        const colores = { 'creada': 0x00ff44, 'eliminada': 0xff1a1a };
        const emojis = { 'creada': '✅', 'eliminada': '🗑️' };
        const folderName = foldersData.find(f => f.id === (licencia.IDCARPETA || currentFolder))?.name || 'N/A';
        
        const embed = {
            title: `${emojis[tipo]} LICENCIA ${tipo.toUpperCase()}`,
            color: colores[tipo],
            fields: [
                { name: 'Recurso (Sistema)', value: licencia.resource || 'N/A', inline: true },
                { name: 'IP:PUERTO', value: `${licencia.ip || 'N/A'}:${licencia.port || 'N/A'}`, inline: true },
                { name: 'Usuario', value: licencia.user || 'N/A', inline: true },
                { name: 'Key', value: licencia.key ? `${licencia.key.substring(0, 12)}...` : 'N/A', inline: true },
                { name: 'Carpeta', value: folderName, inline: true },
                { name: 'Estado', value: licencia.active ? 'ACTIVA' : 'INACTIVA', inline: true }
            ],
            footer: {
                text: 'Papeleta Licencia System',
                icon_url: 'https://media.discordapp.net/attachments/1513192322467369131/1514838369513902263/PapeletaCompilador.png'
            },
            timestamp: new Date().toISOString()
        };
        
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) { console.error('Error Discord:', error); }
}

async function sendDiscordBulkDeleteNotification(cantidad) {
    try {
        const embed = {
            title: '️ LICENCIAS ELIMINADAS EN MASA',
            color: 0xff1a1a,
            description: `Se eliminaron **${cantidad}** licencia(s) simultáneamente`,
            fields: [
                { name: 'Resumen', value: `Total eliminadas: ${cantidad}`, inline: false },
                { name: 'Carpeta', value: currentFolder ? (foldersData.find(f => f.id === currentFolder)?.name || 'N/A') : 'N/A', inline: true }
            ],
            footer: {
                text: 'Papeleta Licencia System',
                icon_url: 'https://media.discordapp.net/attachments/1513192322467369131/1514838369513902263/PapeletaCompilador.png'
            },
            timestamp: new Date().toISOString()
        };
        
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) { console.error('Error Discord:', error); }
}

async function sendDiscordRoleChangeNotification(user, newRole) {
    try {
        const roleNames = {
            'admin': ' ADMINISTRADOR',
            'moderator': ' MODERADOR',
            'helper': ' PAPELETA USUARIO'
        };
        
        const embed = {
            title: '🔄 CAMBIO DE ROL',
            color: 0x5865F2,
            fields: [
                { name: 'Usuario', value: `${user.username} (${user.id})`, inline: false },
                { name: 'Nuevo Rol', value: roleNames[newRole] || newRole, inline: true }
            ],
            footer: {
                text: 'Papeleta Licencia System',
                icon_url: 'https://media.discordapp.net/attachments/1513192322467369131/1514838369513902263/PapeletaCompilador.png'
            },
            timestamp: new Date().toISOString()
        };
        
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) { console.error('Error:', error); }
}

// =============================================
//          GENERADOR DE SERIAL PC
// =============================================
async function generatePCSerial() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("SerialPC", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("SerialPC", 4, 17);
        
        const canvasFingerprint = canvas.toDataURL();
        
        let glVendor = "N/A";
        let glRenderer = "N/A";
        try {
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch (e) {}
        
        const systemData = {
            userAgent: navigator.userAgent,
            language: navigator.language || navigator.userLanguage,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            touchSupport: ('ontouchstart' in window) ? 'yes' : 'no',
            canvas: canvasFingerprint.substring(0, 100),
            webglVendor: glVendor,
            webglRenderer: glRenderer,
            cpuCores: navigator.hardwareConcurrency,
            ram: navigator.deviceMemory
        };
        
        const dataString = JSON.stringify(systemData);
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        const serialHex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
        const serialFormatted = `${serialHex.substring(0, 4)}-${serialHex.substring(4, 8)}-${navigator.hardwareConcurrency || '00'}${screen.width || '0000'}`;
        
        return { serial: serialFormatted, details: systemData };
    } catch (error) {
        console.error('Error generando serial PC:', error);
        return { serial: 'UNKNOWN-' + Date.now(), details: { error: error.message } };
    }
}

// =============================================
//          LOGIN DISCORD NOTIFICATION
// =============================================
const DISCORD_WEBHOOK_LOGIN = "https://discord.com/api/webhooks/1515883928517611631/kLucfuf8QAAI6Q_r5OZ0zIvBQZ3GmRrzXM73SXgE_By7xnDaDlvU4RkXm57pqETmrY9n";

async function sendDiscordLoginNotification(user, role, pcSerial) {
    try {
        const roleNames = {
            'admin': ' ADMINISTRADOR',
            'moderator': ' MODERADOR',
            'helper': ' PAPELETA USUARIO'
        };
        
        const avatarUrl = user.avatar 
            ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;
        
        const embed = {
            title: 'NUEVO INICIO DE SESION',
            color: 0x5865F2,
            thumbnail: { url: avatarUrl },
            fields: [
                { name: '👤 Usuario', value: `${user.username}#${user.discriminator || '0000'}\n<@${user.id}>`, inline: true },
                { name: ' ID', value: `\`${user.id}\``, inline: true },
                { name: ' Rol', value: roleNames[role] || role.toUpperCase(), inline: true },
                { name: '💻 Serial PC', value: `\`${pcSerial.serial}\``, inline: false },
                { name: '🌐 Navegador', value: `\`\`\`${navigator.userAgent.substring(0, 100)}...\`\`\``, inline: false },
                { name: '️ Sistema', value: `**SO:** ${pcSerial.details.platform}\n**CPU:** ${pcSerial.details.hardwareConcurrency} cores\n**RAM:** ${pcSerial.details.deviceMemory}GB\n**Pantalla:** ${pcSerial.details.screenResolution}`, inline: false }
            ],
            footer: {
                text: 'Papeleta License',
                icon_url: 'https://media.discordapp.net/attachments/1513192322467369131/1514838369513902263/PapeletaCompilador.png'
            },
            timestamp: new Date().toISOString()
        };
        
        await fetch(DISCORD_WEBHOOK_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) { console.error('Error login notification:', error); }
}

// =============================================
//          DISCORD OAUTH2
// =============================================
const DISCORD_CLIENT_ID = "1484013765878878378";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "identify";
const ADMIN_ID = "890526767608127489";

let currentUser = null;
let authorizedUsers = [];

// =============================================
//          FIREBASE
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, deleteDoc, updateDoc, onSnapshot, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBzNb1fj_64JGMKAPkBWXXQxk9RizQUS-E",
    authDomain: "licenciapapeleta12.firebaseapp.com",
    projectId: "licenciapapeleta12",
    storageBucket: "licenciapapeleta12.firebasestorage.app",
    messagingSenderId: "467063297352",
    appId: "1:467063297352:web:67767e0cc51f0042fa4f7d",
    measurementId: "G-6LW8X0B2TH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let modalAction = null;
let licensesData = [];
let selectedLicenseIds = new Set();
let foldersData = [];
let linksData = [];
let currentFolder = '';
const MAX_FOLDERS = 5;
let foundUserData = null;

// =============================================
//          SISTEMA DE BAN
// =============================================
function showGlobalBanScreen() {
    document.body.innerHTML = `
        <div style="position:fixed; inset:0; background:linear-gradient(135deg, #1a0000, #000000); color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:999999; font-family:sans-serif; text-align:center;">
            <div style="font-size:8rem; margin-bottom:20px;"></div>
            <h1 style="color:#ff0000; font-size:3rem; margin-bottom:20px; text-shadow:0 0 20px rgba(255,0,0,0.5);">FUISTE BANEADO</h1>
            <p style="font-size:1.5rem; color:#ccc; max-width:600px; margin:20px;">Tu cuenta ha sido bloqueada por un administrador.</p>
            <div style="margin-top:40px; padding:20px; background:rgba(255,0,0,0.1); border:1px solid #ff0000; border-radius:10px;">
                <p style="color:#ff6666; font-size:0.9rem;">Contacta al administrador para más información.</p>
            </div>
        </div>
    `;
    throw new Error("Usuario Baneado");
}

async function checkBanStatus(userId) {
    if (!userId) return false;
    try {
        const userRef = doc(db, "usuarios", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.banned === true) {
                showGlobalBanScreen();
                return true;
            }
        }
    } catch (e) { console.error("Error verificando ban:", e); }
    return false;
}

function validateIPPort(ipPort) {
    if (!ipPort || typeof ipPort !== 'string') return false;
    const parts = ipPort.trim().split(':');
    if (parts.length !== 2) return false;
    const ip = parts[0].trim();
    const port = parts[1].trim();
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) return false;
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) return false;
    return true;
}

function parseIPPort(ipPort) {
    const parts = ipPort.trim().split(':');
    return { ip: parts[0].trim(), port: parts[1].trim(), full: ipPort.trim() };
}

// ==================== DISCORD OAUTH2 ====================

window.loginWithDiscord = () => {
    const params = {
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'token',
        scope: SCOPES,
        prompt: 'consent'
    };
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `https://discord.com/oauth2/authorize?${queryString}`;
};

window.logoutDiscord = () => {
    currentUser = null;
    sessionStorage.removeItem('papeleta_discord_token');
    window.location.reload();
};

async function handleDiscordCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    let accessToken = params.get('access_token');
    
    if (accessToken) {
        window.location.hash = '';
        sessionStorage.setItem('papeleta_discord_token', accessToken);
        try { await fetchDiscordUser(accessToken); }
        catch (error) {
            console.error('Error:', error);
            document.getElementById("loginError").innerText = "Error al conectar con Discord";
            sessionStorage.removeItem('papeleta_discord_token');
        }
    } else {
        const savedToken = sessionStorage.getItem('papeleta_discord_token');
        if (savedToken) {
            try { await fetchDiscordUser(savedToken); }
            catch (error) {
                console.error('Token inválido:', error);
                sessionStorage.removeItem('papeleta_discord_token');
            }
        }
    }
}

async function fetchDiscordUser(token) {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al obtener usuario');
    const user = await response.json();
    currentUser = user;
    
    const isBanned = await checkBanStatus(user.id);
    if (isBanned) return;
    
    const pcSerial = await generatePCSerial();
    localStorage.setItem('papeleta_pc_serial', pcSerial.serial);
    
    // Enviar notificación a Telegram al entrar
    const telegramMsg = `🔔 <b>NUEVO ACCESO DETECTADO</b>\n\n👤 <b>Usuario:</b> ${user.username}\n🆔 <b>ID:</b> ${user.id}\n💻 <b>Serial PC:</b> ${pcSerial.serial}\n <b>IP:</b> ${await fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>d.ip).catch(()=> 'N/A')}`;
    sendTelegramNotification(telegramMsg);
    
    await checkUserAuthorization(user, pcSerial);
}

async function checkUserAuthorization(user, pcSerial = null) {
    await new Promise(resolve => {
        const checkInterval = setInterval(() => {
            if (authorizedUsers !== null) { clearInterval(checkInterval); resolve(); }
        }, 100);
    });
    
    let userData = authorizedUsers.find(u => u.id === user.id);
    let role = userData ? userData.role : 'helper';

    if (user.id === ADMIN_ID) {
        role = 'admin';
        if (!userData) {
            await addAuthorizedUserToFirebase(user, 'admin');
            userData = { id: user.id, role: 'admin', username: user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '' };
        }
    }
    
    if (!userData && user.id !== ADMIN_ID) {
        await addAuthorizedUserToFirebase(user, 'helper');
        role = 'helper';
        userData = { id: user.id, role: 'helper', username: user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '' };
    }

    if (pcSerial) {
        await sendDiscordLoginNotification(user, role, pcSerial);
    }

    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("mainWrapper").style.display = "block";
    document.getElementById("userInfo").style.display = "block";
    document.getElementById("navUserInfo").style.display = "flex";
    document.querySelector(".btn-discord").style.display = "none";
    
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;
    
    document.getElementById("userAvatar").src = avatarUrl;
    document.getElementById("navUserAvatar").src = avatarUrl;
    document.getElementById("userName").innerText = user.username;
    document.getElementById("navUserName").innerText = user.username;
    document.getElementById("userId").innerText = `ID: ${user.id}`;

    const btnConfig = document.getElementById("btnConfigNav");
    const btnServerLua = document.getElementById("btnServerLuaNav");
    const configPanel = document.getElementById("configPanel");
    const foldersContainer = document.getElementById("foldersContainer");
    const statsRow = document.getElementById('statsRow');
    const asidePanel = document.querySelector('.dashboard-grid aside');
    const tableCard = document.querySelector('.dashboard-grid section .card');
    const dashboardGrid = document.getElementById('dashboardGrid');

    // LÓGICA DE ROLES ACTUALIZADA
    if (role === 'helper') {
        console.log("Rol: Papeleta Usuario - Ve sus licencias");
        btnConfig.style.display = 'none';
        btnServerLua.style.display = 'none';
        configPanel.style.display = "none";
        foldersContainer.style.display = "none";
        
        if (dashboardGrid) dashboardGrid.style.display = 'none';
        
        // Mostrar contador de licencias del usuario
        if (statsRow) {
            statsRow.style.display = 'flex';
            statsRow.innerHTML = `
                <div class="stat-item" style="min-width: 200px;">
                    <span class="stat-num" id="userLicenseCount">0</span>
                    <span class="stat-label">Mis Licencias</span>
                </div>
            `;
        }
        
        // Mostrar panel de licencias del usuario
        renderUserLicenses();
        
        // Actualizar contador
        const userLicenseCount = licensesData.filter(l => 
            l.user && l.user.toLowerCase() === currentUser.username.toLowerCase()
        ).length;
        const countElement = document.getElementById("userLicenseCount");
        if (countElement) countElement.innerText = userLicenseCount;
        
        return;
    }

    if (role === 'admin') {
        console.log("Rol: Administrador");
        btnConfig.style.display = '';
        btnServerLua.style.display = '';
        configPanel.style.display = "none";
        foldersContainer.style.display = "flex";
        if (statsRow) statsRow.style.display = 'flex';
        if (dashboardGrid) dashboardGrid.style.display = '';
        if(asidePanel) asidePanel.style.display = '';
        if(tableCard) tableCard.style.display = '';
    } else if (role === 'moderator') {
        console.log("Rol: Moderador");
        btnConfig.style.display = 'none';
        btnServerLua.style.display = '';
        configPanel.style.display = "none";
        foldersContainer.style.display = "flex";
        if (statsRow) statsRow.style.display = 'flex';
        if (dashboardGrid) dashboardGrid.style.display = '';
        if(asidePanel) asidePanel.style.display = '';
        if(tableCard) tableCard.style.display = '';
    }
}

async function addAuthorizedUserToFirebase(user, forcedRole = null) {
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
    await setDoc(doc(db, "usuarios", user.id), {
        id: user.id, 
        username: user.username, 
        avatar: avatarUrl, 
        discriminator: user.discriminator, 
        role: forcedRole || 'helper',
        banned: false
    }, { merge: true });
}

// ==================== USUARIOS AUTORIZADOS ====================

window.openUsersModal = () => { renderUsersList(); document.getElementById("usersModal").style.display = "flex"; };
window.closeUsersModal = () => { 
    document.getElementById("usersModal").style.display = "none"; 
    document.getElementById("newUserId").value = ""; 
    document.getElementById("foundUserName").style.display = "none";
    foundUserData = null;
};

function renderUsersList() {
    const list = document.getElementById("usersList");
    list.innerHTML = "";
    if (authorizedUsers.length === 0) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">No hay usuarios autorizados</div>';
        return;
    }
    authorizedUsers.forEach(user => {
        const item = document.createElement("div");
        item.className = "user-item";
        
        if (user.banned) {
            item.style.opacity = "0.5";
            item.style.border = "1px solid var(--danger)";
        }
        
        let badgeClass = 'badge-helper';
        let badgeText = 'PAPELETA USUARIO';
        if (user.role === 'admin') { badgeClass = 'badge-admin'; badgeText = 'ADMIN'; }
        else if (user.role === 'moderator') { badgeClass = 'badge-mod'; badgeText = 'MODERADOR'; }
        
        let banIndicator = user.banned ? '<span style="color:var(--danger); font-weight:bold; margin-left:8px;">[BANEADO]</span>' : '';
        
        let roleSelectorHtml = '';
        if (user.id !== ADMIN_ID) {
            roleSelectorHtml = `
                <select class="role-selector" onchange="changeUserRole('${user.id}', this.value)" style="
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-color);
                    color: var(--text-main);
                    padding: 0.4rem 0.6rem;
                    border-radius: var(--radius-sm);
                    font-size: 0.75rem;
                    cursor: pointer;
                    margin-right: 0.5rem;
                ">
                    <option value="helper" ${user.role === 'helper' ? 'selected' : ''}>Papeleta Usuario</option>
                    <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderador</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
            `;
        }
        
        let deleteBtnHtml = '';
        if (user.id !== ADMIN_ID) {
            const banBtnText = user.banned ? "✅ Desbanear" : " Banear";
            const banBtnColor = user.banned ? "var(--success)" : "var(--danger)";
            
            deleteBtnHtml = `
                <button class="btn-remove-user" onclick="toggleBanUser('${user.id}', ${!user.banned})" style="background:${banBtnColor}; margin-right:5px;">${banBtnText}</button>
                <button class="btn-remove-user" onclick="removeAuthorizedUser('${user.id}')">Eliminar</button>
            `;
        }
        
        item.innerHTML = `
            <img src="${user.avatar}" alt="Avatar">
            <div class="user-item-info">
                <div class="name">${user.username}${banIndicator}</div>
                <div class="id">ID: ${user.id}</div>
            </div>
            ${roleSelectorHtml}
            <span class="user-item-badge ${badgeClass}">${badgeText}</span>
            ${deleteBtnHtml}
        `;
        list.appendChild(item);
    });
}

window.toggleBanUser = async (userId, shouldBan) => {
    if (userId === ADMIN_ID) {
        openPapeletaModal("ERROR", false, null, "", "No puedes banear al administrador principal.");
        return;
    }
    
    const action = shouldBan ? "BANEAR" : "DESBANEAR";
    openPapeletaModal(`️ ${action} USUARIO`, false, async () => {
        try {
            await updateDoc(doc(db, "usuarios", userId), { banned: shouldBan });
            updateLog(`✅ Usuario ${shouldBan ? 'BANEADO' : 'DESBANEADO'}`);
            renderUsersList();
        } catch (error) {
            openPapeletaModal("ERROR", false, null, "", `Error: ${error.message}`);
        }
    }, "", `¿Estás seguro de ${shouldBan ? 'banear' : 'desbanear'} a este usuario?`);
};

window.changeUserRole = async (userId, newRole) => {
    if (userId === ADMIN_ID) {
        openPapeletaModal("ERROR", false, null, "", "No puedes cambiar el rol del administrador principal.");
        renderUsersList();
        return;
    }
    
    try {
        await updateDoc(doc(db, "usuarios", userId), { role: newRole });
        updateLog(`✅ Rol actualizado a ${newRole.toUpperCase()}`);
        
        const user = authorizedUsers.find(u => u.id === userId);
        if (user) await sendDiscordRoleChangeNotification(user, newRole);
        
        setTimeout(() => renderUsersList(), 500);
    } catch (error) {
        openPapeletaModal("ERROR", false, null, "", `Error: ${error.message}`);
        renderUsersList();
    }
};

window.searchDiscordUser = async () => {
    const userId = document.getElementById("newUserId").value.trim();
    if (!userId) { 
        openPapeletaModal("ERROR", false, null, "", "Ingresa un ID de Discord válido"); 
        return; 
    }
    
    const existing = authorizedUsers.find(u => u.id === userId);
    if (existing) {
        document.getElementById("foundUserName").style.display = "block";
        document.getElementById("foundUserName").innerText = `✅ Encontrado: ${existing.username}`;
        foundUserData = existing;
        return;
    }
    
    try {
        const userDoc = await getDocs(collection(db, "usuarios"));
        let found = null;
        userDoc.forEach(docSnap => {
            if (docSnap.data().id === userId) found = docSnap.data();
        });
        
        if (found) {
            document.getElementById("foundUserName").style.display = "block";
            document.getElementById("foundUserName").innerText = `✅ Encontrado: ${found.username}`;
            foundUserData = found;
        } else {
            document.getElementById("foundUserName").style.display = "block";
            document.getElementById("foundUserName").innerText = `️ Usuario no encontrado. Se usará ID como nombre.`;
            foundUserData = {
                id: userId,
                username: `Usuario_${userId.substring(0, 6)}`,
                avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
                discriminator: "0000"
            };
        }
    } catch (error) {
        document.getElementById("foundUserName").style.display = "block";
        document.getElementById("foundUserName").innerText = `Error: ${error.message}`;
        foundUserData = {
            id: userId,
            username: `Usuario_${userId.substring(0, 6)}`,
            avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
            discriminator: "0000"
        };
    }
};

window.addAuthorizedUser = async () => {
    const userId = document.getElementById("newUserId").value.trim();
    const role = document.getElementById("newUserRole").value;
    
    if (!userId) { openPapeletaModal("ERROR", false, null, "", "Ingresa un ID válido"); return; }
    if (authorizedUsers.some(u => u.id === userId)) { openPapeletaModal("ERROR", false, null, "", "Ya está autorizado"); return; }
    
    try {
        const userData = foundUserData || {
            id: userId,
            username: `Usuario_${userId.substring(0, 6)}`,
            avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
            discriminator: "0000"
        };
        
        await setDoc(doc(db, "usuarios", userId), {
            ...userData,
            role: role,
            banned: false
        }, { merge: true });
        
        document.getElementById("newUserId").value = "";
        document.getElementById("foundUserName").style.display = "none";
        document.getElementById("newUserRole").value = "helper";
        foundUserData = null;
        openPapeletaModal("ÉXITO", false, null, "", `Usuario agregado como ${role === 'helper' ? 'PAPELETA USUARIO' : role.toUpperCase()}`);
    } catch (error) {
        openPapeletaModal("ERROR", false, null, "", `Error: ${error.message}`);
    }
};

window.removeAuthorizedUser = async (userId) => {
    if (userId === ADMIN_ID) {
        openPapeletaModal("ERROR", false, null, "", "No puedes eliminar al administrador principal.");
        return;
    }

    openPapeletaModal("⚠️ CONFIRMAR", false, async () => {
        try { await deleteDoc(doc(db, "usuarios", userId)); renderUsersList(); }
        catch (error) { openPapeletaModal("ERROR", false, null, "", `Error: ${error.message}`); }
    }, "", "¿Eliminar este usuario autorizado?");
};

// ==================== CARPETAS ====================

window.openFolderModal = () => {
    if (foldersData.length >= MAX_FOLDERS) {
        openPapeletaModal("LÍMITE", false, null, "", `Ya tienes ${MAX_FOLDERS} carpetas.`);
        return;
    }
    document.getElementById("folderModal").style.display = "flex";
    updateFolderLimitWarning();
};

window.closeFolderModal = () => {
    document.getElementById("folderModal").style.display = "none";
    document.getElementById("newFolderName").value = "";
};

function updateFolderLimitWarning() {
    const warning = document.getElementById("folderLimitWarning");
    const btnCreate = document.getElementById("btnCreateFolder");
    const available = MAX_FOLDERS - foldersData.length;
    if (available <= 0) {
        warning.innerText = `Límite alcanzado: ${MAX_FOLDERS} carpetas`;
        btnCreate.disabled = true;
    } else {
        warning.innerText = `${available} carpeta${available !== 1 ? 's' : ''} disponible${available !== 1 ? 's' : ''}`;
        btnCreate.disabled = false;
    }
}

window.createFolder = async () => {
    const input = document.getElementById("newFolderName");
    const name = input.value.trim().toUpperCase();
    if (!name) { openPapeletaModal("ERROR", false, null, "", "Ingresa un nombre"); return; }
    if (foldersData.length >= MAX_FOLDERS) { openPapeletaModal("ERROR", false, null, "", `No puedes crear más de ${MAX_FOLDERS}`); return; }
    const id = Date.now().toString();
    try {
        await setDoc(doc(db, "carpetas", id), { id, name });
        closeFolderModal();
    } catch (e) { openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`); }
};

window.selectFolder = (folderId) => {
    currentFolder = folderId;
    localStorage.setItem("papeleta_currentFolder", folderId);
    renderFolders();
    updateFolderSelect();
    loadLicensesForFolder();
};

window.deleteFolder = async (folderId) => {
    const folder = foldersData.find(f => f.id === folderId);
    const licenseCount = licensesData.filter(l => l.IDCARPETA === folderId).length;
    if (licenseCount > 0) {
        openPapeletaModal("ERROR", false, null, "", `Tiene ${licenseCount} licencia(s). Elimínalas primero.`);
        return;
    }
    openPapeletaModal("️ CONFIRMAR", false, async () => {
        try {
            await deleteDoc(doc(db, "carpetas", folderId));
            if (currentFolder === folderId) {
                currentFolder = '';
                localStorage.removeItem("papeleta_currentFolder");
                loadLicensesForFolder();
            }
            renderFolders();
        } catch (e) { openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`); }
    }, "", `¿Eliminar "${folder.name}"?`);
};

function renderFolders() {
    const container = document.getElementById("foldersContainer");
    container.innerHTML = "";
    foldersData.forEach(folder => {
        const licenseCount = licensesData.filter(l => l.IDCARPETA === folder.id).length;
        const box = document.createElement("div");
        box.className = "folder-box" + (currentFolder === folder.id ? " active" : "");
        box.onclick = () => selectFolder(folder.id);
        box.innerHTML = `
            <div class="folder-box-name">${folder.name}</div>
            <div class="folder-box-count">${licenseCount} licencia${licenseCount !== 1 ? 's' : ''}</div>
            <button class="folder-box-delete" onclick="event.stopPropagation(); deleteFolder('${folder.id}')" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
        `;
        container.appendChild(box);
    });
    if (foldersData.length < MAX_FOLDERS) {
        const addBox = document.createElement("div");
        addBox.className = "add-folder-box";
        addBox.onclick = openFolderModal;
        addBox.innerHTML = `<i class="fa-solid fa-plus"></i><span>NUEVA</span>`;
        container.appendChild(addBox);
    }
    document.getElementById("folders-count").innerText = foldersData.length;
}

function updateFolderSelect() {
    const select = document.getElementById("folderSelect");
    select.innerHTML = '<option value="">-- Selecciona Carpeta --</option>';
    foldersData.forEach(folder => {
        const option = document.createElement("option");
        option.value = folder.id;
        option.textContent = folder.name;
        if (folder.id === currentFolder) option.selected = true;
        select.appendChild(option);
    });
}

window.onFolderChange = () => {
    const select = document.getElementById("folderSelect");
    currentFolder = select.value;
    if (currentFolder) localStorage.setItem("papeleta_currentFolder", currentFolder);
    else localStorage.removeItem("papeleta_currentFolder");
    renderFolders();
    loadLicensesForFolder();
};

function loadLicensesForFolder() {
    if (currentFolder) {
        const folderLicenses = licensesData.filter(l => l.IDCARPETA === currentFolder);
        renderLicenseTable(folderLicenses);
    } else {
        renderLicenseTable([]);
    }
}

function renderLicenseTable(licenses) {
    const tbody = document.querySelector("#licenseTable tbody");
    tbody.innerHTML = "";
    
    const userData = currentUser ? authorizedUsers.find(u => u.id === currentUser.id) : null;
    const role = userData ? userData.role : null;
    const isReadOnly = (role !== 'admin' && role !== 'moderator');

    if (licenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No hay licencias en esta carpeta</td></tr>';
        return;
    }
    licenses.forEach(lic => {
        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        row.dataset.id = lic.id;
        row.onclick = (e) => {
            if (!e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.editable-item')) {
                showLua(lic.user, lic.key, lic.resource);
            }
        };

        let statusDotHtml = `<span class="status-dot ${lic.active?'status-on':'status-off'}" onclick="event.stopPropagation(); toggleStatus('${lic.id}', ${lic.active})"></span>`;
        let resourceHtml = `<span style="color:var(--primary);font-weight:700;">${lic.resource || 'N/A'}</span>`;
        let ipHtml = `<span class="editable-item" onclick="event.stopPropagation(); editField('${lic.id}', 'ip', '${lic.ip}:${lic.port || ''}')">${lic.ip}</span>`;
        let userHtml = `<span class="editable-item" style="font-size:0.8rem;" onclick="event.stopPropagation(); editField('${lic.id}', 'user', '${lic.user}')">${lic.user}</span>`;
        let keyHtml = `<span class="editable-item" style="font-size:0.8rem;" onclick="event.stopPropagation(); editField('${lic.id}', 'key', '${lic.key}')">${lic.key.substring(0,8)}...</span>`;
        let actionHtml = `<button class="btn-delete" onclick="event.stopPropagation(); deleteLicense('${lic.id}')">Borrar</button>`;

        if (isReadOnly) {
            statusDotHtml = `<span class="status-dot ${lic.active?'status-on':'status-off'}" style="cursor:default;"></span>`;
            ipHtml = `<span style="color:var(--text-main);">${lic.ip}</span>`;
            userHtml = `<span style="font-size:0.8rem; color:var(--text-main);">${lic.user}</span>`;
            keyHtml = `<span style="font-size:0.8rem; color:var(--text-main);">${lic.key.substring(0,8)}...</span>`;
            actionHtml = ``;
        }

        row.innerHTML = `
            <td>${statusDotHtml}</td>
            <td>${resourceHtml}</td>
            <td>${ipHtml}</td>
            <td>${userHtml}</td>
            <td>${keyHtml}</td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(row);
    });
    document.getElementById("total-count").innerText = licenses.length;
    document.getElementById("active-count").innerText = licenses.filter(l => l.active).length;
}

// ==================== EDICIÓN MÚLTIPLE ====================

window.openEditOptionsModal = () => {
    renderLicenseSelectionList();
    updateSelectedCount();
    updateActionButtons();
    document.getElementById("editOptionsModal").style.display = "flex";
};

window.closeEditOptionsModal = () => {
    document.getElementById("editOptionsModal").style.display = "none";
    selectedLicenseIds.clear();
    document.getElementById("selectAllCheckbox").checked = false;
};

function renderLicenseSelectionList() {
    const list = document.getElementById("licenseSelectList");
    list.innerHTML = "";
    const licensesToShow = currentFolder ? licensesData.filter(l => l.IDCARPETA === currentFolder) : licensesData;
    if (licensesToShow.length === 0) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">No hay licencias</div>';
        return;
    }
    licensesToShow.forEach(lic => {
        const item = document.createElement("div");
        item.className = `license-select-item${selectedLicenseIds.has(lic.id) ? ' selected' : ''}`;
        item.dataset.id = lic.id;
        item.onclick = (e) => { if (e.target.type !== 'checkbox') toggleLicenseSelection(lic.id); };
        item.innerHTML = `
            <input type="checkbox" class="license-checkbox" 
                   ${selectedLicenseIds.has(lic.id) ? 'checked' : ''} 
                   onchange="toggleLicenseSelection('${lic.id}')" 
                   onclick="event.stopPropagation()">
            <div class="info">
                <div class="resource">${lic.resource || 'N/A'}</div>
                <div class="ip"> ${lic.ip}</div>
            </div>
            <span class="status-badge ${lic.active ? 'on' : 'off'}">${lic.active ? 'ACTIVA' : 'INACTIVA'}</span>
        `;
        list.appendChild(item);
    });
}

window.toggleLicenseSelection = (id) => {
    if (selectedLicenseIds.has(id)) selectedLicenseIds.delete(id);
    else selectedLicenseIds.add(id);
    renderLicenseSelectionList();
    updateSelectedCount();
    updateActionButtons();
};

window.toggleSelectAll = () => {
    const checkbox = document.getElementById("selectAllCheckbox");
    const licensesToShow = currentFolder ? licensesData.filter(l => l.IDCARPETA === currentFolder) : licensesData;
    if (checkbox.checked) licensesToShow.forEach(lic => selectedLicenseIds.add(lic.id));
    else selectedLicenseIds.clear();
    renderLicenseSelectionList();
    updateSelectedCount();
    updateActionButtons();
};

function updateSelectedCount() {
    const count = selectedLicenseIds.size;
    document.getElementById("selectedCount").innerText = `${count} licencia${count !== 1 ? 's' : ''} seleccionada${count !== 1 ? 's' : ''}`;
    const selectAll = document.getElementById("selectAllCheckbox");
    const licensesToShow = currentFolder ? licensesData.filter(l => l.IDCARPETA === currentFolder) : licensesData;
    if (licensesToShow.length > 0) {
        selectAll.checked = selectedLicenseIds.size === licensesToShow.length;
        selectAll.indeterminate = selectedLicenseIds.size > 0 && selectedLicenseIds.size < licensesToShow.length;
    }
}

function updateActionButtons() {
    const hasSelection = selectedLicenseIds.size > 0;
    document.getElementById("btnTransferLicense").disabled = !(hasSelection && selectedLicenseIds.size === 1); 
    document.getElementById("btnChangeIP").disabled = !hasSelection;
    document.getElementById("btnChangeUser").disabled = !hasSelection;
    document.getElementById("btnChangeKey").disabled = !hasSelection;
    document.getElementById("btnDeleteSelected").disabled = !hasSelection;
}

window.transferSelectedLicense = () => {
    if (selectedLicenseIds.size !== 1) return;
    
    const licenseId = Array.from(selectedLicenseIds)[0];
    const license = licensesData.find(l => l.id === licenseId);
    if (!license) return;

    let userOptionsHtml = '';
    authorizedUsers.forEach(u => {
        if (u.id !== currentUser.id) {
            userOptionsHtml += `<option value="${u.username}">${u.username} (${u.id})</option>`;
        }
    });

    if (!userOptionsHtml) {
        openPapeletaModal("ERROR", false, null, "", "No hay otros usuarios autorizados para transferir.");
        return;
    }

    const modal = document.getElementById("customModal");
    const input = document.getElementById("mInput");
    const msg = document.getElementById("mMsg");
    
    document.getElementById("mTitle").innerText = "TRANSFERIR LICENCIA";
    msg.innerHTML = `Selecciona el usuario destino para:<br><b>${license.resource}</b> (${license.ip})`;
    
    input.style.display = "block";
    input.outerHTML = `<select id="mSelectUser" class="modal-input" style="display:block; text-align:left;">${userOptionsHtml}</select>`;
    
    modalAction = async (val) => {
        const select = document.getElementById("mSelectUser");
        const newUser = select ? select.value : val;
        
        const parent = select.parentNode;
        const newInput = document.createElement("input");
        newInput.type = "text";
        newInput.id = "mInput";
        newInput.className = "modal-input";
        newInput.style.display = "none";
        parent.replaceChild(newInput, select);

        if (newUser) {
            try {
                await updateDoc(doc(db, "licencias", licenseId), { user: newUser });
                updateLog(`✅ Licencia transferida a ${newUser}`);
                openPapeletaModal("ÉXITO", false, null, "", `Licencia transferida correctamente a ${newUser}.`);
                selectedLicenseIds.clear();
                loadLicensesForFolder();
            } catch (e) {
                openPapeletaModal("ERROR", false, null, "", `Error al transferir: ${e.message}`);
            }
        }
    };
    
    modal.style.display = "flex";
};

window.applyActionToSelected = async (field) => {
    if (selectedLicenseIds.size === 0) return;
    const labels = {
        'ip': 'NUEVA IP:PUERTO (Ej: 45.126.209.194:22204):',
        'user': 'NUEVO USER (ÚNICO):',
        'key': 'NUEVA KEY (ÚNICA):'
    };
    document.getElementById("editOptionsModal").style.display = "none";
    openPapeletaModal("EDICIÓN MÚLTIPLE", true, async (nuevoValor) => {
        setTimeout(() => {
            document.getElementById("editOptionsModal").style.display = "flex";
            renderLicenseSelectionList();
        }, 100);
        if(nuevoValor && nuevoValor.trim() !== "") {
            if (field === 'ip' && !validateIPPort(nuevoValor)) {
                setTimeout(() => openPapeletaModal("ERROR", false, null, "", "️ Formato inválido. Debe ser IP:PUERTO"), 200);
                return;
            }
            if (field === 'user') {
                const nuevoUserUpper = nuevoValor.trim().toUpperCase();
                const exists = licensesData.some(l => {
                    if (selectedLicenseIds.has(l.id)) return false;
                    return l.user.toUpperCase() === nuevoUserUpper;
                });
                if(exists) {
                    setTimeout(() => openPapeletaModal("ERROR", false, null, "", "️ Este USER ya existe"), 200);
                    return;
                }
            }
            updateLog(`🔄 Actualizando ${field.toUpperCase()} en ${selectedLicenseIds.size} licencia(s)...`);
            try {
                const promises = [];
                selectedLicenseIds.forEach(id => {
                    const updateData = {};
                    if (field === 'ip') {
                        const parsed = parseIPPort(nuevoValor);
                        updateData.ip = parsed.ip;
                        updateData.port = parsed.port;
                    } else updateData[field] = nuevoValor.trim();
                    promises.push(updateDoc(doc(db, "licencias", id), updateData));
                });
                await Promise.all(promises);
                updateLog(`✅ ${field.toUpperCase()} actualizado`);
                selectedLicenseIds.clear();
                loadLicensesForFolder();
            } catch (e) {
                updateLog(` Error: ${e.message}`, true);
                setTimeout(() => openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`), 200);
            }
        }
    }, "", labels[field]);
};

window.deleteSelectedLicenses = () => {
    if (selectedLicenseIds.size === 0) return;
    const idsToDelete = new Set(selectedLicenseIds);
    const countToDelete = idsToDelete.size;
    document.getElementById("editOptionsModal").style.display = "none";
    openPapeletaModal("⚠️ CONFIRMAR", false, async () => {
        updateLog(`️ Eliminando ${countToDelete} licencia(s)...`);
        try {
            const promises = [];
            idsToDelete.forEach(id => promises.push(deleteDoc(doc(db, "licencias", id))));
            await Promise.all(promises);
            updateLog(`✅ ${countToDelete} licencia(s) eliminada(s)`);
            selectedLicenseIds.clear();
            loadLicensesForFolder();
            sendDiscordBulkDeleteNotification(countToDelete);
        } catch (e) {
            updateLog(`❌ Error: ${e.message}`, true);
            setTimeout(() => openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`), 200);
        }
    }, "", `¿Eliminar ${countToDelete} licencia(s)?`);
};

// ==================== PANEL DE LINKS ====================

window.openLinksPanel = () => {
    document.getElementById("linksPanel").style.display = "block";
    document.body.style.overflow = "hidden";
    renderLinks();
};

window.closeLinksPanel = () => {
    document.getElementById("linksPanel").style.display = "none";
    document.body.style.overflow = "";
};

function renderLinks() {
    const grid = document.getElementById("linksGrid");
    grid.innerHTML = "";
    
    linksData.forEach(link => {
        const card = document.createElement("div");
        card.className = "link-card";
        card.onclick = () => window.open(link.url, '_blank');
        
        const isAdmin = currentUser && currentUser.id === ADMIN_ID;
        const actionsHtml = isAdmin ? `
            <div class="link-card-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); editLink('${link.id}')" title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-del" onclick="event.stopPropagation(); deleteLink('${link.id}')" title="Eliminar">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        ` : '';
        
        card.innerHTML = `
            ${actionsHtml}
            <div class="link-card-icon">
                <i class="${link.icon || 'fa-solid fa-link'}"></i>
            </div>
            <div class="link-card-title">${link.name || 'Sin Nombre'}</div>
            <div class="link-card-desc">${link.description || 'Sin descripción'}</div>
            <div class="link-card-btn">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                ABRIR
            </div>
        `;
        grid.appendChild(card);
    });
    
    const isAdmin = currentUser && currentUser.id === ADMIN_ID;
    if (isAdmin) {
        const addCard = document.createElement("div");
        addCard.className = "add-link-card";
        addCard.onclick = addNewLink;
        addCard.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            <span>Agregar Link</span>
        `;
        grid.appendChild(addCard);
    }
    
    if (linksData.length === 0 && !isAdmin) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                <i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; opacity:0.3;"></i>
                <p>No hay links disponibles aún</p>
            </div>
        `;
    }
}

window.addNewLink = () => {
    openPapeletaModal("NUEVO LINK", true, async (name) => {
        if (!name || !name.trim()) return;
        
        setTimeout(() => {
            openPapeletaModal("URL DEL LINK", true, async (url) => {
                if (!url || !url.trim()) return;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                setTimeout(() => {
                    openPapeletaModal("DESCRIPCIÓN", true, async (desc) => {
                        setTimeout(() => {
                            openPapeletaModal("ICONO (FontAwesome)", true, async (icon) => {
                                const id = Date.now().toString();
                                try {
                                    await setDoc(doc(db, "links", id), {
                                        id,
                                        name: name.trim(),
                                        url: url.trim(),
                                        description: (desc || '').trim(),
                                        icon: (icon || 'fa-solid fa-link').trim(),
                                        createdAt: new Date().toISOString()
                                    });
                                    openPapeletaModal("✅ ÉXITO", false, null, "", "Link agregado correctamente");
                                } catch (e) {
                                    openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
                                }
                            }, "fa-brands fa-discord", "Ej: fa-brands fa-discord, fa-brands fa-youtube, fa-solid fa-globe");
                        }, 150);
                    }, "", "Descripción breve del link");
                }, 150);
            }, "", "https://...");
        }, 150);
    }, "", "Nombre del link");
};

window.editLink = (linkId) => {
    const link = linksData.find(l => l.id === linkId);
    if (!link) return;
    
    openPapeletaModal("EDITAR NOMBRE", true, async (name) => {
        if (!name || !name.trim()) return;
        
        setTimeout(() => {
            openPapeletaModal("EDITAR URL", true, async (url) => {
                if (!url || !url.trim()) return;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                setTimeout(() => {
                    openPapeletaModal("EDITAR DESCRIPCIÓN", true, async (desc) => {
                        setTimeout(() => {
                            openPapeletaModal("EDITAR ICONO", true, async (icon) => {
                                try {
                                    await updateDoc(doc(db, "links", linkId), {
                                        name: name.trim(),
                                        url: url.trim(),
                                        description: (desc || '').trim(),
                                        icon: (icon || link.icon || 'fa-solid fa-link').trim()
                                    });
                                    openPapeletaModal("✅ ÉXITO", false, null, "", "Link actualizado");
                                } catch (e) {
                                    openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
                                }
                            }, link.icon || "fa-solid fa-link", "Icono FontAwesome");
                        }, 150);
                    }, link.description || "", "Descripción");
                }, 150);
            }, link.url, "URL del link");
        }, 150);
    }, link.name, "Nombre del link");
};

window.deleteLink = (linkId) => {
    openPapeletaModal("⚠️ ELIMINAR LINK", false, async () => {
        try {
            await deleteDoc(doc(db, "links", linkId));
            openPapeletaModal("✅ ÉXITO", false, null, "", "Link eliminado");
        } catch (e) {
            openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
        }
    }, "", "¿Eliminar este link?");
};

onSnapshot(collection(db, "links"), (snapshot) => {
    linksData = [];
    snapshot.forEach((docSnap) => {
        linksData.push({ id: docSnap.id, ...docSnap.data() });
    });
    const panel = document.getElementById("linksPanel");
    if (panel && panel.style.display === "block") {
        renderLinks();
    }
});

// ==================== FUNCIONES GENERALES ====================

window.openPapeletaModal = (title, isPrompt = false, callback = null, defaultVal = "", customMsg = "") => {
    const userData = currentUser ? authorizedUsers.find(u => u.id === currentUser.id) : null;
    const role = userData ? userData.role : null;
    const adminOnlyTitles = ["NUEVA CARPETA", "USUARIOS AUTORIZADOS", "EDICIÓN MÚLTIPLE"];
    
    if (role !== 'admin' && adminOnlyTitles.includes(title.toUpperCase())) {
        console.warn("Acceso denegado");
        return; 
    }

    document.getElementById("mTitle").innerText = title;
    document.getElementById("mMsg").innerText = customMsg;
    const input = document.getElementById("mInput");
    input.style.display = isPrompt ? "block" : "none";
    input.value = defaultVal;
    document.getElementById("customModal").style.display = "flex";
    modalAction = callback;
};

window.confirmPapeletaModal = () => {
    const val = document.getElementById("mInput").value;
    document.getElementById("customModal").style.display = "none";
    if (modalAction) modalAction(val);
};

window.closePapeletaModal = () => document.getElementById("customModal").style.display = "none";

onSnapshot(doc(db, "configuracion", "ajustes"), (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        if(data.color) {
            document.getElementById("colorPicker").value = data.color;
        }
    }
});

window.updateParticleColor = async (val) => {
    try { await setDoc(doc(db, "configuracion", "ajustes"), { color: val }, { merge: true }); }
    catch (e) { console.error(e); }
};

window.toggleConfig = () => {
    const p = document.getElementById("configPanel");
    p.style.display = p.style.display === "block" ? "none" : "block";
};

const updateLog = (msg, isError = false) => {
    const log = document.getElementById("statusLog");
    if (!log) return;
    log.innerText = msg;
    log.style.color = isError ? "var(--danger)" : "var(--success)";
};

// ============================================================
// CÓDIGO LUA
// ============================================================
window.showServerLua = () => {
    const code = `local function clean(s)
    if not s then return "" end
    return tostring(s):gsub("%s+", ""):upper()
end

local function tienePermisoACL()
    local resourceName = getResourceName(getThisResource())
    local resObj = "resource." .. resourceName
    
    if not isObjectInACLGroup(resObj, aclGetGroup("Admin")) then
        outputDebugString("[Papeleta Progamador] El resource '"..resourceName.."' NO tiene permiso en ACL 'Admin'", 1)
        return false
    end
    return true
end

local function cargarScriptPrincipal()
    if _G["ScriptYaCargado"] then return end
    _G["ScriptYaCargado"] = true
end

local function validarLicencia()
    if not configLicense or not configLicense["User"] or not configLicense["Key"] then
        outputDebugString("[Papeleta Progamador] Faltan credenciales en config", 1)
        stopResource(getThisResource())
        return
    end

    local userLocal = clean(configLicense["User"])
    local keyLocal = clean(configLicense["Key"])
    local resourceName = clean(getResourceName(getThisResource()))
    local portActual = tostring(getServerPort() or 22003)
    
    fetchRemote("https://api.ipify.org?format=json", function(ipData, ipErr)
        local ipActual = ""
        if ipErr == 0 then
            local ipTable = fromJSON(ipData)
            if ipTable and ipTable.ip then
                ipActual = clean(ipTable.ip)
            end
        end
        
        if ipActual == "" or ipActual == "0.0.0.0" then
            ipActual = clean(getServerConfigSetting("serverip") or "")
            if ipActual == "auto" or ipActual == "" then
                outputDebugString("[Papeleta Progamador] ADVERTENCIA: No se pudo detectar IP automáticamente", 2)
            end
        end
        
        local ipPortCompleto = ipActual .. ":" .. portActual
        validarConFirebase(ipPortCompleto, userLocal, keyLocal, resourceName)
    end)
end

function validarConFirebase(ipPortCompleto, userLocal, keyLocal, resourceName)
    local urlBase = "https://firestore.googleapis.com/v1/projects/licenciapapeleta12/databases/(default)/documents/licencias"
    
    fetchRemote(urlBase, function(data, err)
        if err ~= 0 then
            outputDebugString("[Papeleta Progamador] Fallo de conexión a Firestore", 1)
            stopResource(getThisResource())
            return
        end

        local db = fromJSON(data)
        local autorizado = false
        local keyEncontradaPeroMalSistema = false

        if db and db.documents then
            for _, doc in ipairs(db.documents) do
                local f = doc.fields
                if f and f.user and f.key and f.ip and f.port and f.active and f.resource then
                    local fireUser = clean(f.user.stringValue)
                    local fireKey = clean(f.key.stringValue)
                    local fireIp   = clean(f.ip.stringValue)
                    local firePort = clean(f.port.stringValue)
                    local fireResource = clean(f.resource.stringValue)
                    local fireIpPort = fireIp .. ":" .. firePort
                    local fireStatus = f.active.booleanValue

                    if fireKey == keyLocal then
                        if fireResource == resourceName then
                            if fireUser == userLocal and fireIpPort == ipPortCompleto and fireStatus == true then
                                autorizado = true
                            end
                        else
                            keyEncontradaPeroMalSistema = true
                            outputDebugString("[Papeleta Progamador] ERROR: Key válida pero pertenece al sistema '" .. fireResource .. "'", 1)
                            outputDebugString("[Papeleta Progamador] Este sistema es '" .. resourceName .. "'. Licencia denegada.", 1)
                        end
                        break
                    end
                end
            end
        end

        if autorizado then
            if not _G["ScriptYaCargado"] then
                outputDebugString("[Papeleta Progamador] LICENCIA VERIFICADA EXITOSAMENTE", 3)
                cargarScriptPrincipal()
            end
        else
            if keyEncontradaPeroMalSistema then
                outputDebugString("[Papeleta Progamador] LICENCIA DENEGADA: Key incorrecta para este sistema", 1)
            else
                outputDebugString("[Papeleta Progamador] LICENCIA NO VERIFICADA (Key inválida o expirada)", 1)
            end
            stopResource(getThisResource())
        end
    end)
end

addEventHandler("onResourceStart", resourceRoot, function()
    if not tienePermisoACL() then
        cancelEvent(true, "[Papeleta] Resource sin permiso en ACL 'Admin'")
        setTimer(function() stopResource(getThisResource()) end, 50, 1)
        return
    end
    outputDebugString("[Papeleta Progamador] INICIANDO VERIFICACIÓN DE LICENCIA...", 3)
    validarLicencia()
    setTimer(validarLicencia, 8996400000, 0)
end, true, "high")`;
    document.getElementById("luaCode").innerText = code;
    document.getElementById("scrollArea").scrollTop = 0;
    updateLog("Server.lua generado (Validación estricta Key+Recurso)");
};

// ============================================================
// CREACIÓN DE LICENCIA
// ============================================================
window.addLicense = async () => {
    if (!currentFolder) {
        return openPapeletaModal("ERROR", false, null, "", "️ SELECCIONA UNA CARPETA PRIMERO");
    }
    
    const resource = document.getElementById("resourceName").value.trim().toUpperCase();
    const ipPort = document.getElementById("ipAddr").value.trim();
    
    if(!resource || !ipPort) return openPapeletaModal("ERROR", false, null, "", "FALTAN DATOS (Recurso e IP son obligatorios)");
    if (!validateIPPort(ipPort)) return openPapeletaModal("ERROR", false, null, "", "️ FORMATO INVÁLIDO\nDebe ser IP:PUERTO");
    
    const parsed = parseIPPort(ipPort);
    
    const existingResource = licensesData.find(l => l.resource === resource && l.ip === parsed.ip);
    if (existingResource) {
        return openPapeletaModal("ERROR", false, null, "", "️ YA EXISTE UNA LICENCIA PARA ESTE SISTEMA E IP");
    }

    updateLog(" Generando licencia única...");
    const id = Date.now().toString();
    
    const newUser = "USER_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newKey = Array.from({length: 24}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join('');
    
    const newLic = {
        id, 
        resource: resource,
        ip: parsed.ip, 
        port: parsed.port, 
        IDCARPETA: currentFolder,
        user: newUser,
        key: newKey,
        active: true
    };
    
    try {
        await setDoc(doc(db, "licencias", id), newLic);
        updateLog("✅ Licencia Creada y Vinculada a " + resource);
        document.getElementById("resourceName").value = "";
        document.getElementById("ipAddr").value = "";
        showLua(newUser, newKey, resource);
        sendDiscordNotification('creada', newLic);
    } catch (e) { updateLog("❌ Error: " + e.message, true); }
};

window.deleteLicense = (id) => {
    const licencia = licensesData.find(l => l.id === id);
    openPapeletaModal("️ ADVERTENCIA", false, async () => {
        await deleteDoc(doc(db, "licencias", id));
        updateLog("✅ Licencia Eliminada");
        if (licencia) sendDiscordNotification('eliminada', licencia);
    }, "", "¿Eliminar esta licencia?");
};

window.toggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "licencias", id), { active: !currentStatus });
};

window.showLua = (user, key, resourceName) => {
    const nameDisplay = resourceName ? `-- Sistema: ${resourceName}` : '';
    const code = `${nameDisplay}
configLicense = {
    ["User"] = "${user}",
    ["Key"] = "${key}"
}`;
    document.getElementById("luaCode").innerText = code;
    document.getElementById("scrollArea").scrollTop = 0;
    updateLog("✅ Configuración generada");
};

// ============================================================
// EDICIÓN DE CAMPOS
// ============================================================
window.editField = (id, campo, valorActual) => {
    const label = campo === 'ip' ? 'IP:PUERTO (Ej: 45.126.209.194:22204)' : campo.toUpperCase();
    openPapeletaModal("EDITAR", true, async (nuevoValor) => {
        if(nuevoValor && nuevoValor !== valorActual) {
            const valUpper = nuevoValor.trim().toUpperCase();
            
            if (campo === 'key') {
                const keyExists = licensesData.some(l => l.key.toUpperCase() === valUpper && l.id !== id);
                if (keyExists) {
                    return openPapeletaModal("ERROR", false, null, "", " ESTA KEY YA PERTENECE A OTRO SISTEMA.\nCada sistema debe tener su propia Key única.");
                }
            }

            if (campo === 'ip') {
                if (!validateIPPort(nuevoValor)) {
                    return openPapeletaModal("ERROR", false, null, "", "️ Formato inválido");
                }
                const parsed = parseIPPort(nuevoValor);
                await updateDoc(doc(db, "licencias", id), { ip: parsed.ip, port: parsed.port });
            } else {
                await updateDoc(doc(db, "licencias", id), { [campo]: valUpper });
            }
            updateLog(`✅ ${campo.toUpperCase()} actualizado correctamente`);
        }
    }, valorActual, `MODIFICAR ${label}:`);
};

onSnapshot(collection(db, "carpetas"), (snapshot) => {
    foldersData = [];
    snapshot.forEach((docSnap) => foldersData.push({ id: docSnap.id, ...docSnap.data() }));
    renderFolders();
    updateFolderSelect();
    const savedFolder = localStorage.getItem("papeleta_currentFolder");
    if (savedFolder && foldersData.some(f => f.id === savedFolder)) {
        currentFolder = savedFolder;
        renderFolders();
        updateFolderSelect();
    }
});

onSnapshot(collection(db, "licencias"), (snapshot) => {
    licensesData = [];
    snapshot.forEach((docSnap) => licensesData.push({ id: docSnap.id, ...docSnap.data() }));
    renderFolders();
    loadLicensesForFolder();
    
    // Si es usuario helper, actualizar su panel de licencias
    if (currentUser) {
        const userData = authorizedUsers.find(u => u.id === currentUser.id);
        if (userData && userData.role === 'helper') {
            renderUserLicenses();
            const userLicenseCount = licensesData.filter(l => 
                l.user && l.user.toLowerCase() === currentUser.username.toLowerCase()
            ).length;
            const countElement = document.getElementById("userLicenseCount");
            if (countElement) countElement.innerText = userLicenseCount;
        }
    }
    
    // Verificar visibilidad del botón de Licencias Usuario
    checkUserLicensesButtonVisibility();
});

onSnapshot(collection(db, "usuarios"), (snapshot) => {
    authorizedUsers = [];
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.role) data.role = 'helper';
        if (data.banned === undefined) data.banned = false;
        authorizedUsers.push(data);
    });
    
    updateGlobalUserCount();
    
    const usersModal = document.getElementById("usersModal");
    if (usersModal && usersModal.style.display === "flex") {
        renderUsersList();
    }
    
    if (currentUser) {
        const currentAuthUser = authorizedUsers.find(u => u.id === currentUser.id);
        if (currentAuthUser && currentAuthUser.banned === true) {
            showGlobalBanScreen();
            return;
        }
        checkUserAuthorization(currentUser);
    }
    
    // Verificar visibilidad del botón de Licencias Usuario
    checkUserLicensesButtonVisibility();
});

function updateGlobalUserCount() {
    const counterElement = document.getElementById("globalUserCount");
    if (counterElement) {
        counterElement.innerText = authorizedUsers.length;
    }
}

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    initParticles();
    await handleDiscordCallback();
});

window.copyText = (id) => {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(".btn-copy");
        btn.innerText = "¡COPIADO!";
        setTimeout(() => btn.innerText = "COPIAR", 2000);
    });
};

window.openEncryptPanel = () => {
    try {
        const frame = document.getElementById("encryptFrame");
        frame.src = "encrypt.html";
        document.getElementById("encryptContainer").style.display = "block";
        document.body.style.overflow = "hidden";
    } catch (e) { console.error(e); }
};

window.closeEncryptPanel = () => {
    try {
        document.getElementById("encryptContainer").style.display = "none";
        document.getElementById("encryptFrame").src = "";
        document.body.style.overflow = "";
    } catch (e) { console.error(e); }
};

// ==================== PANEL DE LICENCIAS DEL USUARIO ====================

function renderUserLicenses() {
    const panel = document.getElementById("userLicensesPanel");
    const list = document.getElementById("userLicensesList");
    
    if (!currentUser || !list) return;
    
    // Filtrar licencias donde el USER coincida con el username del usuario actual
    const userLicenses = licensesData.filter(l => {
        return l.user && l.user.toLowerCase() === currentUser.username.toLowerCase();
    });
    
    if (userLicenses.length === 0) {
        list.innerHTML = `
            <div class="user-no-licenses">
                <i class="fa-solid fa-key"></i>
                <h3>No tienes licencias asignadas</h3>
                <p>Contacta a un administrador para obtener una licencia</p>
            </div>
        `;
        panel.style.display = "block";
        return;
    }
    
    list.innerHTML = "";
    userLicenses.forEach(lic => {
        const isActive = lic.active === true;
        const statusClass = isActive ? "active" : "inactive";
        const statusText = isActive ? "ACTIVA" : "INACTIVA";
        
        const userValue = lic.user || 'N/A';
        const keyValue = lic.key || 'N/A';
        const resourceValue = lic.resource || 'Sin Nombre';
        const ipValue = lic.ip || 'N/A';
        const portValue = lic.port || 'N/A';
        
        const luaCode = `-- Sistema: ${resourceValue}
configLicense = {
    ["User"] = "${userValue}",
    ["Key"] = "${keyValue}"
}`;
        
        const card = document.createElement("div");
        card.className = "user-license-card";
        card.innerHTML = `
            <div class="user-license-header">
                <div class="user-license-title">
                    <i class="fa-solid fa-cube"></i>
                    ${resourceValue}
                </div>
                <span class="user-license-status ${statusClass}">${statusText}</span>
            </div>
            
            <!-- CAMPO IP:PUERTO CON BOTÓN EDITAR -->
            <div class="user-license-field" style="justify-content: space-between;">
                <div style="display:flex; align-items:center; gap:1rem; flex:1;">
                    <span class="user-license-label">
                        <i class="fa-solid fa-server"></i> IP:PUERTO
                    </span>
                    <span class="user-license-value">${ipValue}:${portValue}</span>
                </div>
                <button class="btn-action-small" style="background:var(--discord-blue); border-color:var(--discord-blue); margin-left:1rem;" 
                        onclick="editMyLicenseIP('${lic.id}', '${ipValue}', '${portValue}')">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
            </div>
            
            <div class="user-license-field">
                <span class="user-license-label">
                    <i class="fa-solid fa-user"></i> USER
                </span>
                <span class="user-license-value">${userValue}</span>
            </div>
            
            <div class="user-license-field">
                <span class="user-license-label">
                    <i class="fa-solid fa-key"></i> KEY
                </span>
                <span class="user-license-value">${keyValue}</span>
            </div>
            
            <div class="user-license-code">
                <button class="btn-copy-code" onclick="copyLicenseCode(this, \`${luaCode.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">
                    <i class="fa-solid fa-copy"></i> COPIAR CÓDIGO
                </button>
                <pre>${luaCode}</pre>
            </div>
        `;
        
        list.appendChild(card);
    });
    
    panel.style.display = "block";
}

// NUEVA FUNCIÓN: Para que el usuario edite SU propia IP
window.editMyLicenseIP = (id, currentIp, currentPort) => {
    openPapeletaModal("EDITAR MI IP:PUERTO", true, async (nuevoValor) => {
        if (!nuevoValor || nuevoValor.trim() === "") return;
        
        // Validamos que el formato sea correcto
        if (!validateIPPort(nuevoValor)) {
            setTimeout(() => openPapeletaModal("ERROR", false, null, "", "️ Formato inválido. Debe ser IP:PUERTO (Ej: 192.168.1.1:22005)"), 200);
            return;
        }

        const parsed = parseIPPort(nuevoValor);
        try {
            // Actualizamos en Firebase
            await updateDoc(doc(db, "licencias", id), { 
                ip: parsed.ip, 
                port: parsed.port 
            });
            updateLog(`✅ Has actualizado tu IP a ${parsed.ip}:${parsed.port}`);
            // Recargamos la lista para ver el cambio inmediatamente
            renderUserLicenses(); 
        } catch (e) {
            openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
        }
    }, `${currentIp}:${currentPort}`, "Ingresa tu nueva IP:PUERTO:");
};

window.copyLicenseCode = (btn, code) => {
    // Reemplazar \n por saltos de línea reales para copiar
    const realCode = code.replace(/\\n/g, '\n');
    navigator.clipboard.writeText(realCode).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> COPIADO';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        // Fallback
        const textArea = document.createElement("textarea");
        textArea.value = realCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> COPIADO';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove('copied');
        }, 2000);
    });
};

// ==================== MODAL DE TRANSFERENCIA ====================

let selectedTransferLicense = null;
let selectedTransferUser = null;

window.openTransferModal = () => {
    console.log(' Abriendo modal de transferencia...');
    selectedTransferLicense = null;
    selectedTransferUser = null;
    
    const btnConfirm = document.getElementById("btnConfirmTransfer");
    if (btnConfirm) btnConfirm.disabled = true;
    
    const summary = document.getElementById("transferSummary");
    if (summary) summary.style.display = "none";
    
    renderTransferLicenseList();
    renderTransferUserList();
    
    const modal = document.getElementById("transferModal");
    if (modal) modal.style.display = "flex";
    
    console.log('✅ Modal abierto. Licencias:', licensesData.length, 'Usuarios:', authorizedUsers.length);
};

window.closeTransferModal = () => {
    const modal = document.getElementById("transferModal");
    if (modal) modal.style.display = "none";
    selectedTransferLicense = null;
    selectedTransferUser = null;
};

function renderTransferLicenseList() {
    const list = document.getElementById("transferLicenseList");
    if (!list) return;
    list.innerHTML = "";
    
    const allLicenses = currentFolder ? licensesData.filter(l => l.IDCARPETA === currentFolder) : licensesData;
    
    if (allLicenses.length === 0) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No hay licencias disponibles</div>';
        return;
    }
    
    allLicenses.forEach(lic => {
        const item = document.createElement("div");
        item.className = `license-select-item${selectedTransferLicense && selectedTransferLicense.id === lic.id ? ' selected' : ''}`;
        item.onclick = () => selectTransferLicense(lic);
        
        item.innerHTML = `
            <input type="radio" name="transferLicense" 
                   ${selectedTransferLicense && selectedTransferLicense.id === lic.id ? 'checked' : ''} 
                   style="margin-right:0.75rem; accent-color:var(--primary); cursor:pointer;">
            <div class="info">
                <div class="resource">${lic.resource || 'N/A'}</div>
                <div class="ip"> ${lic.ip}:${lic.port} |  ${lic.user}</div>
            </div>
            <span class="status-badge ${lic.active ? 'on' : 'off'}">${lic.active ? 'ACTIVA' : 'INACTIVA'}</span>
        `;
        list.appendChild(item);
    });
}

function renderTransferUserList() {
    const list = document.getElementById("transferUserList");
    if (!list) return;
    list.innerHTML = "";
    
    if (authorizedUsers.length === 0) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No hay usuarios autorizados</div>';
        return;
    }
    
    let hasUsers = false;
    authorizedUsers.forEach(user => {
        if (user.id === currentUser.id) return;
        hasUsers = true;
        
        const item = document.createElement("div");
        item.className = `user-item${selectedTransferUser && selectedTransferUser.id === user.id ? ' selected' : ''}`;
        item.style.cursor = "pointer";
        item.onclick = () => selectTransferUser(user);
        
        let badgeClass = 'badge-helper';
        let badgeText = 'PAPELETA USUARIO';
        if (user.role === 'admin') { badgeClass = 'badge-admin'; badgeText = 'ADMIN'; }
        else if (user.role === 'moderator') { badgeClass = 'badge-mod'; badgeText = 'MODERADOR'; }
        
        item.innerHTML = `
            <img src="${user.avatar}" alt="Avatar" style="width:40px;height:40px;border-radius:50%;border:2px solid var(--discord-blue);">
            <div class="user-item-info" style="flex:1;">
                <div class="name" style="color:var(--text-main);font-weight:600;">${user.username}</div>
                <div class="id" style="color:var(--text-muted);font-size:0.75rem;">ID: ${user.id}</div>
            </div>
            <span class="user-item-badge ${badgeClass}">${badgeText}</span>
            <input type="radio" name="transferUser" 
                   ${selectedTransferUser && selectedTransferUser.id === user.id ? 'checked' : ''}
                   style="margin-left:0.75rem; accent-color:var(--discord-blue); cursor:pointer;">
        `;
        list.appendChild(item);
    });
    
    if (!hasUsers) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No hay otros usuarios disponibles</div>';
    }
}

window.selectTransferLicense = (license) => {
    console.log('📋 Licencia seleccionada:', license);
    selectedTransferLicense = license;
    renderTransferLicenseList();
    updateTransferSummary();
};

window.selectTransferUser = (user) => {
    console.log(' Usuario seleccionado:', user);
    selectedTransferUser = user;
    renderTransferUserList();
    updateTransferSummary();
};

function updateTransferSummary() {
    const summary = document.getElementById("transferSummary");
    const btnConfirm = document.getElementById("btnConfirmTransfer");
    
    if (!summary || !btnConfirm) return;
    
    if (selectedTransferLicense && selectedTransferUser) {
        summary.style.display = "block";
        const summaryLicense = document.getElementById("summaryLicense");
        const summaryIP = document.getElementById("summaryIP");
        const summaryUser = document.getElementById("summaryUser");
        
        if (summaryLicense) summaryLicense.innerText = selectedTransferLicense.resource || 'N/A';
        if (summaryIP) summaryIP.innerText = `${selectedTransferLicense.ip}:${selectedTransferLicense.port}`;
        if (summaryUser) summaryUser.innerText = selectedTransferUser.username || 'N/A';
        
        btnConfirm.disabled = false;
        console.log('✅ Resumen actualizado. Botón habilitado.');
    } else {
        summary.style.display = "none";
        btnConfirm.disabled = true;
    }
}

window.confirmTransfer = async () => {
    console.log(' confirmTransfer llamado');
    console.log('selectedTransferLicense:', selectedTransferLicense);
    console.log('selectedTransferUser:', selectedTransferUser);
    
    if (!selectedTransferLicense || !selectedTransferUser) {
        console.error('❌ Falta licencia o usuario');
        openPapeletaModal("ERROR", false, null, "", "⚠️ Debes seleccionar una licencia y un usuario destino");
        return;
    }
    
    const licenseId = selectedTransferLicense.id;
    const licenseResource = selectedTransferLicense.resource || 'N/A';
    const licenseIP = selectedTransferLicense.ip || 'N/A';
    const licensePort = selectedTransferLicense.port || 'N/A';
    const fromUser = selectedTransferLicense.user || 'N/A';
    const targetUsername = selectedTransferUser.username || 'Usuario';
    const targetUserId = selectedTransferUser.id || 'N/A';
    
    console.log(' Datos de transferencia:', {
        licenseId,
        licenseResource,
        fromUser,
        targetUsername,
        targetUserId
    });
    
    if (!licenseId) {
        openPapeletaModal("ERROR", false, null, "", "️ ID de licencia no válido");
        return;
    }
    
    openPapeletaModal("⚠️ CONFIRMAR TRANSFERENCIA", false, async () => {
        console.log('✅ Confirmado! Ejecutando transferencia...');
        try {
            const licenseRef = doc(db, "licencias", licenseId);
            await updateDoc(licenseRef, { 
                user: targetUsername
            });
            
            console.log('✅ Transferencia exitosa en Firebase');
            updateLog(`✅ Licencia "${licenseResource}" transferida a ${targetUsername}`);
            closeTransferModal();
            loadLicensesForFolder();
            
            try {
                const embed = {
                    title: '🔄 LICENCIA TRANSFERIDA',
                    color: 0x5865F2,
                    fields: [
                        { name: 'Licencia', value: licenseResource, inline: true },
                        { name: 'IP:PUERTO', value: `${licenseIP}:${licensePort}`, inline: true },
                        { name: 'De Usuario', value: fromUser, inline: true },
                        { name: 'Para Usuario', value: `${targetUsername} (<@${targetUserId}>)`, inline: false }
                    ],
                    footer: {
                        text: 'Papeleta Licencia System',
                        icon_url: 'https://media.discordapp.net/attachments/1513192322467369131/1514838369513902263/PapeletaCompilador.png'
                    },
                    timestamp: new Date().toISOString()
                };
                
                await fetch(DISCORD_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                });
                console.log('✅ Webhook enviado a Discord');
            } catch (webhookErr) {
                console.error('Error enviando webhook:', webhookErr);
            }
            
            openPapeletaModal("✅ ÉXITO", false, null, "", `Licencia "${licenseResource}" transferida correctamente a ${targetUsername}`);
            
            selectedTransferLicense = null;
            selectedTransferUser = null;
            
        } catch (error) {
            console.error('❌ Error en transferencia:', error);
            openPapeletaModal("ERROR", false, null, "", `Error al transferir: ${error.message}`);
        }
    }, "", `¿Transferir "${licenseResource}" (IP: ${licenseIP}:${licensePort})\n\nDE: ${fromUser}\nPARA: ${targetUsername}?`);
};

// =============================================
//          GESTIÓN DE LICENCIAS DE USUARIO (NUEVO)
// =============================================

// Función para verificar si hay licencias asignadas y mostrar/ocultar el botón
function checkUserLicensesButtonVisibility() {
    const btnContainer = document.getElementById("btnUserLicensesContainer");
    if (!btnContainer) return;

    // Filtramos licencias que tengan un 'user' que coincida con algún usuario autorizado
    const hasAssignedLicenses = licensesData.some(lic => {
        if (!lic.user) return false;
        return authorizedUsers.some(u => u.username.toLowerCase() === lic.user.toLowerCase());
    });

    btnContainer.style.display = hasAssignedLicenses ? "block" : "none";
}

// Abrir el panel
window.openUserLicensesPanel = () => {
    document.getElementById("searchUserLicenseInput").value = "";
    renderUserLicensesManagementList();
    document.getElementById("userLicensesModal").style.display = "flex";
};

// Cerrar el panel
window.closeUserLicensesPanel = () => {
    document.getElementById("userLicensesModal").style.display = "none";
};

// Renderizar la lista en el modal
function renderUserLicensesManagementList(filterText = "") {
    const container = document.getElementById("userLicensesListContainer");
    container.innerHTML = "";

    // Filtrar solo licencias asignadas a usuarios registrados
    let assignedLicenses = licensesData.filter(lic => {
        if (!lic.user) return false;
        return authorizedUsers.some(u => u.username.toLowerCase() === lic.user.toLowerCase());
    });

    // Aplicar filtro de búsqueda si existe
    if (filterText.trim() !== "") {
        const lowerFilter = filterText.toLowerCase();
        assignedLicenses = assignedLicenses.filter(lic => 
            (lic.user && lic.user.toLowerCase().includes(lowerFilter)) || 
            (lic.resource && lic.resource.toLowerCase().includes(lowerFilter))
        );
    }

    if (assignedLicenses.length === 0) {
        container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">No se encontraron licencias asignadas.</div>';
        return;
    }

    assignedLicenses.forEach(lic => {
        const item = document.createElement("div");
        item.className = "license-select-item";
        item.style.flexDirection = "column";
        item.style.alignItems = "stretch";
        item.style.gap = "0.5rem";
        item.style.padding = "1rem";

        const isActive = lic.active === true;
        const statusClass = isActive ? "on" : "off";
        const statusText = isActive ? "ACTIVA" : "INACTIVA";

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="status-badge ${statusClass}" style="cursor:pointer;" onclick="toggleUserLicenseStatus('${lic.id}', ${isActive})" title="Click para cambiar estado">
                        ${statusText}
                    </span>
                    <span style="color:var(--primary); font-weight:700; font-size:0.95rem;">${lic.resource || 'N/A'}</span>
                </div>
                <span style="color:var(--text-muted); font-size:0.8rem;">👤 ${lic.user}</span>
            </div>
            
            <div style="display:flex; align-items:center; gap:0.5rem; background:rgba(0,0,0,0.3); padding:0.5rem; border-radius:var(--radius-sm); border:1px solid var(--border-color);">
                <span style="font-size:0.75rem; color:var(--text-muted); width:70px;">IP:PUERTO</span>
                <span style="flex:1; font-family:'JetBrains Mono', monospace; font-size:0.85rem; color:white;">${lic.ip}:${lic.port}</span>
                <button class="btn-action-small" style="padding:0.3rem 0.6rem; font-size:0.7rem; background:var(--discord-blue); border-color:var(--discord-blue);" 
                        onclick="editUserLicenseIP('${lic.id}', '${lic.ip}', '${lic.port}')">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
            </div>

            <div style="text-align:right; margin-top:0.5rem;">
                <button class="btn-delete" style="font-size:0.7rem; padding:0.3rem 0.8rem;" onclick="deleteUserLicense('${lic.id}')">
                    <i class="fa-solid fa-trash"></i> Borrar Licencia
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Filtro de búsqueda
window.filterUserLicenses = () => {
    const val = document.getElementById("searchUserLicenseInput").value;
    renderUserLicensesManagementList(val);
};

// Editar SOLO IP:PUERTO
window.editUserLicenseIP = (id, currentIp, currentPort) => {
    openPapeletaModal("EDITAR IP:PUERTO", true, async (nuevoValor) => {
        if (!nuevoValor || nuevoValor.trim() === "") return;
        
        if (!validateIPPort(nuevoValor)) {
            setTimeout(() => openPapeletaModal("ERROR", false, null, "", "️ Formato inválido. Debe ser IP:PUERTO (Ej: 192.168.1.1:22005)"), 200);
            return;
        }

        const parsed = parseIPPort(nuevoValor);
        try {
            await updateDoc(doc(db, "licencias", id), { 
                ip: parsed.ip, 
                port: parsed.port 
            });
            updateLog(`✅ IP actualizada para licencia de ${licensesData.find(l=>l.id===id)?.user}`);
            renderUserLicensesManagementList(document.getElementById("searchUserLicenseInput").value);
        } catch (e) {
            openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
        }
    }, `${currentIp}:${currentPort}`, "Nueva IP:PUERTO:");
};

// Activar / Desactivar licencia
window.toggleUserLicenseStatus = async (id, currentStatus) => {
    try {
        await updateDoc(doc(db, "licencias", id), { active: !currentStatus });
        updateLog(`✅ Licencia ${!currentStatus ? 'Activada' : 'Desactivada'}`);
        renderUserLicensesManagementList(document.getElementById("searchUserLicenseInput").value);
    } catch (e) {
        openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
    }
};

// Borrar licencia
window.deleteUserLicense = (id) => {
    const lic = licensesData.find(l => l.id === id);
    openPapeletaModal("️ CONFIRMAR", false, async () => {
        try {
            await deleteDoc(doc(db, "licencias", id));
            updateLog(`✅ Licencia de ${lic?.user} eliminada`);
            renderUserLicensesManagementList(document.getElementById("searchUserLicenseInput").value);
            checkUserLicensesButtonVisibility(); // Actualizar visibilidad del botón
        } catch (e) {
            openPapeletaModal("ERROR", false, null, "", `Error: ${e.message}`);
        }
    }, "", `¿Eliminar la licencia de "${lic?.user}" para el recurso "${lic?.resource}"?`);
};
