# Gemini scene plate (worker A3): the Gemini sparkle in a cool blue/purple studio; frosted-glass app tiles "Gmail /
# Docs / Drive" float up on light beams; a web globe rises and its search beam sweeps web cards into the sparkle;
# then a 3/4 orbit (tiles return, three.js chips pop in front) and a pull-back for the cut to the outro.
#   python3 blender/run.py blender/gemini_seq.py -- <project_abs> range A B      frames A..B-1 -> video/public/gemini/seq/f_####.jpg
#   python3 blender/run.py blender/gemini_seq.py -- <project_abs> still F [F ...]
#   python3 blender/run.py blender/gemini_seq.py --json-out video/public/gemini/cam.json -- <project_abs> track
# Every animated value is a pure function of t (scene-local seconds) keyed per frame; 'track' needs no bpy (plain
# python can print it too). Blender world: Z up, the logo faces -Y (the camera side).
P, MODE = ARGS[0], ARGS[1]
FPS, N, LENS, FSTOP = 30, 321, 35.0, 2.8
END = (N - 1) / FPS
S = (0.0, 0.0, 1.55)  # sparkle centre (the GLB is 2 units tall)

# beats (local seconds, whisper word times of gemini-1 / gemini-2)
T_GOOGLE = 1.36
T_IN = (2.72, 3.34, 3.90)  # Gmail, Docs, Drive
T_OUT = 4.55  # "ได้เลย": tiles clear the frame for the web search
T_GLOBE = 4.75
T_CARD = tuple(5.45 + 0.20 * i for i in range(6))  # beam hits card i ("ค้นข้อมูลจากเว็บ")
T_RET = 8.45  # "ที่ใช้ Google ทุกวัน": tiles come back
T_PULL = 9.75  # pull-back for the cut

TILES = ('Gmail', 'Docs', 'Drive')
A = ((-1.28, 0.30, 2.95), (0.0, 0.55, 3.55), (1.28, 0.30, 2.95))  # tile slots around the sparkle
OUT = ((-4.2, 1.6, 0.6), (0.3, -5.0, 3.0), (4.2, 1.6, 0.6))  # exit offsets (Docs flies over the camera, clear of the globe)
R = ((-0.99, 0.17, 3.25), (-0.80, -0.92, 2.40), (1.37, 0.61, 2.23))  # slots after the return (3/4 view)
TILE_GLOW = ((0.10, 0.28, 1.0), (0.30, 0.18, 1.0), (0.62, 0.16, 0.85))
G, RG, RC = (0.0, 3.4, 4.3), 0.95, 1.5  # globe centre, radius, card ring radius

CAM = [  # t, position, target (cubic Hermite through these; keys are passed, never stopped at)
    (0.00, (0.35, -9.30, 2.05), (0.0, 0.0, 1.00)),
    (1.30, (-0.30, -8.60, 1.85), (0.0, 0.0, 1.05)),
    (2.65, (-0.70, -10.40, 2.45), (0.0, 0.2, 1.85)),
    (4.30, (0.45, -11.00, 2.55), (0.0, 0.3, 2.00)),
    (5.40, (0.25, -11.60, 1.55), (0.0, 1.4, 2.20)),
    (6.75, (-0.55, -11.00, 1.45), (0.0, 1.4, 2.25)),
    (7.60, (3.60, -9.60, 1.95), (0.0, 0.7, 1.15)),
    (9.75, (4.30, -9.90, 2.25), (0.0, 0.7, 1.25)),
]
PULL = (0.45, -1.0, 0.32)  # pull-back direction, eased in over T_PULL..END
PULL_D = 6.5


# ---------------------------------------------------------------- pure math (tuples)
def add(a, b): return (a[0] + b[0], a[1] + b[1], a[2] + b[2])
def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def mul(a, s): return (a[0] * s, a[1] * s, a[2] * s)
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a): return mul(a, 1.0 / math.sqrt(dot(a, a)))
def mix(a, b, u): return add(a, mul(sub(b, a), u))
def clamp(x, a=0.0, b=1.0): return min(b, max(a, x))
def seg(x, a, b): return clamp((x - a) / (b - a))
def smooth(u): return u * u * (3 - 2 * u)
def eout(u): return 1 - (1 - u) ** 3
def ein(u): return u ** 3
def eback(u): return 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2


def hermite(t, idx):
    ts = [k[0] for k in CAM]
    if t <= ts[0]:
        return CAM[0][idx]
    if t >= ts[-1]:
        return CAM[-1][idx]
    i = max(j for j in range(len(ts) - 1) if ts[j] <= t)
    h = ts[i + 1] - ts[i]
    u = (t - ts[i]) / h

    def tan(j):
        a, b = max(j - 1, 0), min(j + 1, len(ts) - 1)
        return mul(sub(CAM[b][idx], CAM[a][idx]), 1.0 / (ts[b] - ts[a]))
    h00, h10, h01, h11 = 2 * u**3 - 3 * u**2 + 1, u**3 - 2 * u**2 + u, -2 * u**3 + 3 * u**2, u**3 - u**2
    return add(add(mul(CAM[i][idx], h00), mul(tan(i), h * h10)), add(mul(CAM[i + 1][idx], h01), mul(tan(i + 1), h * h11)))


def cam(t):
    pull = mul(norm(PULL), PULL_D * ein(seg(t, T_PULL, END)))
    return add(hermite(t, 1), pull), add(hermite(t, 2), mul(pull, 0.25))


def quat_from_cols(r, u, b):
    m00, m01, m02, m10, m11, m12, m20, m21, m22 = r[0], u[0], b[0], r[1], u[1], b[1], r[2], u[2], b[2]
    tr = m00 + m11 + m22
    if tr > 0:
        s = math.sqrt(tr + 1) * 2
        return (s / 4, (m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s)
    if m00 > m11 and m00 > m22:
        s = math.sqrt(1 + m00 - m11 - m22) * 2
        return ((m21 - m12) / s, s / 4, (m01 + m10) / s, (m02 + m20) / s)
    if m11 > m22:
        s = math.sqrt(1 + m11 - m00 - m22) * 2
        return ((m02 - m20) / s, (m01 + m10) / s, s / 4, (m12 + m21) / s)
    s = math.sqrt(1 + m22 - m00 - m11) * 2
    return ((m10 - m01) / s, (m02 + m20) / s, (m12 + m21) / s, s / 4)


def look_quat(pos, tgt):
    """Blender camera/light orientation (-Z forward, +Y up) looking from pos at tgt, world Z up."""
    f = norm(sub(tgt, pos))
    r = norm(cross(f, (0, 0, 1)))
    return quat_from_cols(r, cross(r, f), mul(f, -1))


def quat_z_to(d):
    """Rotation taking +Z onto direction d."""
    d = norm(d)
    if d[2] < -0.9999:
        return (0.0, 1.0, 0.0, 0.0)
    q = (1 + d[2], -d[1], d[0], 0.0)
    n = math.sqrt(sum(c * c for c in q))
    return tuple(c / n for c in q)


def yaw_to_cam(t, p, k=1.0):
    c, _ = cam(t)
    return k * math.atan2(c[0] - p[0], -(c[1] - p[1]))


# ---------------------------------------------------------------- animation (pure functions of t)
def bump(x, decay=0.14):
    return math.exp(-x / decay) if x >= 0 else 0.0


def card_arrival(i):
    return T_CARD[i] + 0.48


def hero(t):
    """position, yaw, scale, emission of the sparkle."""
    c, _ = cam(t)
    yaw = -0.10 + 0.14 * smooth(seg(t, 0, 1.5)) + 0.04 * math.sin(0.8 * t) + 0.55 * yaw_to_cam(t, S) * smooth(seg(t, 6.8, 8.0))
    hit = sum(bump(t - card_arrival(i)) for i in range(6))
    z = S[2] + 0.05 * math.sin(1.6 * t)
    return (S[0], S[1], z), yaw, 1 + 0.035 * hit, 0.22 + 1.2 * hit


def tile(t, k):
    """position, yaw, scale, beam growth 0..1 of app tile k."""
    flo = (0, 0, 0.045 * math.sin(1.4 * t + 2.1 * k))
    out = T_OUT + 0.06 * k
    ret = T_RET + 0.13 * k
    if t < out:
        u = seg(t, T_IN[k] - 0.08, T_IN[k] + 0.42)
        pos = add(add(A[k], (0, 0, -1.35 * (1 - eout(u)))), flo)
        s = 0.0001 if u <= 0 else 0.35 + 0.65 * eback(u)
        g = eout(seg(t, T_IN[k] + 0.22, T_IN[k] + 0.52))
    elif t < ret:
        u = seg(t, out, out + 0.3)
        pos = add(add(A[k], mul(OUT[k], ein(u))), flo)
        s = 1.0 if u < 1 else 0.0001
        g = 1 - seg(t, out, out + 0.12)
    else:
        u = seg(t, ret, ret + 0.5)
        pos = add(add(R[k], mul(OUT[k], (1 - eout(u)))), flo)
        s = 1.0
        g = eout(seg(t, ret + 0.32, ret + 0.62))
    return pos, yaw_to_cam(t, pos, 0.75), s, g


def globe(t):
    u = seg(t, T_GLOBE, T_GLOBE + 0.65)
    pos = add(G, (0, 0, -2.0 * (1 - eout(u)) + 0.04 * math.sin(1.1 * t)))
    return pos, 0.35 * t, (0.0001 if u <= 0 else 0.3 + 0.7 * eback(u))


E1, E2 = (1.0, 0.0, 0.0), norm((0.0, -0.45, 1.0))  # card ring plane, tilted toward the camera


def ring_angle(i, t):
    return math.radians(155 - 50 * i) + 0.22 * (t - T_CARD[0])


def ring_pos(i, t, r=RC):
    a = ring_angle(i, t)
    gp, _, _ = globe(t)
    return add(gp, add(mul(E1, r * math.cos(a)), mul(E2, r * math.sin(a))))


def beam_angle(t):
    """Search beam direction angle in the ring plane: passes card i exactly at T_CARD[i]."""
    pts = [(T_CARD[0] - 0.6, ring_angle(0, T_CARD[0]) + 1.1)] + [(T_CARD[i], ring_angle(i, T_CARD[i])) for i in range(6)]
    if t <= pts[0][0]:
        return pts[0][1]
    for (t0, a0), (t1, a1) in zip(pts, pts[1:]):
        if t <= t1:
            return a0 + (a1 - a0) * smooth((t - t0) / (t1 - t0))
    rate = (pts[-1][1] - pts[-2][1]) / (pts[-1][0] - pts[-2][0]) * 0.35
    return pts[-1][1] + rate * (t - pts[-1][0])


def beam_dir(t):
    a = beam_angle(t)
    return norm(add(mul(E1, math.cos(a)), add(mul(E2, math.sin(a)), (0, -0.25, 0))))


def card(t, i):
    """position, yaw, scale, glow of web card i."""
    reveal = seg(t, T_GLOBE + 0.25 + 0.05 * i, T_GLOBE + 0.7 + 0.05 * i)
    if reveal <= 0:
        return G, 0.0, 0.0001, 0.0
    t0 = T_CARD[i] + 0.06
    glow = bump(t - T_CARD[i] + 0.05, 0.25)
    if t < t0:
        pos = ring_pos(i, t, 0.6 + (RC - 0.6) * eout(reveal))
        return pos, yaw_to_cam(t, pos, 0.8), 0.0001 + eback(reveal), glow
    u = seg(t, t0, card_arrival(i))
    if u >= 1:
        return S, 0.0, 0.0001, 0.0
    p0 = ring_pos(i, t0)
    c = add(mix(p0, S, 0.5), (0, -1.3, 0.35))
    e = ein(u)
    pos = mix(mix(p0, c, e), mix(c, (0, -0.2, 1.6), e), e)
    return pos, yaw_to_cam(t, pos, 0.8), 1 - 0.8 * e, glow


def tile_end(tp, ts):
    """Beams land on the tile's lower edge so they never cross its label."""
    sz = ts if isinstance(ts, (int, float)) else ts[2]
    return add(tp, (0, 0.06, -0.37 * sz))


def ripple(t, j):
    u = seg(t, T_GOOGLE + 0.18 * j, T_GOOGLE + 0.18 * j + 1.4)
    return (0.0001 if u <= 0 or u >= 1 else 0.7 + 5.0 * eout(u)), 2.2 * (1 - u) ** 2


# ---------------------------------------------------------------- track (no bpy)
def track():
    frames, marks, prev = [], [], None
    for f in range(N):
        hp, hy, _, _ = hero(f / FPS)
        marks.append([round(v, 5) for v in (*hp, math.cos(hy / 2), 0.0, 0.0, math.sin(hy / 2))])
        pos, tgt = cam(f / FPS)
        q = look_quat(pos, tgt)
        if prev and sum(a * b for a, b in zip(q, prev)) < 0:
            q = tuple(-c for c in q)
        prev = q
        frames.append([round(v, 5) for v in (*pos, *q)])
    fov = math.degrees(2 * math.atan(12.0 / LENS))
    print('@@JSON')
    print(json.dumps({'fps': FPS, 'fovY': round(fov, 4), 'frames': frames, 'logo': marks}))
    print('@@END')


if MODE == 'track':
    track()
else:
    import bmesh
    import mathutils
    import random

    sc = bpy.context.scene
    eevee(sc, samples=48, exposure=-0.35)
    sc.eevee.use_volumetric_shadows = True
    world_fog(0.012, (0.0015, 0.002, 0.005), anisotropy=0.6)
    coll = sc.collection

    def obj(name, data=None):
        o = bpy.data.objects.new(name, data)
        coll.objects.link(o)
        return o

    def mesh_obj(name, bm, mat=None):
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        if mat:
            me.materials.append(mat)
        return obj(name, me)

    def rrect(w, h, d, r, seg_n=8):
        bm = bmesh.new()
        pts = []
        for cx, cz, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
            for i in range(seg_n + 1):
                a = math.radians(a0 + 90 * i / seg_n)
                pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
        fr = [bm.verts.new((x, -d / 2, z)) for x, z in pts]
        bk = [bm.verts.new((x, d / 2, z)) for x, z in pts]
        bm.faces.new(fr)
        bm.faces.new(bk)
        n = len(pts)
        for i in range(n):
            f = bm.faces.new((fr[i], fr[(i + 1) % n], bk[(i + 1) % n], bk[i]))
            f.smooth = True
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return bm

    def plane(w, h, y=0.0):
        bm = bmesh.new()
        vs = [bm.verts.new((x, y, z)) for x, z in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]
        bm.faces.new(vs)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        return bm

    def sphere(r, u=24, v=12, at=(0, 0, 0), bm=None):
        bm = bm or bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=r, matrix=mathutils.Matrix.Translation(at))
        return bm

    def tube(r1, r2, depth, segs):
        """Open cone/cylinder from z=0 to z=depth."""
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=False, segments=segs, radius1=r1, radius2=r2, depth=depth,
                              matrix=mathutils.Matrix.Translation((0, 0, depth / 2)))
        return bm

    def disc(r, segs):
        bm = bmesh.new()
        bmesh.ops.create_circle(bm, cap_ends=True, segments=segs, radius=r)
        return bm

    def grid(size):
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size)
        return bm

    def soft_edges(o, width=0.012):
        m = o.modifiers.new('bevel', 'BEVEL')
        m.width, m.segments, m.limit_method = width, 3, 'ANGLE'

    def glass(name, tint, rough):
        m = pbr(name, tint, roughness=rough, **{'Transmission Weight': 1.0, 'IOR': 1.45, 'Coat Weight': 0.4, 'Coat Roughness': 0.05})
        m.use_raytrace_refraction = True
        return m

    def ghost(name, color, alpha, strength):
        """Transparent emission (light cone), fading along the object's +Z."""
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        nt = m.node_tree
        nt.nodes.clear()
        out = nt.nodes.new('ShaderNodeOutputMaterial')
        em = nt.nodes.new('ShaderNodeEmission')
        em.inputs['Color'].default_value = (*color, 1)
        em.inputs['Strength'].default_value = strength
        tr = nt.nodes.new('ShaderNodeBsdfTransparent')
        mx = nt.nodes.new('ShaderNodeMixShader')
        tc = nt.nodes.new('ShaderNodeTexCoord')
        sx = nt.nodes.new('ShaderNodeSeparateXYZ')
        mr = nt.nodes.new('ShaderNodeMapRange')
        mr.inputs['To Min'].default_value = alpha
        mr.inputs['To Max'].default_value = 0.0
        nt.links.new(tc.outputs['Generated'], sx.inputs[0])
        nt.links.new(sx.outputs['Z'], mr.inputs['Value'])
        lw = nt.nodes.new('ShaderNodeLayerWeight')
        inv = nt.nodes.new('ShaderNodeMath')
        inv.operation, inv.inputs[0].default_value = 'SUBTRACT', 1.0
        nt.links.new(lw.outputs['Facing'], inv.inputs[1])
        sq = nt.nodes.new('ShaderNodeMath')
        sq.operation = 'MULTIPLY'
        nt.links.new(inv.outputs[0], sq.inputs[0])
        nt.links.new(inv.outputs[0], sq.inputs[1])
        fac = nt.nodes.new('ShaderNodeMath')
        fac.operation = 'MULTIPLY'
        nt.links.new(sq.outputs[0], fac.inputs[0])
        nt.links.new(mr.outputs['Result'], fac.inputs[1])
        nt.links.new(fac.outputs[0], mx.inputs[0])
        nt.links.new(tr.outputs[0], mx.inputs[1])
        nt.links.new(em.outputs[0], mx.inputs[2])
        nt.links.new(mx.outputs[0], out.inputs['Surface'])
        m.surface_render_method = 'BLENDED'
        return m

    def light(name, kind, pos, aim, color, energy, size=1.0, cone=0.0, spec=1.0):
        ld = bpy.data.lights.new(name, kind)
        ld.color, ld.energy, ld.specular_factor = color, energy, spec
        if kind == 'AREA':
            ld.shape, ld.size, ld.size_y = 'RECTANGLE', size, size * 0.5
        if kind == 'SPOT':
            ld.spot_size, ld.spot_blend, ld.shadow_soft_size = math.radians(cone), 0.7, 0.6
        o = obj(name, ld)
        o.location = pos
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = quat_z_to(sub(pos, aim))
        return o

    # ---- set: glossy black floor with faint roughness variation, key + two brand rims + a top shaft
    floor_m = pbr('floor', (0.0004, 0.0005, 0.0009), roughness=0.08)  # ~no diffuse: glossy black, rims' shadows don't print on it
    nt = floor_m.node_tree
    tc, nz, mr = nt.nodes.new('ShaderNodeTexCoord'), nt.nodes.new('ShaderNodeTexNoise'), nt.nodes.new('ShaderNodeMapRange')
    nz.inputs['Scale'].default_value = 0.55
    mr.inputs['To Min'].default_value, mr.inputs['To Max'].default_value = 0.07, 0.2
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], nt.nodes['Principled BSDF'].inputs['Roughness'])
    mesh_obj('floor', grid(120), floor_m)

    light('key', 'AREA', (0.0, -4.0, 7.5), (0, 0, 1.4), (0.92, 0.95, 1.0), 480, size=5.0, spec=0.0)
    light('rimL', 'SPOT', (-4.2, 7.5, 9.0), (0, -0.5, 1.3), (0.18, 0.42, 1.0), 4600, cone=28)
    light('rimR', 'SPOT', (4.2, 7.5, 8.6), (0, -0.5, 1.3), (0.70, 0.26, 1.0), 4600, cone=28)
    light('top', 'SPOT', (0.0, 2.6, 11.0), (0, 0.8, 0.0), (0.45, 0.58, 1.0), 2600, cone=20)
    light('fill', 'AREA', (-6.0, -6.0, 2.0), (0, 0, 1.5), (0.45, 0.55, 1.0), 120, size=4.0, spec=0.2)
    for nm, pos in (('kickL', (-3.2, -3.5, 4.2)), ('kickR', (3.6, -3.0, 2.6))):
        kl = light(nm, 'AREA', pos, (0, 0, 1.55), (0.85, 0.9, 1.0), 260, size=3.0)
        kl.data.diffuse_factor = 0.0
        kl.data.volume_factor = 0.0

    # ---- hero: the real Gemini mark (GLB), vertex-colour gradient kept, a touch of self-glow so it reads in the dark
    hero_e = obj('hero')
    hero_e.rotation_mode = 'XYZ'
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=f'{P}/video/public/logos/gemini.glb')
    logo_m = None
    for o in set(bpy.data.objects) - before:
        if o.type == 'MESH':
            o.parent = hero_e
            me = o.data
            cname = me.color_attributes[0].name if len(me.color_attributes) else 'Col'
            logo_m = bpy.data.materials.new('gemini_logo')
            logo_m.use_nodes = True
            lnt = logo_m.node_tree
            b = lnt.nodes['Principled BSDF']
            vc = lnt.nodes.new('ShaderNodeVertexColor')
            vc.layer_name = cname
            lnt.links.new(vc.outputs['Color'], b.inputs['Base Color'])
            lnt.links.new(vc.outputs['Color'], b.inputs['Emission Color'])
            b.inputs['Roughness'].default_value = 0.18
            b.inputs['Coat Weight'].default_value = 0.6
            b.inputs['Coat Roughness'].default_value = 0.08
            me.materials.clear()
            me.materials.append(logo_m)
    logo_glow = logo_m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength']

    # ---- app tiles: frosted glass slab, plain-text label (no app logos), soft coloured glow behind the glass
    font = bpy.data.fonts.load(P + '/ref/fonts/Prompt-SemiBold.ttf')  # Prompt (OFL, Google Fonts)
    label_m = emission('label', (1.0, 1.0, 1.0), 1.1)  # under the stage bloom threshold: crisp text
    beam_m = emission('beam', (0.42, 0.62, 1.0), 10.0)
    pulse_m = emission('pulse', (0.85, 0.92, 1.0), 40.0)
    tiles, beams, pulses = [], [], []
    for k, name in enumerate(TILES):
        e = obj(f'tile{k}')
        e.rotation_mode = 'XYZ'
        g = mesh_obj(f'tile{k}_glass', rrect(0.98, 0.70, 0.09, 0.14), glass(f'tileglass{k}', (0.72, 0.80, 1.0), 0.30))
        g.data.set_sharp_from_angle(angle=0.6)
        soft_edges(g)
        g.parent = e
        gl = mesh_obj(f'tile{k}_glow', plane(0.78, 0.5), emission(f'tileglow{k}', TILE_GLOW[k], 1.0))
        gl.location = (0, 0.07, 0)
        gl.parent = e
        cu = bpy.data.curves.new(f'label{k}', 'FONT')
        cu.body, cu.font, cu.size, cu.extrude = name, font, 0.25, 0.004
        cu.align_x, cu.align_y = 'CENTER', 'CENTER'
        cu.materials.append(label_m)
        tx = obj(f'tile{k}_label', cu)
        tx.location, tx.rotation_euler = (0, -0.055, -0.01), (math.pi / 2, 0, 0)
        tx.parent = e
        tiles.append(e)
        bm_o = mesh_obj(f'beam{k}', tube(1, 1, 1, 12), beam_m)
        bm_o.rotation_mode = 'QUATERNION'
        beams.append(bm_o)
        for j in range(2):
            pu = mesh_obj(f'pulse{k}{j}', sphere(1, 12, 8), pulse_m)
            pulses.append((k, j, pu))

    # ---- web globe: glowing wireframe sphere around a dark glossy core, search spot + light cone, web cards
    gl_e = obj('globe')
    gl_e.rotation_mode = 'XYZ'
    wire = mesh_obj('globe_wire', sphere(RG, 28, 14),
                    emission('globewire', (0.22, 0.48, 1.0), 3.5))
    wm = wire.modifiers.new('wire', 'WIREFRAME')
    wm.thickness, wm.use_replace = 0.016, True
    wire.parent = gl_e
    core = mesh_obj('globe_core', sphere(RG * 0.93, 48, 24),
                    pbr('globecore', (0.015, 0.03, 0.09), roughness=0.45, **{'Coat Weight': 0.15, 'Emission Color': (0.2, 0.35, 1.0, 1), 'Emission Strength': 0.25}))
    for f in core.data.polygons:
        f.use_smooth = True
    core.parent = gl_e
    for o in (wire, core):
        o.visible_shadow = False
    cone = mesh_obj('search_cone', tube(0.02, 0.42, 2.6, 40), ghost('searchcone', (0.35, 0.65, 1.0), 0.22, 2.5))
    cone.rotation_mode = 'QUATERNION'
    cone.visible_shadow = False
    spot = light('search', 'SPOT', G, (0, -1, 3.85), (0.6, 0.85, 1.0), 0, cone=18)

    cards, card_glows = [], []
    for i in range(6):
        e = obj(f'card{i}')
        e.rotation_mode = 'XYZ'
        c = mesh_obj(f'card{i}_glass', rrect(0.74, 0.50, 0.03, 0.06, 5), glass(f'cardglass{i}', (0.6, 0.7, 1.0), 0.3))
        c.parent = e
        hm = emission(f'cardhead{i}', (0.35, 0.6, 1.0), 1.4)
        h = mesh_obj(f'card{i}_head', plane(0.62, 0.075), hm)
        h.location = (0, -0.02, 0.145)
        h.parent = e
        for j, (w, z) in enumerate(((0.56, 0.03), (0.48, -0.06), (0.53, -0.15))):
            ln = mesh_obj(f'card{i}_line{j}', plane(w, 0.032), emission(f'cardline{i}{j}', (0.85, 0.88, 1.0), 0.8))
            ln.location = (0, -0.02, z)
            ln.parent = e
        bk = mesh_obj(f'card{i}_back', plane(0.62, 0.38), emission(f'cardback{i}', (0.12, 0.26, 0.95), 0.8))
        bk.location = (0, 0.03, 0)
        bk.parent = e
        cards.append(e)
        card_glows.append(hm.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'])

    # floor ripples on "Google"
    rip_m = [emission(f'ripple{j}', (0.35, 0.55, 1.0), 2.2) for j in range(2)]
    ripples = [mesh_obj(f'ripple{j}', disc(1.0, 96), rip_m[j]) for j in range(2)]
    for rp in ripples:
        rp.location = (0, 0, 0.004)
        m = rp.modifiers.new('wire', 'WIREFRAME')  # disc outline -> thin band
        m.thickness, m.use_replace, m.use_boundary = 0.008, True, True

    camo = portrait_camera(lens=LENS, fstop=FSTOP)
    camo.data.dof.focus_object = hero_e
    camo.data.clip_end = 200
    camo.rotation_mode = 'QUATERNION'

    # ---- keys
    if MODE == 'range':
        a, b = int(ARGS[2]), int(ARGS[3])
        keyed = list(range(max(0, a - 2), min(N, b + 2)))
    else:
        shots = [int(x) for x in ARGS[2:]]
        keyed = sorted({g for f in shots for g in (f - 1, f, f + 1) if 0 <= g < N})

    def K(o, f, loc=None, quat=None, eul=None, scale=None):
        if loc is not None:
            o.location = loc
            o.keyframe_insert('location', frame=f)
        if quat is not None:
            o.rotation_quaternion = quat
            o.keyframe_insert('rotation_quaternion', frame=f)
        if eul is not None:
            o.rotation_euler = eul
            o.keyframe_insert('rotation_euler', frame=f)
        if scale is not None:
            o.scale = scale if isinstance(scale, tuple) else (scale, scale, scale)
            o.keyframe_insert('scale', frame=f)

    def KV(sock, f, v):
        sock.default_value = v
        sock.keyframe_insert('default_value', frame=f)

    prev_q = None
    for f in keyed:
        t = f / FPS
        cp, ct = cam(t)
        q = look_quat(cp, ct)
        if prev_q and sum(x * y for x, y in zip(q, prev_q)) < 0:
            q = tuple(-c for c in q)
        prev_q = q
        K(camo, f, loc=cp, quat=q)
        hp, hy, hs, he = hero(t)
        K(hero_e, f, loc=hp, eul=(0, 0, hy), scale=hs)
        KV(logo_glow, f, he)
        src = add(hp, (0, 0.14, 0))
        for k in range(3):
            tp, ty, ts_, tg = tile(t, k)
            K(tiles[k], f, loc=tp, eul=(0, 0, ty), scale=ts_)
            end = tile_end(tp, ts_)
            d = sub(end, src)
            ln = math.sqrt(dot(d, d)) * max(tg, 0.0001)
            K(beams[k], f, loc=src, quat=quat_z_to(d), scale=(0.009, 0.009, ln))
        for k, j, pu in pulses:
            tp, _, _ts, tg = tile(t, k)
            u = (t * 0.9 + 0.5 * j + 0.17 * k) % 1.0
            r = 0.04 * math.sin(math.pi * u) if tg > 0.98 else 0.0001
            K(pu, f, loc=mix(src, tile_end(tp, _ts), u), scale=max(r, 0.0001))
        gp, gr, gs = globe(t)
        K(gl_e, f, loc=gp, eul=(0, 0, gr), scale=gs)
        on = seg(t, T_GLOBE + 0.4, T_GLOBE + 0.9)
        bd = beam_dir(t)
        K(cone, f, loc=gp, quat=quat_z_to(bd), scale=max(on, 0.0001))
        K(spot, f, loc=gp, quat=quat_z_to(mul(bd, -1)))
        spot.data.energy = 6000 * on
        spot.data.keyframe_insert('energy', frame=f)
        for i in range(6):
            cpos, cy, cs, cg = card(t, i)
            K(cards[i], f, loc=cpos, eul=(0, 0, cy), scale=cs)
            KV(card_glows[i], f, 1.4 + 5.0 * cg)
        for j in range(2):
            rs, re = ripple(t, j)
            K(ripples[j], f, scale=rs)
            KV(rip_m[j].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'], f, re)

    out = f'{P}/video/public/gemini/seq'
    if MODE == 'range':
        render_range(out, a, b)
        print('rendered', a, b)
    else:
        for f in shots:
            render_range(out, f, f + 1)
        print('rendered', shots)
