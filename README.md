# Ventas OS

Aplicación web para gestión comercial de leads, preleads, llamadas, reuniones y seguimiento. Se puede ejecutar localmente o publicar en Vercel desde GitHub.

## Publicar en Vercel

1. Importar el repositorio `GiacomoVallebuona/Ventas-OS` desde GitHub.
2. Usar la rama `main` y dejar **Root Directory** en la raíz del repositorio.
3. Seleccionar **Framework Preset: Other**. El archivo `vercel.json` configura la compilación `npm run build` y la carpeta de salida `dist`.
4. Pulsar **Deploy**. Si el proyecto ya existe, quitar cualquier configuración antigua de carpeta de salida y desplegar el último commit de `main`.

La compilación genera `dist/index.html` con los estilos y scripts. Vercel sirve estos archivos estáticos; Python se utiliza solamente para ejecutar la aplicación localmente. La conexión con Supabase sigue funcionando desde el navegador.

Para comprobar la compilación localmente, instalar Node.js 22 o superior y ejecutar `npm run build`. No se necesitan dependencias npm adicionales.

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
