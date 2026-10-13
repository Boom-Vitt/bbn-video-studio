# Loaded by run.py before every script (runs inside the shared Blender bridge). Helpers for animated EEVEE plates.
import json
import math



def eevee(scene, samples=48, motion_blur=True, volumes=True, look='AgX - Medium High Contrast', exposure=0.0):
    """1080x1920 EEVEE Next with ray-traced reflections, volumetrics, motion blur and a filmic look."""
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1080, 1920, 100
    scene.render.fps = 30
    e = scene.eevee
    e.taa_render_samples = samples
    e.use_raytracing = True
    e.ray_tracing_options.resolution_scale = '1'
    e.use_shadows = True
    e.volumetric_tile_size = '4' if volumes else '16'
    e.volumetric_samples = 96 if volumes else 16
    scene.render.use_motion_blur = motion_blur
    scene.render.motion_blur_shutter = 0.5
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = look
    scene.view_settings.exposure = exposure
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 90
    scene.render.film_transparent = False


def portrait_camera(name='Cam', lens=28.0, fstop=0.0, focus=5.0):
    """Camera with VERTICAL sensor fit (three.js uses vertical fov). fstop > 0 turns on depth of field."""
    cam = bpy.data.cameras.new(name)
    cam.sensor_fit = 'VERTICAL'
    cam.sensor_height = 24.0
    cam.lens = lens
    if fstop > 0:
        cam.dof.use_dof = True
        cam.dof.aperture_fstop = fstop
        cam.dof.focus_distance = focus
    obj = bpy.data.objects.new(name, cam)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.scene.camera = obj
    return obj


def key(obj, frame, location=None, rotation=None, scale=None):
    """Keyframe an object at a frame: key(cam, 0, location=(0,-5,1.6), rotation=(1.4,0,0)) (rotation = Euler radians)."""
    if location is not None:
        obj.location = location
        obj.keyframe_insert(data_path='location', frame=frame)
    if rotation is not None:
        obj.rotation_euler = rotation
        obj.keyframe_insert(data_path='rotation_euler', frame=frame)
    if scale is not None:
        obj.scale = scale
        obj.keyframe_insert(data_path='scale', frame=frame)


def smooth_keys(obj):
    """Ease every keyframe (Bezier, auto-clamped) so camera moves start and stop softly."""
    ad = obj.animation_data
    if ad and ad.action:
        for fc in _fcurves(ad.action):
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'


def _fcurves(action):
    if hasattr(action, 'fcurves'):
        return action.fcurves
    out = []  # Blender 5 layered actions
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out += list(bag.fcurves)
    return out


def render_range(out_dir, a, b):
    """Render frames a..b-1 to <out_dir>/f_0000.jpg ... (absolute out_dir). Keep b - a short (≤ ~150 frames): other workers queue behind each call."""
    sc = bpy.context.scene
    sc.render.filepath = out_dir.rstrip('/') + '/f_####'
    sc.frame_start, sc.frame_end = a, b - 1
    bpy.ops.render.render(animation=True)


def cam_track(n):
    """Print the active camera for frames 0..n-1 as JSON for seq.ts applyCam (Blender world, [x,y,z,qw,qx,qy,qz])."""
    sc = bpy.context.scene
    cam = sc.camera
    frames = []
    for f in range(n):
        sc.frame_set(f)
        loc, rot, _ = cam.matrix_world.decompose()
        frames.append([round(v, 5) for v in (loc.x, loc.y, loc.z, rot.w, rot.x, rot.y, rot.z)])
    fov = math.degrees(2 * math.atan(cam.data.sensor_height / 2 / cam.data.lens))
    print('@@JSON')
    print(json.dumps({'fps': sc.render.fps, 'fovY': round(fov, 4), 'frames': frames}))
    print('@@END')


def emission(name, color, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0, 0, 0, 1)
    b.inputs['Emission Color'].default_value = (*color, 1)
    b.inputs['Emission Strength'].default_value = strength
    return m


def pbr(name, color, metallic=0.0, roughness=0.5, **extra):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Metallic'].default_value = metallic
    b.inputs['Roughness'].default_value = roughness
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return m


def world_fog(density=0.02, color=(0.02, 0.03, 0.05), anisotropy=0.3):
    """Dark world with volumetric haze (light shafts from lights)."""
    w = bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes['Background'].inputs['Color'].default_value = (*color, 1)
    v = nt.nodes.new('ShaderNodeVolumePrincipled')
    v.inputs['Density'].default_value = density
    v.inputs['Anisotropy'].default_value = anisotropy
    nt.links.new(v.outputs[0], nt.nodes['World Output'].inputs['Volume'])
    return w
