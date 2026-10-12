# outro (35.65–44.87 s, 278 frames): the three logos as a team (triangle) on the glossy stage, each flares as its job
# chips pop (chips + light lines are three.js, outro.ts); outro-2 cranes up to a glowing prompt box for the next
# episode, its rim flares on the "×2" burst, then holds as the end card (button + cursor are three.js).
#   python3 blender/run.py blender/outro_seq.py -- <project_abs_dir> still 0 45 200   -> video/out/bl/outro_f0000.jpg ...
#   python3 blender/run.py blender/outro_seq.py -- <project_abs_dir> range 0 100      -> video/public/outro/seq/f_0000.jpg ...
#   python3 blender/run.py blender/outro_seq.py --json-out video/public/outro/cam.json -- <project_abs_dir> cam
import bmesh
from mathutils import Vector

P, MODE = ARGS[0], ARGS[1]
N = 278
BOX = (0.0, 0.3, 6.3)  # prompt box centre; outro.ts puts the typed text on its face
BTN = (0.0, -1.4, 5.36)  # subscribe button (three.js); a red light flashes here on the tap
TAP = 210  # 7.0 s
LOGOS = [('chatgpt', (0.0, 0.45, 2.27), 0.0, (0.20, 0.89, 0.58), 15), ('claude', (-1.25, 0.0, 0.12), 0.12, (1.0, 0.28, 0.10), 30),
         ('gemini', (1.25, 0.0, 0.12), -0.12, (0.33, 0.40, 1.0), 45)]  # name, centre, yaw, rim colour, flare frame
TEAM = 71  # "ใช้ให้ตรงงาน": all three flare together
sc = bpy.context.scene
eevee(sc, samples=16 if MODE == 'still' else 32)
sc.eevee.use_volumetric_shadows = True
sc.eevee.volumetric_end = 70
world_fog(0.013, (0.003, 0.004, 0.007), anisotropy=0.55)


def link(o):
    sc.collection.objects.link(o)


def look(loc, target):
    return (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()


def light(kind, name, loc, target, energy, color=(1, 1, 1), size=1.0, spot=0.9):
    d = bpy.data.lights.new(name, kind)
    d.energy, d.color = energy, color
    if kind == 'AREA':
        d.shape, d.size = 'DISK', size
        d.specular_factor = 0.25
    if kind == 'SPOT':  # haze shafts only: no specular, so no hot reflections in the floor under the captions
        d.spot_size, d.spot_blend, d.shadow_soft_size = spot, 0.75, size
        d.specular_factor = 0.0
    o = bpy.data.objects.new(name, d)
    link(o)
    o.location = loc
    o.rotation_euler = look(loc, target)
    return o


def energy_keys(d, pts):
    for f, v in pts:
        d.energy = v
        d.keyframe_insert('energy', frame=f)


def rounded_slab(name, w, h, r, depth, seg=10):
    """Rounded rectangle in the XZ plane, `depth` thick along Y, soft-bevelled edges."""
    pts = []
    for cx, cz, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new((x, -depth / 2, z)) for x, z in pts])
    ext = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, vec=(0, depth, 0), verts=[v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    b = o.modifiers.new('bevel', 'BEVEL')
    b.width, b.segments, b.limit_method = min(0.035, depth * 0.3), 4, 'ANGLE'
    me.shade_smooth()
    return o


def brand_gradient(name, strength, half_w):
    """Emission sweeping mint (ChatGPT) -> terracotta (Claude) -> blue (Gemini) across the object's x."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0, 0, 0, 1)
    b.inputs['Emission Strength'].default_value = strength
    tc, sep = nt.nodes.new('ShaderNodeTexCoord'), nt.nodes.new('ShaderNodeSeparateXYZ')
    mr, ramp = nt.nodes.new('ShaderNodeMapRange'), nt.nodes.new('ShaderNodeValToRGB')
    mr.inputs['From Min'].default_value, mr.inputs['From Max'].default_value = -half_w, half_w
    els = ramp.color_ramp.elements
    els[0].color, els[1].color = (0.2, 0.89, 0.58, 1), (0.40, 0.42, 1.0, 1)
    els.new(0.5).color = (1.0, 0.36, 0.14, 1)
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    nt.links.new(sep.outputs['X'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Emission Color'])
    return m


# studio (same grammar as hook): black glossy floor with faint roughness variation, one big soft key
floor_m = pbr('floor', (0.004, 0.005, 0.007), roughness=0.08)
nt = floor_m.node_tree
noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 2.5
rmap = nt.nodes.new('ShaderNodeMapRange'); rmap.inputs['To Min'].default_value = 0.05; rmap.inputs['To Max'].default_value = 0.13
nt.links.new(noise.outputs['Fac'], rmap.inputs['Value'])
nt.links.new(rmap.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Roughness'])
bpy.ops.mesh.primitive_plane_add(size=240, location=(0, 0, -1.0))
bpy.context.object.data.materials.append(floor_m)
key_l = light('AREA', 'key', (0.5, -9, 9.5), (0, 0, 1.5), 1500, size=8)
key_l.data.volume_factor = 0.3  # keeps the haze from turning into a grey veil once the camera cranes up

GLOW = {'chatgpt': (0.55, 1.0, 0.82), 'claude': (1.0, 0.3, 0.12), 'gemini': None}  # emission tint (None = its gradient)


def brand_material(root, name):
    """The imported mark's material, with emission wired for the flares (Gemini: a touch more saturated gradient)."""
    for o in root.children_recursive:
        if o.type == 'MESH':
            nt = o.active_material.node_tree
            b = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
            if GLOW[name] is None and b.inputs['Base Color'].links:
                hs = nt.nodes.new('ShaderNodeHueSaturation')
                hs.inputs['Saturation'].default_value = 1.45
                nt.links.new(b.inputs['Base Color'].links[0].from_socket, hs.inputs['Color'])
                nt.links.new(hs.outputs['Color'], b.inputs['Base Color'])
                nt.links.new(hs.outputs['Color'], b.inputs['Emission Color'])
            else:
                b.inputs['Emission Color'].default_value = (*GLOW[name], 1)
            return b.inputs['Emission Strength']


for name, (x, y, z), yaw, col, peak in LOGOS:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f'{P}/video/public/logos/{name}.glb')
    root = bpy.data.objects.new(name + '_root', None)
    link(root)
    for o in bpy.data.objects:
        if o not in before and o.parent is None and o is not root:
            o.parent = root
    # rim: narrow spot from behind-above on the mark (bevel highlights, no floor hot spot in the reflection);
    # haze: wide spot toward camera for the shafts, no specular
    rim = light('SPOT', name + '_rim', (x, y + 2.2, z + 2.9), (x, y, z + 0.3), 1500, col, size=0.3, spot=0.6)
    rim.data.specular_factor = 1.0
    haze = light('SPOT', name + '_haze', (x * 1.3, y + 3.6, z + 3.1), (x, y - 4, z - 0.8), 2000, col, size=0.4, spot=1.0)
    # flare when this logo's chips pop, again together on "ใช้ให้ตรงงาน", then calm down for the end card
    em = brand_material(root, name)
    for f, v in ((0, 0.1), (peak - 3, 0.1), (peak + 1, 1.0), (peak + 13, 0.2), (TEAM - 3, 0.2), (TEAM + 1, 0.8), (TEAM + 14, 0.2)):
        em.default_value = v; em.keyframe_insert('default_value', frame=f)
    for d, base, hi, after in ((rim.data, 1500, 4500, 1900), (haze.data, 2000, 6000, 2600)):
        energy_keys(d, [(0, base), (peak - 3, base), (peak + 1, hi), (peak + 13, after), (TEAM - 3, after), (TEAM + 1, hi * 0.8),
                        (TEAM + 14, after), (92, after), (112, base * 0.35)])
    for f, s_, dy in ((0, 1.0, 0), (peak - 3, 1.0, 0), (peak + 1, 1.05, -0.3), (peak + 12, 1.0, 0)):
        key(root, f, location=(x, y + dy, z), scale=(s_, s_, s_))
    if name == 'chatgpt':  # it peeks in cropped under the end card: sink it out of frame after the crane
        key(root, 112, location=(x, y, z)); key(root, 132, location=(x, y, z - 1.9))
    key(root, 0, rotation=(0, 0, yaw - 0.06)); key(root, N - 1, rotation=(0, 0, yaw + 0.1))
    smooth_keys(root)

# prompt box for the next episode: dark glass slab with a glowing brand-gradient rim, rises in as the camera cranes up
box = bpy.data.objects.new('box_root', None); link(box)
body = rounded_slab('box_body', 3.2, 0.86, 0.3, 0.16)
body.data.materials.append(pbr('box_glass', (0.008, 0.01, 0.018), metallic=0.1, roughness=0.14, **{'Coat Weight': 1.0, 'Coat Roughness': 0.03}))
rim_m = brand_gradient('box_rim', 2.0, 1.7)
rim_o = rounded_slab('box_rim', 3.32, 0.98, 0.36, 0.05)
rim_o.data.materials.append(rim_m)
rim_o.location = (0, 0.09, 0)
for o in (body, rim_o):
    o.parent = box
for f, z, s in ((90, BOX[2] - 0.7, 0.55), (108, BOX[2], 1.0)):
    key(box, f, location=(BOX[0], BOX[1], z), scale=(s, s, s))
key(box, 108, rotation=(0, 0, 0)); key(box, N - 1, rotation=(0.02, 0, -0.03))
smooth_keys(box)
for o in (box, body, rim_o):
    o.hide_render = True; o.keyframe_insert('hide_render', frame=0)
    o.hide_render = False; o.keyframe_insert('hide_render', frame=90)
em = rim_m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
for f, v in ((90, 6), (110, 2), (184, 2), (189, 7), (206, 2.4)):  # flare on the "×2" burst (6.27 s)
    em.default_value = v; em.keyframe_insert('default_value', frame=f)
bpy.ops.object.text_add(location=(1.15, 0.05, BOX[2] + 0.5), rotation=(1.5708, 0, 0))
x2 = bpy.context.object
x2.data.body = '×2'
x2.data.align_x, x2.data.align_y = 'CENTER', 'CENTER'
x2.data.size, x2.data.extrude, x2.data.bevel_depth, x2.data.bevel_resolution = 0.62, 0.07, 0.018, 3
x2.data.materials.append(pbr('x2_gold', (1.0, 0.6, 0.06), metallic=0.6, roughness=0.18, **{'Emission Color': (1.0, 0.62, 0.1, 1), 'Emission Strength': 0.9, 'Coat Weight': 1.0}))
X2 = 187  # 6.23 s, "เท่าตัว"
x2.hide_render = True; x2.keyframe_insert('hide_render', frame=0)
x2.hide_render = False; x2.keyframe_insert('hide_render', frame=X2)
for f, s_, r in ((X2, 0.05, -0.9), (X2 + 6, 1.3, 0.12), (X2 + 12, 0.95, -0.05), (X2 + 18, 1.0, 0.0), (N - 1, 1.04, 0.06)):
    key(x2, f, scale=(s_, s_, s_), rotation=(1.5708, 0, r))
smooth_keys(x2)
halo = light('SPOT', 'box_halo', (0, 5.5, 8.4), (0, -6, 5.6), 0, (0.75, 0.7, 1.0), size=0.6, spot=0.6)
energy_keys(halo.data, [(88, 0), (110, 500), (184, 500), (189, 1600), (206, 600)])
tap = light('POINT', 'tap_glow', BTN, BOX, 0, (1.0, 0.12, 0.16), size=0.4)
tap.data.specular_factor = 0.4
energy_keys(tap.data, [(190, 0), (198, 160), (TAP - 1, 160), (TAP + 2, 900), (TAP + 16, 220)])

# camera: slow drift around the team, a fast crane up to the prompt box, then a slow push for the end card
cam = portrait_camera(lens=38, fstop=3.2, focus=17.4)
for f, loc, tgt in ((0, (0.5, -18.0, 1.35), (0, 0, 1.22)), (45, (0.0, -17.4, 1.3), (0, 0, 1.22)),
                    (88, (-0.45, -16.8, 1.28), (0, 0, 1.22)), (106, (0.0, -12.8, 6.4), (0, 0.3, 5.75)),
                    (N - 1, (0.0, -11.6, 6.38), (0, 0.3, 5.78))):
    key(cam, f, location=loc, rotation=look(loc, tgt))
smooth_keys(cam)
fd = cam.data.dof
for f, v in ((0, 18.0), (88, 16.8), (106, 13.1), (N - 1, 11.9)):
    fd.focus_distance = v; fd.keyframe_insert('focus_distance', frame=f)

if MODE == 'still':
    for f in ARGS[2:]:
        sc.frame_set(int(f))
        sc.render.filepath = f'{P}/video/out/bl/outro_f{int(f):04d}.jpg'
        bpy.ops.render.render(write_still=True)
elif MODE == 'range':
    render_range(f'{P}/video/public/outro/seq', int(ARGS[2]), int(ARGS[3]))
elif MODE == 'cam':
    cam_track(N)
