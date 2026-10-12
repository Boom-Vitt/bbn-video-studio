"""Run a Blender script on the shared headless Blender (blender/bridge.py). Never launch Blender yourself.
  python3 blender/run.py blender/x.py [--json-out F] [-- args...]
blender/seq_lib.py is loaded first (eevee, portrait_camera, key, smooth_keys, render_range, cam_track, pbr, emission,
world_fog). The script starts from an emptied scene, gets its CLI args as the list ARGS, writes images with
bpy.ops.render.render(write_still=True), and prints JSON between the lines @@JSON and @@END (saved to --json-out).
The bridge runs one call at a time and other workers queue behind you: keep each call short (≤ ~150 EEVEE frames).
"""
import json, os, re, socket, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('BLENDER_BRIDGE_PORT', '9878'))
RESET = '''
for _c in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.curves,
           bpy.data.images, bpy.data.node_groups, bpy.data.textures, bpy.data.worlds, bpy.data.particles):
    for _b in list(_c):
        _c.remove(_b)
for _b in list(bpy.data.collections):
    bpy.data.collections.remove(_b)
'''


def main():
    argv = sys.argv[1:]
    args = argv[argv.index('--') + 1:] if '--' in argv else []
    head = argv[:argv.index('--')] if '--' in argv else argv
    script, json_out = head[0], (head[head.index('--json-out') + 1] if '--json-out' in head else None)
    lib = os.path.join(HERE, 'seq_lib.py')
    parts = [('<prelude>', f'import bpy\nARGS = {args!r}\n' + RESET),
             (lib, open(lib).read()), (os.path.abspath(script), open(script).read())]
    try:
        token = open(os.path.expanduser(f'~/.cache/bbn-video-studio/bridge-{PORT}.token')).read().strip()
        s = socket.create_connection(('127.0.0.1', PORT))
    except (FileNotFoundError, ConnectionRefusedError):
        sys.exit('Blender bridge is not running. Start it once (see blender/bridge.py), then retry.')
    with s:
        s.sendall(token.encode() + b'\n' + json.dumps({'parts': parts}).encode())
        s.shutdown(socket.SHUT_WR)
        res = json.loads(b''.join(iter(lambda: s.recv(1 << 16), b'')))
    text = res['out']
    m = re.search(r'@@JSON\n(.*?)\n@@END', text, re.S)
    if json_out and m:
        open(json_out, 'w').write(m.group(1))
    print(text if not m else text.replace(m.group(0), f'[json -> {json_out}]'))
    sys.exit(0 if res['ok'] else 1)


if __name__ == '__main__':
    main()
