# Ventas OS

Aplicación web local para gestión comercial de leads, preleads, llamadas, reuniones y seguimiento.

## Ejecutar en Windows

1. Tener Python 3 instalado.
2. Ejecutar `Iniciar Ventas OS.bat`.
3. La aplicación se abrirá en `http://localhost:4321`.

## Estructura

- `ventas-os.html`: página principal.
- `css/`: estilos.
- `js/`: lógica de la aplicación.
- `serve.py`: servidor local.
- `supabase/migrations/`: cambios de base de datos.
- `tests/`: pruebas de contrato del frontend y Supabase.
- `vercel.json`: configuración para servir la aplicación desde la ruta principal en Vercel.

## Verificación

```powershell
node --test tests/lead-fields-contract.test.mjs
```
