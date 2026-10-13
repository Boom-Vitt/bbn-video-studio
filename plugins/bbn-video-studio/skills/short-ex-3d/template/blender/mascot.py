# "น้องข้อความ": the hero chat bubble (puffy glossy blue bubble + tail, eyes, smile, blush) as one GLB.
# Nodes for animation: mascot (root empty, origin = body centre, faces -Y), body, tail, eye_l, eye_r, smile, blush_l, blush_r.
#   python3 blender/run.py blender/mascot.py -- <project_abs_dir> [preview]
P = ARGS[0]
PREVIEW = len(ARGS) > 1
BLUE = tuple(c ** 2.2 for c in (0.24, 0.55, 1.0))  # #3D8CFF


def m_body():
    m = pbr('bubble', BLUE, roughness=0.28)
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Coat Weight'].default_value = 0.9; b.inputs['Coat Roughness'].default_value = 0.04
    b.inputs['Subsurface Weight'].default_value = 0.12; b.inputs['Subsurface Radius'].default_value = (0.4, 0.6, 1.0)
    return m


def puffy(obj, width, segs=8, level=2):
    bm = obj.modifiers.new('bev', 'BEVEL'); bm.width = width; bm.segments = segs; bm.limit_method = 'NONE'
    sd = obj.modifiers.new('sub', 'SUBSURF'); sd.levels = level; sd.render_levels = level
    bpy.context.view_layer.objects.active = obj
    for md in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.ops.object.shade_smooth()


def mesh_obj(name, mat):
    o = bpy.context.object; o.name = name
    o.data.materials.append(mat)
    return o


body_m, ink = m_body(), pbr('ink', (0.004, 0.005, 0.008), roughness=0.12)
ink.node_tree.nodes['Principled BSDF'].inputs['Coat Weight'].default_value = 1.0
spark = emission('spark', (1, 1, 1), 6.0)
blush_m = pbr('blush', (1.0, 0.22, 0.32), roughness=0.5)

bpy.ops.mesh.primitive_cube_add(size=2); body = mesh_obj('body', body_m)
body.scale = (1.25, 0.46, 0.92); bpy.ops.object.transform_apply(scale=True)
puffy(body, 0.42)
bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.36, radius2=0.07, depth=0.62, location=(-0.72, 0, -0.98),
                                rotation=(0, -2.55, 0))
tail = mesh_obj('tail', body_m)
tail.scale = (1, 0.75, 1); bpy.ops.object.transform_apply(scale=True, rotation=True)
puffy(tail, 0.06, segs=4, level=3)

FRONT = -0.46
eyes = []
for side, x in (('l', -0.36), ('r', 0.36)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=32, ring_count=16, location=(x, FRONT + 0.015, 0.12))
    e = mesh_obj(f'eye_{side}', ink)
    e.scale = (0.105, 0.05, 0.165); bpy.ops.object.shade_smooth()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.032, location=(x + 0.035, FRONT - 0.03, 0.2))
    h = mesh_obj(f'glint_{side}', spark)
    h.parent = e; h.matrix_parent_inverse = e.matrix_world.inverted()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(x * 1.72, FRONT + 0.012, -0.13))
    b = mesh_obj(f'blush_{side}', blush_m)
    b.scale = (0.13, 0.02, 0.075); bpy.ops.object.shade_smooth()
    eyes += [e, b]

bpy.ops.curve.primitive_bezier_curve_add()
sm = bpy.context.object; sm.name = 'smile'
pts = sm.data.splines[0].bezier_points
pts[0].co = (-0.14, 0, 0); pts[0].handle_left = (-0.2, 0, 0.05); pts[0].handle_right = (-0.1, 0, -0.1)
pts[1].co = (0.14, 0, 0); pts[1].handle_left = (0.1, 0, -0.1); pts[1].handle_right = (0.2, 0, 0.05)
for p in pts:
    p.handle_left_type = p.handle_right_type = 'FREE'
sm.data.dimensions = '3D'; sm.data.bevel_depth = 0.026; sm.data.bevel_resolution = 4; sm.data.use_fill_caps = True
sm.location = (0, FRONT - 0.005, -0.12)
bpy.ops.object.convert(target='MESH'); sm = bpy.context.object; sm.data.materials.append(ink); bpy.ops.object.shade_smooth()

root = bpy.data.objects.new('mascot', None); bpy.context.collection.objects.link(root)
parts = [body, tail, sm] + eyes
for o in parts:
    o.parent = root
bpy.ops.object.select_all(action='DESELECT')
for o in [root] + parts + [o for o in bpy.data.objects if o.name.startswith('glint')]:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=f'{P}/video/public/mascot/mascot.glb', use_selection=True, export_apply=True)
print('mascot', [round(d, 3) for d in body.dimensions])

if PREVIEW:
    sc = bpy.context.scene
    eevee(sc, samples=48, motion_blur=False, volumes=True)
    world_fog(0.015, (0.01, 0.015, 0.03))
    floor = pbr('floor', (0.01, 0.012, 0.02), roughness=0.1)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1.4)); bpy.context.object.data.materials.append(floor)
    root.rotation_euler = (0.05, 0, 0.32); root.location = (0, 0, 0.1)
    bpy.ops.object.light_add(type='AREA', location=(-2.5, -4, 3.5)); k = bpy.context.object; k.data.energy = 700; k.data.size = 4
    k.rotation_euler = (0.85, 0, -0.55)
    bpy.ops.object.light_add(type='AREA', location=(3, 2.5, 2)); r = bpy.context.object; r.data.energy = 900; r.data.size = 2.5
    r.data.color = (1.0, 0.55, 0.3); r.rotation_euler = (-1.1, 0, 2.3)
    bpy.ops.object.light_add(type='AREA', location=(-3, 2.5, 1.5)); r2 = bpy.context.object; r2.data.energy = 700; r2.data.size = 2.5
    r2.data.color = (0.3, 0.6, 1.0); r2.rotation_euler = (-1.1, 0, -2.3)
    cam = portrait_camera(lens=50, fstop=2.8, focus=6.0)
    cam.location = (0, -7.5, 0.4); cam.rotation_euler = (1.5, 0, 0)
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1080
    sc.render.filepath = f'{P}/video/out/mascot_preview.jpg'
    bpy.ops.render.render(write_still=True)
