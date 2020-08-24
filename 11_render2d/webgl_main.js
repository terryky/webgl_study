
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
    r2d.resize_viewport (gl, w, h);
    teapot.resize_viewport (gl, w, h);
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

    const texid  = GLUtil.create_image_texture (gl, "../assets/webgl.png");
    const video  = GLUtil.create_video_texture (gl, "../assets/BigBuckBunny_640x360.mp4");
    const camera = GLUtil.create_camera_texture (gl);

    let win_w = canvas.clientWidth;
    let win_h = canvas.clientHeight;
    let vid_w = 0;
    let vid_h = 0;
    let cam_w = 0;
    let cam_h = 0;

    r2d.init_2d_render (gl, win_w, win_h);

    teapot.init_teapot (gl, win_w / win_h);
    init_dbgstr (gl, win_w, win_h);
    pmeter.init_pmeter (gl, win_w, 480, 400);
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
        let w = canvas.width;
        let h = canvas.height;

        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let draw_texid;
        let user_uv = [0.25, 0.25, 0.25, 0.75, 0.75, 0.25, 0.75, 0.75];
        if (GLUtil.is_camera_ready(camera))
        {
            GLUtil.update_camera_texture (gl, camera);
            draw_texid = camera.texid;
            cam_w = camera.video.videoWidth;
            cam_h = camera.video.videoHeight;
        }
        else if (GLUtil.is_video_ready(video))
        {
            GLUtil.update_video_texture (gl, video);
            draw_texid = video.texid;
            vid_w = video.video.videoWidth;
            vid_h = video.video.videoHeight;
        }

        /* video */
        r2d.draw_2d_texture (gl, draw_texid, 0, 0, w, h, 0)
        r2d.draw_2d_rect_rot (gl, w/4, h/4, w/2, h/2, [1.0, 0.0, 1.0, 1.0], 3.0, 0.5, 0.5, 0)
        r2d.draw_2d_texture_texcoord_rot (gl, draw_texid, w/4, h/4, w/2, h/2, user_uv, 0.5, 0.5, count);
        r2d.draw_2d_rect_rot (gl, w/4, h/4, w/2, h/2, [1.0, 0.0, 1.0, 1.0], 3.0, 0.5, 0.5, count)

        /* circle */
        r2d.draw_2d_circle     (gl, 100, 100, 50, [0.0, 0.0, 1.0, 1.0], 4.0);
        r2d.draw_2d_fillcircle (gl, 200, 100, 30, [0.0, 1.0, 0.0, 0.5]);

        /* rectangle */
        r2d.draw_2d_rect       (gl, 300, 50,  80, 100, [1.0, 1.0, 0.0, 1.0], 3.0);
        r2d.draw_2d_fillrect   (gl, 400, 70, 100,  60, [0.0, 1.0, 1.0, 0.5]);

        /* triangle */
        r2d.draw_2d_line (gl, 500, 150, 600, 150, [1.0, 0.5, 0.0, 1.0], 10.0);
        r2d.draw_2d_line (gl, 550,  50, 500, 150, [1.0, 0.5, 0.0, 1.0], 10.0);
        r2d.draw_2d_line (gl, 550,  50, 600, 150, [1.0, 0.5, 0.0, 1.0], 10.0);

        /* WebGL logo */
        r2d.draw_2d_texture (gl, texid, w * 0.8, h * 0.8, 160, 80, 0)

        /* teapot */
        {
            let matMV = new Array(16);
            matrix_identity (matMV);
            matrix_translate (matMV, -1.0, -1.0, -5.0);
            matrix_rotate (matMV, count*1.0, 0.0, 1.0, 0.0);
            matrix_translate (matMV, 0.0, -1.5, 0.0);
            matrix_scale (matMV, 0.3, 0.3, 0.3);
            
            teapot.draw_teapot (gl, matMV, [0.0, 0.5, 1.0]);
        }

        pmeter.draw_pmeter (gl, 0, 40);

        let str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);
        str = "window(" + canvas.width + ", " + canvas.height + ")";
        dbgstr.draw_dbgstr (gl, str, canvas.width - 200, 0);

        str = "video (" + vid_w + ", " + vid_h + ")";
        dbgstr.draw_dbgstr (gl, str, canvas.width - 200, 22);

        str = "camera(" + cam_w + ", " + cam_h + ")";
        dbgstr.draw_dbgstr (gl, str, canvas.width - 200, 44);

        count ++;
        stats.end();
        requestAnimationFrame (render);
    }
    render ();
}

