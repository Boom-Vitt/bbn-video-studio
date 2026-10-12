# Brand logos as 3D objects (extruded + bevelled from the official SVG marks). The template ships no logo files:
# download each official SVG per story (Wikimedia Commons, send a User-Agent header) into ref/logos/ under the name
# below; missing ones are skipped. Add a row for any other brand.
# Exports video/public/logos/<name>.glb and renders a hero preview per logo.
#   python3 blender/run.py blender/logos.py -- <project_abs_dir> [preview]
P = ARGS[0]
PREVIEW = len(ARGS) > 1
LOGOS = [  # name, svg, extrude (fraction of height), bevel, material
    ('chatgpt', 'chatgpt.svg', 0.09, 0.022),
    ('claude', 'claude_shape.svg', 0.08, 0.018),
    ('gemini', 'gemini_shape.svg', 0.10, 0.03),
]
GEMINI = [(0.0, (0.278, 0.588, 0.890)), (0.55, (0.569, 0.467, 0.780)), (1.0, (0.792, 0.400, 0.451))]  # 2025 icon gradient


def mat_for(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Coat Weight'].default_value = 0.6
    b.inputs['Coat Roughness'].default_value = 0.08
    if name == 'chatgpt':
        b.inputs['Base Color'].default_value = (0.92, 0.93, 0.95, 1); b.inputs['Roughness'].default_value = 0.22
    elif name == 'claude':
        b.inputs['Base Color'].default_value = (0.69, 0.25, 0.14, 1); b.inputs['Roughness'].default_value = 0.38  # #D97757 in linear
        b.inputs['Coat Weight'].default_value = 0.25
    else:
        col = nt.nodes.new('ShaderNodeVertexColor'); col.layer_name = 'Col'
        nt.links.new(col.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = 0.18
    return m


def lerp3(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def gradient(t):
    for (t0, c0), (t1, c1) in zip(GEMINI, GEMINI[1:]):
        if t <= t1:
            return lerp3(c0, c1, (t - t0) / (t1 - t0))
    return GEMINI[-1][1]


import os
LOGOS = [l for l in LOGOS if os.path.exists(f'{P}/ref/logos/{l[1]}')]
if not LOGOS:
    print('no logo SVGs in ref/logos: nothing to build')
made = []
for name, svg, ext, bev in LOGOS:
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=f'{P}/ref/logos/{svg}')
    curves = [o for o in bpy.data.objects if o not in before]
    bpy.ops.object.select_all(action='DESELECT')
    for o in curves:
        o.select_set(True)
    bpy.context.view_layer.objects.active = curves[0]
    if len(curves) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = name
    # normalise: svg units are tiny; scale so the logo is 2 units tall
    dims = obj.dimensions
    s = 2.0 / max(dims.x, dims.y)
    obj.data.extrude = ext / s
    obj.data.bevel_depth = bev / s
    obj.data.bevel_resolution = 6
    obj.data.resolution_u = 24
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.view_layer.objects.active
    obj.scale = (s, s, s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0, 0, 0)
    obj.rotation_euler = (1.5708, 0, 0)  # stand up facing -Y (Blender front)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.ops.object.shade_smooth_by_angle(angle=0.6)
    if name == 'gemini':
        me = obj.data
        attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        zs = [v.co.z for v in me.vertices]; xs = [v.co.x for v in me.vertices]
        z0, z1, x0, x1 = min(zs), max(zs), min(xs), max(xs)
        for v in me.vertices:  # diagonal sweep top-left (blue) -> bottom-right (pink)
            t = 0.5 * ((v.co.x - x0) / (x1 - x0)) + 0.5 * (1 - (v.co.z - z0) / (z1 - z0))
            attr.data[v.index].color = (*[c ** 2.2 for c in gradient(t)], 1)  # sRGB -> linear
    obj.data.materials.clear()
    obj.data.materials.append(mat_for(name))
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=f'{P}/video/public/logos/{name}.glb', use_selection=True, export_apply=True)
    made.append(obj)
    print(name, [round(d, 3) for d in obj.dimensions])

if PREVIEW and made:
    sc = bpy.context.scene
    eevee(sc, samples=32, motion_blur=False, volumes=True)
    world_fog(0.012, (0.01, 0.015, 0.03))
    floor = pbr('floor', (0.01, 0.012, 0.02), roughness=0.2)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1.3)); bpy.context.object.data.materials.append(floor)
    for i, o in enumerate(made):
        o.location = ((i - 1) * 2.6, 0, 0)
        o.rotation_euler = (0, 0, (i - 1) * -0.25)
    bpy.ops.object.light_add(type='AREA', location=(-3, -4, 4)); k = bpy.context.object; k.data.energy = 900; k.data.size = 4
    k.rotation_euler = (0.9, 0, -0.6)
    bpy.ops.object.light_add(type='AREA', location=(4, 3, 3)); r = bpy.context.object; r.data.energy = 700; r.data.size = 3
    r.data.color = (0.5, 0.7, 1.0); r.rotation_euler = (-0.9, 0, 2.4)
    cam = portrait_camera(lens=32, fstop=4.0, focus=9.5)
    cam.location = (0, -9.5, 0.6); cam.rotation_euler = (1.52, 0, 0)
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    cam.data.sensor_fit = 'HORIZONTAL'; cam.data.sensor_width = 36
    sc.render.filepath = f'{P}/video/out/logos_preview.jpg'
    bpy.ops.render.render(write_still=True)
