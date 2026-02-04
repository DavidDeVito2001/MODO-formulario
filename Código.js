// ===== APPS SCRIPT OPTIMIZADO PARA MÓVIL =====
// Configuración optimizada para móvil
const CONFIG = {
  MAX_EXECUTION_TIME: 270000, // 4.5 minutos
  MAX_FILE_SIZE: 20 * 1024 * 1024, // Reducido a 10MB para móvil
  DRIVE_QUOTA_LIMIT: 15 * 1024 * 1024 * 1024,
  MAX_FILES_PER_FOLDER: 1000,
  MOBILE_BATCH_SIZE: 1, // Procesar de a 1 en móvil
  MOBILE_DELAY: 200, // Delay entre procesamiento
  MAX_IMAGE_RETRIES: 2 // Menos reintentos en móvil
};

/*-VARIABLE GLOBAL-*/
const SPREADSHEET_ID = "1Nj0UvAKopoQbHxrMui8yXITzDYEzkWbPvF5VPpbL3UU"; //ID del archivo

function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
  .setTitle("Modo")
  .setFaviconUrl("https://raw.githubusercontent.com/DavidDeVito2001/Image/refs/heads/main/logoTrading.ico");
}

function obtenerHoja(nombre) {
  const hoja = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nombre);
  if (!hoja) throw new Error(`No se encontró la hoja: ${nombre}`);
  return hoja;
}

function getDatosAuditor(auditorDNI) {
  try {
    const hoja = obtenerHoja("soloLocalesAsignados");
    const data = hoja.getDataRange().getValues();
    auditorDNI = auditorDNI.toLocaleString().trim();

    let datosValidos = {
      valido: false,
      nombre: null,
      dni: null,
      casos: [],
    };

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === auditorDNI) {
        datosValidos.casos.push({
          fila: i + 1,
          idCaso: data[i][1],
          idMODO: data[i][2],
          nombre: data[i][3],
          qrImpreso: data[i][5],
          nombreComercio: data[i][6],
          idCarpeta: data[i][10],
          promo: data[i][9],
          direccionComercio: data[i][12],
          formularioCompletado: data[i][17],
          fechaPromoInicio: Utilities.formatDate(new Date(data[i][18]), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
          fechaPromoFin: Utilities.formatDate(new Date(data[i][19]), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
          diasQueHayPromo: data[i][20],
          paraEditar: data[i][21],
          fechaInicio: Utilities.formatDate(new Date(data[1][22]), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
          fechaFin: Utilities.formatDate(new Date(data[1][23]), Session.getScriptTimeZone(), 'dd/MM/yyyy'),
          fotoEditar1: data[i][24],
          fotoEditar2: data[i][25],
          fotoEditar3: data[i][26],
          fotoEditar4: data[i][27],
          fotoEditar5: data[i][28],
          fotoEditar6: data[i][29],
          fotoEditar7: data[i][30],
          fotoEditar8: data[i][31],
          fotoEditar9: data[i][32],
          fotoEditar10: data[i][33],
          tipoComercio: data[i][34]
        });
        if (datosValidos.nombre === null) {
          datosValidos.dni = auditorDNI;
          datosValidos.valido = true;
          datosValidos.nombre = data[i][3];
        }
      }
    }

    if (datosValidos.valido === true) {
      let token = Utilities.getUuid();
      let expiracion = new Date().getTime() + 3600000;
      let sessionData = JSON.stringify({token, expiracion});
      PropertiesService.getUserProperties().setProperty("session_" + datosValidos.dni, sessionData);
      datosValidos.token = token;
      Logger.log(datosValidos);
      return datosValidos;
    }
    Logger.log(datosValidos);
    return datosValidos;
  } catch(e) {
    Logger.log("Error: " + e.message);
    return {
      valido: false,
      nombre: null,
      dni: null,
      casos: [],
    };
  }
}

function uploadFile(data, nombreOriginal, index, caso, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const extension = nombreOriginal.split('.').pop();
    const nombreArchivo = `${caso.idMODO || 'sinID'}-${String(index + 1).padStart(2,'0')}.${extension}`;
    const bytes = Utilities.base64Decode(data);
    const blob = Utilities.newBlob(bytes, `image/${extension}`, nombreArchivo);
    const file = folder.createFile(blob);

    return { success: true, fileName: nombreOriginal, fileUrl: file.getUrl() };
  } catch (err) {
    return { success: false, fileName: nombreOriginal, error: err.message };
  }
}

// ===== FUNCIÓN PRINCIPAL OPTIMIZADA =====
function guardarAuditoria(datos) {
  const startTime = new Date().getTime();

  try {
    const hoja = obtenerHoja("NewFormulario");
    if (!hoja) throw new Error("No se encontró la hoja NewFormulario");

    // Validación previa de imágenes (ya subidas con uploadFile)
    const imagenes = datos.imagenes || Array(10).fill(null);
    const imagenesConDatos = imagenes.filter(img => img && img.length > 0).length;

    if (imagenesConDatos === 0) {
      return { 
        success: false, 
        error: "No se recibieron imágenes válidas para guardar." 
      };
    }

    // Procesar arrays de forma más eficiente
    const procesarCampoArray = (campo) => {
      if (!datos[campo]) return "";
      return Array.isArray(datos[campo]) ? datos[campo].join(", ") : String(datos[campo]);
    };

    const ahora = new Date();

    // Preparar lista de datos para la hoja
    const listaDatos = [
      ahora,
      datos.datosCaso?.nombreComercio || "",
      "", // Campo vacío reservado
      datos.datosCaso?.idCaso || "",
      datos.datosCaso?.nombre || "",
      datos.estadoLocal || "",
      datos.datosCaso?.promo || "",
      datos.preguntaTieneAlgunaPromocion || "",
      datos.preguntaTienePromoModo || "",
      procesarCampoArray("senializacionPromoModo"),
      procesarCampoArray("vidrieraIndicaPuedePagarModo"),
      procesarCampoArray("haySenializacionModoDentroLocal"),
      procesarCampoArray("ubicacionSenalizacionModo"),
      datos.hayPopModo || "",
      procesarCampoArray("tipoDePop"),
      datos.datosCaso?.qrImpreso || "",
      datos.cantidadDeCajas || "",
      datos.cantidadCajasConQR || "",
      datos.qrImpresoEnCaja || "",
      datos.hayQRMercadoPago || "",
      datos.haySenializacionDeOtrasBilleteras || "",
      procesarCampoArray("tipoSenializacionOtrasBilleteras"),
      procesarCampoArray("ubicacionSenializacionOtrasBilleteras"),
      procesarCampoArray("indicarBilleterasSenializadas"),
      datos.conQueBilleteraPuedoPagar || "",
      datos.mencionoOtrasBilleteras || "",
      datos.sePuedeComprarConModo || "",
      datos.queBilleterasMenciono || "",
      datos.sePuedePagarConModo || "",
      datos.preguntaComoTeCobran || "",
      datos.noSePuedePagarConModo || "",
      datos.hicisteLaCompra || "",
      datos.comoEsElProcedimientoDeCobro || "",
      datos.haySenializacionDePromosBancarias || "",
      procesarCampoArray("indicarBancosConPromoModo"),
      procesarCampoArray("indicarBancosSinPromoModo"),
      datos.observaciones || "",
      // URLs de fotos (10 columnas fijas)
      ...imagenes.map(img => img ? (img || "") : "")
    ];

    // Escribir en la hoja
    const ultimaFila = hoja.getLastRow();
    hoja.getRange(ultimaFila + 1, 1, 1, listaDatos.length).setValues([listaDatos]);

    const tiempoTotal = (new Date().getTime() - startTime) / 1000;

    return {
      success: true,
      idCaso: datos.datosCaso?.idCaso || "",
      filaGuardada: ultimaFila + 1,
      fotosSubidas: imagenes.map(img => img ? (img || "") : ""),
      tiempoTotal: tiempoTotal,
      mensaje: `Guardado exitoso: ${imagenes.map(img => img ? (img || "") : "1")} imágenes registradas`
    };

  } catch (error) {
    const tiempoError = (new Date().getTime() - startTime) / 1000;
    Logger.log(`Error después de ${tiempoError}s: ${error.stack}`);
    
    return {
      success: false,
      error: `Error del servidor: ${error.message}`,
      tiempoError: tiempoError
    };
  }
}

// ===== FUNCIÓN DE EDICIÓN (SIMPLIFICADA) =====
/**
 * Guarda la edición en la hoja 'NewFormulario'.
 * IMPORTANTE: Depende de que el cliente pase el 'datos.datosCaso.fila' pre-calculado.
 */
/**
 * Guarda la edición final del caso, conservando las URLs no modificadas.
 * Esta función SOLO maneja la actualización de las URLs y la limpieza.
 * La subida y eliminación de archivos se maneja en el cliente (handleUploadEditar).
 * * @param {object} datos Contiene datosCaso (con fila) e imagenes (array plano de URLs).
 */
function guardarEdicion(datos) {
    const startTime = new Date().getTime();
    
    try { 
        const hoja = obtenerHoja("NewFormulario");
        if (!hoja) throw new Error("No se encontró la hoja NewFormulario");
        
        const fila = datos.datosCaso.fila;
        if (!fila || typeof fila !== 'number' || fila < 2) {
            throw new Error("Error crítico: El número de fila es inválido o faltante.");
        }
        
        // Array de URLs que el cliente nos envía (contiene: URL_Nueva, URL_Antigua, o null)
        const urlsDesdeCliente = datos.imagenes || Array(10).fill(null);
        
        // 1. OBTENER LAS URLs ACTUALES (Para comparar y conservar)
        // Leemos solo las 10 columnas de fotos (39-48) en un solo batch
        const urlsActualesHoja = hoja.getRange(fila, 38, 1, 10).getValues()[0];
        
        const respuestasFinales = [];
        
        // 2. CONSTRUIR EL ARRAY FINAL
        for (let i = 0; i < 10; i++) {
            const urlNuevaOEditada = urlsDesdeCliente[i];
            const urlActual = urlsActualesHoja[i] || "";
            
            if (urlNuevaOEditada) {
                // Si el cliente envió una URL (significa que se subió una nueva o se conservó)
                respuestasFinales.push(urlNuevaOEditada);
            } else {
                // Si el cliente envió NULL/Vacío (significa que NO se subió nada o falló),
                // CONSERVAMOS la URL que ya estaba en la hoja.
                respuestasFinales.push(urlActual);
            }
        }
        
        // 3. ESCRITURA BATCH
        
        // Actualizar columnas de fotos (39-48)
        hoja.getRange(fila, 38, 1, 10).setValues([respuestasFinales]);
        
        // Limpiar columnas de edición (49-57)
        hoja.getRange(fila, 50, 1, 10).setValues([Array(10).fill("")]);
        
        const tiempoTotal = (new Date().getTime() - startTime) / 1000;
        Logger.log(`✅ Edición finalizada en ${tiempoTotal}s para caso ${datos.datosCaso.idCaso}`);
        
        return { success: true };
        
    } catch (error) {
        Logger.log(`Error en edición final: ${error.stack}`);
        throw new Error(`Error en la edición (actualización de URLs): ${error.message}`);
    }
}

// ===== FUNCIÓN MEJORADA PARA ELIMINAR ARCHIVOS =====
/**
 * Busca y elimina el archivo existente en una posición de foto (index)
 * basándose en la convención de nombres: IDMODO-XX.ext.
 *
 * @param {string} folderId El ID de la carpeta de Drive donde buscar.
 * @param {number} index El índice de la foto (0-9).
 * @param {object} caso El objeto caso que contiene el idMODO.
 */
function eliminarArchivoPorNombre(folderId, index, caso) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    
    // Calculamos el nombre base que tendrá el archivo (ej: 'CASO123-01')
    const nombreBase = `${caso.idMODO || 'sinID'}-${String(index + 1).padStart(2,'0')}`;
    
    // Búsqueda en Drive: título que contenga el nombre base y no esté en la papelera
    const query = `title contains '${nombreBase}' and trashed = false`;
    const archivos = folder.searchFiles(query);
    
    let eliminados = 0;
    while (archivos.hasNext()) {
      const archivo = archivos.next();
      
      // Verificación estricta: nos aseguramos de que el nombre empiece exactamente
      // con nuestro nombre base (para evitar eliminar archivos como CASO-01_temp.jpg)
      if (archivo.getName().startsWith(nombreBase)) {
        archivo.setTrashed(true);
        Logger.log(`Eliminado por nombre: ${archivo.getName()} (ID: ${archivo.getId()})`);
        eliminados++;
      }
    }
    
    if (eliminados === 0) {
      Logger.log(`No se encontró ningún archivo con nombre base: ${nombreBase} para eliminar.`);
    }
    
    return { success: true, eliminados: eliminados };
    
  } catch (error) {
    Logger.log(`Error eliminando por nombre: ${error.message} para index ${index}. Stack: ${error.stack}`);
    return { success: false, error: error.message };
  }
}

function asegurarCarpetaUnica(carpetaID) {
  const carpetaPrincipal = DriveApp.getFolderById("1XCUlgju31v7Ei1gHmy-2zO41JclH0IMK");
  let subcarpetas = carpetaPrincipal.getFoldersByName(carpetaID);

  if (subcarpetas.hasNext()) {
    return subcarpetas.next().getId();
  } else {
    return carpetaPrincipal.createFolder(carpetaID).getId();
  }
}

function obtenerOCrearCarpeta(nombreCarpeta) {
  try {
    const carpetas = DriveApp.getFoldersByName(nombreCarpeta);
    if (carpetas.hasNext()) {
      return carpetas.next();
    }
    return DriveApp.createFolder(nombreCarpeta);
  } catch (error) {
    Logger.log(`Error con carpeta principal: ${error.message}`);
    return DriveApp.getRootFolder();
  }
}

/**
 * Busca la fila en la hoja 'NewFormulario' basándose en el ID único.
 * Asume que el ID del caso está en la Columna D (índice 3).
 * @param {string} idCaso El ID único del caso.
 * @returns {number | null} El número de fila (base 1) o null si no se encuentra.
 */
function buscarFilaPorId(idCaso) {
  try {
    const hoja = obtenerHoja("NewFormulario");
    
    // Lee la Columna D completa
    const data = hoja.getRange(1, 4, hoja.getLastRow(), 1).getValues();
    
    // Busca el ID del caso
    const filaEncontrada = data.findIndex(row => row[0] === idCaso);
    
    if (filaEncontrada !== -1) {
      return filaEncontrada + 1; // Retorna la fila base 1
    }
    return null;
    
  } catch (e) {
    Logger.log("Error buscando fila: " + e.message);
    return null;
  }
}