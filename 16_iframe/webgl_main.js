
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

let s_ongoing_touch = [];

let s_win_w = 0;
let s_win_h = 0;

function
OnResize (gl)
{
    let w = gl.canvas.width;
    let h = gl.canvas.height;

    if ((s_win_w == w) && (s_win_h == h))
        return;

    s_win_w = w;
    s_win_h = h;

    gl.viewport (0, 0, w, h);
    teapot.resize_viewport (w, h);
    pmeter.resize (gl, w, h, h - 100);
    dbgstr.resize_viewport (gl, w, h);
    r2d.resize_viewport (gl, w, h);
}

function
check_resize_canvas (gl, canvas)
{
//  devicePixelRatio_ = window.devicePixelRatio;

    let display_w = Math.floor(canvas.clientWidth  * devicePixelRatio_);
    let display_h = Math.floor(canvas.clientHeight * devicePixelRatio_);

    if (canvas.width  != display_w ||
        canvas.height != display_h)
    {
        canvas.width  = display_w;
        canvas.height = display_h;
        OnResize (gl);
    }
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

/* ---------------------------------------------------------------- *
 *  Touch Event
 * ---------------------------------------------------------------- */
function touch_client_coord (canvas, event, id)
{
    let rect = canvas.getBoundingClientRect ();
    let mpos = {x: event.changedTouches[id].pageX - rect.left,
                y: event.changedTouches[id].pageY - rect.top,
                id: event.changedTouches[id].identifier};
    mpos.x *= devicePixelRatio_;
    mpos.y *= devicePixelRatio_;
    return mpos;
}

function get_touch_idx (key_id)
{
    for (let i = 0; i < s_ongoing_touch.length; i ++)
    {
        if (s_ongoing_touch[i].id == key_id)
            return i;
    }
    return -1;
}

function on_touch_start (event)
{
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i ++)
    {
        let mouse_pos = touch_client_coord (s_canvas, event, i);
        s_ongoing_touch.push (mouse_pos);
    }

    if (s_ongoing_touch.length == 1)
    {
        s_mouse_trajectory = [];
        s_mouse_pos0 = s_ongoing_touch[0];
        quaternion_copy (s_mdl_qtn0, s_mdl_qtn);
    }
}

function on_touch_end (event)
{
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i ++)
    {
        let idx = get_touch_idx (event.changedTouches[i].identifier);
        if (idx >= 0)
        {
            s_ongoing_touch.splice (idx, 1); /* remove it */
        }
    }
}

function on_touch_move (event)
{
    event.preventDefault();

    for (let i = 0; i < event.changedTouches.length; i ++)
    {
        let mouse_pos = touch_client_coord (s_canvas, event, i);
        let idx = get_touch_idx (mouse_pos.id);
        if (idx >= 0)
        {
            s_ongoing_touch.splice (idx, 1, mouse_pos); /* swap in the new touch record */
        }
    }

    if (s_ongoing_touch.length > 0)
    {
        let touch = s_ongoing_touch[0];
        s_mouse_trajectory.push (touch);

        let dx = touch.x - s_mouse_pos0.x;
        let dy = touch.y - s_mouse_pos0.y;
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

function draw_grid (gl, win_w, win_h)
{
    let col_gray = [0.73, 0.75, 0.75, 1.0];
    let col_blue = [0.00, 0.00, 1.00, 1.0];
    let col_red  = [1.00, 0.00, 0.00, 1.0];
    let col;

    col = col_gray;
    for (let y = 0; y < win_h; y += 10)
        r2d.draw_2d_line (gl, 0, y, win_w, y, col, 1.0);

    for (let x = 0; x < win_w; x += 10)
        r2d.draw_2d_line (gl, x, 0, x, win_h, col, 1.0);

    col = col_blue;
    for (let y = 0; y < win_h; y += 100)
        r2d.draw_2d_line (gl, 0, y, win_w, y, col, 1.0);

    for (let x = 0; x < win_w; x += 100)
        r2d.draw_2d_line (gl, x, 0, x, win_h, col, 1.0);

    col = col_red;
    for (let y = 0; y < win_h; y += 500)
        r2d.draw_2d_line (gl, 0, y, win_w, y, col, 1.0);

    for (let x = 0; x < win_w; x += 500)
        r2d.draw_2d_line (gl, x, 0, x, win_h, col, 1.0);
}



/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function startWebGL()
{
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl');
    if (!gl)
    {
        alert('Failed to initialize WebGL.');
        return;
    }

    let col_bg = 0.7;
    const sParams = new URL(document.location).searchParams;
    if (sParams.get("col_bg"))
        col_bg = sParams.get("col_bg");

    gl.clearColor (col_bg, col_bg, col_bg, 1.0);
    gl.clear (gl.COLOR_BUFFER_BIT);

    s_canvas = canvas;
    canvas  .addEventListener ('mousedown' , on_mouse_down );
    document.addEventListener ('mouseup'   , on_mouse_up   );
    document.addEventListener ('mousemove' , on_mouse_move );
    canvas  .addEventListener ('mouseenter', on_mouse_enter);
    canvas  .addEventListener ('mouseleave', on_mouse_leave);
    canvas  .addEventListener ('click',      on_click      );
    canvas  .addEventListener ('dblclick',   on_dblclick   );

    canvas  .addEventListener ('touchstart' , on_touch_start);
    canvas  .addEventListener ('touchend'   , on_touch_end  );
    canvas  .addEventListener ('touchmove'  , on_touch_move );

    //const texid  = GLUtil.create_image_texture (gl, "../assets/webgl.png");
    //const video  = GLUtil.create_video_texture (gl, "../assets/BigBuckBunny_640x360.mp4");
    //const camera = GLUtil.create_camera_texture (gl);
    devicePixelRatio_ = window.devicePixelRatio;
    let win_w = canvas.clientWidth  * devicePixelRatio_;
    let win_h = canvas.clientHeight * devicePixelRatio_;

    teapot.init_teapot (gl, win_w/win_h);
    r2d.init_2d_render (gl, win_w, win_h);

    init_dbgstr (gl, win_w, win_h);
    pmeter.init_pmeter (gl, win_w, win_h, win_h - 100);

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

        check_resize_canvas (gl, canvas);
        win_w = s_win_w;
        win_h = s_win_h;

        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        draw_grid (gl, win_w, win_h);

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

        let strS = 1;
        let strX = win_w - 180 * strS;
        let strY = 0;
        let strH = 22 * strS;
        let col_white = [1.0, 1.0, 1.0, 1.0];
        let col_black = [0.0, 0.0, 0.0, 0.5];
        dbgstr.draw_dbgstr_ex (gl, `ratio=${devicePixelRatio_}`, strX, strY, strS, col_white, col_black);  strY += strH;
        dbgstr.draw_dbgstr_ex (gl, `WH:${s_win_w},${s_win_h}`,   strX, strY, strS, col_white, col_black);  strY += strH;

        if (s_mouse_down)
        {
            r2d.draw_2d_fillcircle (gl, s_mouse_pos.x, s_mouse_pos.y, 30, [0.0, 0.0, 1.0, 0.5]);
            dbgstr.draw_dbgstr_ex (gl, "MOUSEDOWN", strX, strY, strS, col_white, [0.0, 1.0, 1.0, 1.0]);
        }
        else
        {
            dbgstr.draw_dbgstr_ex (gl, "MOUSEUP  ",  strX, strY, strS, col_white, col_black);
        }
        strY += strH;

        if (s_mouse_enter)
            dbgstr.draw_dbgstr_ex (gl, "MOUSEENTER", strX, strY, strS, col_white, [0.0, 1.0, 1.0, 1.0]);
        else
            dbgstr.draw_dbgstr_ex (gl, "MOUSELEAVE",  strX, strY, strS, col_white, col_black);
        strY += strH;

        let str;
        str = "click=" + s_click_count;
        dbgstr.draw_dbgstr_ex (gl, str,  strX, strY, strS, col_white, col_black); strY += strH;
        str = "dblclick= " + s_dblclick_count;
        dbgstr.draw_dbgstr_ex (gl, str,  strX, strY, strS, col_white, col_black); strY += strH;

        for (let i = 0; i < s_ongoing_touch.length; i ++)
            r2d.draw_2d_fillcircle (gl, s_ongoing_touch[i].x, s_ongoing_touch[i].y, 30, [0.0, 0.0, 1.0, 0.5]);

        if (s_ongoing_touch.length > 0)
            dbgstr.draw_dbgstr_ex (gl, "TOUCH:" + s_ongoing_touch.length, strX, strY, strS, [1.0, 1.0, 1.0, 1.0], [0.0, 1.0, 1.0, 1.0]);
        else
            dbgstr.draw_dbgstr_ex (gl, "TOUCH:0",  strX, strY, strS, col_white, col_black);

        pmeter.draw_pmeter (gl, 0, 40);

        str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);

        count ++;
        requestAnimationFrame (render);
    }
    render ();
}

