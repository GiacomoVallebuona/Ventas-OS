"""Servidor local para Ventas OS.
Con hilos (ThreadingHTTPServer) para que varias peticiones simultáneas del
navegador (varios .js/.css a la vez) no se bloqueen entre sí, y sin caché
para que siempre veas la última versión al abrir la app."""
import http.server
import os

PORT = 4321
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/" or self.path == "":
            self.path = "/ventas-os.html"
        return super().do_GET()


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    # En Windows, allow_reuse_address puede dejar DOS procesos escuchando el mismo puerto a la vez
    # (conexiones que se cuelgan sin respuesta). Lo desactivamos: si ya hay un servidor corriendo,
    # este simplemente falla al arrancar y el que ya estaba activo sigue funcionando bien.
    allow_reuse_address = False


with Server(("", PORT), NoCacheHandler) as httpd:
    print(f"Ventas OS corriendo en http://localhost:{PORT}  (Ctrl+C para detener)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
