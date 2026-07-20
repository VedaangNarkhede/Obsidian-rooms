'use client';

import { useEffect, useRef } from 'react'
import './cursor-effects.css'
import { createFastCursor } from './fast-cursor'

type Star = { x: number; y: number; z: number; size: number; alpha: number; phase: number; hue: number }
type Trail = { x: number; y: number; life: number; size: number; hue: number; drift: number }

export default function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const cursor = cursorRef.current
    const halo = haloRef.current
    if (!canvas || !cursor || !halo) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const fastCursor = createFastCursor(cursor, halo, finePointer)
    let width = 0
    let height = 0
    let raf = 0
    let last = 0
    let visible = true
    let stars: Star[] = []
    const trail: Trail[] = []
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, haloX: 0, haloY: 0, active: false }

    const createStars = () => {
      const count = Math.min(260, Math.max(110, Math.floor((width * height) / 7200)))
      stars = Array.from({ length: count }, () => ({
        x: (Math.random() - .5) * width * 1.35,
        y: (Math.random() - .5) * height * 1.35,
        z: .08 + Math.random() * .92,
        size: .3 + Math.random() * 1.35,
        alpha: .16 + Math.random() * .78,
        phase: Math.random() * Math.PI * 2,
        hue: Math.random() > .86 ? 38 : 210 + Math.random() * 24,
      }))
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pointer.x = pointer.tx = pointer.haloX = width / 2
      pointer.y = pointer.ty = pointer.haloY = height / 2
      createStars()
    }

    const resetStar = (star: Star, depth = .08) => {
      star.x = (Math.random() - .5) * width * 1.15
      star.y = (Math.random() - .5) * height * 1.15
      star.z = depth
    }

    const drawStar = (x: number, y: number, radius: number, alpha: number, hue: number, streak = 0) => {
      if (x < -20 || x > width + 20 || y < -20 || y > height + 20) return
      ctx.beginPath()
      ctx.fillStyle = `hsla(${hue},90%,${hue < 100 ? 70 : 84}%,${alpha})`
      ctx.arc(x, y, Math.max(.2, radius), 0, Math.PI * 2)
      ctx.fill()
      if (radius > 1.3) {
        ctx.strokeStyle = `hsla(${hue},95%,82%,${alpha * .35})`
        ctx.lineWidth = .45
        ctx.beginPath()
        ctx.moveTo(x - radius * (3.2 + streak), y); ctx.lineTo(x + radius * (3.2 + streak), y)
        ctx.moveTo(x, y - radius * 3.2); ctx.lineTo(x, y + radius * 3.2)
        ctx.stroke()
      }
    }

    const render = (time: number) => {
      if (!visible) return
      // Cursor motion stays at the display refresh rate even though the more
      // expensive starfield remains deliberately frame-capped.
      fastCursor.updateHalo()
      if (time - last < 25 && !reduced) { raf = requestAnimationFrame(render); return }
      const dt = Math.min(2.2, (time - last) / 25 || 1)
      last = time
      ctx.clearRect(0, 0, width, height)

      pointer.x += (pointer.tx - pointer.x) * .2
      pointer.y += (pointer.ty - pointer.y) * .2

      const centerX = width * .5 + (pointer.active ? (pointer.x - width * .5) * .035 : 0)
      const centerY = height * .47 + (pointer.active ? (pointer.y - height * .5) * .025 : 0)
      const perspective = Math.min(width, height) * .72

      stars.forEach((s) => {
        const previousZ = s.z
        if (!reduced) s.z += (.0012 + s.z * .0017) * dt
        if (s.z > 1.04) resetStar(s)
        const scale = .22 + s.z * 1.65
        const x = centerX + s.x * scale + Math.sin(time * .00015 + s.phase) * 4 * s.z
        const y = centerY + s.y * scale + Math.cos(time * .00012 + s.phase) * 2.5 * s.z
        const previousScale = .22 + previousZ * 1.65
        const oldX = centerX + s.x * previousScale
        const oldY = centerY + s.y * previousScale
        if (Math.abs(x - centerX) > width * .75 || Math.abs(y - centerY) > height * .8) resetStar(s)
        const pulse = reduced ? 1 : .72 + Math.sin(time * .0015 + s.phase) * .28
        const radius = s.size * (.35 + s.z * 1.25)
        if (s.z > .82 && !reduced) {
          ctx.beginPath()
          ctx.moveTo(oldX, oldY)
          ctx.lineTo(x, y)
          ctx.strokeStyle = `hsla(${s.hue},90%,82%,${s.alpha * .24})`
          ctx.lineWidth = radius * .45
          ctx.stroke()
        }
        drawStar(x, y, radius, s.alpha * pulse * (.35 + s.z * .75), s.hue, s.z * 2)
      })

      if (pointer.active && finePointer && !reduced && Math.random() > .3) {
        const angle = Math.random() * Math.PI * 2
        const distance = 10 + Math.random() * 30
        trail.push({
          x: pointer.x + Math.cos(angle) * distance,
          y: pointer.y + Math.sin(angle) * distance,
          life: 1,
          size: .65 + Math.random() * 1.8,
          hue: 31 + Math.random() * 19,
          drift: (Math.random() - .5) * .35,
        })
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i]
        p.life -= .028 * dt
        p.y -= (.14 + p.size * .05) * dt
        p.x += p.drift * dt
        if (p.life <= 0) trail.splice(i, 1)
        else drawStar(p.x, p.y, p.size * (.25 + p.life), p.life * .78, p.hue)
      }
      if (trail.length > 46) trail.splice(0, trail.length - 46)
      void perspective
      raf = requestAnimationFrame(render)
    }

    const onPointer = (event: PointerEvent) => {
      pointer.tx = event.clientX; pointer.ty = event.clientY; pointer.active = true
      fastCursor.move(event.clientX, event.clientY, true)
      const interactive = (event.target as HTMLElement)?.closest('button, a, input, [role="button"]')
      cursor.classList.toggle('hovering', Boolean(interactive))
      halo.classList.toggle('hovering', Boolean(interactive))
    }
    const onDown = () => { cursor.classList.add('pressed'); halo.classList.add('pressed') }
    const onUp = () => { cursor.classList.remove('pressed'); halo.classList.remove('pressed') }
    const onLeave = () => { pointer.active = false; fastCursor.move(pointer.tx, pointer.ty, false) }
    const onVisibility = () => {
      visible = !document.hidden
      if (visible) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(render) }
    }

    resize()
    if (finePointer) document.documentElement.classList.add('cosmic-cursor-active')
    window.addEventListener('resize', resize, { passive: true })
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('visibilitychange', onVisibility)
    raf = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(raf)
      fastCursor.destroy()
      document.documentElement.classList.remove('cosmic-cursor-active')
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <>
    <canvas ref={canvasRef} className="cosmic-canvas cosmic-canvas-3d" aria-hidden="true" />
    <div ref={haloRef} className="mystic-cursor-halo" aria-hidden="true"><i/><i/></div>
    <div ref={cursorRef} className="mystic-cursor" aria-hidden="true"><span/><i/><b/></div>
  </>
}
