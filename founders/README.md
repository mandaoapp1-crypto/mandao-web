# MANDAW — 50 Comercios Fundadores (trabajo en desarrollo)

**Estado:** código inicial guardado en rama de desarrollo. No desplegado en Firebase ni integrado al HTML.

## Decisión comercial
Cupo máximo: 50 establecimientos aprobados. Cada fundador recibe el paquete definido como `founder-v1`, sujeto al contrato y al anexo comercial aprobado. No incluye automáticamente productos futuros ni exención de comisiones generales.

## Firestore propuesto
- `founderProgram/config`: `maxSlots:50`, `assignedSlots:0`, `status:"open"`
- `founderAssignments/{storeId}`: `storeId`, `founderNumber`, `benefitsVersion`, `assignedAt`, `assignedBy`
- `stores/{storeId}.membership`: `plan`, `status`, `founderNumber`, `benefitsVersion`, `approvedAt`

**NO inicializar assignedSlots=0 sin auditar asignaciones previas.** Nunca reiniciar el contador una vez utilizado.

## Antes de desplegar
1. Verificar cómo se aprueban realmente las tiendas: el HTML actual trata como aprobada una tienda sin campo `estado`; la función exige `estado` explícito para evitar asignaciones indebidas.
2. Integrar este módulo en el proyecto real de Firebase Functions; este directorio es un prototipo, no un proyecto listo para desplegar.
3. Implementar App Check, custom claim `admin` asignado exclusivamente por servidor y registro de aceptación contractual por establecimiento.
4. Ajustar las reglas existentes para que clientes no creen/modifiquen `membership`, `founderProgram` o `founderAssignments`. No sustituir reglas de producción sin auditarlas.
5. Conectar botón administrativo de asignación mediante `httpsCallable`; mostrar insignia y permisos de módulos por membresía verificada.
6. Probar 50/51 cupos, concurrencia, doble clic, reintentos, tienda no aprobada y usuario sin permisos en emuladores.
7. Revisar contrato comercial y paquete de beneficios antes de activar cupos reales.

## Seguridad
No exponer credenciales privadas ni claves de servicio en el repositorio público. No realizar asignaciones de fundador desde JavaScript cliente ni localStorage.
