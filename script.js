// =============================================
//          BLOQUEO AGRESIVO DE DEVTOOLS
// =============================================

if (typeof DisableDevtool === 'function') {
    DisableDevtool({
        ondevtoolopen: function () {
            openPapeletaModal('ACCESO DENEGADO', false, null, '', 'Herramientas de desarrollador detectadas.\nLa página se recargará en 3 segundos.');
            setTimeout(() => { location.reload(true); }, 3000);
        },
        clearIntervalWhenDevOpen: true,
        disableMenu: true,
        ignore: []
    });
}

document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || e.keyCode === 123) { e.preventDefault(); showDevWarning(); return false; }
    if (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) { e.preventDefault(); showDevWarning(); return false; }
    if (e.ctrlKey && e.key.toLowerCase() === 'u') { e.preventDefault(); showDevWarning(); return false; }
    if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); showDevWarning(); return false; }
}, true);

function showDevWarning() {
    openPapeletaModal('PROHIBIDO', false, null, '', 'Acceso a herramientas de desarrollador bloqueado.');
}

setInterval(() => {
    const start = performance.now();
    debugger;
    const end = performance.now();
    if (end - start > 80) { 
        document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#f00;font-size:48px;text-align:center;padding-top:30vh;z-index:99999;">DEVTOOLS DETECTADO<br>ACCESO BLOQUEADO</div>';
        setTimeout(() => {
             document.body.innerHTML = '<div style="position:fixed;inset:0;background:#000;color:#fff;font-size:24px;text-align:center;padding-top:40vh;z-index:99999;">ACCESO PERMANENTEMENTE BLOQUEADO</div>';
        }, 4000);
    }
}, 400);

// =============================================
//          NOTIFICACIONES DE DISCORD
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
                { name: ' Recurso', value: licencia.resource || 'N/A', inline: true },
                { name: ' IP:PUERTO', value: `${licencia.ip || 'N/A'}:${licencia.port || 'N/A'}`, inline: true },
                { name: ' Usuario', value: licencia.user || 'N/A', inline: true },
                { name: ' Key', value: licencia.key ? `${licencia.key.substring(0, 12)}...` : 'N/A', inline: true },
                { name: ' Carpeta', value: folderName, inline: true },
                { name: ' Estado', value: licencia.active ? ' ACTIVA' : ' INACTIVA', inline: true }
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
                { name: ' Resumen', value: `Total eliminadas: ${cantidad}`, inline: false },
                { name: ' Carpeta', value: currentFolder ? (foldersData.find(f => f.id === currentFolder)?.name || 'N/A') : 'N/A', inline: true }
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

// =============================================
//          DISCORD OAUTH2 CONFIGURATION
// =============================================

const DISCORD_CLIENT_ID = "1484013765878878378";
const REDIRECT_URI = "https://omarvasquez12.github.io/";
const SCOPES = "identify";

// ID DEL ADMINISTRADOR PROTEGIDO (NO SE PUEDE BORRAR NI EDITAR)
const ADMIN_ID = "890526767608127489";

let currentUser = null;
let authorizedUsers = [];

// =============================================
//                 FIREBASE
// =============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc, collection, deleteDoc, updateDoc, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
let currentFolder = '';
const MAX_FOLDERS = 5;
let foundUserData = null;

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
        prompt: 'consent' // <--- CAMBIO: Fuerza a Discord a mostrar siempre la pantalla de autorización
    };
    const queryString = new URLSearchParams(params).toString();
    window.location.href = `https://discord.com/oauth2/authorize?${queryString}`;
};

window.logoutDiscord = () => {
    // No guardamos nada en localStorage, así que solo recargamos para "cerrar"
    currentUser = null;
    window.location.reload();
};

async function handleDiscordCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    
    if (accessToken) {
        // CAMBIO: No guardamos en localStorage. Solo usamos el token actual.
        window.location.hash = '';
        try { await fetchDiscordUser(accessToken); }
        catch (error) {
            console.error('Error:', error);
            document.getElementById("loginError").innerText = "Error al conectar con Discord";
        }
    } else {
        // Si no hay token en la URL, mostramos el login (que es el estado por defecto del HTML)
        console.log("Esperando inicio de sesión...");
    }
}

async function fetchDiscordUser(token) {
    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al obtener usuario');
    const user = await response.json();
    currentUser = user;
    
    // CAMBIO: Eliminamos el guardado en localStorage para que no persista la sesión
    // localStorage.setItem("discord_user", JSON.stringify(user)); 
    
    await checkUserAuthorization(user);
}

async function checkUserAuthorization(user) {
    // Esperar a que carguen los usuarios autorizados desde Firebase
    await new Promise(resolve => {
        const checkInterval = setInterval(() => {
            if (authorizedUsers !== null) { clearInterval(checkInterval); resolve(); }
        }, 100);
    });
    
    let userData = authorizedUsers.find(u => u.id === user.id);
    let role = userData ? userData.role : null;

    // --- LÓGICA DE AUTO-ADMIN PARA EL ID ESPECÍFICO ---
    if (user.id === ADMIN_ID) {
        role = 'admin';
        // Si no existe en la BD, lo creamos para que persista el rol en Firebase
        if (!userData) {
            await addAuthorizedUserToFirebase(user, 'admin');
            userData = { id: user.id, role: 'admin', username: user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '' };
        }
    }
    
    // --- ACCESO UNIVERSAL ---
    // Todos entran. Si no tienen rol, se les asigna 'helper' automáticamente.
    if (!userData && user.id !== ADMIN_ID) {
         await addAuthorizedUserToFirebase(user, 'helper');
         role = 'helper';
         userData = { id: user.id, role: 'helper', username: user.username, avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '' };
    }

    // MOSTRAR INTERFAZ PRINCIPAL (Todos entran aquí sin excepción)
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("mainWrapper").style.display = "block";
    document.getElementById("userInfo").style.display = "block";
    document.getElementById("navUserInfo").style.display = "flex";
    document.querySelector(".btn-discord").style.display = "none";
    
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
    
    document.getElementById("userAvatar").src = avatarUrl;
    document.getElementById("navUserAvatar").src = avatarUrl;
    document.getElementById("userName").innerText = user.username;
    document.getElementById("navUserName").innerText = user.username;
    document.getElementById("userId").innerText = `ID: ${user.id}`;

    // --- LÓGICA DE PERMISOS POR ROLES ---
    const btnConfig = document.getElementById("btnConfigNav");
    const btnServerLua = document.getElementById("btnServerLuaNav");
    const configPanel = document.getElementById("configPanel");
    const foldersContainer = document.getElementById("foldersContainer");
    const statsRow = document.querySelector('.stats-row');
    const asidePanel = document.querySelector('.dashboard-grid aside');
    const tableCard = document.querySelector('.dashboard-grid section .card');
    const navBtns = document.querySelectorAll('.nav-actions button');

    if (role === 'admin') {
        // ADMIN: Acceso total
        console.log("Rol: Administrador - Acceso total");
        navBtns.forEach(btn => btn.style.display = '');
        configPanel.style.display = "none";
        foldersContainer.style.display = "flex";
        statsRow.style.display = 'flex';
        if(asidePanel) asidePanel.style.display = '';
        if(tableCard) tableCard.style.display = '';
        
    } else if (role === 'moderator') {
        // MODERADOR: Ve todo menos Config
        console.log("Rol: Moderador - Sin acceso a Config");
        btnConfig.style.display = 'none';
        btnServerLua.style.display = '';
        configPanel.style.display = "none";
        foldersContainer.style.display = "flex";
        statsRow.style.display = 'flex';
        if(asidePanel) asidePanel.style.display = '';
        if(tableCard) tableCard.style.display = '';
        
    } else {
        // HELPER / SIN ROL: SOLO VE LA TABLA DE LICENCIAS (SOLO LECTURA)
        console.log("Rol: Ayudante/Sin Rol - Solo lectura");
        
        // Ocultar botones de navegación superiores (pero el botón SALIR se maneja aparte o se deja visible si se desea)
        btnConfig.style.display = 'none';
        btnServerLua.style.display = 'none';
        
        // Ocultar panel de configuración
        configPanel.style.display = "none";
        
        // Ocultar carpetas y estadísticas
        foldersContainer.style.display = "none";
        statsRow.style.display = 'none';
        
        // Ocultar panel lateral izquierdo (Generador + Código)
        if(asidePanel) asidePanel.style.display = 'none';
        
        // Mostrar solo la tabla de licencias (derecha)
        if(tableCard) tableCard.style.display = ''; 
        
        // Ajustar grid para que la tabla ocupe todo el ancho
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if(dashboardGrid) {
            dashboardGrid.style.gridTemplateColumns = '1fr';
        }
    }
}

async function addAuthorizedUserToFirebase(user, forcedRole = null) {
    const avatarUrl = user.avatar 
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/0.png`;
    await setDoc(doc(db, "usuarios", user.id), {
        id: user.id, username: user.username, avatar: avatarUrl, discriminator: user.discriminator, role: forcedRole || 'helper'
    });
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
        
        let badgeClass = 'badge-helper';
        let badgeText = 'AYUDANTE';
        if (user.role === 'admin') { badgeClass = 'badge-admin'; badgeText = 'ADMIN'; }
        else if (user.role === 'moderator') { badgeClass = 'badge-mod'; badgeText = 'MODERADOR'; }
        
        // Lógica para proteger al Admin ID específico de ser borrado
        let deleteBtnHtml = '';
        if (user.id !== ADMIN_ID) {
            deleteBtnHtml = `<button class="btn-remove-user" onclick="removeAuthorizedUser('${user.id}')">Eliminar</button>`;
        }
        
        item.innerHTML = `
            <img src="${user.avatar}" alt="Avatar">
            <div class="user-item-info">
                <div class="name">${user.username}</div>
                <div class="id">ID: ${user.id}</div>
            </div>
            <span class="user-item-badge ${badgeClass}">${badgeText}</span>
            ${deleteBtnHtml}
        `;
        list.appendChild(item);
    });
}

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
            document.getElementById("foundUserName").innerText = `ℹ️ Usuario no encontrado en BD. Se usará ID como nombre.`;
            foundUserData = {
                id: userId,
                username: `Usuario_${userId.substring(0, 6)}`,
                avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
                discriminator: "0000"
            };
        }
    } catch (error) {
        document.getElementById("foundUserName").style.display = "block";
        document.getElementById("foundUserName").innerText = `️ Error buscando: ${error.message}`;
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
    
    if (!userId) { openPapeletaModal("ERROR", false, null, "", "Ingresa un ID de Discord válido"); return; }
    if (authorizedUsers.some(u => u.id === userId)) { openPapeletaModal("ERROR", false, null, "", "Este usuario ya está autorizado"); return; }
    
    try {
        // Nota: Como no guardamos token en localStorage, esta función podría fallar si se usa mucho tiempo después.
        // Pero para agregar usuarios suele hacerse justo después de loguearse.
        const token = new URLSearchParams(window.location.hash.substring(1)).get('access_token');
        if (!token) { 
            // Fallback: intentar usar el token de la URL actual si existe, o avisar
            console.warn("Token no disponible en URL para agregar usuario.");
        }
        
        const userData = foundUserData || {
            id: userId,
            username: `Usuario_${userId.substring(0, 6)}`,
            avatar: `https://cdn.discordapp.com/embed/avatars/0.png`,
            discriminator: "0000"
        };
        
        await setDoc(doc(db, "usuarios", userId), {
            ...userData,
            role: role
        });
        
        document.getElementById("newUserId").value = "";
        document.getElementById("foundUserName").style.display = "none";
        document.getElementById("newUserRole").value = "helper";
        foundUserData = null;
        openPapeletaModal("ÉXITO", false, null, "", `Usuario agregado como ${role.toUpperCase()}`);
    } catch (error) {
        openPapeletaModal("ERROR", false, null, "", `Error: ${error.message}`);
    }
};

window.removeAuthorizedUser = async (userId) => {
    // Protección extra: no permitir borrar al admin ni por ID directo
    if (userId === ADMIN_ID) {
        openPapeletaModal("ERROR", false, null, "", "No puedes eliminar al administrador principal.");
        return;
    }

    openPapeletaModal("️ CONFIRMAR", false, async () => {
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
    // Mantenemos localStorage solo para la carpeta seleccionada, no para la sesión
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
            <button class="folder-box-delete" onclick="event.stopPropagation(); deleteFolder('${folder.id}')" title="Eliminar"></button>
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
    
    // Detectar si el usuario actual es solo lectura (helper o sin rol)
    const userData = currentUser ? authorizedUsers.find(u => u.id === currentUser.id) : null;
    const role = userData ? userData.role : null;
    const isReadOnly = (role !== 'admin' && role !== 'moderator');

    if (licenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:2rem;">No hay licencias en esta carpeta</td></tr>';
        return;
    }
    licenses.forEach(lic => {
        const row = document.createElement("tr");
        row.style.cursor = "pointer";
        row.dataset.id = lic.id;
        row.onclick = (e) => {
            if (!e.target.closest('input') && !e.target.closest('button') && !e.target.closest('.editable-item')) {
                showLua(lic.user, lic.key);
            }
        };

        // Lógica para ocultar controles si es ReadOnly
        let statusDotHtml = `<span class="status-dot ${lic.active?'status-on':'status-off'}" onclick="event.stopPropagation(); toggleStatus('${lic.id}', ${lic.active})"></span>`;
        let ipHtml = `<span class="editable-item" onclick="event.stopPropagation(); editField('${lic.id}', 'ip', '${lic.ip}:${lic.port || ''}')">${lic.ip}</span>`;
        let userHtml = `<span class="editable-item" style="font-size:0.8rem;" onclick="event.stopPropagation(); editField('${lic.id}', 'user', '${lic.user}')">${lic.user}</span>`;
        let keyHtml = `<span class="editable-item" style="font-size:0.8rem;" onclick="event.stopPropagation(); editField('${lic.id}', 'key', '${lic.key}')">${lic.key.substring(0,8)}...</span>`;
        let actionHtml = `<button class="btn-delete" onclick="event.stopPropagation(); deleteLicense('${lic.id}')">Borrar</button>`;

        if (isReadOnly) {
            // Si es solo lectura, quitamos los onclick y el botón borrar
            statusDotHtml = `<span class="status-dot ${lic.active?'status-on':'status-off'}" style="cursor:default;"></span>`;
            ipHtml = `<span style="color:var(--text-main);">${lic.ip}</span>`;
            userHtml = `<span style="font-size:0.8rem; color:var(--text-main);">${lic.user}</span>`;
            keyHtml = `<span style="font-size:0.8rem; color:var(--text-main);">${lic.key.substring(0,8)}...</span>`;
            actionHtml = ``; // Botón vacío
        }

        row.innerHTML = `
            <td>${statusDotHtml}</td>
            <td style="color:var(--primary);font-weight:700;">${lic.resource}</td>
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
                <div class="resource">${lic.resource}</div>
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
    document.getElementById("btnChangeIP").disabled = !hasSelection;
    document.getElementById("btnChangeUser").disabled = !hasSelection;
    document.getElementById("btnChangeKey").disabled = !hasSelection;
    document.getElementById("btnDeleteSelected").disabled = !hasSelection;
}

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
                updateLog(`✅ ${field.toUpperCase()} actualizado en ${selectedLicenseIds.size} licencia(s)`);
                selectedLicenseIds.clear();
                loadLicensesForFolder();
            } catch (e) {
                updateLog(`❌ Error: ${e.message}`, true);
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
    openPapeletaModal("️ CONFIRMAR", false, async () => {
        updateLog(` Eliminando ${countToDelete} licencia(s)...`);
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

// ==================== FUNCIONES GENERALES ====================

window.openPapeletaModal = (title, isPrompt = false, callback = null, defaultVal = "", customMsg = "") => {
    const userData = currentUser ? authorizedUsers.find(u => u.id === currentUser.id) : null;
    const role = userData ? userData.role : null;
    const adminOnlyTitles = ["NUEVA CARPETA", "USUARIOS AUTORIZADOS", "EDICIÓN MÚLTIPLE"];
    
    if (role !== 'admin' && adminOnlyTitles.includes(title.toUpperCase())) {
        console.warn("Acceso denegado: Intento de abrir panel de admin.");
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
    log.innerText = msg;
    log.style.color = isError ? "var(--danger)" : "var(--success)";
};

window.showServerLua = () => {
    const code = `local function clean(s)
    if not s then return "" end
    return tostring(s):gsub("%s+", "")
end

local function tienePermisoACL()
    local resourceName = getResourceName(getThisResource())
    local resObj = "resource." .. resourceName
    if not isObjectInACLGroup(resObj, aclGetGroup("Admin")) then
        outputDebugString("[Papeleta] Resource sin permiso ACL 'Admin'", 1)
        return false
    end
    return true
end

local function validarLicencia()
    if not configLicense or not configLicense["User"] or not configLicense["Key"] then
        outputDebugString("[Papeleta] Faltan credenciales", 1)
        stopResource(getThisResource())
        return
    end

    local userLocal = clean(configLicense["User"])
    local keyLocal = clean(configLicense["Key"])
    local portActual = tostring(getServerPort() or 22003)
    
    fetchRemote("https://api.ipify.org?format=json", function(ipData, ipErr)
        local ipActual = ""
        if ipErr == 0 then
            local ipTable = fromJSON(ipData)
            if ipTable and ipTable.ip then ipActual = clean(ipTable.ip) end
        end
        if ipActual == "" then ipActual = clean(getServerConfigSetting("serverip") or "") end
        local ipPortCompleto = ipActual .. ":" .. portActual
        validarConFirebase(ipPortCompleto, userLocal, keyLocal)
    end)
end

function validarConFirebase(ipPortCompleto, userLocal, keyLocal)
    local urlBase = "https://firestore.googleapis.com/v1/projects/licenciapapeleta12/databases/(default)/documents/licencias"
    fetchRemote(urlBase, function(data, err)
        if err ~= 0 then
            outputDebugString("[Papeleta] Fallo conexión Firestore", 1)
            stopResource(getThisResource())
            return
        end
        local db = fromJSON(data)
        local autorizado = false
        if db and db.documents then
            for _, doc in ipairs(db.documents) do
                local f = doc.fields
                if f and f.user and f.key and f.ip and f.port and f.active then
                    local fireUser = clean(f.user.stringValue)
                    local fireKey = clean(f.key.stringValue)
                    local fireIp = clean(f.ip.stringValue)
                    local firePort = clean(f.port.stringValue)
                    local fireIpPort = fireIp .. ":" .. firePort
                    local fireStatus = f.active.booleanValue
                    if fireUser == userLocal and fireKey == keyLocal then
                        if fireIpPort == ipPortCompleto and fireStatus == true then
                            autorizado = true
                        end
                        break
                    end
                end
            end
        end
        if autorizado then
            outputDebugString("[Papeleta] LICENCIA VERIFICADA", 3)
        else
            outputDebugString("[Papeleta] LICENCIA NO VERIFICADA", 1)
            stopResource(getThisResource())
        end
    end)
end

addEventHandler("onResourceStart", resourceRoot, function()
    if not tienePermisoACL() then
        cancelEvent(true, "[Papeleta] Sin permiso ACL")
        setTimer(function() stopResource(getThisResource()) end, 50, 1)
        return
    end
    validarLicencia()
    setTimer(validarLicencia, 86400000, 0)
end, true, "high")`;
    document.getElementById("luaCode").innerText = code;
    document.getElementById("scrollArea").scrollTop = 0;
    updateLog("Server.lua generado");
};

window.addLicense = async () => {
    if (!currentFolder) {
        return openPapeletaModal("ERROR", false, null, "", "️ SELECCIONA UNA CARPETA PRIMERO");
    }
    const resource = document.getElementById("resourceName").value.trim().toUpperCase();
    const ipPort = document.getElementById("ipAddr").value.trim();
    if(!resource || !ipPort) return openPapeletaModal("ERROR", false, null, "", "FALTAN DATOS");
    if (!validateIPPort(ipPort)) return openPapeletaModal("ERROR", false, null, "", "⚠️ FORMATO INVÁLIDO\nDebe ser IP:PUERTO\nEj: 45.126.209.194:22204");
    
    const parsed = parseIPPort(ipPort);
    updateLog(" Generando licencia...");
    const id = Date.now().toString();
    const newLic = {
        id, resource, ip: parsed.ip, port: parsed.port, IDCARPETA: currentFolder,
        user: "USER_" + Math.random().toString(36).substring(7).toUpperCase(),
        key: (Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)).toUpperCase(),
        active: true
    };
    try {
        await setDoc(doc(db, "licencias", id), newLic);
        updateLog("✅ Licencia Activada - IP:" + parsed.ip + " PUERTO:" + parsed.port);
        document.getElementById("resourceName").value = "";
        document.getElementById("ipAddr").value = "";
        showLua(newLic.user, newLic.key);
        sendDiscordNotification('creada', newLic);
    } catch (e) { updateLog("❌ Error: " + e.message, true); }
};

window.deleteLicense = (id) => {
    const licencia = licensesData.find(l => l.id === id);
    openPapeletaModal("ADVERTENCIA", false, async () => {
        await deleteDoc(doc(db, "licencias", id));
        updateLog("✅ Licencia Eliminada");
        if (licencia) sendDiscordNotification('eliminada', licencia);
    }, "", "¿Eliminar esta licencia?");
};

window.toggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, "licencias", id), { active: !currentStatus });
};

window.showLua = (user, key) => {
    const code = `configLicense = {\n ["User"] = "${user}",\n ["Key"] = "${key}"\n}`;
    document.getElementById("luaCode").innerText = code;
    document.getElementById("scrollArea").scrollTop = 0;
    updateLog("Configuración generada");
};

window.editField = (id, campo, valorActual) => {
    const label = campo === 'ip' ? 'IP:PUERTO (Ej: 45.126.209.194:22204)' : campo.toUpperCase();
    openPapeletaModal("EDITAR", true, async (nuevoValor) => {
        if(nuevoValor && nuevoValor !== valorActual) {
            if (campo === 'ip') {
                if (!validateIPPort(nuevoValor)) {
                    openPapeletaModal("ERROR", false, null, "", "️ Formato inválido");
                    return;
                }
                const parsed = parseIPPort(nuevoValor);
                await updateDoc(doc(db, "licencias", id), { ip: parsed.ip, port: parsed.port });
            } else {
                await updateDoc(doc(db, "licencias", id), { [campo]: nuevoValor });
            }
            updateLog(`✅ ${campo.toUpperCase()} actualizado`);
        }
    }, valorActual, `MODIFICAR ${label}:`);
};

// Listeners Firebase
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
});

onSnapshot(collection(db, "usuarios"), (snapshot) => {
    authorizedUsers = [];
    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.role) data.role = 'helper';
        authorizedUsers.push(data);
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    // CAMBIO: Ignoramos localStorage para la sesión. Solo miramos si Discord acaba de enviar el token en la URL.
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
