import os
import re
import json
from pathlib import Path

class OWASPScanner:

    def __init__(self, path):
        self.path = Path(path)
        self.issues = []

    # -------------------------
    # REGISTRAR PROBLEMA
    # -------------------------
    def add(self, owasp, file, line, issue, fix):
        self.issues.append({
            "owasp": owasp,
            "file": str(file),
            "line": line,
            "issue": issue,
            "fix": fix
        })

    # -------------------------
    # ESCANEAR ARCHIVO
    # -------------------------
    def scan_file(self, file_path):

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            for i, line in enumerate(lines, 1):

                # XSS
                if "dangerouslySetInnerHTML" in line:
                    self.add(
                        "A03 - XSS",
                        file_path, i,
                        "Uso inseguro de HTML dinámico",
                        "Usar DOMPurify o evitar HTML directo"
                    )

                # Injection
                if "eval(" in line:
                    self.add(
                        "A03 - Injection",
                        file_path, i,
                        "Uso de eval() peligroso",
                        "Eliminar eval() o usar JSON.parse"
                    )

                # Secrets
                if re.search(r"(api|secret|token|password)\s*=", line, re.I):
                    self.add(
                        "A02 - Secrets",
                        file_path, i,
                        "Credenciales hardcodeadas",
                        "Usar variables de entorno (.env)"
                    )

                # HTTP inseguro
                if "http://" in line:
                    self.add(
                        "A02 - Crypto Failure",
                        file_path, i,
                        "Uso de HTTP inseguro",
                        "Cambiar a HTTPS"
                    )

                # localStorage tokens
                if "localStorage" in line and "token" in line:
                    self.add(
                        "A01 - Access Control",
                        file_path, i,
                        "Token almacenado en localStorage",
                        "Usar cookies HttpOnly"
                    )

        except Exception as e:
            print("Error:", file_path, e)

    # -------------------------
    # SCAN PROYECTO
    # -------------------------
    def scan(self):

        for root, _, files in os.walk(self.path):

            if "node_modules" in root or ".git" in root:
                continue

            for file in files:
                if file.endswith((".js", ".jsx", ".ts", ".tsx")):
                    self.scan_file(Path(root) / file)

    # -------------------------
    # REPORTE FINAL
    # -------------------------
    def report(self):

        total = len(self.issues)

        types = {}

        for i in self.issues:
            types[i["owasp"]] = types.get(i["owasp"], 0) + 1

        print("\n==============================")
        print(" OWASP SECURITY REPORT")
        print("==============================\n")

        print("TOTAL VULNERABILIDADES:", total)
        print("\nPOR TIPO:\n")

        for k, v in types.items():
            print(f"- {k}: {v}")

        print("\nDETALLE:\n")

        for i in self.issues:
            print(f"[{i['owasp']}]")
            print(f"Archivo: {i['file']}:{i['line']}")
            print(f"Problema: {i['issue']}")
            print(f"Solución: {i['fix']}")
            print("-" * 50)

        # guardar JSON (IMPORTANTE para apps móviles / APIs)
        with open("owasp_report.json", "w", encoding="utf-8") as f:
            json.dump({
                "total": total,
                "by_type": types,
                "issues": self.issues
            }, f, indent=2)

# -------------------------
# MAIN
# -------------------------
if __name__ == "__main__":

    import sys

    if len(sys.argv) < 2:
        print("Uso: python owasp_simple_report.py <proyecto>")
        exit()

    scanner = OWASPScanner(sys.argv[1])
    scanner.scan()
    scanner.report()