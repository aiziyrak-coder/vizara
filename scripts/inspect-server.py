#!/usr/bin/env python3
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('164.90.186.193', username='root', password='Fjsti2026Ai', timeout=15)
for cmd in [
    'ls -la /etc/nginx/sites-enabled/',
    'ss -tlnp | head -30',
    'which pm2; which certbot',
    'dig +short vizara.saxar.uz; dig +short vizaraapi.saxar.uz',
]:
    _, stdout, stderr = c.exec_command(cmd)
    print('===', cmd)
    print(stdout.read().decode())
    e = stderr.read().decode()
    if e: print('ERR:', e)
c.close()
