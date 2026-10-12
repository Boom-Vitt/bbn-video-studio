# Claude scene plate: terracotta mark on the black glossy stage in a warm terracotta/paper glow; on "เอกสารยาวๆ" a
# long stream of real paper pages swirls in and is swallowed by the mark (which spins up as it reads).
#   python3 blender/run.py blender/claude_seq.py -- <project_abs> still 0,90,200      -> video/out/a2/claude_####.jpg
#   python3 blender/run.py blender/claude_seq.py -- <project_abs> seq 0 120           -> video/public/claude/seq/f_####.jpg
#   python3 blender/run.py blender/claude_seq.py --json-out video/public/claude/cam.json -- <project_abs> track
import mathutils
import random

P, MODE = ARGS[0], ARGS[1]
N = 237  # ceil(7.84 s * 30) + 1
LOGO_Z = 1.7
TERRA = (0.69, 0.20, 0.10)
PAPER = (1.0, 0.78, 0.52)
DOC_T0, DOC_T1 = 2.22, 4.25  # pages spawn window (s): "เอกสารยาวๆ ได้ทีละเยอะมาก"

sc = bpy.context.scene
eevee(sc, samples=40)
world_fog(0.024, (0.004, 0.0025, 0.002), 0.5)

floor = pbr('floor', (0.008, 0.006, 0.005), roughness=0.08, **{'Specular IOR Level': 0.35})
nt = floor.node_tree
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.35
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.09; mr.inputs['To Max'].default_value = 0.2
nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
nt.links.new(mr.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Roughness'])
bpy.ops.mesh.primitive_plane_add(size=300, location=(0, 0, 0))
bpy.context.object.data.materials.append(floor)

# hero mark: slow spin about its facing axis, spinning up while it swallows the pages
bpy.ops.import_scene.gltf(filepath=f'{P}/video/public/logos/claude.glb')
logo = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
lb = logo.active_material.node_tree.nodes['Principled BSDF']
lb.inputs['Emission Color'].default_value = (1.0, 0.45, 0.25, 1)


def smooth01(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


roll = 0.0
for f in range(N + 1):
    t = f / 30
    speed = 0.35 + 2.6 * smooth01((t - 2.4) / 0.6) * (1 - smooth01((t - 4.4) / 0.8))
    if f % 3 == 0:
        key(logo, f, location=(0, 0, LOGO_Z + 0.05 * math.sin(t * 1.4)), rotation=(0.05 * math.sin(t * 0.8), -roll, 0.18 * math.sin(t * 0.45)))
        lb.inputs['Emission Strength'].default_value = 0.5 * smooth01((t - 2.5) / 0.8) * (1 - smooth01((t - 4.4) / 0.6))
        lb.inputs['Emission Strength'].keyframe_insert('default_value', frame=f)
    roll += speed / 30


# real paper: warm off-white, translucent when backlit, procedural lines of text
def paper_mat():
    m = bpy.data.materials.new('paper'); m.use_nodes = True
    n = m.node_tree.nodes; lk = m.node_tree.links
    b = n['Principled BSDF']; b.inputs['Roughness'].default_value = 0.62
    def op(kind, a, bb=None, c=None):
        x = n.new('ShaderNodeMath'); x.operation = kind
        for i, v in enumerate((a, bb, c)):
            if v is None:
                continue
            if isinstance(v, float) or isinstance(v, int):
                x.inputs[i].default_value = v
            else:
                lk.new(v, x.inputs[i])
        return x.outputs[0]
    tc = n.new('ShaderNodeTexCoord'); sp = n.new('ShaderNodeSeparateXYZ'); lk.new(tc.outputs['UV'], sp.inputs[0])
    u, v = sp.outputs['X'], sp.outputs['Y']
    rows = op('MULTIPLY', v, 26.0)
    band = op('LESS_THAN', op('FRACT', rows), 0.36)
    wn = n.new('ShaderNodeTexWhiteNoise'); wn.noise_dimensions = '1D'; lk.new(op('FLOOR', rows), wn.inputs['W'])
    lim = op('MULTIPLY_ADD', wn.outputs['Value'], 0.5, 0.4)
    words = op('LESS_THAN', op('FRACT', op('MULTIPLY_ADD', u, 7.0, op('MULTIPLY', wn.outputs['Value'], 5.0))), 0.84)
    box = op('MULTIPLY', op('MULTIPLY', op('LESS_THAN', u, lim), op('GREATER_THAN', u, 0.1)), op('MULTIPLY', op('GREATER_THAN', v, 0.08), op('LESS_THAN', v, 0.88)))
    ink = op('MULTIPLY', op('MULTIPLY', band, words), box)
    mix = n.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (0.86, 0.82, 0.74, 1); mix.inputs['B'].default_value = (0.16, 0.14, 0.13, 1)
    lk.new(ink, mix.inputs['Factor']); lk.new(mix.outputs['Result'], b.inputs['Base Color'])
    tr = n.new('ShaderNodeBsdfTranslucent'); tr.inputs['Color'].default_value = (1.0, 0.86, 0.66, 1)
    mx = n.new('ShaderNodeMixShader'); mx.inputs['Fac'].default_value = 0.28
    out = n['Material Output']
    lk.new(b.outputs[0], mx.inputs[1]); lk.new(tr.outputs[0], mx.inputs[2]); lk.new(mx.outputs[0], out.inputs['Surface'])
    return m


pm = paper_mat()
rnd = random.Random(7)
NP = 44
for i in range(NP):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, -50))
    pg = bpy.context.object
    pg.scale = (0.9, 1.25, 1)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=10); bpy.ops.object.mode_set(mode='OBJECT')
    bd = pg.modifiers.new('curl', 'SIMPLE_DEFORM'); bd.deform_method = 'BEND'; bd.deform_axis = 'Y'; bd.angle = rnd.uniform(0.3, 0.8)
    pg.data.materials.append(pm)
    t0 = DOC_T0 + (DOC_T1 - DOC_T0) * i / (NP - 1)
    f0 = round(t0 * 30)
    dur = rnd.uniform(0.85, 1.05) * 30
    a0, r0, z0 = rnd.uniform(-0.25, 0.25) + 0.9, rnd.uniform(3.2, 3.8), rnd.uniform(2.2, 3.0)
    tw = (rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(-1, 1))
    # vortex: enters off-frame upper right, spirals ~1.2 turns round the mark (behind it and in front), tightening into its face
    key(pg, f0 - 1, location=(r0 * math.sin(a0), -r0 * math.cos(a0), LOGO_Z + z0), scale=(0.001, 0.001, 0.001))
    K = 7
    for k in range(K):
        u = k / (K - 1)
        a = a0 - u * 1.2 * 2 * math.pi
        r = r0 * (1 - u) ** 0.85 + 0.05
        sc_ = 1.0 if u < 0.6 else max(0.02, 1 - (u - 0.6) / 0.4)
        key(pg, f0 + round(dur * u), location=(r * math.sin(a), -r * math.cos(a) - 0.15 * u, LOGO_Z + z0 * (1 - u) ** 1.3 + 0.25 * math.sin(u * 6 + i)),
            rotation=(1.5708 + tw[0] * (1 - u) * 1.4, tw[1] * (1 - u) * 1.6, -a + tw[2] * (1 - u)), scale=(sc_, sc_, sc_))
    key(pg, f0 + round(dur) + 1, location=(0, 0.2, LOGO_Z), scale=(0.001, 0.001, 0.001))
    smooth_keys(pg)

# set dressing: warm backdrop glow + a faint terracotta stage-edge line
glow = bpy.data.materials.new('glow'); glow.use_nodes = True
gn = glow.node_tree
tc = gn.nodes.new('ShaderNodeTexCoord'); gr = gn.nodes.new('ShaderNodeTexGradient'); gr.gradient_type = 'SPHERICAL'
mp = gn.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (2.6, 4.2, 1.0)
cr = gn.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].color = (*TERRA, 1)
cr.color_ramp.elements[0].position = 0.15
gn.links.new(tc.outputs['Object'], mp.inputs['Vector']); gn.links.new(mp.outputs['Vector'], gr.inputs['Vector'])
gn.links.new(gr.outputs['Fac'], cr.inputs['Fac'])
bsdf = gn.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
gn.links.new(cr.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = 0.55
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 32, 6), rotation=(1.5708, 0, 0))
bd = bpy.context.object; bd.scale = (46, 22, 1); bd.data.materials.append(glow)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 9, 0.02))
edge = bpy.context.object; edge.scale = (16, 0.025, 0.025); edge.data.materials.append(emission('edge', PAPER, 1.0))


def aim(obj, target):
    d = mathutils.Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def area(loc, color, energy, size, target=(0, 0, LOGO_Z)):
    bpy.ops.object.light_add(type='AREA', location=loc)
    l = bpy.context.object; l.data.energy = energy; l.data.size = size; l.data.color = color; l.data.volume_factor = 0.03
    aim(l, target)
    return l


def spot(loc, color, energy, size_deg, target):
    bpy.ops.object.light_add(type='SPOT', location=loc)
    l = bpy.context.object; l.data.energy = energy; l.data.color = color
    l.data.spot_size = math.radians(size_deg); l.data.spot_blend = 0.6; l.data.shadow_soft_size = 0.3; l.data.volume_factor = 0.6
    aim(l, target)
    return l


spot((0.3, -4.2, 8.5), (1.0, 0.93, 0.85), 2600, 30, (0, 0, LOGO_Z)).data.shadow_soft_size = 1.6  # warm key, pool behind the mark
fill = area((0, -9, 2.2), (1.0, 0.9, 0.8), 360, 5); fill.data.specular_factor = 0.0
# rims are soft spots, not area lights: an area rim's floor reflection tails into the bottom of frame
rim_l = spot((-4.0, 5.5, 6.6), PAPER, 4200, 17, (0, 0, LOGO_Z))   # paper-warm rim, back-left
rim_r = spot((4.2, 5.0, 6.8), TERRA, 5200, 17, (0, 0, LOGO_Z))    # terracotta rim, back-right
for r_ in (rim_l, rim_r):
    r_.data.shadow_soft_size = 1.2; r_.data.volume_factor = 0.15
spot((-3.0, 7.0, 10.0), PAPER, 3000, 14, (-1.2, 1.0, 0))          # shafts through the warm haze
spot((3.4, 7.5, 10.5), TERRA, 3600, 13, (1.4, 1.2, 0))

# camera: hero push, arc right while code streams, pull back + rise for the paper stream, arc back for the chips
cam = portrait_camera(lens=40, fstop=2.8, focus=10)
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam.data.dof.focus_object = logo
KEYS = [  # frame, azimuth deg, distance, camera height, target z
    (0, 6, 10.4, 1.25, 1.18),
    (34, 0, 9.8, 1.3, 1.2),
    (62, 18, 11.2, 1.55, 1.28),
    (122, 26, 13.6, 2.7, 1.55),
    (146, -8, 12.2, 1.7, 1.3),
    (N - 1, -22, 11.2, 1.35, 1.25),
]
for f, az, d, h, tz in KEYS:
    a = math.radians(az)
    key(cam, f, location=(d * math.sin(a), -d * math.cos(a), h))
    key(tgt, f, location=(0, 0, tz))
smooth_keys(cam); smooth_keys(tgt)

def track_json(n):
    """cam_track() plus the mark's world transform per frame (three.js depth occluder)."""
    frames, marks = [], []
    for f in range(n):
        sc.frame_set(f)
        for o, out in ((cam, frames), (logo, marks)):
            loc, rot, _ = o.matrix_world.decompose()
            out.append([round(v, 5) for v in (loc.x, loc.y, loc.z, rot.w, rot.x, rot.y, rot.z)])
    fov = math.degrees(2 * math.atan(cam.data.sensor_height / 2 / cam.data.lens))
    print('@@JSON')
    print(json.dumps({'fps': 30, 'fovY': round(fov, 4), 'frames': frames, 'logo': marks}))
    print('@@END')


if MODE == 'still':
    for f in [int(x) for x in ARGS[2].split(',')]:
        sc.frame_set(f)
        sc.render.filepath = f'{P}/video/out/a2/claude_{f:04d}.jpg'
        bpy.ops.render.render(write_still=True)
elif MODE == 'seq':
    render_range(f'{P}/video/public/claude/seq', int(ARGS[2]), int(ARGS[3]))
else:
    track_json(N)
