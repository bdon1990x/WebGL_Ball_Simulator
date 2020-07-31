const distance = (pos1, pos2) => {
  return Math.sqrt(
    Math.pow(pos2[0] - pos1[0], 2) + Math.pow(pos2[1] - pos1[1], 2)
  )
}

const magnitude = (v) => {
  return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2))
}

const degToRad = (d) => {
  return (d * Math.PI) / 180
}
