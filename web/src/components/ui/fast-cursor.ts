export type FastCursorController = {
  move: (x: number, y: number, active: boolean) => void
  updateHalo: () => void
  destroy: () => void
}

export function createFastCursor(
  cursor: HTMLDivElement,
  halo: HTMLDivElement,
  enabled: boolean,
): FastCursorController {
  let targetX = window.innerWidth / 2
  let targetY = window.innerHeight / 2
  let haloX = targetX
  let haloY = targetY
  let cursorFrame = 0

  const move = (x: number, y: number, active: boolean) => {
    targetX = x
    targetY = y
    if (!enabled) return

    // The bright cursor is positioned on the next browser paint without
    // interpolation, so it remains locked to the physical pointer at 60–120Hz.
    if (!cursorFrame) {
      cursorFrame = requestAnimationFrame(() => {
        cursorFrame = 0
        cursor.style.transform = `translate3d(${targetX}px,${targetY}px,0) translate(-50%,-50%)`
        cursor.classList.toggle('visible', active)
        halo.classList.toggle('visible', active)
      })
    }
  }

  const updateHalo = () => {
    if (!enabled) return
    // Only the large atmospheric halo has inertia; the cursor itself never lags.
    haloX += (targetX - haloX) * .24
    haloY += (targetY - haloY) * .24
    halo.style.transform = `translate3d(${haloX}px,${haloY}px,0) translate(-50%,-50%)`
  }

  const destroy = () => cancelAnimationFrame(cursorFrame)
  return { move, updateHalo, destroy }
}
