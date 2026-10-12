"""One headless Blender shared by every worker (and every project) on this machine; blender/run.py sends it scripts.
Launch it once (parallel Blender launches crash while compiling GPU kernels):
  "${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}" --background --factory-startup --python blender/bridge.py
Port $BLENDER_BRIDGE_PORT (default 9876), 127.0.0.1 only. Each start writes a fresh random token to
~/.cache/blender-explainer/bridge-<port>.token (dir 0700, file 0600); calls without it are refused.
One call runs at a time, the rest wait in the accept queue.
"""
import contextlib, io, json, os, secrets, socket, tempfile, time, traceback
import bpy

PORT = int(os.environ.get('BLENDER_BRIDGE_PORT', '9876'))
TOKEN_DIR = os.path.expanduser('~/.cache/blender-explainer')
MAX_IN, MAX_OUT, IO_S = 64 << 20, 1 << 20, 60  # request bytes, reply chars, socket deadline (s)
TOKEN = secrets.token_hex(16)

prefs = bpy.context.preferences.addons['cycles'].preferences  # GPU for Cycles; EEVEE picks the GPU itself
for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
    try:
        prefs.compute_device_type = kind
    except TypeError:
        continue
    prefs.get_devices()
    if any(d.type == kind for d in prefs.devices):
        for d in prefs.devices:
            d.use = True
        break


def receive(conn):
    """The whole request, b'<token>\\n<json>', within IO_S seconds and MAX_IN bytes (a slow or huge sender can't hold
    the bridge). The token is checked before any parsing: unauthenticated bytes never reach json."""
    end, data = time.monotonic() + IO_S, bytearray()
    while True:
        left = end - time.monotonic()
        if left <= 0 or len(data) > MAX_IN:
            raise ValueError('request too slow or too big')
        conn.settimeout(left)
        chunk = conn.recv(1 << 16)
        if not chunk:
            return bytes(data)
        data += chunk


srv = socket.create_server(('127.0.0.1', PORT))
os.makedirs(TOKEN_DIR, mode=0o700, exist_ok=True)
os.chmod(TOKEN_DIR, 0o700)
fd, tmp = tempfile.mkstemp(dir=TOKEN_DIR)  # new 0600 file swapped in atomically: no stale perms, no symlink follow
with os.fdopen(fd, 'w') as f:
    f.write(TOKEN)
os.replace(tmp, os.path.join(TOKEN_DIR, f'bridge-{PORT}.token'))
print(f'Blender bridge ready on 127.0.0.1:{PORT}', flush=True)
# ponytail: no per-job deadline (exec can't be interrupted); a script that never returns blocks every worker until
# the bridge is killed and restarted (the keepalive loop in SKILL.md does that). Add a supervisor if that bites.
while True:
    conn, _ = srv.accept()
    with conn:
        try:
            tok, _, body = receive(conn).partition(b'\n')
        except (OSError, ValueError):
            continue
        if not secrets.compare_digest(tok, TOKEN.encode()):
            reply = {'ok': False, 'out': 'bad token: was the bridge restarted? run.py reads the current one'}
        else:
            out, g = io.StringIO(), {'__name__': '__bridge__'}
            try:
                with contextlib.redirect_stdout(out):
                    for name, src in json.loads(body)['parts']:  # prelude, seq_lib, script: tracebacks keep real file:line
                        exec(compile(src, name, 'exec'), g)
                ok = True
            except (Exception, SystemExit):  # a script's sys.exit must not stop the shared bridge
                ok = False
                out.write(traceback.format_exc())
            reply = {'ok': ok, 'out': out.getvalue()[-MAX_OUT:]}  # keep the tail (the error) of a print flood
        with contextlib.suppress(OSError):  # client gone or not reading: drop the reply, keep serving
            conn.settimeout(IO_S)
            conn.sendall(json.dumps(reply).encode())
