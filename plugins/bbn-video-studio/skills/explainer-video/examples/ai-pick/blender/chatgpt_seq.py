# ChatGPT scene plate: white ceramic mark on the black glossy stage, clean white/mint studio light.
#   python3 blender/run.py blender/chatgpt_seq.py -- <project_abs> still 0,80,200     -> video/out/a2/chatgpt_####.jpg
#   python3 blender/run.py blender/chatgpt_seq.py -- <project_abs> seq 0 145          -> video/public/chatgpt/seq/f_####.jpg
#   python3 blender/run.py blender/chatgpt_seq.py --json-out video/public/chatgpt/cam.json -- <project_abs> track
import mathutils

P, MODE = ARGS[0], ARGS[1]
N = 290  # ceil(9.616 s * 30) + 1
LOGO_Z = 1.7
MINT = (0.20, 0.88, 0.58)
COOL = (0.80, 0.90, 1.0)

sc = bpy.context.scene
eevee(sc, samples=40)
world_fog(0.022, (0.002, 0.0025, 0.003), 0.5)

# floor: black gloss with faint roughness variation
floor = pbr('floor', (0.006, 0.007, 0.008), roughness=0.08, **{'Specular IOR Level': 0.35})
nt = floor.node_tree
nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.35
mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['To Min'].default_value = 0.09; mr.inputs['To Max'].default_value = 0.2
nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
nt.links.new(mr.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Roughness'])
bpy.ops.mesh.primitive_plane_add(size=300, location=(0, 0, 0))
bpy.context.object.data.materials.append(floor)

# hero mark
bpy.ops.import_scene.gltf(filepath=f'{P}/video/public/logos/chatgpt.glb')
logo = [o for o in bpy.context.selected_objects if o.type == 'MESH'][0]
for f in range(0, N + 1, 6):
    t = f / 30
    key(logo, f, location=(0, 0, LOGO_Z + 0.06 * math.sin(t * 1.3)), rotation=(0.04 * math.sin(t * 0.9), 0, 0.42 * math.sin(t * 0.33) + 0.05 * math.sin(t * 1.1)))

# set dressing: a soft mint glow on a far backdrop + a faint stage-edge line, both mirrored by the gloss floor
glow = bpy.data.materials.new('glow'); glow.use_nodes = True
gn = glow.node_tree
tc = gn.nodes.new('ShaderNodeTexCoord'); gr = gn.nodes.new('ShaderNodeTexGradient'); gr.gradient_type = 'SPHERICAL'
mp = gn.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (2.6, 4.2, 1.0)
cr = gn.nodes.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].color = (0, 0, 0, 1); cr.color_ramp.elements[1].color = (*MINT, 1)
cr.color_ramp.elements[0].position = 0.15; cr.color_ramp.elements[1].position = 1.0
gn.links.new(tc.outputs['Object'], mp.inputs['Vector']); gn.links.new(mp.outputs['Vector'], gr.inputs['Vector'])
gn.links.new(gr.outputs['Fac'], cr.inputs['Fac'])
bsdf = gn.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
gn.links.new(cr.outputs['Color'], bsdf.inputs['Emission Color']); bsdf.inputs['Emission Strength'].default_value = 0.35
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 32, 6), rotation=(1.5708, 0, 0))
bd = bpy.context.object; bd.scale = (46, 22, 1); bd.data.materials.append(glow)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 9, 0.02))
edge = bpy.context.object; edge.scale = (16, 0.025, 0.025); edge.data.materials.append(emission('edge', MINT, 1.0))


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


spot((0.3, -4.2, 8.5), (1, 1, 1), 2600, 30, (0, 0, LOGO_Z)).data.shadow_soft_size = 1.6   # key: pool of light behind the mark
fill = area((0, -9, 2.2), (1, 1, 1), 380, 5); fill.data.specular_factor = 0.0           # front fill, no floor hotspot
# rims are soft spots, not area lights: an area rim's floor reflection tails into the bottom of frame
rim_l = spot((-4.0, 5.5, 6.6), MINT, 4500, 17, (0, 0, LOGO_Z))    # mint rim, back-left
rim_r = spot((4.2, 5.0, 6.8), COOL, 3900, 17, (0, 0, LOGO_Z))     # cool white rim, back-right
for r_ in (rim_l, rim_r):
    r_.data.shadow_soft_size = 1.2; r_.data.volume_factor = 0.15
spot((-3.0, 7.0, 10.0), MINT, 3500, 14, (-1.2, 1.0, 0))           # shafts through the haze, crossing behind the mark
spot((3.4, 7.5, 10.5), COOL, 2800, 13, (1.4, 1.2, 0))

# camera: hero front-on push, pull back for the orbiting abilities, then an arc around the mark
cam = portrait_camera(lens=40, fstop=2.8, focus=10)
tgt = bpy.data.objects.new('tgt', None); sc.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
cam.data.dof.focus_object = logo
KEYS = [  # frame, azimuth deg, distance, camera height, target z
    (0, -5, 10.4, 1.25, 1.18),
    (78, 2, 9.7, 1.35, 1.22),
    (112, -16, 12.6, 1.75, 1.3),
    (168, -22, 13.0, 1.9, 1.32),
    (190, 18, 12.0, 1.5, 1.28),
    (N - 1, 34, 11.2, 1.35, 1.25),
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
        sc.render.filepath = f'{P}/video/out/a2/chatgpt_{f:04d}.jpg'
        bpy.ops.render.render(write_still=True)
elif MODE == 'seq':
    render_range(f'{P}/video/public/chatgpt/seq', int(ARGS[2]), int(ARGS[3]))
else:
    track_json(N)
