
function init_stats ()
{
    var stats = new Stats();
    var xPanel = stats.addPanel( new Stats.Panel( 'x', '#ff8', '#221' ) );
    var yPanel = stats.addPanel( new Stats.Panel( 'y', '#f8f', '#212' ) );
    stats.showPanel( 0 );
    document.body.appendChild( stats.dom );

    return stats;
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

    //const texid  = GLUtil.create_image_texture (gl, "../assets/webgl.png");
    //const video  = GLUtil.create_video_texture (gl, "../assets/BigBuckBunny_640x360.mp4");
    //const camera = GLUtil.create_camera_texture (gl);

    teapot.init_teapot (gl, 640/480);
    init_dbgstr (gl, 640, 480);
    pmeter.init_pmeter (gl, 640, 480, 400);
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
        debug_log.innerHTML  = "";
        //debug_log.innerHTML += "camera_ready = " + GLUtil.is_camera_ready(camera) + "<br>";
        //debug_log.innerHTML += "video_ready  = " + GLUtil.is_video_ready (video)  + "<br>";
        debug_log.innerHTML += count;

        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        {
            let matMV = new Array(16);
            matrix_identity (matMV);
            matrix_translate (matMV, 0.0, 0.0, -5.0);
            matrix_rotate (matMV, count*1.0, 0.0, 1.0, 0.0);
            matrix_translate (matMV, 0.0, -1.5, 0.0);
            
            teapot.draw_teapot (gl, matMV, [0.0, 0.5, 1.0]);
        }

        pmeter.draw_pmeter (gl, 0, 40);

        let str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);

        count ++;
        stats.end();
        requestAnimationFrame (render);
    }
    render ();
}

