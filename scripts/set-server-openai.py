#!/usr/bin/env python3
"""Set OPENAI_API_KEY on production server .env (never commits the key)."""
import os
import sys
import paramiko

HOST = "164.90.186.193"
USER = "root"
PASSWORD = os.environ.get("VIZARA_SSH_PASSWORD", "Fjsti2026Ai")
APP_DIR = "/var/www/vizara"


def main() -> None:
    api_key = os.environ.get("VIZARA_OPENAI_KEY", "").strip()
    if not api_key:
        print("ERROR: Set VIZARA_OPENAI_KEY environment variable.", file=sys.stderr)
        sys.exit(1)

    model = os.environ.get("VIZARA_AI_MODEL", "gpt-4o").strip()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    sftp = client.open_sftp()
    remote_py = f"{APP_DIR}/.set_openai_tmp.py"
    with sftp.file(remote_py, "w") as f:
        f.write(
            "import re, pathlib\n"
            f"p = pathlib.Path('{APP_DIR}/.env')\n"
            "text = p.read_text() if p.exists() else ''\n"
            f"key = {api_key!r}\n"
            f"model = {model!r}\n"
            "def upsert(t, name, val):\n"
            "    line = f'{name}={val}'\n"
            "    if re.search(rf'^{name}=', t, re.M):\n"
            "        return re.sub(rf'^{name}=.*$', line, t, flags=re.M)\n"
            "    return (t.rstrip() + '\\n' + line + '\\n') if t else (line + '\\n')\n"
            "text = upsert(text, 'OPENAI_API_KEY', key)\n"
            "text = upsert(text, 'AI_MODEL', model)\n"
            "p.write_text(text)\n"
            "print('ENV_OK')\n"
        )
    sftp.close()

    for cmd in [
        f"python3 {remote_py}",
        f"rm -f {remote_py}",
        "pm2 restart vizara-api --update-env",
        "sleep 2",
        "curl -s http://127.0.0.1:3011/api/health",
    ]:
        _, stdout, stderr = client.exec_command(f"cd {APP_DIR} && {cmd}", timeout=60)
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        if out:
            print(out)
        if err:
            print("STDERR:", err)

    client.close()
    print("OpenAI key configured on server.")


if __name__ == "__main__":
    main()
