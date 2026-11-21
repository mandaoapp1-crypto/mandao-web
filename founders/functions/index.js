// MANDAW — asignación segura de los 50 Comercios Fundadores.
// Borrador para entorno de pruebas. No desplegar antes de integrar reglas y contratos.
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
initializeApp();
const db = getFirestore();
exports.assignFounder = onCall({region:"us-central1", enforceAppCheck:false}, async (request) => {
  if (!request.auth || request.auth.uid !== "WyHLc4kRQ6XyalFfi5rLYKj7ZZy2" && request.auth.token.admin !== true)
    throw new HttpsError("permission-denied", "Solo administradores autorizados.");
  const storeId = String(request.data?.storeId || "").trim();
  if (!/^[A-Za-z0-9_-]{3,80}$/.test(storeId))
    throw new HttpsError("invalid-argument", "Código de tienda inválido.");
  const storeRef = db.doc("stores/" + storeId);
  const assignmentRef = db.doc("founderAssignments/" + storeId);
  const configRef = db.doc("founderProgram/config");
  return db.runTransaction(async tx => {
    const [storeSnap, assignmentSnap, configSnap] = await Promise.all([
      tx.get(storeRef), tx.get(assignmentRef), tx.get(configRef)
    ]);
    if (!storeSnap.exists) throw new HttpsError("not-found", "Tienda inexistente.");
    if (assignmentSnap.exists) {
      const existing = assignmentSnap.data();
      return {alreadyAssigned:true, founderNumber:existing.founderNumber};
    }
    // Requiere estado APROBADO EXPLÍCITO, nunca valores predeterminados del cliente.
    const estado = storeSnap.data().estado;
    if (estado !== "aprobada" && estado !== "activa")
      throw new HttpsError("failed-precondition", "Tienda sin aprobación explícita.");
    if (!configSnap.exists)
      throw new HttpsError("failed-precondition", "Programa sin inicializar.");
    const cfg = configSnap.data();
    if (cfg.maxSlots !== 50 || cfg.status !== "open")
      throw new HttpsError("failed-precondition", "Programa cerrado o mal configurado.");
    const n = cfg.assignedSlots;
    if (!Number.isInteger(n) || n < 0 || n >= 50)
      throw new HttpsError("resource-exhausted", "No quedan cupos.");
    const founderNumber = n + 1;
    tx.update(configRef, {assignedSlots: founderNumber});
    tx.create(assignmentRef, {
      storeId, founderNumber, benefitsVersion:"founder-v1",
      assignedAt:FieldValue.serverTimestamp(), assignedBy:request.auth.uid
    });
    tx.update(storeRef, {membership:{
      plan:"founder", status:"active", founderNumber,
      benefitsVersion:"founder-v1", approvedAt:FieldValue.serverTimestamp()
    }});
    return {alreadyAssigned:false, founderNumber};
  });
});

const {onDocumentWritten} = require("firebase-functions/v2/firestore");

function publicStoreData(store) {
  if (!store || !["aprobada", "activa"].includes(store.estado)) return null;
  const info = store.info || {};
  const nombre = typeof info.nombre === "string" ? info.nombre.trim().slice(0,100) : "";
  if (!nombre) return null;
  const categoria = typeof info.categoria === "string" ? info.categoria.trim().slice(0,80) : "Comercio";
  return {nombre, categoria, activa:true};
}

// Publicar únicamente nombre y categoría. No copiar datos privados del comercio.
exports.syncPublicStore = onDocumentWritten({document:"stores/{storeId}",region:"us-central1"}, async event => {
  const ref = db.doc("publicStores/" + event.params.storeId);
  const after = event.data?.after;
  const data = after?.exists ? publicStoreData(after.data()) : null;
  if (!data) {
    await ref.delete();
    return;
  }
  await ref.set(data);
});

// Una única sincronización inicial para tiendas ya existentes, ejecutada por administrador.
exports.rebuildPublicStoreDirectory = onCall({region:"us-central1",enforceAppCheck:false}, async request => {
  if (!request.auth || (request.auth.uid !== "WyHLc4kRQ6XyalFfi5rLYKj7ZZy2" && request.auth.token.admin !== true))
    throw new HttpsError("permission-denied","Solo administradores autorizados.");
  const snap = await db.collection("stores").get();
  let published=0, hidden=0;
  let batch=db.batch(), operations=0;
  const flush=async()=>{if(operations){await batch.commit();batch=db.batch();operations=0;}};
  for (const doc of snap.docs) {
    const data=publicStoreData(doc.data());
    const ref=db.doc("publicStores/"+doc.id);
    if (data) {batch.set(ref,data);published++;}
    else {batch.delete(ref);hidden++;}
    operations++;
    if (operations>=400) await flush();
  }
  await flush();
  return {published,hidden,total:snap.size};
});
