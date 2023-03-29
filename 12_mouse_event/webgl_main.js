
/* can we use touch event ? */
let s_supportTouch = 'ontouchend' in document;
let s_mouse_down = false;
let s_mouse_enter= false;
let s_clicked    = false;
let s_click_count    = 0;
let s_dblclick_count = 0;
let s_mouse_pos  = {x:0, y:0};
let s_mouse_pos0 = {x:0, y:0};
let s_canvas;
let s_mouse_trajectory = [];
let s_mdl_qtn  = new Array(4);
let s_mdl_qtn0 = new Array(4);
let s_mdl_mtx  = new Array(16);
let devicePixelRatio_;

let s_win_w;
let s_win_h;

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
 *  Mouse Event
 * ---------------------------------------------------------------- */
function mouse_client_coord (canvas, event)
{
    let rect = canvas.getBoundingClientRect ();
    let mpos = {x: event.clientX - rect.left,
                y: event.clientY - rect.top};
    mpos.x *= devicePixelRatio_;
    mpos.y *= devicePixelRatio_;
    return mpos;
}

function on_mouse_down (event)
{
    s_mouse_pos = mouse_client_coord (s_canvas, event);
    s_mouse_down = true;
    s_mouse_trajectory = [];

    s_mouse_pos0 = s_mouse_pos;
    quaternion_copy (s_mdl_qtn0, s_mdl_qtn);
}

function on_mouse_up (event)
{
    s_mouse_down = false;
}

function on_mouse_move (event)
{
    s_mouse_pos = mouse_client_coord (s_canvas, event);

    if (s_mouse_down)
    {
        s_mouse_trajectory.push (s_mouse_pos);

        let dx = s_mouse_pos.x - s_mouse_pos0.x;
        let dy = s_mouse_pos.y - s_mouse_pos0.y;
        let axis = [];
        axis[0] = 2 * Math.PI * dy / s_win_h;
        axis[1] = 2 * Math.PI * dx / s_win_w;
        axis[2] = 0;

        let rot = vec3_normalize (axis);
        let dqtn = [];
        quaternion_rotate (dqtn, rot, axis[0], axis[1], axis[2]);
        quaternion_mult (s_mdl_qtn, dqtn, s_mdl_qtn0);
        quaternion_to_matrix (s_mdl_mtx, s_mdl_qtn);
    }
}

function on_mouse_enter (event)
{
    s_mouse_enter = true;
}

function on_mouse_leave (event)
{
    s_mouse_enter = false;
}

function on_click (event)
{
    s_click_count ++;
    s_clicked = true;
}

function on_dblclick (event)
{
    s_dblclick_count ++;

    quaternion_identity (s_mdl_qtn);
    quaternion_to_matrix (s_mdl_mtx, s_mdl_qtn);
}


function draw_mouse_trajectory (gl)
{
    let col_black = [0.0, 0.0, 0.0, 1.0];
    let col_red   = [1.0, 0.0, 0.0, 1.0];
    let col_green = [0.0, 0.9, 0.0, 1.0];
    let col_pink  = [1.0, 0.0, 1.0, 1.0];
    let col_blue  = [0.0, 0.0, 1.0, 1.0];

    for (let i = 1; i < s_mouse_trajectory.length; i ++)
    {
        let x0 = s_mouse_trajectory[i - 1].x;
        let y0 = s_mouse_trajectory[i - 1].y;
        let x1 = s_mouse_trajectory[i    ].x;
        let y1 = s_mouse_trajectory[i    ].y;

        if (i == s_mouse_trajectory.length - 1)
            r2d.draw_2d_line (gl, x0, y0, x1, y1, col_pink, 8.0);
        else if (i == s_mouse_trajectory.length - 2)
            r2d.draw_2d_line (gl, x0, y0, x1, y1, col_green, 8.0);
        else if (i == s_mouse_trajectory.length - 3)
            r2d.draw_2d_line (gl, x0, y0, x1, y1, col_blue, 8.0);
        else
            r2d.draw_2d_line (gl, x0, y0, x1, y1, col_black, 3.0);
    }

    for (let i = 1; i < s_mouse_trajectory.length; i ++)
    {
        let x0 = s_mouse_trajectory[i - 1].x;
        let y0 = s_mouse_trajectory[i - 1].y;
        let x1 = s_mouse_trajectory[i    ].x;
        let y1 = s_mouse_trajectory[i    ].y;

        if (i == s_mouse_trajectory.length - 1)
        {
            r2d.draw_2d_fillcircle (gl, x0, y0, 10, col_black);
            r2d.draw_2d_fillcircle (gl, x0, y0,  8, col_green);
            r2d.draw_2d_fillcircle (gl, x1, y1, 10, col_black);
            r2d.draw_2d_fillcircle (gl, x1, y1,  8, col_pink);
        }
        else if (i == s_mouse_trajectory.length - 2)
        {
            r2d.draw_2d_fillcircle (gl, x0, y0, 10, col_black);
            r2d.draw_2d_fillcircle (gl, x0, y0,  8, col_blue);
        }
        else
        {
            r2d.draw_2d_fillrect  (gl, x0 - 3, y0 - 3, 7, 7, col_red);
        }
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

    s_canvas = canvas;
    canvas  .addEventListener ('mousedown' , on_mouse_down );
    document.addEventListener ('mouseup'   , on_mouse_up   );
    document.addEventListener ('mousemove' , on_mouse_move );
    canvas  .addEventListener ('mouseenter', on_mouse_enter);
    canvas  .addEventListener ('mouseleave', on_mouse_leave);
    canvas  .addEventListener ('click',      on_click      );
    canvas  .addEventListener ('dblclick',   on_dblclick   );


    //const texid  = GLUtil.create_image_texture (gl, "../assets/webgl.png");
    //const video  = GLUtil.create_video_texture (gl, "../assets/BigBuckBunny_640x360.mp4");
    //const camera = GLUtil.create_camera_texture (gl);
    devicePixelRatio_ = window.devicePixelRatio;
    let win_w = canvas.clientWidth  * devicePixelRatio_;
    let win_h = canvas.clientHeight * devicePixelRatio_;
    s_win_w = win_w;
    s_win_h = win_h;

    teapot.init_teapot (gl, win_w/win_h);
    r2d.init_2d_render (gl, win_w, win_h);

    init_dbgstr (gl, win_w, win_h);
    pmeter.init_pmeter (gl, win_w, win_h, win_h - 100);
    const stats = init_stats ();

    let teapot_color = [];
    teapot_color[0] = Math.random();
    teapot_color[1] = Math.random();
    teapot_color[2] = Math.random();

    quaternion_identity (s_mdl_qtn);
    quaternion_to_matrix (s_mdl_mtx, s_mdl_qtn);

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
        debug_log.innerHTML += "s_supportTouch = " + s_supportTouch + "<br>";
        debug_log.innerHTML += "s_mouse_down = "   + s_mouse_down + "<br>";
        debug_log.innerHTML += "s_mouse_pos  = (" + s_mouse_pos.x.toFixed(1) + ", " + s_mouse_pos.y.toFixed(1) + ")" + "<br>";
        debug_log.innerHTML += count;

        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        /* [mouse click] ==> change teapot color */
        if (s_clicked)
        {
            teapot_color[0] = Math.random();
            teapot_color[1] = Math.random();
            teapot_color[2] = Math.random();
            s_clicked = false;
        }

        {
            let matMV = new Array(16);
            matrix_identity (matMV);
            matrix_mult (matMV, s_mdl_mtx, matMV);
            matrix_rotate (matMV, count*1.0, 0.0, 1.0, 0.0);
            matrix_translate (matMV, 0.0, -1.5, 0.0);

            matMV[12] +=  0.0;
            matMV[13] +=  0.0;
            matMV[14] += -5.0;

            teapot.draw_teapot (gl, matMV, teapot_color);
        }

        gl.disable (gl.DEPTH_TEST);
        draw_mouse_trajectory (gl);

        if (s_mouse_down)
        {
            r2d.draw_2d_fillcircle (gl, s_mouse_pos.x, s_mouse_pos.y, 30, [0.0, 0.0, 1.0, 0.5]);
            dbgstr.draw_dbgstr_ex (gl, "MOUSEDOWN", win_w - 140, 22 * 0, 1, [1.0, 1.0, 1.0, 1.0], [0.0, 1.0, 1.0, 1.0]);
        }
        else
        {
            dbgstr.draw_dbgstr (gl, "MOUSEUP  ",  win_w - 140, 22 * 0);
        }

        if (s_mouse_enter)
            dbgstr.draw_dbgstr_ex (gl, "MOUSEENTER", win_w - 140, 22 * 1, 1, [1.0, 1.0, 1.0, 1.0], [0.0, 1.0, 1.0, 1.0]);
        else
            dbgstr.draw_dbgstr (gl, "MOUSELEAVE",  win_w - 140, 22 * 1);

        let str;
        str = "click=" + s_click_count;
        dbgstr.draw_dbgstr (gl, str,  win_w - 140, 22 * 2);
        str = "dblclick= " + s_dblclick_count;
        dbgstr.draw_dbgstr (gl, str,  win_w - 140, 22 * 3);

        pmeter.draw_pmeter (gl, 0, 40);

        str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);

        count ++;
        stats.end();
        requestAnimationFrame (render);
    }
    render ();
}

