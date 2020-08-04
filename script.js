const width = 640
const height = 480

//initialization WEBGL
let clicks = 0
let canvas = null
let gl = null
let program = null

//mouseLogic
let startTime = null
let endTime = null
let startPoint = null
let endPoint = null

//state
let mouseDown = false
let selectedCircle = -1
let addCircle = false

//animation
const fps = 60

// physics
const g = 1
const wall_loss = 0.98
const ball_loss = 0.99

//Circle Properties
let circRadius = 25
let circles = [new Circle(circRadius, [100, 200], [0, 0])]

var vertexShaderText = [
  'precision mediump float;',
  '',
  'attribute vec2 vertPosition;',
  'attribute vec3 vertColor;',
  'varying vec3 fragColor;',
  '',
  'void main()',
  '{',
  '   fragColor = vertColor;',
  '   gl_Position = vec4(vertPosition, 0.0, 1.0);',
  '}',
].join('\n')

var fragmentShaderText = [
  'precision mediump float;',
  '',
  'varying vec3 fragColor;',
  'void main()',
  '{',
  '   gl_FragColor = vec4(fragColor, 1.0);',
  '}',
].join('\n')

var triangleVertices = []

const convertCoord = (x, y) => {
  return [(x * 2) / width - 1, -((y * 2) / height - 1)]
}

const onMouseDown = (e) => {
  let rect = canvas.getBoundingClientRect()
  let x = e.clientX - rect.left
  let y = e.clientY - rect.top

  if (addCircle) {
    circles.push(
      new Circle(
        circRadius,
        [x, y],
        [0, 0],
        [
          Math.random() / 2 + 0.5,
          Math.random() / 2 + 0.5,
          Math.random() / 2 + 0.5,
        ]
      )
    )
  } else {
    selectedCircle = circles.findIndex(
      (c) =>
        Math.abs(c.position[0] - x) <= circRadius &&
        Math.abs(c.position[1] - y) <= circRadius
    )
    if (selectedCircle !== -1) {
      mouseDown = true
      circles[selectedCircle].loss = 1
      startPoint = [x, y]
      circles[selectedCircle].position = [x, y]
    }
  }
}
const onMouseMove = (e) => {
  if (mouseDown) {
    startTime = startTime || new Date().getTime()
    let rect = canvas.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    circles[selectedCircle].loss = 1
    circles[selectedCircle].position = [x, y]
  }
}

const onMouseUp = (e) => {
  if (selectedCircle !== -1) {
    endTime = new Date().getTime()
    let rect = canvas.getBoundingClientRect()
    endPoint = [e.clientX - rect.left, e.clientY - rect.top]
    const duration = ((endTime - startTime) * fps) / 1000
    const vX = (endPoint[0] - startPoint[0]) / duration
    const vY = (endPoint[1] - startPoint[1]) / duration
    circles[selectedCircle].velocity = [vX, vY]

    startTime = null
    endTime = null
    startPoint = null
    endPoint = null
    selectedCircle = -1
    mouseDown = false
  }
}

toggleAddCircle = () => {
  if (addCircle) {
    document.getElementById('circleButton').innerHTML = 'Add Circles'
    document.getElementById('notice').innerHTML =
      'Click and drag circles to throw them!'
  } else {
    document.getElementById('circleButton').innerHTML = 'Stop Adding'
    document.getElementById('notice').innerHTML = 'Add circles by clicking!'
  }
  addCircle = !addCircle
}

shakeCircles = () => {
  for (const circle of circles) {
    circle.velocity = [Math.random() * 100 - 50, Math.random() * 100 - 50]
    circle.loss = 1
  }
}

setRadius = (r) => {
  circRadius = parseInt(r)
}

clearCircle = () => {
  circles = []
}
function main() {
  canvas = document.querySelector('#glCanvas')
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)

  document
    .getElementById('circleButton')
    .addEventListener('click', toggleAddCircle)
  document.getElementById('shakeButton').addEventListener('click', shakeCircles)
  document.getElementById('clearButton').addEventListener('click', clearCircle)

  gl = canvas.getContext('webgl')

  if (!gl) {
    const gl = canvas.getContext('experimental-webgl')
  }
  if (!gl) {
    console.log('WebGL not supported. Falling back on experimental.')
    alert('WebGL not supported on this browser')
  }
  if (gl === null) {
    alert(
      'Unable to initialize WebGL. Your browser or machine may not support it.'
    )
    return
  }

  gl.clearColor(0.98, 0.85, 0.78, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)

  gl.shaderSource(vertexShader, vertexShaderText)
  gl.shaderSource(fragmentShader, fragmentShaderText)

  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      'Error compiling vertex shader!',
      gl.getShaderInfoLog(vertexShader)
    )
    return
  }
  gl.compileShader(fragmentShader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      'Error compiling fragment shader!',
      gl.getShaderInfoLog(fragmentShader)
    )
    return
  }

  program = gl.createProgram()
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ERROR linking program!', gl.getProgramInfoLog(program))
    return
  }
  gl.validateProgram(program)
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('ERROR validating program!', gl.getProgramInfoLog(program))
    return
  }

  //
  // Create Buffer
  //
  animLoop()
}

const animLoop = () => {
  requestAnimationFrame(animLoop)
  render()
}

const render = () => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  for (const circle of circles) {
    if (
      selectedCircle !== -1 &&
      JSON.stringify(circle.position) ===
        JSON.stringify(circles[selectedCircle].position)
    ) {
      continue
    }
    //Movement
    circle.position[1] = Math.min(
      circle.position[1] + circle.velocity[1],
      height - circRadius
    )
    circle.position[1] = Math.max(circle.position[1], circRadius)
    circle.velocity[1] = circle.velocity[1] + g

    circle.position[0] = Math.min(
      circle.position[0] + circle.velocity[0],
      width - circRadius
    )
    circle.position[0] = Math.max(circle.position[0], circRadius)
    //Wall Collision
    if (
      circle.position[1] + circRadius >= height ||
      circle.position[1] <= circRadius
    ) {
      circle.velocity[1] =
        circle.velocity[1] *
        circle.loss *
        (circle.position[1] <= circRadius && circle.velocity[1] > 0 ? 1 : -1)
      circle.loss = circle.loss * wall_loss
    }

    if (
      circle.position[0] + circRadius >= width ||
      circle.position[0] <= circRadius
    ) {
      circle.velocity[0] = -circle.velocity[0] * circle.loss
      circle.loss = circle.loss * wall_loss
    }
  }
  for (const circle of circles) {
    //Unit Collision
    if (
      selectedCircle !== -1 &&
      JSON.stringify(circle.position) ===
        JSON.stringify(circles[selectedCircle].position)
    ) {
      continue
    }
    let collision = circles.findIndex((c) => {
      const d = distance(circle.position, c.position)
      return d > 0 && d < 2 * circRadius
    })
    if (collision != -1) {
      const circle2 = circles[collision]
      const tot_v =
        (magnitude(circle.velocity) + magnitude(circle2.velocity)) * circle.loss
      const dx = circle2.position[0] - circle.position[0]
      const dy = circle2.position[1] - circle.position[1]
      const angle = Math.atan(dy / dx)
      circle.velocity[0] = ((dx < 0 ? 1 : -1) * (Math.cos(angle) * tot_v)) / 2
      circle.velocity[1] = ((dx < 0 ? 1 : -1) * (Math.sin(angle) * tot_v)) / 2

      circle.loss = Math.max(circle.loss, circle2.loss * ball_loss)
    }
  }
  for (const circle of circles) {
    drawCircle(circle)
  }
}

window.requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    // if none of the above, use non-native timeout method
    function (callback) {
      window.setTimeout(callback, 1000 / fps)
    }
  )
})()

const drawCircle = (circle) => {
  const center = convertCoord(circle.position[0], circle.position[1])
  let circleVertices = [center[0], center[1], ...circle.color]
  rh = (circRadius * 2) / width
  rv = (circRadius * 2) / height
  for (let i = 0; i <= 360; i += 10) {
    x1 = Math.cos(degToRad(i)) * rh
    y1 = Math.sin(degToRad(i)) * rv
    circleVertices = [
      ...circleVertices,
      center[0] + x1,
      center[1] + y1,
      ...circle.color,
    ]
  }
  var circleVertexBufferObject = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, circleVertexBufferObject)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(circleVertices),
    gl.STATIC_DRAW
  )

  var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition')
  var colorAttribLocation = gl.getAttribLocation(program, 'vertColor')
  gl.vertexAttribPointer(
    positionAttribLocation, //Attribute location
    2, // Number of elements per attribute
    gl.FLOAT,
    gl.FALSE,
    5 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
    0 //Offset from the beginning of a single vertex to this attribute
  )
  gl.vertexAttribPointer(
    colorAttribLocation, //Attribute location
    3, // Number of elements per attribute
    gl.FLOAT,
    gl.FALSE,
    5 * Float32Array.BYTES_PER_ELEMENT, //Size of an individual vertex
    2 * Float32Array.BYTES_PER_ELEMENT //Offset from the beginning of a single vertex to this attribute
  )

  gl.enableVertexAttribArray(positionAttribLocation)
  gl.enableVertexAttribArray(colorAttribLocation)

  gl.useProgram(program)
  gl.drawArrays(gl.TRIANGLE_FAN, 0, 38)
}

window.onload = main
