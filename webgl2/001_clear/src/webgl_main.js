export function
WebGLMain()
{
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl2');
    if (!gl)
    {
        alert('Failed to initialize WebGL2.');
        return;
    }

    gl.clearColor (0.5, 0.5, 0.5, 1.0);
    gl.clear (gl.COLOR_BUFFER_BIT);
}

WebGLMain();
