#!/usr/bin/env python3
import paramiko
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('164.90.186.193', username='root', password='Fjsti2026Ai', timeout=15)
cmds = [
    'ls -la /var/www/vizara/ | head -15',
    'test -f /var/www/vizara/dist/index.html && echo DIST_OK || echo NO_DIST',
    'pm2 list 2>/dev/null || echo NO_PM2',
    'curl -s http://127.0.0.1:3011/api/health 2>/dev/null || echo API_DOWN',
    'ls /etc/nginx/sites-enabled/',
    'nginx -t 2>&1',
    'curl -sI http://vizara.uz 2>/dev/null | head -5',
    'curl -sI https://vizara.uz 2>/dev/null | head -5',
]
for cmd in cmds:
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    print('===', cmd)
    print(out or err)
c.close()
