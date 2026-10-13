# hook (0–7.53 s, 227 frames): the three logos side by side on the glossy stage, each pulses on its name; at hook-2
# ChatGPT and Claude slide apart as the camera pushes in to a 40 s timer ring between them, light streaks rush past,
# then a whip left past ChatGPT.
#   python3 blender/run.py blender/hook_seq.py -- <project_abs_dir> still 0 60 150   -> video/out/bl/hook_f0000.jpg ...
#   python3 blender/run.py blender/hook_seq.py -- <project_abs_dir> range 0 120      -> video/public/hook/seq/f_0000.jpg ...
#   python3 blender/run.py blender/hook_seq.py --json-out video/public/hook/cam.json -- <project_abs_dir> cam
import random
from mathutils import Vector

P, MODE = ARGS[0], ARGS[1]
N = 227
RING = (-1.125, 2.5, 0.9)  # timer ring centre (Blender world), seen through the ChatGPT|Claude gap; hook.ts puts "40 วิ" here
R = 0.8  # ring radius
LOGOS = [('chatgpt', -2.15, -2.75, 0.1, (0.20, 0.89, 0.58), 6), ('claude', 0.0, 0.5, 0.0, (1.0, 0.28, 0.10), 33),
         ('gemini', 2.15, 2.95, -0.1, (0.33, 0.40, 1.0), 56)]  # name, x, x after the doors open, yaw, rim colour, pulse peak
GLOW = {'chatgpt': (0.55, 1.0, 0.82), 'claude': (1.0, 0.3, 0.12), 'gemini': None}  # emission tint (None = its own gradient)
sc = bpy.context.scene
eevee(sc, samples=16 if MODE == 'still' else 32)
sc.eevee.use_volumetric_shadows = True
sc.eevee.volumetric_end = 70
world_fog(0.016, (0.003, 0.004, 0.007), anisotropy=0.55)


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


# floor: black glossy with a faint roughness variation
floor_m = pbr('floor', (0.004, 0.005, 0.007), roughness=0.08)
nt = floor_m.node_tree
noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 2.5
rng_ = nt.nodes.new('ShaderNodeMapRange'); rng_.inputs['To Min'].default_value = 0.05; rng_.inputs['To Max'].default_value = 0.13
nt.links.new(noise.outputs['Fac'], rng_.inputs['Value'])
nt.links.new(rng_.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Roughness'])
bpy.ops.mesh.primitive_plane_add(size=240, location=(0, 0, -1.0))
bpy.context.object.data.materials.append(floor_m)

# key: one large soft light above-front
light('AREA', 'key', (0.5, -9, 8.5), (0, 0, 0), 1400, size=8)

def brand_material(root, name):
    """The imported mark's material, with emission wired for the pulse (Gemini: a touch more saturated gradient)."""
    for o in root.children_recursive:
        if o.type == 'MESH':
            m = o.active_material
            nt = m.node_tree
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


for name, x, x2, yaw, col, peak in LOGOS:
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f'{P}/video/public/logos/{name}.glb')
    root = bpy.data.objects.new(name + '_root', None)
    link(root)
    for o in bpy.data.objects:
        if o not in before and o.parent is None and o is not root:
            o.parent = root
    # rim: narrow spot from behind-above aimed at the mark (lights the bevels, its cone never reaches the floor the
    # camera sees in reflection); haze: wide spot toward camera for the shafts, no specular
    rim = light('SPOT', name + '_rim', (x, 2.2, 3.0), (x, 0, 0.4), 1500, col, size=0.3, spot=0.6)
    rim.data.specular_factor = 1.0
    haze = light('SPOT', name + '_haze', (x, 3.6, 3.2), (x, -4, -0.6), 2200, col, size=0.4, spot=1.0)
    # pulse as the name is spoken: the mark itself glows + rim flare + a small hop toward camera, then settles
    em = brand_material(root, name)
    for f, v in ((0, 0.08), (peak - 4, 0.08), (peak, 1.1), (peak + 14, 0.2), (136, 0.2), (160, 0.12)):
        em.default_value = v; em.keyframe_insert('default_value', frame=f)
    for d, base, hi, after in ((rim.data, 1500, 5000, 2000), (haze.data, 2200, 7000, 3000)):  # dim once we fly past
        energy_keys(d, [(0, base), (peak - 4, base), (peak, hi), (peak + 14, after), (136, after), (160, after * 0.35)])
    for f, s_, y in ((0, 1.0, 0), (peak - 4, 1.0, 0), (peak, 1.05, -0.4), (peak + 12, 1.0, 0)):
        key(root, f, location=(x, y, 0.12), scale=(s_, s_, s_))
    key(root, 121, location=(x, 0, 0.12)); key(root, 150, location=(x2, 0, 0.12))  # doors open on hook-2
    key(root, 0, rotation=(0, 0, yaw)); key(root, N - 1, rotation=(0, 0, yaw - 0.12))
    smooth_keys(root)

# timer ring: dark glass disc, dim track, bright arc that fills on hook-2 then starts counting down, 40 tick marks
ring_on = 124


def show_from(o, f):
    o.hide_render = True; o.keyframe_insert('hide_render', frame=0)
    o.hide_render = False; o.keyframe_insert('hide_render', frame=f)


face = (1.5708, 0, 0)  # curve/cylinder axis -> facing -Y (camera)
amber = emission('ring', (1.0, 0.6, 0.18), 1.4)  # kept under the three.js bloom threshold (0.72 luma): crisp, not a blob
track = emission('track', (1.0, 0.8, 0.5), 0.6)
tick_m = emission('tick', (1.0, 0.8, 0.5), 0.7)
grp = bpy.data.objects.new('ring_root', None); link(grp); grp.location = RING
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=R, depth=0.05, location=(0, 0.04, 0), rotation=face)
disc = bpy.context.object; disc.parent = grp
disc.data.materials.append(pbr('disc', (0.01, 0.011, 0.014), metallic=0.2, roughness=0.12, **{'Coat Weight': 1.0}))
bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=0.01, location=(0, 0, 0), rotation=face)
t = bpy.context.object; t.parent = grp; t.data.materials.append(track)
bpy.ops.curve.primitive_bezier_circle_add(radius=R, location=(0, -0.01, 0), rotation=(1.5708, -1.5708, 0))
arc = bpy.context.object; arc.parent = grp
arc.data.bevel_depth, arc.data.bevel_resolution = 0.042, 4
arc.data.materials.append(amber)
for f, v in ((ring_on, 0.0), (ring_on + 22, 1.0), (N - 1, 0.94)):
    arc.data.bevel_factor_end = v; arc.data.keyframe_insert('bevel_factor_end', frame=f)  # fill, then 40 s countdown begins
bpy.ops.mesh.primitive_cube_add(size=1)
tick = bpy.context.object; tick.scale = (0.011, 0.011, 0.06); tick.data.materials.append(tick_m)
for i in range(40):
    a = i / 40 * 6.28318
    o = tick if i == 0 else tick.copy()
    if i:
        link(o)
    o.parent = grp
    o.location = (1.16 * R * math.sin(a), -0.01, 1.16 * R * math.cos(a))
    o.rotation_euler = (0, a, 0)
for o in [grp, *grp.children]:
    show_from(o, ring_on)
key(grp, ring_on, scale=(0.3, 0.3, 0.3)); key(grp, ring_on + 16, scale=(1, 1, 1))
key(grp, ring_on, rotation=(0, -0.6, 0)); key(grp, ring_on + 26, rotation=(0, 0, 0)); key(grp, N - 1, rotation=(0, 0.05, 0))
smooth_keys(grp)
em = amber.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']
for f, v in ((ring_on, 3.0), (ring_on + 18, 1.4), (151, 1.4), (155, 2.6), (170, 1.5)):  # flare on "40" (5.12 s)
    em.default_value = v; em.keyframe_insert('default_value', frame=f)

# light streaks: thin emissive rods rushing toward the camera on hook-2 (motion blur stretches them)
random.seed(7)
cols = [(0.2, 0.89, 0.58), (1.0, 0.35, 0.15), (0.35, 0.45, 1.0), (0.75, 0.4, 1.0), (1.0, 0.7, 0.25)]
mats = [emission(f'streak{i}', c, 14) for i, c in enumerate(cols)]
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=1, depth=1, rotation=face)
rod0 = bpy.context.object
rod0.data.materials.append(mats[0])
for i in range(90):
    o = rod0 if i == 0 else rod0.copy()
    if i:
        o.animation_data_clear()  # copy() shares the action; each rod needs its own keys
        link(o)
    o.material_slots[0].link = 'OBJECT'
    o.material_slots[0].material = mats[i % len(mats)]
    a, r = random.uniform(0, 6.28318), random.uniform(0.6, 2.2)
    x, z = RING[0] + 1.1 * r * math.cos(a), max(-0.85, 0.75 + r * math.sin(a))
    rr, ln = random.uniform(0.006, 0.016), random.uniform(3.0, 8.0)
    o.scale = (rr, rr, ln)
    fs = int(random.uniform(ring_on - 6, N - 14))
    y0, v = random.uniform(8, 30), random.uniform(35, 60)
    show_from(o, fs)
    key(o, fs, location=(x, y0, z)); key(o, fs + 60, location=(x, y0 - 2 * v, z))
    for fc in _fcurves(o.animation_data.action):
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR' if fc.data_path == 'location' else 'CONSTANT'

# camera: slow drift on the title shot, fast push as the doors open (ChatGPT + Claude stay readable, framing the
# ring), creep through the streaks, then a whip left past ChatGPT into the hard cut
cam = portrait_camera(lens=35, fstop=4.0, focus=18.6)
FLOOR_T = (0, 0, -1.05)  # title shot aims below the marks: they sit at y≈620–930, mirror copies underneath
for f, loc, tgt in ((0, (0.3, -18.6, 0.95), FLOOR_T), (60, (0.1, -18.2, 0.93), FLOOR_T),
                    (121, (-0.15, -17.6, 0.9), (-0.1, 0, -1.0)), (150, (-1.125, -12.0, 0.75), RING),
                    (211, (-1.125, -11.3, 0.73), RING)):
    key(cam, f, location=loc, rotation=look(loc, tgt))
base = look((-1.125, -11.3, 0.73), RING)
key(cam, 218, location=(-1.25, -11.25, 0.73), rotation=(base[0], base[1], base[2] + 0.04))
key(cam, N - 1, location=(-2.2, -11.0, 0.72), rotation=look((-2.2, -11.0, 0.72), (-2.75, 0, 0.55)))  # ChatGPT centred, mid-whip
key(cam, N + 6, location=(-3.4, -10.8, 0.7), rotation=look((-3.4, -10.8, 0.7), (-7.5, 0, 0.5)))  # past the cut: still whipping
smooth_keys(cam)
fd = cam.data.dof
for f, v in ((0, 18.6), (121, 17.6), (150, 12.1), (211, 11.4), (N - 1, 10.8)):
    fd.focus_distance = v; fd.keyframe_insert('focus_distance', frame=f)

if MODE == 'still':
    for f in ARGS[2:]:
        sc.frame_set(int(f))
        sc.render.filepath = f'{P}/video/out/bl/hook_f{int(f):04d}.jpg'
        bpy.ops.render.render(write_still=True)
elif MODE == 'range':
    render_range(f'{P}/video/public/hook/seq', int(ARGS[2]), int(ARGS[3]))
elif MODE == 'cam':
    cam_track(N)
