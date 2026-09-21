import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ======================================================
// FIREBASE
// ======================================================

const firebaseConfig = {
    apiKey: "AIzaSyBmJGL7p8sO45TkkN75lg9Ot1CB4JurJE8",
    authDomain: "casastock-6b9ca.firebaseapp.com",
    projectId: "casastock-6b9ca",
    storageBucket: "casastock-6b9ca.firebasestorage.app",
    messagingSenderId: "355535129205",
    appId: "1:355535129205:web:1e5a4be50a8d41f039463c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======================================================
// VARIABLES
// ======================================================

let usuarioActual = null;

let productos = [];
let listaCompras = [];

let productoEditando = null;

let cantidadFormulario = 1;
let minimoFormulario = 1;

let modoScanner = "agregar";

let scanner = null;
let scannerActivo = false;
let iniciandoScanner = false;
let procesandoCodigo = false;

let ultimoCodigoEscaneado = "";
let ultimoMomentoEscaneado = 0;

let categoriaFiltro = "Todas";
let filtroVencimientoActual = "proximos";

// ======================================================
// CATEGORÍAS
// ======================================================

const categorias = [
    "Enlatados",
    "Pastas",
    "Lácteos",
    "Bebidas",
    "Infusiones",
    "Legumbres",
    "Dulces",
    "Golosinas",
    "Aderezos",
    "Condimentos",
    "Salsas",
    "Secos",
    "Conservas",
    "Carnes",
    "Frutas",
    "Verduras",
    "Limpieza",
    "Elaboración propia",
    "Otros"
];

// ======================================================
// INICIO
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
);

function iniciarAplicacion() {

    prepararCategorias();
    prepararFormulario();
    prepararBuscador();
    prepararAutenticacion();

    seleccionarModoScanner("agregar");

    /*
     * MUY IMPORTANTE:
     * Firebase decide si existe una sesión.
     * Mientras tanto mostramos solamente
     * la pantalla de autenticación.
     */

    ocultarAplicacionCompleta();
    mostrarLogin();

    onAuthStateChanged(
        auth,
        async (usuario) => {

            if (usuario) {

                usuarioActual = usuario;

                await cargarDatosUsuario();

                mostrarAplicacion();

            } else {

                usuarioActual = null;

                productos = [];
                listaCompras = [];

                await detenerScanner();

                ocultarAplicacionCompleta();

                mostrarLogin();
            }
        }
    );
}

// ======================================================
// CONTROL GENERAL DE PANTALLAS
// ======================================================

function ocultarAplicacionCompleta() {

    const authPantalla =
        document.getElementById(
            "pantallaAuth"
        );

    const appPrincipal =
        document.getElementById(
            "appPrincipal"
        );

    if (authPantalla) {

        authPantalla.classList.remove(
            "oculto"
        );
    }

    if (appPrincipal) {

        appPrincipal.classList.add(
            "oculto"
        );
    }

    /*
     * Por seguridad, también ocultamos
     * todas las pantallas internas.
     */

    document
        .querySelectorAll(
            "#appPrincipal [id^='pantalla-']"
        )
        .forEach(
            (pantalla) => {

                pantalla.classList.add(
                    "oculto"
                );
            }
        );

    /*
     * También ocultamos la barra de navegación
     * si está fuera de appPrincipal.
     */

    document
        .querySelectorAll(".navbar")
        .forEach(
            (navbar) => {

                navbar.classList.add(
                    "oculto"
                );
            }
        );
}

function mostrarAplicacion() {

    const authPantalla =
        document.getElementById(
            "pantallaAuth"
        );

    const appPrincipal =
        document.getElementById(
            "appPrincipal"
        );

    /*
     * LOGIN COMPLETAMENTE OCULTO
     */

    if (authPantalla) {

        authPantalla.classList.add(
            "oculto"
        );
    }

    /*
     * APP COMPLETAMENTE VISIBLE
     */

    if (appPrincipal) {

        appPrincipal.classList.remove(
            "oculto"
        );
    }

    /*
     * Mostramos la barra de navegación.
     */

    document
        .querySelectorAll(".navbar")
        .forEach(
            (navbar) => {

                navbar.classList.remove(
                    "oculto"
                );
            }
        );

    const nombreUsuario =
        document.getElementById(
            "nombreUsuario"
        );

    if (nombreUsuario) {

        nombreUsuario.textContent =
            usuarioActual?.displayName ||
            usuarioActual?.email ||
            "Usuario";
    }

    /*
     * Siempre arrancamos en inicio.
     */

    mostrarPantalla("inicio");

    renderizarTodo();
}

// ======================================================
// AUTENTICACIÓN
// ======================================================

function prepararAutenticacion() {

    prepararBotonPassword(
        document.getElementById(
            "loginPassword"
        )
    );

    prepararBotonPassword(
        document.getElementById(
            "registroPassword"
        )
    );

    prepararBotonPassword(
        document.getElementById(
            "registroPassword2"
        )
    );

    prepararValidacionEmail(
        document.getElementById(
            "loginEmail"
        )
    );

    prepararValidacionEmail(
        document.getElementById(
            "registroEmail"
        )
    );

    prepararValidacionPasswords();
}

// ======================================================
// OJO CONTRASEÑA
// ======================================================

function iconoOjo(tachado = false) {

    if (tachado) {

        return `
            <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path>
                <circle cx="12" cy="12" r="2.5"></circle>
                <path d="M3 3l18 18"></path>
            </svg>
        `;
    }

    return `
        <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"></path>
            <circle cx="12" cy="12" r="2.5"></circle>
        </svg>
    `;
}

function prepararBotonPassword(input) {

    if (!input) return;

    if (
        input.dataset.passwordPreparada ===
        "true"
    ) {
        return;
    }

    input.dataset.passwordPreparada =
        "true";

    const contenedor =
        document.createElement("div");

    contenedor.style.position =
        "relative";

    contenedor.style.width =
        "100%";

    input.parentNode.insertBefore(
        contenedor,
        input
    );

    contenedor.appendChild(input);

    input.style.width =
        "100%";

    input.style.boxSizing =
        "border-box";

    input.style.paddingRight =
        "44px";

    const boton =
        document.createElement("button");

    boton.type = "button";

    boton.innerHTML =
        iconoOjo(true);

    boton.setAttribute(
        "aria-label",
        "Mostrar contraseña"
    );

    boton.style.position =
        "absolute";

    boton.style.right =
        "4px";

    boton.style.top =
        "50%";

    boton.style.transform =
        "translateY(-50%)";

    boton.style.width =
        "36px";

    boton.style.height =
        "36px";

    boton.style.padding =
        "0";

    boton.style.margin =
        "0";

    boton.style.border =
        "none";

    boton.style.background =
        "transparent";

    boton.style.display =
        "flex";

    boton.style.alignItems =
        "center";

    boton.style.justifyContent =
        "center";

    boton.style.cursor =
        "pointer";

    boton.style.zIndex =
        "2";

    boton.style.color =
        "inherit";

    boton.addEventListener(
        "click",
        () => {

            const visible =
                input.type === "text";

            if (visible) {

                input.type =
                    "password";

                boton.innerHTML =
                    iconoOjo(true);

            } else {

                input.type =
                    "text";

                boton.innerHTML =
                    iconoOjo(false);
            }
        }
    );

    contenedor.appendChild(
        boton
    );
}

// ======================================================
// EMAIL
// ======================================================

const dominiosPermitidos = [
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
    "protonmail.com",
    "proton.me",
    "msn.com"
];

function emailValido(email) {

    email =
        String(email || "")
            .trim()
            .toLowerCase();

    if (!email) return false;

    const formato =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formato.test(email)) {
        return false;
    }

    const partes =
        email.split("@");

    if (partes.length !== 2) {
        return false;
    }

    return dominiosPermitidos.includes(
        partes[1]
    );
}

function prepararValidacionEmail(input) {

    if (!input) return;

    if (
        input.dataset.emailPreparado ===
        "true"
    ) {
        return;
    }

    input.dataset.emailPreparado =
        "true";

    const mensaje =
        document.createElement("small");

    mensaje.textContent =
        "El correo electrónico no es válido. Revisá que esté escrito correctamente.";

    mensaje.style.display =
        "none";

    mensaje.style.color =
        "#b42318";

    mensaje.style.marginTop =
        "4px";

    input.insertAdjacentElement(
        "afterend",
        mensaje
    );

    const validar = () => {

        if (
            input.value.trim() === ""
        ) {

            limpiarErrorEmail(input);

            return;
        }

        if (
            emailValido(input.value)
        ) {

            mensaje.style.display =
                "none";

            input.style.borderColor =
                "";

        } else {

            mensaje.style.display =
                "block";

            input.style.borderColor =
                "#b42318";
        }
    };

    input.addEventListener(
        "input",
        validar
    );

    input.addEventListener(
        "blur",
        validar
    );
}

function limpiarErrorEmail(input) {

    if (!input) return;

    const mensaje =
        input.nextElementSibling;

    if (
        mensaje &&
        mensaje.tagName === "SMALL"
    ) {

        mensaje.style.display =
            "none";
    }

    input.style.borderColor =
        "";
}

// ======================================================
// CONTRASEÑAS
// ======================================================

function prepararValidacionPasswords() {

    const password =
        document.getElementById(
            "registroPassword"
        );

    const password2 =
        document.getElementById(
            "registroPassword2"
        );

    if (!password || !password2) {
        return;
    }

    if (
        password2.dataset.validacionPreparada ===
        "true"
    ) {
        return;
    }

    password2.dataset.validacionPreparada =
        "true";

    const mensaje =
        document.createElement("small");

    mensaje.style.display =
        "none";

    mensaje.style.marginTop =
        "4px";

    password2.insertAdjacentElement(
        "afterend",
        mensaje
    );

    function comprobar() {

        const valor1 =
            password.value;

        const valor2 =
            password2.value;

        if (!valor2) {

            mensaje.style.display =
                "none";

            password2.style.borderColor =
                "";

            return;
        }

        if (valor1 !== valor2) {

            mensaje.textContent =
                "Las contraseñas no coinciden.";

            mensaje.style.color =
                "#b42318";

            mensaje.style.display =
                "block";

            password2.style.borderColor =
                "#b42318";

        } else {

            mensaje.textContent =
                "Las contraseñas coinciden.";

            mensaje.style.color =
                "#16803c";

            mensaje.style.display =
                "block";

            password2.style.borderColor =
                "#16803c";
        }
    }

    password.addEventListener(
        "input",
        comprobar
    );

    password2.addEventListener(
        "input",
        comprobar
    );
}

function limpiarValidacionPasswords() {

    const password2 =
        document.getElementById(
            "registroPassword2"
        );

    if (!password2) return;

    const mensaje =
        password2.nextElementSibling;

    if (
        mensaje &&
        mensaje.tagName === "SMALL"
    ) {

        mensaje.style.display =
            "none";
    }

    password2.style.borderColor =
        "";
}

// ======================================================
// LOGIN
// ======================================================

function mostrarLogin() {

    const authPantalla =
        document.getElementById(
            "pantallaAuth"
        );

    const login =
        document.getElementById(
            "formLogin"
        );

    const registro =
        document.getElementById(
            "formRegistro"
        );

    if (authPantalla) {

        authPantalla.classList.remove(
            "oculto"
        );
    }

    if (login) {

        login.classList.remove(
            "oculto"
        );
    }

    if (registro) {

        registro.classList.add(
            "oculto"
        );
    }

    /*
     * MUY IMPORTANTE:
     * si estamos en login, la app queda
     * totalmente oculta.
     */

    const appPrincipal =
        document.getElementById(
            "appPrincipal"
        );

    if (appPrincipal) {

        appPrincipal.classList.add(
            "oculto"
        );
    }

    /*
     * Ocultamos también la navegación.
     */

    document
        .querySelectorAll(".navbar")
        .forEach(
            (navbar) => {

                navbar.classList.add(
                    "oculto"
                );
            }
        );

    const mensajeLogin =
        document.getElementById(
            "mensajeLogin"
        );

    const mensajeRegistro =
        document.getElementById(
            "mensajeRegistro"
        );

    if (mensajeLogin) {
        mensajeLogin.textContent = "";
    }

    if (mensajeRegistro) {
        mensajeRegistro.textContent = "";
    }
}

// ======================================================
// REGISTRO
// ======================================================

function mostrarRegistro() {

    const authPantalla =
        document.getElementById(
            "pantallaAuth"
        );

    const login =
        document.getElementById(
            "formLogin"
        );

    const registro =
        document.getElementById(
            "formRegistro"
        );

    if (authPantalla) {

        authPantalla.classList.remove(
            "oculto"
        );
    }

    if (login) {

        login.classList.add(
            "oculto"
        );
    }

    if (registro) {

        registro.classList.remove(
            "oculto"
        );
    }

    const appPrincipal =
        document.getElementById(
            "appPrincipal"
        );

    if (appPrincipal) {

        appPrincipal.classList.add(
            "oculto"
        );
    }

    document
        .querySelectorAll(".navbar")
        .forEach(
            (navbar) => {

                navbar.classList.add(
                    "oculto"
                );
            }
        );
}

// ======================================================
// CREAR CUENTA
// ======================================================

async function crearCuenta() {

    const nombre =
        document.getElementById(
            "registroNombre"
        )?.value.trim();

    const email =
        document.getElementById(
            "registroEmail"
        )?.value.trim().toLowerCase();

    const password =
        document.getElementById(
            "registroPassword"
        )?.value;

    const password2 =
        document.getElementById(
            "registroPassword2"
        )?.value;

    const mensaje =
        document.getElementById(
            "mensajeRegistro"
        );

    if (!nombre) {

        if (mensaje) {
            mensaje.textContent =
                "Ingresá tu nombre.";
        }

        return;
    }

    if (!emailValido(email)) {

        if (mensaje) {
            mensaje.textContent =
                "Ingresá un correo electrónico válido.";
        }

        return;
    }

    if (!password || password.length < 6) {

        if (mensaje) {
            mensaje.textContent =
                "La contraseña debe tener al menos 6 caracteres.";
        }

        return;
    }

    if (password !== password2) {

        if (mensaje) {
            mensaje.textContent =
                "Las contraseñas no coinciden.";
        }

        return;
    }

    try {

        if (mensaje) {

            mensaje.style.color = "";

            mensaje.textContent =
                "Creando cuenta...";
        }

        const credencial =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        await updateProfile(
            credencial.user,
            {
                displayName: nombre
            }
        );

        await setDoc(
            doc(
                db,
                "users",
                credencial.user.uid
            ),
            {
                nombre,
                email,
                creado:
                    new Date().toISOString()
            }
        );

        if (mensaje) {
            mensaje.textContent = "";
        }

    } catch (error) {

        console.error(
            "Error creando cuenta:",
            error
        );

        if (mensaje) {

            mensaje.style.color =
                "#b42318";

            mensaje.textContent =
                traducirErrorFirebase(
                    error
                );
        }
    }
}

// ======================================================
// INICIAR SESIÓN
// ======================================================

async function iniciarSesion() {

    const email =
        document.getElementById(
            "loginEmail"
        )?.value.trim().toLowerCase();

    const password =
        document.getElementById(
            "loginPassword"
        )?.value;

    const mensaje =
        document.getElementById(
            "mensajeLogin"
        );

    if (!emailValido(email)) {

        if (mensaje) {
            mensaje.textContent =
                "Ingresá un correo electrónico válido.";
        }

        return;
    }

    if (!password) {

        if (mensaje) {
            mensaje.textContent =
                "Ingresá tu contraseña.";
        }

        return;
    }

    try {

        if (mensaje) {

            mensaje.style.color = "";

            mensaje.textContent =
                "Ingresando...";
        }

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        if (mensaje) {
            mensaje.textContent = "";
        }

    } catch (error) {

        console.error(
            "Error iniciando sesión:",
            error
        );

        if (mensaje) {

            mensaje.style.color =
                "#b42318";

            mensaje.textContent =
                traducirErrorFirebase(
                    error
                );
        }
    }
}

// ======================================================
// CERRAR SESIÓN
// ======================================================

async function cerrarSesion() {

    try {

        await detenerScanner();

        await signOut(auth);

        /*
         * Ocultamos la app inmediatamente.
         * No esperamos a que la interfaz
         * termine de reaccionar.
         */

        const appPrincipal =
            document.getElementById(
                "appPrincipal"
            );

        if (appPrincipal) {

            appPrincipal.classList.add(
                "oculto"
            );
        }

        mostrarLogin();

    } catch (error) {

        console.error(
            "Error cerrando sesión:",
            error
        );
    }
}

// ======================================================
// ERRORES FIREBASE
// ======================================================

function traducirErrorFirebase(error) {

    if (!error) {

        return "Ocurrió un error. Intentá nuevamente.";
    }

    switch (error.code) {

        case "auth/email-already-in-use":
            return "Ese correo ya está registrado.";

        case "auth/invalid-email":
            return "El correo electrónico no es válido.";

        case "auth/weak-password":
            return "La contraseña debe tener al menos 6 caracteres.";

        case "auth/user-not-found":
            return "No existe una cuenta con ese correo.";

        case "auth/wrong-password":
            return "La contraseña es incorrecta.";

        case "auth/invalid-credential":
            return "El correo o la contraseña son incorrectos.";

        case "auth/too-many-requests":
            return "Demasiados intentos. Esperá unos minutos.";

        case "auth/network-request-failed":
            return "No hay conexión con Internet.";

        case "auth/operation-not-allowed":
            return "El registro con correo y contraseña no está habilitado en Firebase.";

        case "auth/invalid-api-key":
        case "auth/api-key-not-valid":
            return "La clave de Firebase no es válida.";

        case "auth/unauthorized-domain":
            return "Este sitio no está autorizado en Firebase Authentication.";

        case "auth/configuration-not-found":
            return "No se encontró la configuración de Firebase Authentication.";

        default:

            return (
                error.message ||
                "Ocurrió un error. Intentá nuevamente."
            );
    }
}

// ======================================================
// FIRESTORE
// ======================================================

function rutaProductos() {

    if (!usuarioActual) {
        return null;
    }

    return collection(
        db,
        "users",
        usuarioActual.uid,
        "productos"
    );
}

function rutaCompras() {

    if (!usuarioActual) {
        return null;
    }

    return collection(
        db,
        "users",
        usuarioActual.uid,
        "listaCompras"
    );
}

// ======================================================
// CARGAR DATOS
// ======================================================

async function cargarDatosUsuario() {

    if (!usuarioActual) {
        return;
    }

    try {

        productos = [];
        listaCompras = [];

        const productosRef =
            rutaProductos();

        const comprasRef =
            rutaCompras();

        if (productosRef) {

            const snapshotProductos =
                await getDocs(
                    productosRef
                );

            snapshotProductos.forEach(
                (documento) => {

                    productos.push({
                        id: documento.id,
                        ...documento.data()
                    });
                }
            );
        }

        if (comprasRef) {

            const snapshotCompras =
                await getDocs(
                    comprasRef
                );

            snapshotCompras.forEach(
                (documento) => {

                    listaCompras.push({
                        id: documento.id,
                        ...documento.data()
                    });
                }
            );
        }

        renderizarTodo();

    } catch (error) {

        console.error(
            "Error cargando datos:",
            error
        );
    }
}

// ======================================================
// GUARDAR PRODUCTO
// ======================================================

async function guardarProductoFirebase(
    producto
) {

    if (!usuarioActual) {
        throw new Error(
            "No hay usuario conectado."
        );
    }

    await setDoc(
        doc(
            db,
            "users",
            usuarioActual.uid,
            "productos",
            producto.id
        ),
        producto
    );
}

// ======================================================
// ELIMINAR PRODUCTO
// ======================================================

async function eliminarProductoFirebase(
    id
) {

    if (!usuarioActual) {
        return;
    }

    await deleteDoc(
        doc(
            db,
            "users",
            usuarioActual.uid,
            "productos",
            id
        )
    );
}

// ======================================================
// CATEGORÍAS
// ======================================================

function prepararCategorias() {

    const contenedor =
        document.getElementById(
            "listaCategorias"
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    const todas =
        document.createElement(
            "button"
        );

    todas.type = "button";

    todas.textContent =
        "Todas";

    todas.className =
        categoriaFiltro === "Todas"
            ? "categoria activa"
            : "categoria";

    todas.addEventListener(
        "click",
        () => {

            categoriaFiltro =
                "Todas";

            prepararCategorias();

            renderStock();
        }
    );

    contenedor.appendChild(
        todas
    );

    categorias.forEach(
        (categoria) => {

            const boton =
                document.createElement(
                    "button"
                );

            boton.type = "button";

            boton.textContent =
                categoria;

            boton.className =
                categoriaFiltro === categoria
                    ? "categoria activa"
                    : "categoria";

            boton.addEventListener(
                "click",
                () => {

                    categoriaFiltro =
                        categoria;

                    prepararCategorias();

                    renderStock();
                }
            );

            contenedor.appendChild(
                boton
            );
        }
    );
}

// ======================================================
// FORMULARIO
// ======================================================

function prepararFormulario() {

    const categoria =
        document.getElementById(
            "categoriaProducto"
        );

    const tipoPresentacion =
        document.getElementById(
            "tipoPresentacion"
        );

    if (categoria) {

        categoria.innerHTML = "";

        categorias.forEach(
            (item) => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item;

                option.textContent =
                    item;

                categoria.appendChild(
                    option
                );
            }
        );

        categoria.addEventListener(
            "change",
            mostrarCamposElaboracion
        );
    }

    if (tipoPresentacion) {

        tipoPresentacion.addEventListener(
            "change",
            mostrarCamposElaboracion
        );
    }

    mostrarCamposElaboracion();
}

function mostrarCamposElaboracion() {

    const categoria =
        document.getElementById(
            "categoriaProducto"
        );

    const campos =
        document.getElementById(
            "camposElaboracion"
        );

    if (!categoria || !campos) {
        return;
    }

    if (
        categoria.value ===
        "Elaboración propia"
    ) {

        campos.classList.remove(
            "oculto"
        );

    } else {

        campos.classList.add(
            "oculto"
        );
    }
}

// ======================================================
// ABRIR FORMULARIO
// ======================================================

function abrirFormularioProducto() {

    productoEditando = null;

    cantidadFormulario = 1;
    minimoFormulario = 1;

    const formulario =
        document.getElementById(
            "formProducto"
        );

    if (formulario) {
        formulario.reset();
    }

    const titulo =
        document.getElementById(
            "tituloFormulario"
        );

    if (titulo) {

        titulo.textContent =
            "Agregar producto";
    }

    const editando =
        document.getElementById(
            "productoEditando"
        );

    if (editando) {

        editando.value = "";
    }

    actualizarCantidadFormulario();
    actualizarMinimoFormulario();
    mostrarCamposElaboracion();

    mostrarPantalla(
        "formulario"
    );
}

// ======================================================
// EDITAR PRODUCTO
// ======================================================

function editarProducto(id) {

    const producto =
        productos.find(
            (item) =>
                item.id === id
        );

    if (!producto) {
        return;
    }

    productoEditando =
        producto;

    const titulo =
        document.getElementById(
            "tituloFormulario"
        );

    if (titulo) {

        titulo.textContent =
            "Editar producto";
    }

    const editando =
        document.getElementById(
            "productoEditando"
        );

    if (editando) {

        editando.value =
            producto.id;
    }

    const nombre =
        document.getElementById(
            "nombreProducto"
        );

    if (nombre) {

        nombre.value =
            producto.nombre || "";
    }

    const categoria =
        document.getElementById(
            "categoriaProducto"
        );

    if (categoria) {

        categoria.value =
            producto.categoria ||
            "Otros";
    }

    const fechaElaboracion =
        document.getElementById(
            "fechaElaboracion"
        );

    if (fechaElaboracion) {

        fechaElaboracion.value =
            producto.fechaElaboracion ||
            "";
    }

    const duracion =
        document.getElementById(
            "duracionElaboracion"
        );

    if (duracion) {

        duracion.value =
            producto.duracionElaboracion ||
            "";
    }

    const tipoPresentacion =
        document.getElementById(
            "tipoPresentacion"
        );

    if (tipoPresentacion) {

        tipoPresentacion.value =
            producto.tipoPresentacion ||
            "";
    }

    const presentacion =
        document.getElementById(
            "presentacionProducto"
        );

    if (presentacion) {

        presentacion.value =
            producto.presentacion ||
            "";
    }

    const codigo =
        document.getElementById(
            "codigoProducto"
        );

    if (codigo) {

        codigo.value =
            producto.codigo ||
            "";
    }

    const vencimiento =
        document.getElementById(
            "vencimientoProducto"
        );

    if (vencimiento) {

        vencimiento.value =
            producto.vencimiento ||
            "";
    }

    cantidadFormulario =
        Math.max(
            1,
            Number(producto.cantidad) || 1
        );

    minimoFormulario =
        Math.max(
            0,
            Number(producto.minimo) || 0
        );

    actualizarCantidadFormulario();
    actualizarMinimoFormulario();
    mostrarCamposElaboracion();

    mostrarPantalla(
        "formulario"
    );
}

// ======================================================
// CANTIDAD FORMULARIO
// ======================================================

function cambiarCantidadFormulario(
    valor
) {

    cantidadFormulario +=
        Number(valor) || 0;

    if (cantidadFormulario < 1) {

        cantidadFormulario = 1;
    }

    actualizarCantidadFormulario();
}

function actualizarCantidadFormulario() {

    const elemento =
        document.getElementById(
            "cantidadFormulario"
        );

    if (elemento) {

        elemento.textContent =
            cantidadFormulario;
    }
}

// ======================================================
// MÍNIMO FORMULARIO
// ======================================================

function cambiarMinimoFormulario(
    valor
) {

    minimoFormulario +=
        Number(valor) || 0;

    if (minimoFormulario < 0) {

        minimoFormulario = 0;
    }

    actualizarMinimoFormulario();
}

function actualizarMinimoFormulario() {

    const elemento =
        document.getElementById(
            "minimoFormulario"
        );

    if (elemento) {

        elemento.textContent =
            minimoFormulario;
    }
}

// ======================================================
// GUARDAR PRODUCTO
// ======================================================

async function guardarProducto(event) {

    if (event) {
        event.preventDefault();
    }

    if (!usuarioActual) {
        return;
    }

    const nombre =
        document.getElementById(
            "nombreProducto"
        )?.value.trim();

    const categoria =
        document.getElementById(
            "categoriaProducto"
        )?.value;

    const fechaElaboracion =
        document.getElementById(
            "fechaElaboracion"
        )?.value || "";

    const duracionElaboracion =
        document.getElementById(
            "duracionElaboracion"
        )?.value || "";

    const tipoPresentacion =
        document.getElementById(
            "tipoPresentacion"
        )?.value || "";

    const presentacion =
        document.getElementById(
            "presentacionProducto"
        )?.value.trim() || "";

    const codigo =
        document.getElementById(
            "codigoProducto"
        )?.value.trim() || "";

    const vencimiento =
        document.getElementById(
            "vencimientoProducto"
        )?.value || "";

    if (!nombre) {

        alert(
            "Ingresá el nombre del producto."
        );

        return;
    }

    /*
     * Evitamos tener dos productos con
     * el mismo código de barras.
     */

    if (codigo) {

        const duplicado =
            productos.find(
                (item) =>
                    item.id !==
                        productoEditando?.id &&
                    String(
                        item.codigo || ""
                    ).trim() === codigo
            );

        if (duplicado) {

            alert(
                `Ese código ya está asignado a "${duplicado.nombre}".`
            );

            return;
        }
    }

    const id =
        productoEditando
            ? productoEditando.id
            : generarId();

    const producto = {

        id,

        nombre,

        categoria,

        fechaElaboracion,

        duracionElaboracion,

        tipoPresentacion,

        presentacion,

        codigo,

        cantidad:
            cantidadFormulario,

        minimo:
            minimoFormulario,

        vencimiento,

        actualizado:
            new Date().toISOString()
    };

    try {

        await guardarProductoFirebase(
            producto
        );

        const indice =
            productos.findIndex(
                (item) =>
                    item.id === id
            );

        if (indice >= 0) {

            productos[indice] =
                producto;

        } else {

            productos.push(
                producto
            );
        }

        renderizarTodo();

        mostrarPantalla(
            "inicio"
        );

    } catch (error) {

        console.error(
            "Error guardando producto:",
            error
        );

        alert(
            "No se pudo guardar el producto."
        );
    }
}

// ======================================================
// ELIMINAR PRODUCTO
// ======================================================

async function eliminarProducto(id) {

    const producto =
        productos.find(
            (item) =>
                item.id === id
        );

    if (!producto) {
        return;
    }

    if (
        !confirm(
            `¿Querés eliminar "${producto.nombre}"?`
        )
    ) {

        return;
    }

    try {

        await eliminarProductoFirebase(
            id
        );

        productos =
            productos.filter(
                (item) =>
                    item.id !== id
            );

        renderizarTodo();

        mostrarPantalla(
            "stock"
        );

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo eliminar el producto."
        );
    }
}

// ======================================================
// ID
// ======================================================

function generarId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2, 8)
    );
}

// ======================================================
// STOCK
// ======================================================

function renderStock() {

    const contenedor =
        document.getElementById(
            "listaStock"
        );

    if (!contenedor) {
        return;
    }

    const buscador =
        document.getElementById(
            "buscarStock"
        );

    const texto =
        buscador
            ? buscador.value
                .trim()
                .toLowerCase()
            : "";

    const filtrados =
        productos.filter(
            (producto) => {

                const coincideCategoria =
                    categoriaFiltro ===
                        "Todas" ||
                    producto.categoria ===
                        categoriaFiltro;

                const nombre =
                    String(
                        producto.nombre || ""
                    ).toLowerCase();

                const codigo =
                    String(
                        producto.codigo || ""
                    ).toLowerCase();

                const coincideBusqueda =
                    !texto ||
                    nombre.includes(texto) ||
                    codigo.includes(texto);

                return (
                    coincideCategoria &&
                    coincideBusqueda
                );
            }
        );

    contenedor.innerHTML = "";

    if (
        filtrados.length === 0
    ) {

        contenedor.innerHTML = `
            <p class="sin-resultados">
                No hay productos para mostrar.
            </p>
        `;

        return;
    }

    filtrados.forEach(
        (producto) => {

            const tarjeta =
                document.createElement(
                    "div"
                );

            tarjeta.className =
                "tarjeta-producto";

            const cantidad =
                Number(
                    producto.cantidad
                ) || 0;

            const minimo =
                Number(
                    producto.minimo
                ) || 0;

            let claseEstado = "";

            if (cantidad <= 0) {

                claseEstado =
                    "agotado";

            } else if (
                cantidad <= minimo
            ) {

                claseEstado =
                    "bajo";
            }

            tarjeta.innerHTML = `
                <div class="producto-info">

                    <h3>
                        ${escaparHTML(
                            producto.nombre
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            producto.categoria || ""
                        )}
                    </p>

                    ${
                        producto.presentacion
                            ? `
                                <p>
                                    ${escaparHTML(
                                        producto.presentacion
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        producto.codigo
                            ? `
                                <p>
                                    Código:
                                    ${escaparHTML(
                                        producto.codigo
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>

                <div class="producto-cantidad ${claseEstado}">
                    ${cantidad}
                </div>
            `;

            tarjeta.addEventListener(
                "click",
                () =>
                    mostrarDetalleProducto(
                        producto.id
                    )
            );

            contenedor.appendChild(
                tarjeta
            );
        }
    );
}

// ======================================================
// BUSCADOR
// ======================================================

function prepararBuscador() {

    const buscador =
        document.getElementById(
            "buscarStock"
        );

    if (!buscador) {
        return;
    }

    buscador.addEventListener(
        "input",
        renderStock
    );
}

function filtrarStock() {
    renderStock();
}

function abrirBusqueda() {

    mostrarPantalla(
        "stock"
    );

    const buscador =
        document.getElementById(
            "buscarStock"
        );

    if (buscador) {

        setTimeout(
            () => buscador.focus(),
            150
        );
    }
}

// ======================================================
// DETALLE
// ======================================================

function mostrarDetalleProducto(id) {

    const producto =
        productos.find(
            (item) =>
                item.id === id
        );

    if (!producto) {
        return;
    }

    const contenedor =
        document.getElementById(
            "detalleProducto"
        );

    if (!contenedor) {
        return;
    }

    const cantidad =
        Number(
            producto.cantidad
        ) || 0;

    contenedor.innerHTML = `

        <div class="detalle-producto">

            <h2>
                ${escaparHTML(
                    producto.nombre
                )}
            </h2>

            <p>
                Categoría:
                ${escaparHTML(
                    producto.categoria || ""
                )}
            </p>

            <p>
                Cantidad:
                <strong>
                    ${cantidad}
                </strong>
            </p>

            <p>
                Mínimo:
                ${
                    Number(
                        producto.minimo
                    ) || 0
                }
            </p>

            ${
                producto.presentacion
                    ? `
                        <p>
                            Presentación:
                            ${escaparHTML(
                                producto.presentacion
                            )}
                        </p>
                    `
                    : ""
            }

            ${
                producto.codigo
                    ? `
                        <p>
                            Código:
                            ${escaparHTML(
                                producto.codigo
                            )}
                        </p>
                    `
                    : ""
            }

            ${
                producto.vencimiento
                    ? `
                        <p>
                            Vencimiento:
                            ${formatearFecha(
                                producto.vencimiento
                            )}
                        </p>
                    `
                    : ""
            }

            <div class="acciones-detalle">

                <button
                    type="button"
                    onclick="editarProducto('${producto.id}')"
                >
                    Editar
                </button>

                <button
                    type="button"
                    onclick="eliminarProducto('${producto.id}')"
                >
                    Eliminar
                </button>

            </div>

        </div>
    `;

    mostrarPantalla(
        "detalle"
    );
}

// ======================================================
// VENCIMIENTOS
// ======================================================

function renderizarVencimientos() {

    const contenedor =
        document.getElementById(
            "listaVencimientos"
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    const hoy =
        inicioDelDia(
            new Date()
        );

    const conVencimiento =
        productos
            .filter(
                (producto) =>
                    producto.vencimiento
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.vencimiento
                    ) -
                    new Date(
                        b.vencimiento
                    )
            );

    const filtrados =
        conVencimiento.filter(
            (producto) => {

                const fecha =
                    inicioDelDia(
                        new Date(
                            producto.vencimiento
                        )
                    );

                const diferencia =
                    Math.round(
                        (
                            fecha - hoy
                        ) /
                        86400000
                    );

                if (
                    filtroVencimientoActual ===
                    "vencidos"
                ) {

                    return diferencia < 0;
                }

                if (
                    filtroVencimientoActual ===
                    "hoy"
                ) {

                    return diferencia === 0;
                }

                if (
                    filtroVencimientoActual ===
                    "proximos"
                ) {

                    return (
                        diferencia >= 0 &&
                        diferencia <= 7
                    );
                }

                return true;
            }
        );

    if (!filtrados.length) {

        contenedor.innerHTML = `
            <p class="sin-resultados">
                No hay productos en este período.
            </p>
        `;

        return;
    }

    filtrados.forEach(
        (producto) => {

            const tarjeta =
                document.createElement(
                    "div"
                );

            tarjeta.className =
                "tarjeta-vencimiento";

            tarjeta.innerHTML = `
                <strong>
                    ${escaparHTML(
                        producto.nombre
                    )}
                </strong>

                <span>
                    ${formatearFecha(
                        producto.vencimiento
                    )}
                </span>
            `;

            contenedor.appendChild(
                tarjeta
            );
        }
    );
}

function filtrarVencimientos(
    tipo,
    boton
) {

    filtroVencimientoActual =
        tipo || "proximos";

    document
        .querySelectorAll(
            ".filtro-vencimiento"
        )
        .forEach(
            (elemento) => {

                elemento.classList.remove(
                    "activo"
                );
            }
        );

    if (boton) {

        boton.classList.add(
            "activo"
        );
    }

    renderizarVencimientos();
}

// ======================================================
// LISTA DE COMPRAS
// ======================================================

async function guardarCompraFirebase(
    compra
) {

    if (!usuarioActual) {
        return;
    }

    await setDoc(
        doc(
            db,
            "users",
            usuarioActual.uid,
            "listaCompras",
            compra.id
        ),
        compra
    );
}

async function eliminarCompraFirebase(
    id
) {

    if (!usuarioActual) {
        return;
    }

    await deleteDoc(
        doc(
            db,
            "users",
            usuarioActual.uid,
            "listaCompras",
            id
        )
    );
}

async function agregarCompraManual() {

    const nombre =
        prompt(
            "¿Qué producto querés agregar a la lista de compras?"
        );

    if (!nombre?.trim()) {
        return;
    }

    const compra = {

        id:
            generarId(),

        nombre:
            nombre.trim(),

        cantidad:
            1,

        creada:
            new Date().toISOString()
    };

    try {

        await guardarCompraFirebase(
            compra
        );

        listaCompras.push(
            compra
        );

        renderizarListaCompras();
        actualizarResumen();

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo agregar el producto."
        );
    }
}

async function eliminarItemCompra(id) {

    try {

        await eliminarCompraFirebase(
            id
        );

        listaCompras =
            listaCompras.filter(
                (item) =>
                    item.id !== id
            );

        renderizarListaCompras();
        actualizarResumen();

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo eliminar el producto."
        );
    }
}

function renderizarListaCompras() {

    const contenedor =
        document.getElementById(
            "listaCompras"
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    if (!listaCompras.length) {

        contenedor.innerHTML = `
            <p class="sin-resultados">
                No hay productos en la lista.
            </p>
        `;

        return;
    }

    listaCompras.forEach(
        (compra) => {

            const elemento =
                document.createElement(
                    "div"
                );

            elemento.className =
                "item-compra";

            elemento.innerHTML = `
                <span>
                    ${escaparHTML(
                        compra.nombre
                    )}
                </span>

                <button
                    type="button"
                    onclick="eliminarItemCompra('${compra.id}')"
                >
                    ×
                </button>
            `;

            contenedor.appendChild(
                elemento
            );
        }
    );
}

// ======================================================
// ALERTAS
// ======================================================

function renderizarAlertas() {

    const contenedor =
        document.getElementById(
            "listaAlertas"
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    const alertas =
        productos.filter(
            (producto) => {

                const cantidad =
                    Number(
                        producto.cantidad
                    ) || 0;

                const minimo =
                    Number(
                        producto.minimo
                    ) || 0;

                return cantidad <= minimo;
            }
        );

    if (!alertas.length) {

        contenedor.innerHTML = `
            <p>
                No hay alertas de stock.
            </p>
        `;

        return;
    }

    alertas.forEach(
        (producto) => {

            const elemento =
                document.createElement(
                    "div"
                );

            elemento.className =
                "alerta-stock";

            elemento.innerHTML = `
                <strong>
                    ${escaparHTML(
                        producto.nombre
                    )}
                </strong>

                <span>
                    Stock:
                    ${
                        Number(
                            producto.cantidad
                        ) || 0
                    }
                </span>
            `;

            contenedor.appendChild(
                elemento
            );
        }
    );
}

// ======================================================
// RESUMEN
// ======================================================

function actualizarResumen() {

    const cantidadProductos =
        document.getElementById(
            "cantidadProductos"
        );

    const cantidadUnidades =
        document.getElementById(
            "cantidadUnidades"
        );

    const cantidadAlertas =
        document.getElementById(
            "cantidadAlertas"
        );

    const cantidadCompras =
        document.getElementById(
            "cantidadCompras"
        );

    const unidades =
        productos.reduce(
            (total, producto) =>
                total +
                (
                    Number(
                        producto.cantidad
                    ) || 0
                ),
            0
        );

    const alertas =
        productos.filter(
            (producto) =>
                (
                    Number(
                        producto.cantidad
                    ) || 0
                ) <=
                (
                    Number(
                        producto.minimo
                    ) || 0
                )
        ).length;

    if (cantidadProductos) {

        cantidadProductos.textContent =
            productos.length;
    }

    if (cantidadUnidades) {

        cantidadUnidades.textContent =
            unidades;
    }

    if (cantidadAlertas) {

        cantidadAlertas.textContent =
            alertas;
    }

    if (cantidadCompras) {

        cantidadCompras.textContent =
            listaCompras.length;
    }
}

// ======================================================
// RENDER TODO
// ======================================================

function renderizarTodo() {

    actualizarResumen();

    renderStock();

    renderizarVencimientos();

    renderizarListaCompras();

    renderizarAlertas();

    prepararCategorias();
}

// ======================================================
// SCANNER
// ======================================================

function seleccionarModoScanner(modo) {

    modoScanner =
        modo === "usar"
            ? "usar"
            : "agregar";

    const botonAgregar =
        document.getElementById(
            "modoAgregar"
        );

    const botonUsar =
        document.getElementById(
            "modoUsar"
        );

    if (botonAgregar) {

        botonAgregar.classList.toggle(
            "activo",
            modoScanner === "agregar"
        );
    }

    if (botonUsar) {

        botonUsar.classList.toggle(
            "activo",
            modoScanner === "usar"
        );
    }

    mostrarMensajeScanner(
        modoScanner === "agregar"
            ? "Modo agregar seleccionado."
            : "Modo usar seleccionado."
    );
}

// ======================================================
// INICIAR SCANNER
// ======================================================

async function iniciarScanner() {

    if (
        scannerActivo ||
        iniciandoScanner
    ) {
        return;
    }

    const elemento =
        document.getElementById(
            "lectorCodigo"
        );

    const mensaje =
        document.getElementById(
            "mensajeScanner"
        );

    const botonIniciar =
        document.getElementById(
            "botonIniciarScanner"
        );

    const botonDetener =
        document.getElementById(
            "botonDetenerScanner"
        );

    if (!elemento) {
        return;
    }

    if (
        typeof window.Html5Qrcode ===
        "undefined"
    ) {

        if (mensaje) {

            mensaje.textContent =
                "No se pudo cargar el lector de códigos.";
        }

        return;
    }

    iniciandoScanner = true;

    if (botonIniciar) {

        botonIniciar.classList.add(
            "oculto"
        );
    }

    if (mensaje) {

        mensaje.textContent =
            "Solicitando acceso a la cámara...";
    }

    try {

        /*
         * Limpiamos cualquier instancia
         * anterior.
         */

        if (scanner) {

            try {

                if (scannerActivo) {

                    await scanner.stop();
                }

            } catch (e) {

                console.warn(e);
            }

            try {

                await scanner.clear();

            } catch (e) {

                console.warn(e);
            }

            scanner = null;
            scannerActivo = false;
        }

        elemento.innerHTML = "";

        scanner =
            new window.Html5Qrcode(
                "lectorCodigo"
            );

        /*
         * Tomamos solamente los formatos
         * que realmente existen en la versión
         * de html5-qrcode cargada.
         */

        const formatos = [];

        const F =
            window.Html5QrcodeSupportedFormats;

        if (F) {

            [
                "EAN_13",
                "EAN_8",
                "UPC_A",
                "UPC_E",
                "CODE_128",
                "CODE_39",
                "ITF"
            ].forEach(
                (nombre) => {

                    if (
                        F[nombre] !==
                        undefined
                    ) {

                        formatos.push(
                            F[nombre]
                        );
                    }
                }
            );
        }

        const configuracion = {

            fps: 10,

            qrbox: {
                width: 280,
                height: 140
            },

            aspectRatio:
                1.777778,

            ...(formatos.length
                ? {
                    formatsToSupport:
                        formatos
                }
                : {})
        };

        await scanner.start(

            {
                facingMode:
                    "environment"
            },

            configuracion,

            (codigo) => {

                manejarLecturaScanner(codigo);
            },

            () => {}
        );

        scannerActivo = true;

        if (mensaje) {

            mensaje.textContent =
                "📷 Cámara activa. Apuntá al código de barras.";
        }

        if (botonDetener) {

            botonDetener.classList.remove(
                "oculto"
            );
        }

    } catch (error) {

        console.error(
            "Error iniciando scanner:",
            error
        );

        scanner = null;
        scannerActivo = false;

        if (botonIniciar) {

            botonIniciar.classList.remove(
                "oculto"
            );
        }

        if (botonDetener) {

            botonDetener.classList.add(
                "oculto"
            );
        }

        if (mensaje) {

            if (
                error?.name ===
                "NotAllowedError"
            ) {

                mensaje.textContent =
                    "Permiso de cámara denegado.";

            } else if (
                error?.name ===
                "NotFoundError"
            ) {

                mensaje.textContent =
                    "No encontramos una cámara.";

            } else if (
                error?.name ===
                "NotReadableError"
            ) {

                mensaje.textContent =
                    "La cámara está siendo utilizada por otra aplicación.";

            } else {

                mensaje.textContent =
                    "No se pudo iniciar la cámara.";
            }
        }

    } finally {

        iniciandoScanner = false;
    }
}

// ======================================================
// LECTURA SCANNER
// ======================================================

async function manejarLecturaScanner(
    codigo
) {

    codigo =
        String(codigo || "").trim();

    if (!codigo) {
        return;
    }

    if (procesandoCodigo) {
        return;
    }

    procesandoCodigo = true;

    try {

        // Mostrar claramente que se detectó
        mostrarMensajeScanner(
            `✅ ¡CÓDIGO ESCANEADO! ${codigo}`
        );

        // Detener cámara inmediatamente
        await detenerScanner();

        // Dar tiempo a que la cámara se cierre
        await new Promise(
            (resolve) =>
                setTimeout(resolve, 300)
        );

        // Procesar producto
        await procesarCodigoEscaneado(
            codigo
        );

    } catch (error) {

        console.error(
            "Error procesando código:",
            error
        );

        mostrarMensajeScanner(
            "❌ Ocurrió un error al procesar el código."
        );

    } finally {

        procesandoCodigo = false;
    }
}

// ======================================================
// DETENER SCANNER
// ======================================================

async function detenerScanner() {

    const botonIniciar =
        document.getElementById(
            "botonIniciarScanner"
        );

    const botonDetener =
        document.getElementById(
            "botonDetenerScanner"
        );

    const elemento =
        document.getElementById(
            "lectorCodigo"
        );

    if (!scanner) {

        scannerActivo = false;
        iniciandoScanner = false;

        if (botonIniciar) {

            botonIniciar.classList.remove(
                "oculto"
            );
        }

        if (botonDetener) {

            botonDetener.classList.add(
                "oculto"
            );
        }

        return;
    }

    try {

        if (scannerActivo) {

            await scanner.stop();
        }

    } catch (error) {

        console.warn(
            "Error deteniendo cámara:",
            error
        );

    } finally {

        try {

            await scanner.clear();

        } catch (error) {

            console.warn(
                "Error limpiando scanner:",
                error
            );
        }

        scanner = null;

        scannerActivo = false;

        iniciandoScanner = false;

        procesandoCodigo = false;

        if (elemento) {

            elemento.innerHTML = "";
        }

        if (botonIniciar) {

            botonIniciar.classList.remove(
                "oculto"
            );
        }

        if (botonDetener) {

            botonDetener.classList.add(
                "oculto"
            );
        }
    }
}

// ======================================================
// ABRIR ESCÁNER
// ======================================================

function abrirEscaner() {

    mostrarPantalla(
        "escanear"
    );
}

// ======================================================
// CERRAR ESCÁNER
// ======================================================

async function cerrarEscaner() {

    await detenerScanner();

    mostrarPantalla(
        "inicio"
    );
}

// ======================================================
// PROCESAR CÓDIGO
// ======================================================

async function procesarCodigoEscaneado(
    codigo
) {

    codigo =
        String(codigo || "").trim();

    if (!codigo) {
        return;
    }

    console.log(
        "🔴 PROCESANDO CÓDIGO:",
        codigo
    );

    const producto =
        productos.find(
            (item) =>
                String(
                    item.codigo || ""
                ).trim() === codigo
        );

    if (producto) {

        console.log(
            "🟢 PRODUCTO ENCONTRADO:",
            producto.nombre
        );

        mostrarMensajeScanner(
            `✅ Producto detectado: ${producto.nombre}`
        );

        await detenerScanner();

        await new Promise(
            (resolve) =>
                setTimeout(resolve, 500)
        );

        abrirFormularioProducto(
            producto
        );

        return;
    }

    console.log(
        "🟡 PRODUCTO NO ENCONTRADO. BUSCANDO EN OPEN FOOD FACTS..."
    );

    mostrarMensajeScanner(
        "Producto no encontrado. Buscando..."
    );

    await buscarProductoOpenFoodFacts(
        codigo
    );
}

// ======================================================
// OPEN FOOD FACTS
// ======================================================

async function buscarProductoOpenFoodFacts(
    codigo
) {

    try {

        const respuesta =
            await fetch(
                `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
                    codigo
                )}.json`
            );

        if (!respuesta.ok) {

            throw new Error(
                "Error consultando Open Food Facts"
            );
        }

        const datos =
            await respuesta.json();

        if (
            datos.status !== 1 ||
            !datos.product
        ) {

            mostrarMensajeScanner(
                "No encontramos el producto. Podés cargarlo manualmente."
            );

            return;
        }

        const info =
            datos.product;

        const nombre =
            info.product_name ||
            info.product_name_es ||
            "";

        const marca =
            info.brands ||
            "";

        if (!nombre) {

            mostrarMensajeScanner(
                "Encontramos el código, pero no el nombre."
            );

            return;
        }

        const producto = {

            id:
                generarId(),

            nombre:
                marca
                    ? `${nombre} - ${marca}`
                    : nombre,

            categoria:
                detectarCategoriaOpenFoodFacts(
                    info
                ),

            fechaElaboracion:
                "",

            duracionElaboracion:
                "",

            tipoPresentacion:
                "Unidad",

            presentacion:
                "",

            codigo,

            cantidad:
                1,

            minimo:
                1,

            vencimiento:
                "",

            actualizado:
                new Date().toISOString()
        };

        // Agregamos temporalmente el producto
        // a la lista para poder editarlo
        productos.push(
            producto
        );

        // Abrimos el formulario para completar
        // cantidad, vencimiento, mínimo, etc.
        abrirFormularioProducto(
            producto
        );

    } catch (error) {

        console.error(
            "Open Food Facts:",
            error
        );

        mostrarMensajeScanner(
            "No pudimos consultar el producto. Podés cargarlo manualmente."
        );
    }
}

function detectarCategoriaOpenFoodFacts(
    producto
) {

    const texto = [

        producto.categories || "",

        producto.categories_tags
            ? producto.categories_tags.join(" ")
            : "",

        producto.product_name || ""

    ]
        .join(" ")
        .toLowerCase();

    if (
        texto.includes("milk") ||
        texto.includes("lact") ||
        texto.includes("leche") ||
        texto.includes("yog")
    ) {

        return "Lácteos";
    }

    if (
        texto.includes("pasta") ||
        texto.includes("noodle") ||
        texto.includes("fideo")
    ) {

        return "Pastas";
    }

    if (
        texto.includes("drink") ||
        texto.includes("beverage") ||
        texto.includes("bebida")
    ) {

        return "Bebidas";
    }

    if (
        texto.includes("canned") ||
        texto.includes("enlat")
    ) {

        return "Enlatados";
    }

    if (
        texto.includes("sweet") ||
        texto.includes("chocolate") ||
        texto.includes("candy")
    ) {

        return "Dulces";
    }

    if (
        texto.includes("sauce") ||
        texto.includes("salsa")
    ) {

        return "Salsas";
    }

    if (
        texto.includes("spice") ||
        texto.includes("condiment")
    ) {

        return "Condimentos";
    }

    return "Otros";
}

// ======================================================
// PRODUCTO → LISTA COMPRAS
// ======================================================

async function agregarProductoACompras(
    producto
) {

    const yaExiste =
        listaCompras.some(
            (item) =>
                item.productoId ===
                producto.id
        );

    if (yaExiste) {
        return;
    }

    const compra = {

        id:
            generarId(),

        productoId:
            producto.id,

        nombre:
            producto.nombre,

        cantidad:
            1,

        creada:
            new Date().toISOString()
    };

    try {

        await guardarCompraFirebase(
            compra
        );

        listaCompras.push(
            compra
        );

        renderizarListaCompras();
        actualizarResumen();

    } catch (error) {

        console.error(error);
    }
}

// ======================================================
// MENSAJE SCANNER
// ======================================================

function mostrarMensajeScanner(
    texto
) {

    const mensaje =
        document.getElementById(
            "mensajeScanner"
        );

    if (!mensaje) {
        return;
    }

    mensaje.textContent =
        texto;

    mensaje.classList.remove(
        "oculto"
    );
}

// ======================================================
// NAVEGACIÓN
// ======================================================

function mostrarPantalla(
    pantallaSolicitada
) {

    /*
     * Si no hay usuario, NO permitimos
     * entrar a ninguna pantalla de la app.
     */

    if (!usuarioActual) {

        ocultarAplicacionCompleta();

        return;
    }

    /*
     * Aceptamos:
     *
     * "inicio"
     * "stock"
     * "escanear"
     * "categorias"
     * "vencimientos"
     * "lista"
     * "detalle"
     * "formulario"
     *
     * y también:
     *
     * "pantalla-inicio"
     * etc.
     */

    let nombre =
        String(
            pantallaSolicitada || ""
        );

    nombre =
        nombre.replace(
            /^pantalla-/,
            ""
        );

    const pantallas =
        document.querySelectorAll(
            "#appPrincipal [id^='pantalla-']"
        );

    pantallas.forEach(
        (pantalla) => {

            pantalla.classList.add(
                "oculto"
            );
        }
    );

    const destino =
        document.getElementById(
            `pantalla-${nombre}`
        );

    if (!destino) {

        console.warn(
            `No existe la pantalla: pantalla-${nombre}`
        );

        return;
    }

    destino.classList.remove(
        "oculto"
    );

    /*
     * Si salimos del scanner,
     * apagamos la cámara.
     */

    if (
        nombre !== "escanear"
    ) {

        if (
            scanner ||
            scannerActivo ||
            iniciandoScanner
        ) {

            detenerScanner();
        }
    }

    /*
     * Solo iniciamos el scanner cuando
     * realmente entramos en esa pantalla.
     */

    if (
        nombre === "escanear"
    ) {

        setTimeout(
            () => {

                if (
                    usuarioActual &&
                    !scannerActivo &&
                    !iniciandoScanner
                ) {

                    iniciarScanner();
                }

            },
            300
        );
    }

    if (
        nombre === "stock"
    ) {

        renderStock();
    }

    if (
        nombre === "vencimientos"
    ) {

        renderizarVencimientos();
    }

    if (
        nombre === "lista"
    ) {

        renderizarListaCompras();
    }
}

// ======================================================
// MODAL
// ======================================================

function cerrarModal() {

    const modal =
        document.getElementById(
            "modal"
        );

    if (modal) {

        modal.classList.add(
            "oculto"
        );
    }
}

// ======================================================
// FECHAS
// ======================================================

function inicioDelDia(
    fecha
) {

    const nueva =
        new Date(fecha);

    nueva.setHours(
        0,
        0,
        0,
        0
    );

    return nueva;
}

function formatearFecha(
    fecha
) {

    if (!fecha) {
        return "";
    }

    const partes =
        String(fecha).split("-");

    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const fechaObjeto =
        new Date(fecha);

    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return String(fecha);
    }

    return fechaObjeto.toLocaleDateString(
        "es-AR"
    );
}

// ======================================================
// HTML SEGURO
// ======================================================

function escaparHTML(
    texto
) {

    return String(
        texto ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}

// ======================================================
// FECHA HOY
// ======================================================

function fechaHoy() {

    const fecha =
        new Date();

    const año =
        fecha.getFullYear();

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${año}-${mes}-${dia}`;
}

// ======================================================
// LECTOR DE TICKETS
// ======================================================

let procesandoTicket = false;


// ------------------------------------------------------
// ABRIR LECTOR DE TICKET
// ------------------------------------------------------

function abrirLectorTicket() {

    if (procesandoTicket) {
        return;
    }

    const input =
        document.getElementById(
            "inputTicket"
        );

    if (!input) {
        alert(
            "No se encontró el lector de tickets."
        );
        return;
    }

    input.value = "";

    input.click();
}


// ------------------------------------------------------
// PROCESAR FOTO DEL TICKET
// ------------------------------------------------------

async function procesarTicket(event) {

    const archivo =
        event?.target?.files?.[0];

    if (!archivo) {
        return;
    }

    if (
        typeof window.Tesseract ===
        "undefined"
    ) {

        alert(
            "No se pudo cargar el lector de texto. Revisá tu conexión a Internet."
        );

        return;
    }

    if (procesandoTicket) {
        return;
    }

    procesandoTicket = true;

    const boton =
        document.getElementById(
            "botonLeerTicket"
        );

    if (boton) {

        boton.disabled = true;

        boton.textContent =
            "⏳ Leyendo ticket...";
    }

    try {

        mostrarPantalla(
            "escanear"
        );

        mostrarMensajeScanner(
            "🧾 Analizando el ticket..."
        );

        const resultado =
            await Tesseract.recognize(
                archivo,
                "spa",
                {
                    logger:
                        (informacion) => {

                            if (
                                informacion.status ===
                                "recognizing text"
                            ) {

                                const progreso =
                                    Math.round(
                                        (
                                            informacion.progress ||
                                            0
                                        ) * 100
                                    );

                                mostrarMensajeScanner(
                                    `🧾 Leyendo ticket... ${progreso}%`
                                );
                            }
                        }
                }
            );

        const texto =
            resultado?.data?.text || "";

        console.log(
            "Texto detectado en ticket:",
            texto
        );

        const datos =
            extraerProductoYCantidadTicket(
                texto
            );

        if (!datos) {

            mostrarMensajeScanner(
                "No pudimos identificar el producto y el peso. Probá con una foto más clara."
            );

            alert(
                "No pude identificar el producto y la cantidad del ticket.\n\nProbá sacar una foto más cerca y con buena luz."
            );

            return;
        }

        mostrarResultadoTicket(
            datos,
            texto
        );

    } catch (error) {

        console.error(
            "Error leyendo ticket:",
            error
        );

        mostrarMensajeScanner(
            "No se pudo leer el ticket."
        );

        alert(
            "No se pudo leer el ticket. Probá nuevamente con una foto más clara."
        );

    } finally {

        procesandoTicket = false;

        if (boton) {

            boton.disabled = false;

            boton.textContent =
                "🧾 Leer ticket";
        }

        if (event?.target) {

            event.target.value = "";
        }
    }
}


// ------------------------------------------------------
// EXTRAER PRODUCTO + CANTIDAD
// ------------------------------------------------------

function extraerProductoYCantidadTicket(
    texto
) {

    if (!texto) {
        return null;
    }

    const lineas =
        texto
            .split(/\r?\n/)
            .map(
                linea =>
                    linea
                        .replace(
                            /\s+/g,
                            " "
                        )
                        .trim()
            )
            .filter(
                linea =>
                    linea.length >= 3
            );

    /*
     * Buscamos líneas que tengan:
     *
     * PRODUCTO + KG
     * PRODUCTO + G
     * PRODUCTO + GR
     *
     * Ejemplos:
     *
     * VACIO 1,250 KG
     * MANZANA ROJA 2.350 KG
     * PAPA 1500 G
     */

    const patrones = [

        /(.+?)\s+(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos)\b/i,

        /(.+?)\s+(\d+(?:[.,]\d+)?)\s*(g|gr|grs|gramos)\b/i

    ];

    for (
        const linea of lineas
    ) {

        /*
         * Primero eliminamos algunos
         * símbolos que suelen aparecer
         * por errores del OCR.
         */

        const limpia =
            linea
                .replace(
                    /[$€£]/g,
                    " "
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();

        for (
            const patron of patrones
        ) {

            const coincidencia =
                limpia.match(
                    patron
                );

            if (!coincidencia) {
                continue;
            }

            let nombre =
                coincidencia[1]
                    .trim();

            let cantidadTexto =
                coincidencia[2];

            const unidad =
                coincidencia[3]
                    .toLowerCase();

            /*
             * Convertimos coma decimal
             * en punto.
             */

            let cantidad =
                Number(
                    cantidadTexto
                        .replace(
                            ",",
                            "."
                        )
                );

            if (
                !Number.isFinite(
                    cantidad
                ) ||
                cantidad <= 0
            ) {

                continue;
            }

            /*
             * Si está expresado en gramos,
             * convertimos a kilogramos.
             */

            if (
                unidad === "g" ||
                unidad === "gr" ||
                unidad === "grs" ||
                unidad === "gramos"
            ) {

                cantidad =
                    cantidad / 1000;
            }

            /*
             * Limpiamos el nombre.
             */

            nombre =
                limpiarNombreProductoTicket(
                    nombre
                );

            if (
                !nombre ||
                nombre.length < 2
            ) {

                continue;
            }

            /*
             * Evitamos interpretar como producto
             * palabras claramente relacionadas
             * con precios o totales.
             */

            if (
                parecePrecioOTotal(
                    nombre
                )
            ) {

                continue;
            }

            return {

                nombre,

                cantidad:

                    redondearCantidad(
                        cantidad
                    ),

                unidad: "kg",

                textoOriginal:
                    linea
            };
        }
    }

    /*
     * Segundo intento:
     *
     * Algunos tickets imprimen:
     *
     * VACIO
     * 1,250 KG
     *
     * En ese caso buscamos una línea de
     * producto seguida por una línea de peso.
     */

    for (
        let i = 0;
        i < lineas.length - 1;
        i++
    ) {

        const nombreLinea =
            limpiarNombreProductoTicket(
                lineas[i]
            );

        const pesoLinea =
            lineas[i + 1];

        const coincidencia =
            pesoLinea.match(
                /^(\d+(?:[.,]\d+)?)\s*(kg|kgs|kilo|kilos|g|gr|grs|gramos)\b/i
            );

        if (!coincidencia) {
            continue;
        }

        if (
            parecePrecioOTotal(
                nombreLinea
            )
        ) {
            continue;
        }

        let cantidad =
            Number(
                coincidencia[1]
                    .replace(
                        ",",
                        "."
                    )
            );

        if (
            !Number.isFinite(
                cantidad
            ) ||
            cantidad <= 0
        ) {
            continue;
        }

        const unidad =
            coincidencia[2]
                .toLowerCase();

        if (
            unidad === "g" ||
            unidad === "gr" ||
            unidad === "grs" ||
            unidad === "gramos"
        ) {

            cantidad =
                cantidad / 1000;
        }

        if (
            nombreLinea.length < 2
        ) {
            continue;
        }

        return {

            nombre:
                nombreLinea,

            cantidad:
                redondearCantidad(
                    cantidad
                ),

            unidad: "kg",

            textoOriginal:
                `${lineas[i]} ${lineas[i + 1]}`
        };
    }

    return null;
}


// ------------------------------------------------------
// LIMPIAR NOMBRE
// ------------------------------------------------------

function limpiarNombreProductoTicket(
    nombre
) {

    let resultado =
        String(
            nombre || ""
        );

    /*
     * Eliminamos símbolos típicos
     * del ticket.
     */

    resultado =
        resultado
            .replace(
                /^[^A-Za-zÁÉÍÓÚáéíóúÑñ]+/,
                ""
            )
            .replace(
                /[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s-]+$/,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    /*
     * Eliminamos números que puedan
     * ser códigos al comienzo.
     */

    resultado =
        resultado.replace(
            /^\d{3,}\s+/,
            ""
        );

    /*
     * Evitamos que el OCR devuelva
     * palabras de precio.
     */

    resultado =
        resultado
            .replace(
                /\b(precio|total|importe|subtotal|efectivo|tarjeta|vuelto)\b/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    /*
     * Capitalización sencilla.
     */

    if (resultado) {

        resultado =
            resultado
                .toLowerCase()
                .replace(
                    /(^|\s)([a-záéíóúñ])/g,
                    (
                        coincidencia,
                        espacio,
                        letra
                    ) =>
                        espacio +
                        letra.toUpperCase()
                );
    }

    return resultado;
}


// ------------------------------------------------------
// FILTRAR PRECIOS
// ------------------------------------------------------

function parecePrecioOTotal(
    texto
) {

    const valor =
        String(
            texto || ""
        ).toLowerCase();

    const palabrasProhibidas = [

        "total",
        "subtotal",
        "precio",
        "importe",
        "efectivo",
        "tarjeta",
        "vuelto",
        "cambio",
        "iva",
        "descuento"
    ];

    return palabrasProhibidas.some(
        palabra =>
            valor.includes(
                palabra
            )
    );
}


// ------------------------------------------------------
// REDONDEAR CANTIDAD
// ------------------------------------------------------

function redondearCantidad(
    cantidad
) {

    return Math.round(
        cantidad * 1000
    ) / 1000;
}


// ------------------------------------------------------
// DETECTAR CATEGORÍA
// ------------------------------------------------------

function detectarCategoriaTicket(
    nombre
) {

    const texto =
        String(
            nombre || ""
        )
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );

    /*
     * CARNES
     */

    const carnes = [

        "asado",
        "vacio",
        "vacío",
        "entraña",
        "entraña",
        "bife",
        "chorizo",
        "peceto",
        "nalga",
        "paleta",
        "roast beef",
        "roastbeef",
        "colita",
        "cuadril",
        "bola de lomo",
        "lomo",
        "matambre",
        "osobuco",
        "carne picada",
        "carne molida",
        "tapa de asado",
        "tortuguita",
        "falda",
        "bondiola",
        "costeleta",
        "costilla",
        "pollo",
        "pechuga",
        "muslo",
        "pata muslo",
        "suprema",
        "alitas"
    ];

    if (
        carnes.some(
            palabra =>
                texto.includes(
                    palabra
                )
        )
    ) {

        return "Carnes";
    }

    /*
     * FRUTAS
     */

    const frutas = [

        "manzana",
        "banana",
        "pera",
        "naranja",
        "mandarina",
        "limon",
        "limón",
        "pomelo",
        "frutilla",
        "durazno",
        "ciruela",
        "uva",
        "kiwi",
        "melon",
        "melón",
        "sandia",
        "sandía",
        "ananá",
        "anana",
        "palta"
    ];

    if (
        frutas.some(
            palabra =>
                texto.includes(
                    palabra
                )
        )
    ) {

        return "Frutas";
    }

    /*
     * VERDURAS
     */

    const verduras = [

        "papa",
        "batata",
        "cebolla",
        "tomate",
        "zanahoria",
        "zapallo",
        "zapallito",
        "berenjena",
        "morron",
        "morrón",
        "lechuga",
        "espinaca",
        "acelga",
        "brocoli",
        "brócoli",
        "coliflor",
        "pepino",
        "remolacha",
        "apio",
        "ajo"
    ];

    if (
        verduras.some(
            palabra =>
                texto.includes(
                    palabra
                )
        )
    ) {

        return "Verduras";
    }

    return "Otros";
}


// ------------------------------------------------------
// MOSTRAR RESULTADO
// ------------------------------------------------------

function mostrarResultadoTicket(
    datos,
    textoOCR
) {

    const modal =
        document.getElementById(
            "modal"
        );

    const contenido =
        document.getElementById(
            "contenidoModal"
        );

    if (!modal || !contenido) {
        return;
    }

    const categoria =
        detectarCategoriaTicket(
            datos.nombre
        );

    contenido.innerHTML = `

        <div class="resultado-ticket">

            <h2>
                🧾 Producto detectado
            </h2>

            <p style="margin: 10px 0 20px;">
                Revisá los datos antes de agregarlos
                al stock.
            </p>

            <label
                for="ticketProducto">
                Producto / corte
            </label>

            <input
                id="ticketProducto"
                type="text"
                value="${escaparHTML(
                    datos.nombre
                )}"
                style="
                    width:100%;
                    padding:12px;
                    margin:6px 0 14px;
                    border:1px solid #d6dadd;
                    border-radius:12px;
                    font-size:16px;
                ">

            <label
                for="ticketCantidad">
                Cantidad
            </label>

            <div
                style="
                    display:flex;
                    gap:8px;
                    align-items:center;
                    margin-top:6px;
                ">

                <input
                    id="ticketCantidad"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value="${datos.cantidad}"
                    style="
                        flex:1;
                        min-width:0;
                        padding:12px;
                        border:1px solid #d6dadd;
                        border-radius:12px;
                        font-size:16px;
                    ">

                <strong>
                    kg
                </strong>

            </div>

            <p
                style="
                    margin-top:12px;
                    font-size:12px;
                    color:#777;
                ">
                Categoría detectada:
                <strong>
                    ${escaparHTML(
                        categoria
                    )}
                </strong>
            </p>

            <div
                style="
                    display:flex;
                    gap:8px;
                    margin-top:20px;
                ">

                <button
                    type="button"
                    class="btn-secundario"
                    onclick="cerrarModal()">

                    Cancelar

                </button>

                <button
                    type="button"
                    class="btn-principal"
                    onclick="confirmarProductoTicket()">

                    ✓ Agregar al stock

                </button>

            </div>

        </div>
    `;

    modal.classList.remove(
        "oculto"
    );

    mostrarMensajeScanner(
        "Revisá el producto y la cantidad."
    );
}


// ------------------------------------------------------
// CONFIRMAR TICKET
// ------------------------------------------------------

async function confirmarProductoTicket() {

    const nombreInput =
        document.getElementById(
            "ticketProducto"
        );

    const cantidadInput =
        document.getElementById(
            "ticketCantidad"
        );

    const nombre =
        nombreInput
            ?.value
            .trim();

    const cantidad =
        Number(
            cantidadInput
                ?.value
        );

    if (!nombre) {

        alert(
            "Ingresá el nombre del producto."
        );

        return;
    }

    if (
        !Number.isFinite(cantidad) ||
        cantidad <= 0
    ) {

        alert(
            "Ingresá una cantidad válida."
        );

        return;
    }

    const categoria =
        detectarCategoriaTicket(
            nombre
        );

    /*
     * Buscamos si ya existe un producto
     * con el mismo nombre.
     */

    const productoExistente =
        productos.find(
            producto =>
                normalizarTexto(
                    producto.nombre
                ) ===
                normalizarTexto(
                    nombre
                )
        );

    try {

        if (productoExistente) {

            /*
             * Si ya existe, sumamos el peso.
             */

            productoExistente.cantidad =
                (
                    Number(
                        productoExistente.cantidad
                    ) || 0
                ) + cantidad;

            productoExistente.unidad =
                "kg";

            productoExistente.presentacion =
                "kg";

            productoExistente.categoria =
                categoria !== "Otros"
                    ? categoria
                    : (
                        productoExistente.categoria ||
                        "Otros"
                    );

            productoExistente.actualizado =
                new Date().toISOString();

            await guardarProductoFirebase(
                productoExistente
            );

            mostrarMensajeScanner(
                `✅ Agregado: ${nombre} (+${cantidad} kg)`
            );

        } else {

            /*
             * Si no existe, creamos uno nuevo.
             */

            const producto = {

                id:
                    generarId(),

                nombre,

                categoria,

                fechaElaboracion:
                    "",

                duracionElaboracion:
                    "",

                tipoPresentacion:
                    "Peso",

                presentacion:
                    "kg",

                codigo:
                    "",

                cantidad:
                    redondearCantidad(
                        cantidad
                    ),

                minimo:
                    1,

                vencimiento:
                    "",

                unidad:
                    "kg",

                actualizado:
                    new Date().toISOString()
            };

            await guardarProductoFirebase(
                producto
            );

            productos.push(
                producto
            );

            mostrarMensajeScanner(
                `✅ Agregado: ${nombre} (${cantidad} kg)`
            );
        }

        cerrarModal();

        renderizarTodo();

        mostrarPantalla(
            "stock"
        );

    } catch (error) {

        console.error(
            "Error guardando producto del ticket:",
            error
        );

        alert(
            "No se pudo guardar el producto."
        );
    }
}


// ------------------------------------------------------
// NORMALIZAR TEXTO
// ------------------------------------------------------

function normalizarTexto(
    texto
) {

    return String(
        texto || ""
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

// ======================================================
// FUNCIONES DISPONIBLES PARA EL HTML
// ======================================================

window.mostrarLogin =
    mostrarLogin;

window.mostrarRegistro =
    mostrarRegistro;

window.crearCuenta =
    crearCuenta;

window.iniciarSesion =
    iniciarSesion;

window.cerrarSesion =
    cerrarSesion;

window.mostrarAplicacion =
    mostrarAplicacion;

window.mostrarPantalla =
    mostrarPantalla;

window.abrirFormularioProducto =
    abrirFormularioProducto;

window.guardarProducto =
    guardarProducto;

window.editarProducto =
    editarProducto;

window.eliminarProducto =
    eliminarProducto;

window.cambiarCantidadFormulario =
    cambiarCantidadFormulario;

window.cambiarMinimoFormulario =
    cambiarMinimoFormulario;

window.iniciarScanner =
    iniciarScanner;

window.detenerScanner =
    detenerScanner;

window.abrirEscaner =
    abrirEscaner;

window.cerrarEscaner =
    cerrarEscaner;

window.seleccionarModoScanner =
    seleccionarModoScanner;

window.renderStock =
    renderStock;

window.filtrarStock =
    filtrarStock;

window.abrirBusqueda =
    abrirBusqueda;

window.mostrarDetalleProducto =
    mostrarDetalleProducto;

window.filtrarVencimientos =
    filtrarVencimientos;

window.agregarCompraManual =
    agregarCompraManual;

window.eliminarItemCompra =
    eliminarItemCompra;

window.cerrarModal =
    cerrarModal;

window.mostrarCamposElaboracion =
    mostrarCamposElaboracion;

window.abrirLectorTicket =
    abrirLectorTicket;

window.procesarTicket =
    procesarTicket;

window.confirmarProductoTicket =
    confirmarProductoTicket;
