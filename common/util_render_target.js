/* ------------------------------------------------ *
 * The MIT License (MIT)
 * Copyright (c) 2020 terryky1220@gmail.com
 * ------------------------------------------------ */

GLUtil.create_render_target = function (gl, w, h, flags)
{
    let tex_id = null;
    let tex_z  = null;
    let fbo_id = null;

    if (flags & 1)
    {
        tex_id = gl.createTexture ();
        gl.bindTexture (gl.TEXTURE_2D, tex_id);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindTexture (gl.TEXTURE_2D, null);
    }

    if (flags & 2)
    {
        tex_z = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, tex_z);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

    if (flags)
    {
        fbo_id = gl.createFramebuffer();
        gl.bindFramebuffer (gl.FRAMEBUFFER, fbo_id);
        gl.framebufferTexture2D (gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex_id, 0);
        gl.framebufferRenderbuffer (gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,  gl.RENDERBUFFER, tex_z,  0);
        gl.bindFramebuffer (gl.FRAMEBUFFER, null);
    }


    let rtarget = {};
    rtarget.texid  = tex_id;
    rtarget.texz_id= tex_z;
    rtarget.fboid  = fbo_id;
    rtarget.width  = w;
    rtarget.height = h;

    return rtarget;
}


GLUtil.destroy_render_target = function (gl, rtarget)
{
    if (!rtarget.fboid)
        return;

    let texid   = rtarget.texid;
    let texz_id = rtarget.texz_id;
    let fboid   = rtarget.fboid;

    if (texid)   gl.deleteTexture (texid);
    if (texz_id) gl.deleteRenderbuffer (texz_id);
    gl.deleteFramebuffer (fboid);

    rtarget.texid   = null;
    rtarget.texz_id = null;
    rtarget.fboid   = null;
}

GLUtil.set_render_target = function (gl, rtarget)
{
    if (rtarget.fboid)
    {
        gl.bindFramebuffer (gl.FRAMEBUFFER, rtarget.fboid);
    }
    else
    {
        gl.bindFramebuffer (gl.FRAMEBUFFER, null);
    }

    gl.viewport (0, 0, rtarget.width, rtarget.height);
    gl.scissor  (0, 0, rtarget.width, rtarget.height);
}


GLUtil.get_render_target = function (gl, rtarget)
{
    rtarget.texid  = null;
    rtarget.texz_id= null;
    rtarget.fboid  = null;
    rtarget.width  = 0;
    rtarget.height = 0;

    let fbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if (fbo != null)
    {
        let tex_c = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,
                                                         gl.COLOR_ATTACHMENT0,
                                                         gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);

        let tex_z = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,
                                                         gl.DEPTH_ATTACHMENT,
                                                         gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
        rtarget.valid   = 1;
        rtarget.fboid   = fbo;
        rtarget.texid   = tex_c;
        rtarget.texz_id = tex_z;
    }

    let viewport = gl.getParameter(gl.VIEWPORT);
    rtarget.width  = viewport[2];
    rtarget.height = viewport[3];
}
