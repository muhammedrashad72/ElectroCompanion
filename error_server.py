import http.server
import socketserver
import sys

class ErrorLoggerHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        log_entry = f"====== JS ERROR CAUGHT ======\n{post_data}\n=============================\n"
        print(log_entry, flush=True)
        
        # Write to local errors.txt immediately
        with open("errors.txt", "a", encoding="utf-8") as f:
            f.write(log_entry)
            
        self.send_response(200)
        self.end_headers()

PORT = 8001
with socketserver.TCPServer(("", PORT), ErrorLoggerHandler) as httpd:
    print("serving at port", PORT, flush=True)
    httpd.serve_forever()

