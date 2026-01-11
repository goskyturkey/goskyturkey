
import pty
import os
import time
import sys

# VPS config
HOST = "5.175.136.21"
PORT = "2222"
USER = "root"
PASS = "Goskyturkey.2026"


def run_vps_commands():
    def log(msg):
        print(f"[VPS] {msg}")

    remote_script = """
    echo "=== CHECKING BACKEND LOGS ==="
    docker logs --tail 50 goskyturkey-next 2>&1 | grep -i -E "(upload|hero|error|sharp)"
    
    echo "=== CHECKING UPLOAD DIRECTORY ==="
    docker exec goskyturkey-next ls -la /app/backend/uploads/
    docker exec goskyturkey-next ls -la /app/backend/uploads/temp/
    
    echo "=== CHECKING DISK SPACE ==="
    df -h /
    
    echo "=== CHECKING SHARP INSTALL ==="
    docker exec goskyturkey-next node -e "try { require('sharp'); console.log('sharp OK'); } catch(e) { console.log('sharp ERROR:', e.message); }"
    
    exit
    """

    pid, fd = pty.fork()

    if pid == 0:
        os.execvp("ssh", ["ssh", "-p", PORT, "-o",
                  "StrictHostKeyChecking=no", f"{USER}@{HOST}"])
    else:
        log("Connecting...")

        while True:
            try:
                chunk = os.read(fd, 1024)
                if not chunk:
                    break
                sys.stdout.buffer.write(chunk)
                sys.stdout.flush()

                if b"password:" in chunk:
                    log("Authenticating...")
                    os.write(fd, (PASS + "\n").encode())

                if b"root@" in chunk or b"#" in chunk:
                    break
            except OSError:
                break

        time.sleep(2)

        lines = remote_script.strip().split('\n')
        for cmd in lines:
            cmd = cmd.strip()
            if not cmd or cmd.startswith('#'):
                continue
            log(f">> {cmd}")
            os.write(fd, (cmd + "\n").encode())
            time.sleep(1)

        while True:
            try:
                chunk = os.read(fd, 1024)
                if not chunk:
                    break
                sys.stdout.buffer.write(chunk)
                sys.stdout.flush()
            except OSError:
                break

        os.close(fd)
        os.waitpid(pid, 0)


if __name__ == "__main__":
    run_vps_commands()
