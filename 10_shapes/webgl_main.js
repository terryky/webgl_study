
var s_sobj;
var s_matPrj = new Array(16);
var s_loc_mtx_mv;
var s_loc_mtx_pmv;
var s_loc_mtx_nrm;
var s_loc_color;
var s_loc_alpha;
var s_loc_lightpos;

s_strVS = `
    attribute vec4  a_Vertex;
    attribute vec3  a_Normal;
    attribute vec2  a_TexCoord;
    uniform   mat4  u_PMVMatrix;
    uniform   mat4  u_MVMatrix;
    uniform   mat3  u_ModelViewIT;
    varying   vec3  v_diffuse;
    varying   vec3  v_specular;
    varying   vec2  v_texcoord;
    const     float shiness = 16.0;
    uniform   vec3  u_LightPos;
    const     vec3  LightCol = vec3(1.0, 1.0, 1.0);

    void DirectionalLight (vec3 normal, vec3 eyePos)
    {
        vec3  lightDir = normalize (u_LightPos);
        vec3  halfV    = normalize (u_LightPos - eyePos);
        float dVP      = max(dot(normal, lightDir), 0.0);
        float dHV      = max(dot(normal, halfV   ), 0.0);

        float pf = 0.0;
        if(dVP > 0.0)
            pf = pow(dHV, shiness);

        v_diffuse += dVP * LightCol;
        v_specular+= pf  * LightCol * 0.5;
    }

    void main(void)
    {
        gl_Position = u_PMVMatrix * a_Vertex;
        vec3 normal = normalize(u_ModelViewIT * a_Normal);
        vec3 eyePos = vec3(u_MVMatrix * a_Vertex);

        v_diffuse  = vec3(0.5);
        v_specular = vec3(0.0);
        DirectionalLight(normal, eyePos);

        v_diffuse = clamp(v_diffuse, 0.0, 1.0);
        v_texcoord  = a_TexCoord;
    }
`;

s_strFS = `
    precision mediump float;

    uniform vec3    u_color;
    uniform float   u_alpha;
    varying vec3    v_diffuse;
    varying vec3    v_specular;
    varying vec2    v_texcoord;
    uniform sampler2D u_sampler;

    void main(void)
    {
        vec3 color;
        color = vec3(texture2D(u_sampler, v_texcoord));
        color *= (u_color * v_diffuse);
        color += v_specular;
        gl_FragColor = vec4(color, u_alpha);
    }
`;




function init_stats ()
{
    var stats = new Stats();
    var xPanel = stats.addPanel( new Stats.Panel( 'x', '#ff8', '#221' ) );
    var yPanel = stats.addPanel( new Stats.Panel( 'y', '#f8f', '#212' ) );
    stats.showPanel( 0 );
    document.body.appendChild( stats.dom );

    return stats;
}


function on_resize (gl)
{
    let w = gl.canvas.width;
    let h = gl.canvas.height;

    gl.viewport (0, 0, w, h);
    pmeter.resize (gl, w, h, h - 100);
    dbgstr.resize_viewport (gl, w, h);
    matrix_proj_perspective (s_matPrj, 72.0, w/h, 1, 1000);
}

function check_resize_canvas (gl, canvas)
{
    let display_w = canvas.clientWidth;
    let display_h = canvas.clientHeight;

    if (canvas.width  != display_w ||
        canvas.height != display_h) 
    {
        canvas.width  = display_w;
        canvas.height = display_h;
        on_resize (gl);
    }
}

function init_shader (gl, w, h)
{
    s_sobj = GLUtil.generate_shader (gl, s_strVS, s_strFS);
    s_loc_mtx_mv  = gl.getUniformLocation (s_sobj.program, "u_MVMatrix" );
    s_loc_mtx_pmv = gl.getUniformLocation (s_sobj.program, "u_PMVMatrix" );
    s_loc_mtx_nrm = gl.getUniformLocation (s_sobj.program, "u_ModelViewIT" );
    s_loc_color   = gl.getUniformLocation (s_sobj.program, "u_color" );
    s_loc_alpha   = gl.getUniformLocation (s_sobj.program, "u_alpha" );
    s_loc_lightpos= gl.getUniformLocation (s_sobj.program, "u_LightPos" );

    matrix_proj_perspective (s_matPrj, 72.0, w / h, 1, 1000);
}


function compute_invmat3x3 (matMVI3x3, matMV)
{
    let matMVI4x4 = new Array(16);

    matrix_copy (matMVI4x4, matMV);
    matrix_invert   (matMVI4x4);
    matrix_transpose(matMVI4x4);
    matMVI3x3[0] = matMVI4x4[0];
    matMVI3x3[1] = matMVI4x4[1];
    matMVI3x3[2] = matMVI4x4[2];
    matMVI3x3[3] = matMVI4x4[4];
    matMVI3x3[4] = matMVI4x4[5];
    matMVI3x3[5] = matMVI4x4[6];
    matMVI3x3[6] = matMVI4x4[8];
    matMVI3x3[7] = matMVI4x4[9];
    matMVI3x3[8] = matMVI4x4[10];
}

function render_shape (gl, shape, texid, count, x, y)
{
    let matMV     = new Array(16);
    let matPMV    = new Array(16);
    let matMVI4x4 = new Array(16);
    let matMVI3x3 = new Array( 9);
    let color = [1.0, 1.0, 1.0, 1.0];

    gl.enable (gl.DEPTH_TEST);
    //gl.enable (gl.CULL_FACE);
    gl.frontFace (gl.CW);

    gl.useProgram (s_sobj.program);

    gl.enableVertexAttribArray (s_sobj.loc_vtx);
    gl.enableVertexAttribArray (s_sobj.loc_uv );
    gl.enableVertexAttribArray (s_sobj.loc_nrm);

    matrix_identity (matMV);
    matrix_translate (matMV, x, y, -10.0);
    matrix_rotate (matMV, count, 0.0, 1.0, 0.0);
    matrix_mult (matPMV, s_matPrj, matMV);

    compute_invmat3x3 (matMVI3x3, matMV);

    gl.uniformMatrix4fv (s_loc_mtx_mv,  false, matMV );
    gl.uniformMatrix4fv (s_loc_mtx_pmv, false, matPMV);
    gl.uniformMatrix3fv (s_loc_mtx_nrm, false, matMVI3x3);
    gl.uniform3f (s_loc_lightpos, 1.0, 1.0, 1.0);
    gl.uniform3f (s_loc_color, color[0], color[1], color[2]);
    gl.uniform1f (s_loc_alpha, color[3]);

    gl.enable (gl.BLEND);
    gl.enable (gl.DEPTH_TEST);

    gl.bindTexture (gl.TEXTURE_2D, texid);

    gl.bindBuffer (gl.ARRAY_BUFFER, shape.vbo_vtx);
    gl.vertexAttribPointer (s_sobj.loc_vtx, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer (gl.ARRAY_BUFFER, shape.vbo_nrm);
    gl.vertexAttribPointer (s_sobj.loc_nrm, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer (gl.ARRAY_BUFFER, shape.vbo_uv);
    gl.vertexAttribPointer (s_sobj.loc_uv,  2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, shape.vbo_idx);
    gl.drawElements (gl.TRIANGLES, shape.num_faces * 3, gl.UNSIGNED_SHORT, 0);

    gl.disable (gl.BLEND);
    gl.frontFace (gl.CCW);
}

/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function startWebGL()
{
    let debug_log = document.getElementById('debug_log');

    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl');
    if (!gl)
    {
        alert('Failed to initialize WebGL.');
        return;
    }

    gl.clearColor (0.7, 0.7, 0.7, 1.0);
    gl.clear (gl.COLOR_BUFFER_BIT);

    const texid  = GLUtil.create_image_texture (gl, "../assets/uv_checker.png");
    //const video  = GLUtil.create_video_texture (gl, "../assets/BigBuckBunny_640x360.mp4");
    //const camera = GLUtil.create_camera_texture (gl);

    let win_w = canvas.clientWidth;
    let win_h = canvas.clientHeight;

    let shape_cylinder    = shapes.shape_create (gl, shapes.SHAPE_CYLINDER,    40, 40);
    let shape_sphere      = shapes.shape_create (gl, shapes.SHAPE_SPHERE,      40, 40);
    let shape_dinisurface = shapes.shape_create (gl, shapes.SHAPE_DINISURFACE, 40, 40);
    let shape_boysurface  = shapes.shape_create (gl, shapes.SHAPE_BOYSURFACE,  40, 40);
    let shape_kleinbottle = shapes.shape_create (gl, shapes.SHAPE_KLEINBOTTLE, 40, 40);
    let shape_moebius     = shapes.shape_create (gl, shapes.SHAPE_MOEBIUS,     40, 40);
    let shape_torus       = shapes.shape_create (gl, shapes.SHAPE_TORUS,       40, 40);

    init_shader (gl, win_w, win_h);
    init_dbgstr (gl, win_w, win_h);
    pmeter.init_pmeter (gl, win_w, win_w, win_h);
    const stats = init_stats ();

    let count = 0;
    let prev_time_ms = performance.now();
    function render (now)
    {
        pmeter.reset_lap (0);
        pmeter.set_lap (0);

        let cur_time_ms = performance.now();
        let interval_ms = cur_time_ms - prev_time_ms;
        prev_time_ms = cur_time_ms;

        stats.begin();
        //debug_log.innerHTML  = "";
        //debug_log.innerHTML += "camera_ready = " + GLUtil.is_camera_ready(camera) + "<br>";
        //debug_log.innerHTML += "video_ready  = " + GLUtil.is_video_ready (video)  + "<br>";

        check_resize_canvas (gl, canvas);
        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let draw_texid = texid;
/*
        if (GLUtil.is_camera_ready(camera))
        {
            GLUtil.update_camera_texture (gl, camera);
            draw_texid = camera.texid;
        }
        else if (GLUtil.is_video_ready(video))
        {
            GLUtil.update_video_texture (gl, video);
            draw_texid = video.texid;
        }
*/
        render_shape (gl, shape_moebius,     draw_texid, count, -1.5,  3.0);
        render_shape (gl, shape_dinisurface, draw_texid, count,  1.5,  3.0);

        render_shape (gl, shape_torus,       draw_texid, count, -3.0,  0.0);
        render_shape (gl, shape_sphere,      draw_texid, count,  0.0,  0.0);
        render_shape (gl, shape_cylinder,    draw_texid, count,  3.0,  0.0);

        render_shape (gl, shape_boysurface,  draw_texid, count, -1.5, -3.0);
        render_shape (gl, shape_kleinbottle, draw_texid, count,  1.5, -3.0);

        pmeter.draw_pmeter (gl, 0, 40);

        let str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);
        str = "window(" + canvas.width + ", " + canvas.height + ")";
        dbgstr.draw_dbgstr (gl, str, canvas.width - 200, 0);
        dbgstr.draw_dbgstr (gl, str, canvas.width - 200, canvas.height - 22);

        count ++;
        stats.end();
        requestAnimationFrame (render);
    }
    render ();
}

