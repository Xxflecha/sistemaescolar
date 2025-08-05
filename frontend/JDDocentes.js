// JDDocentes.js (basado en docentes.js)
// Manejo de menú hamburguesa
const menuIcon = document.getElementById('menuIcon');
const docMenu = document.getElementById('docMenu');
if (menuIcon && docMenu) {
    menuIcon.onclick = function(e) {
        docMenu.style.display = docMenu.style.display === 'flex' ? 'none' : 'flex';
        docMenu.style.flexDirection = 'column';
        e.stopPropagation();
    };
    document.body.onclick = function() {
        docMenu.style.display = 'none';
    };
    docMenu.onclick = function(e) {
        e.stopPropagation();
    };
}

// Cargar lista de docentes en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    cargarDocentes();
    // Espera a que se cargue la lista y selecciona el primero automáticamente
    setTimeout(() => {
        const listDiv = document.getElementById('docenteList');
        const first = listDiv.querySelector('.docente-list-item');
        if (first) {
            first.classList.add('selected');
            docenteSeleccionadoId = first.dataset.id;
        }
    }, 500);

    // Asigna eventos SOLO cuando el DOM está listo
    document.getElementById('editarDocenteBtn').onclick = function() {
        const campos = [
            'doc-clave','doc-nombre','doc-apellidos','doc-calle','doc-colonia','doc-cp','doc-correo-personal','doc-fecha-nac','doc-numero','doc-ciudad','doc-telefono','doc-correo-inst','doc-antiguedad'
        ];
        campos.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.tagName === 'SPAN') {
                const valor = el.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = valor;
                input.className = 'edit-input';
                input.id = id;
                el.parentNode.replaceChild(input, el);
            }
        });
        document.getElementById('editarDocenteBtn').style.display = 'none';
        document.getElementById('guardarDocenteBtn').style.display = 'inline-block';
    };

    document.getElementById('guardarDocenteBtn').onclick = function() {
        const campos = [
            'doc-clave','doc-nombre','doc-apellidos','doc-calle','doc-colonia','doc-cp','doc-correo-personal','doc-fecha-nac','doc-numero','doc-ciudad','doc-telefono','doc-correo-inst','doc-antiguedad'
        ];
        const mapCampos = {
            'doc-clave': 'clave',
            'doc-nombre': 'nombre',
            'doc-apellidos': 'apellido',
            'doc-calle': 'calle',
            'doc-colonia': 'colonia',
            'doc-cp': 'cp',
            'doc-correo-personal': 'correo_personal',
            'doc-fecha-nac': 'fecha_nacimiento',
            'doc-numero': 'numero',
            'doc-ciudad': 'ciudad',
            'doc-telefono': 'telefono',
            'doc-correo-inst': 'correo_institucional',
            'doc-antiguedad': 'antiguedad'
        };
        const datos = {};
        campos.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.tagName === 'INPUT') {
                let valor = input.value;
                if (id === 'doc-fecha-nac') {
                    if (valor) {
                        // Normaliza siempre a YYYY-MM-DD
                        valor = valor.split('T')[0];
                    } else {
                        return;
                    }
                }
                datos[mapCampos[id]] = valor;
            }
        });
        const id = Number(docenteActualId);
        if (!id || isNaN(id)) {
            mostrarError('ID de docente inválido.');
            return;
        }
        fetch(`http://localhost:4000/api/docentes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
        .then(res => {
            if (res.status === 404) throw new Error('No se encontró el docente.');
            if (!res.ok) throw new Error('Error al guardar');
            return res.json();
        })
        .then(doc => {
            // Normaliza la fecha antes de mostrarla
            if (doc.fecha_nacimiento && typeof doc.fecha_nacimiento === 'string' && doc.fecha_nacimiento.includes('T')) {
                doc.fecha_nacimiento = doc.fecha_nacimiento.split('T')[0];
            }
            campos.forEach(id => {
                const input = document.getElementById(id);
                if (input && input.tagName === 'INPUT') {
                    const span = document.createElement('span');
                    span.id = id;
                    // Normaliza la fecha en la UI
                    if (id === 'doc-fecha-nac' && doc.fecha_nacimiento) {
                        span.textContent = doc.fecha_nacimiento;
                    } else {
                        span.textContent = doc[mapCampos[id]] || '';
                    }
                    input.parentNode.replaceChild(span, input);
                }
            });
            document.getElementById('editarDocenteBtn').style.display = 'inline-block';
            document.getElementById('guardarDocenteBtn').style.display = 'none';
            cargarDocentes();
        })
        .catch(err => mostrarError(err.message));
    };
});

let docenteSeleccionadoId = null;
let docenteActualId = null;
let listaDocentes = [];
let docenteSeleccionadoNombre = "";

// Cargar lista de docentes y mostrar el listado
function cargarDocentes() {
    fetch('http://localhost:4000/api/docentes')
        .then(res => res.json())
        .then(docentes => {
            listaDocentes = docentes;
            const listDiv = document.getElementById('docenteList');
            listDiv.innerHTML = '';
            docentes.forEach((doc, idx) => {
                const item = document.createElement('div');
                item.className = 'docente-list-item';
                item.textContent = `${doc.nombre} ${doc.apellido}`;
                item.dataset.id = doc.id;
                item.onclick = function() {
                    docenteSeleccionadoId = doc.id;
                    docenteSeleccionadoNombre = `${doc.nombre} ${doc.apellido}`;
                    consultarYMostrarDocente(doc.id);
                    mostrarSoloSeleccionado();
                };
                listDiv.appendChild(item);
            });
            // Si no hay seleccionado, selecciona el primero
            if (!docenteSeleccionadoId && docentes.length > 0) {
                docenteSeleccionadoId = docentes[0].id;
                docenteSeleccionadoNombre = `${docentes[0].nombre} ${docentes[0].apellido}`;
                consultarYMostrarDocente(docenteSeleccionadoId);
                mostrarSoloSeleccionado();
            }
        });
}

// Mostrar solo el docente seleccionado y el botón para cambiar
function mostrarSoloSeleccionado() {
    const listDiv = document.getElementById('docenteList');
    listDiv.style.display = 'none';
    let selectedDiv = document.getElementById('docenteSeleccionado');
    if (!selectedDiv) {
        selectedDiv = document.createElement('div');
        selectedDiv.id = 'docenteSeleccionado';
        selectedDiv.style.margin = '10px 0 18px 0';
        selectedDiv.style.fontWeight = 'bold';
        selectedDiv.style.fontSize = '1.1em';
        selectedDiv.style.display = 'flex';
        selectedDiv.style.alignItems = 'center';
        selectedDiv.style.gap = '12px';
        listDiv.parentNode.insertBefore(selectedDiv, listDiv);
    }
    selectedDiv.innerHTML = `
        Docente seleccionado: ${docenteSeleccionadoNombre}
        <button id="cambiarDocenteBtn" class="consultar-btn" style="margin-left:10px;">Cambiar docente</button>
    `;
    document.getElementById('cambiarDocenteBtn').onclick = function() {
        listDiv.style.display = '';
        selectedDiv.remove();
    };
}

// Consultar información del docente seleccionado (botón)
const consultarBtn = document.getElementById('consultarBtn');
if (consultarBtn) {
    consultarBtn.onclick = function() {
        if (!docenteSeleccionadoId) return mostrarError('Selecciona un docente.');
        consultarYMostrarDocente(docenteSeleccionadoId);
    };
}

function consultarYMostrarDocente(id) {
    fetch(`http://localhost:4000/api/docentes/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('No se encontró el docente.');
            return res.json();
        })
        .then(doc => mostrarDocente(doc))
        .catch(() => mostrarError('No se pudo consultar la información del docente.'));
}

function mostrarDocente(doc) {
    // Normaliza la fecha a YYYY-MM-DD si existe
    let fechaNac = doc.fecha_nacimiento || '';
    if (fechaNac) {
        if (typeof fechaNac === 'string' && fechaNac.includes('T')) {
            fechaNac = fechaNac.split('T')[0];
        }
    }
    if (document.getElementById('doc-fecha-nac')) {
        document.getElementById('doc-fecha-nac').textContent = fechaNac;
    }
    if (document.getElementById('doc-clave')) document.getElementById('doc-clave').textContent = doc.clave || '';
    if (document.getElementById('doc-nombre')) document.getElementById('doc-nombre').textContent = doc.nombre || '';
    if (document.getElementById('doc-apellidos')) document.getElementById('doc-apellidos').textContent = doc.apellido || '';
    if (document.getElementById('doc-calle')) document.getElementById('doc-calle').textContent = doc.calle || '';
    if (document.getElementById('doc-colonia')) document.getElementById('doc-colonia').textContent = doc.colonia || '';
    if (document.getElementById('doc-cp')) document.getElementById('doc-cp').textContent = doc.cp || '';
    if (document.getElementById('doc-correo-personal')) document.getElementById('doc-correo-personal').textContent = doc.correo_personal || '';
    if (document.getElementById('doc-numero')) document.getElementById('doc-numero').textContent = doc.numero || '';
    if (document.getElementById('doc-ciudad')) document.getElementById('doc-ciudad').textContent = doc.ciudad || '';
    if (document.getElementById('doc-telefono')) document.getElementById('doc-telefono').textContent = doc.telefono || '';
    if (document.getElementById('doc-correo-inst')) document.getElementById('doc-correo-inst').textContent = doc.correo_institucional || '';
    if (document.getElementById('doc-antiguedad')) document.getElementById('doc-antiguedad').textContent = doc.antiguedad || '';
    window.docenteActual = doc;
    docenteActualId = doc.id;
    docenteSeleccionadoId = doc.id;
    docenteSeleccionadoNombre = `${doc.nombre} ${doc.apellido}`;
    document.getElementById('editarDocenteBtn').style.display = 'inline-block';
    document.getElementById('guardarDocenteBtn').style.display = 'none';
}

// Editar información
document.getElementById('editarDocenteBtn').onclick = function() {
    const campos = [
        'doc-clave','doc-nombre','doc-apellidos','doc-calle','doc-colonia','doc-cp','doc-correo-personal','doc-fecha-nac','doc-numero','doc-ciudad','doc-telefono','doc-correo-inst','doc-antiguedad'
    ];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.tagName === 'SPAN') {
            const valor = el.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.value = valor;
            input.className = 'edit-input';
            input.id = id;
            el.parentNode.replaceChild(input, el);
        }
    });
    document.getElementById('editarDocenteBtn').style.display = 'none';
    document.getElementById('guardarDocenteBtn').style.display = 'inline-block';
};

// Guardar cambios
document.getElementById('guardarDocenteBtn').onclick = function() {
    const campos = [
        'doc-clave','doc-nombre','doc-apellidos','doc-calle','doc-colonia','doc-cp','doc-correo-personal','doc-fecha-nac','doc-numero','doc-ciudad','doc-telefono','doc-correo-inst','doc-antiguedad'
    ];
    const mapCampos = {
        'doc-clave': 'clave',
        'doc-nombre': 'nombre',
        'doc-apellidos': 'apellido',
        'doc-calle': 'calle',
        'doc-colonia': 'colonia',
        'doc-cp': 'cp',
        'doc-correo-personal': 'correo_personal',
        'doc-fecha-nac': 'fecha_nacimiento',
        'doc-numero': 'numero',
        'doc-ciudad': 'ciudad',
        'doc-telefono': 'telefono',
        'doc-correo-inst': 'correo_institucional',
        'doc-antiguedad': 'antiguedad'
    };
    const datos = {};
    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.tagName === 'INPUT') {
            let valor = input.value;
            if (id === 'doc-fecha-nac') {
                if (valor) {
                    valor = valor.split('T')[0];
                } else {
                    return;
                }
            }
            datos[mapCampos[id]] = valor;
        }
    });
    const id = Number(docenteActualId);
    if (!id || isNaN(id)) {
        mostrarError('ID de docente inválido.');
        return;
    }
    fetch(`http://localhost:4000/api/docentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
    .then(res => {
        if (res.status === 404) throw new Error('No se encontró el docente.');
        if (!res.ok) throw new Error('Error al guardar');
        return res.json();
    })
    .then(doc => {
        campos.forEach(id => {
            const input = document.getElementById(id);
            if (input && input.tagName === 'INPUT') {
                const span = document.createElement('span');
                span.id = id;
                span.textContent = doc[mapCampos[id]] || '';
                input.parentNode.replaceChild(span, input);
            }
        });
        document.getElementById('editarDocenteBtn').style.display = 'inline-block';
        document.getElementById('guardarDocenteBtn').style.display = 'none';
        // Corrige la visualización de la fecha después de guardar
        if (doc.fecha_nacimiento && typeof doc.fecha_nacimiento === 'string' && doc.fecha_nacimiento.includes('T')) {
            doc.fecha_nacimiento = doc.fecha_nacimiento.split('T')[0];
        }
        cargarDocentes();
    })
    .catch(err => mostrarError(err.message));
};

function mostrarError(msg) {
    document.getElementById('modalErrorMsg').textContent = msg;
    document.getElementById('modalError').style.display = 'flex';
}
function cerrarModalError() {
    document.getElementById('modalError').style.display = 'none';
}

// Actualización en tiempo real de la lista de docentes cada 10s
setInterval(cargarDocentes, 10000);