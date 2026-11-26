import { useEffect, useRef, useState } from 'react'

// Gas Lab: Particles -> Probability  (Chemistry x Maths)
// 2D ideal gas. Speeds follow the Maxwell-Boltzmann (Rayleigh) distribution.
// Self-contained: no dependency on other Tenali files.

const H = 300, NB = 32, VMAX = 320, X0 = 10
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
const mk = (s) => ({ x: Math.random() * s.W, y: Math.random() * H, vx: gauss() * Math.sqrt(s.kT), vy: gauss() * Math.sqrt(s.kT) })

function step(s, dt) {
  for (const p of s.parts) {
    p.x += p.vx * dt; p.y += p.vy * dt
    if (p.x < 0) { p.x = -p.x; p.vx = -p.vx; s.imp += 2 * Math.abs(p.vx) }
    if (p.x > s.W) { p.x = Math.max(0, 2 * s.W - p.x); p.vx = -p.vx; s.imp += 2 * Math.abs(p.vx) }
    if (p.y < 0) { p.y = -p.y; p.vy = -p.vy; s.imp += 2 * Math.abs(p.vy) }
    if (p.y > H) { p.y = 2 * H - p.y; p.vy = -p.vy; s.imp += 2 * Math.abs(p.vy) }
  }
  s.t += dt
  if (s.t >= 1.5) { s.pm = s.imp / s.t / (2 * (s.W + H)); s.imp = 0; s.t = 0 } // measured pressure
  const c = new Array(NB).fill(0)
  for (const p of s.parts) { const b = Math.floor(Math.hypot(p.vx, p.vy) / VMAX * NB); if (b < NB) c[b]++ }
  for (let i = 0; i < NB; i++) s.bins[i] = s.bins[i] * 0.97 + c[i] * 0.03
}

function drawBox(cv, s) {
  const c = cv.getContext('2d'); c.clearRect(0, 0, 800, H)
  c.strokeStyle = '#e5e7ff'; c.lineWidth = 3; c.strokeRect(X0, 1, s.W, H - 2)
  c.fillStyle = '#fb923c'; c.fillRect(X0 + s.W, 1, 7, H - 2)
  const sc = 3 * Math.sqrt(s.kT)
  for (const p of s.parts) {
    const hue = 220 - Math.min(Math.hypot(p.vx, p.vy) / sc, 1) * 220
    c.fillStyle = `hsl(${hue},90%,58%)`; c.beginPath(); c.arc(X0 + p.x, p.y, 4, 0, 7); c.fill()
  }
}

function drawHist(cv, s) {
  const c = cv.getContext('2d'), w = 800, h = 250, pl = 34, pb = 26, bw = VMAX / NB
  c.clearRect(0, 0, w, h)
  const f = (v) => (v / s.kT) * Math.exp(-v * v / (2 * s.kT)) * s.parts.length * bw // theory count per bin
  let ym = 1; for (let i = 0; i < NB; i++) ym = Math.max(ym, s.bins[i], f((i + 0.5) * bw)); ym *= 1.15
  const X = (v) => pl + (v / VMAX) * (w - pl - 8), Y = (y) => h - pb - (y / ym) * (h - pb - 12)
  c.fillStyle = '#38bdf8'; c.globalAlpha = 0.6
  for (let i = 0; i < NB; i++) c.fillRect(X(i * bw) + 1, Y(s.bins[i]), X(bw) - X(0) - 2, h - pb - Y(s.bins[i]))
  c.globalAlpha = 1; c.strokeStyle = '#a78bfa'; c.lineWidth = 3.5; c.beginPath()
  for (let v = 0; v <= VMAX; v += 2) v ? c.lineTo(X(v), Y(f(v))) : c.moveTo(X(v), Y(f(v)))
  c.stroke()
  c.strokeStyle = '#35306b'; c.lineWidth = 1; c.beginPath(); c.moveTo(pl, 8); c.lineTo(pl, h - pb); c.lineTo(w - 8, h - pb); c.stroke()
  c.fillStyle = '#a9a6cc'; c.font = '12px system-ui'; c.fillText('speed v', w - 60, h - 6)
}

const card = { background: '#14123a', border: '1px solid #35306b', borderRadius: 16, padding: 14, marginBottom: 12 }
const cvs = { width: '100%', height: 'auto', display: 'block', background: '#0d0b1e', borderRadius: 12 }

export default function ChemMathsLab({ onBack }) {
  const [temp, setTemp] = useState(40)
  const [width, setWidth] = useState(780)
  const [n, setN] = useState(200)
  const [paused, setPaused] = useState(false)
  const [pm, setPm] = useState(0)
  const [tgt, setTgt] = useState(null)
  const boxRef = useRef(null), histRef = useRef(null)
  const sim = useRef({ parts: [], kT: 2400, W: 780, bins: new Array(NB).fill(0), imp: 0, t: 0, pm: 0, paused: false })

  useEffect(() => { // temperature: rescale velocities by sqrt(T_new / T_old)
    const s = sim.current, k = temp * 60, f = Math.sqrt(k / s.kT)
    s.parts.forEach((p) => { p.vx *= f; p.vy *= f }); s.kT = k; s.bins.fill(0); s.imp = 0; s.t = 0; s.pm = 0
  }, [temp])
  useEffect(() => { // volume: move the piston
    const s = sim.current; s.W = width
    s.parts.forEach((p) => { if (p.x > width) p.x = Math.random() * width }); s.imp = 0; s.t = 0; s.pm = 0
  }, [width])
  useEffect(() => { // particle count
    const s = sim.current
    while (s.parts.length < n) s.parts.push(mk(s))
    s.parts.length = n; s.imp = 0; s.t = 0; s.pm = 0
  }, [n])
  useEffect(() => { sim.current.paused = paused }, [paused])

  useEffect(() => {
    let raf, last = performance.now(), fr = 0
    const loop = (now) => {
      const s = sim.current, dt = Math.min((now - last) / 1000, 0.033); last = now
      if (!s.paused) step(s, dt)
      if (boxRef.current) drawBox(boxRef.current, s)
      if (histRef.current) drawHist(histRef.current, s)
      if (++fr % 10 === 0) setPm(s.pm)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const kT = temp * 60, area = width * H
  const pp = (n * kT) / area // predicted pressure from P*A = N*kT
  const newChallenge = () => setTgt((50 + Math.random() * 300) * (10 + Math.random() * 80) * 60 / ((200 + Math.random() * 560) * H))
  const err = tgt ? (pp - tgt) / tgt : 0

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, color: '#f1efff', fontFamily: 'system-ui, sans-serif' }}>
      {onBack && <button onClick={onBack}>← Back</button>}
      <h2>Gas Lab: Particles to Probability</h2>
      <p style={{ opacity: 0.8 }}>Each particle is random, yet the crowd follows the Maxwell-Boltzmann curve. Pressure is just wall hits: P·A = N·kT.</p>
      <div style={card}>
        <label>Temperature T = {temp}<input type="range" min="5" max="100" value={temp} onChange={(e) => setTemp(+e.target.value)} style={{ width: '100%' }} /></label>
        <label>Volume = {Math.round(area / 1000)}<input type="range" min="150" max="780" value={width} onChange={(e) => setWidth(+e.target.value)} style={{ width: '100%' }} /></label>
        <label>Particles N = {n}<input type="range" min="20" max="400" value={n} onChange={(e) => setN(+e.target.value)} style={{ width: '100%' }} /></label>
        <button onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
        <canvas ref={boxRef} width={800} height={H} style={{ ...cvs, marginTop: 10 }} />
      </div>
      <div style={card}>
        <b>Speed histogram (bars) vs theory f(v) = (v/kT)·e^(-v²/2kT) (line)</b>
        <canvas ref={histRef} width={800} height={250} style={cvs} />
      </div>
      <div style={{ ...card, fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
        Predicted P = N·kT/A = {pp.toFixed(3)}<br />
        Measured P = {pm ? pm.toFixed(3) : 'measuring...'}<br />
        v_peak = √kT = {Math.sqrt(kT).toFixed(1)} · v_mean = √(πkT/2) = {Math.sqrt((Math.PI * kT) / 2).toFixed(1)} · v_rms = √(2kT) = {Math.sqrt(2 * kT).toFixed(1)}
      </div>
      <div style={card}>
        <b>Challenge</b>{' '}
        <button onClick={newChallenge}>New challenge</button>
        {tgt && <p>Set the predicted pressure to <b>{tgt.toFixed(2)}</b> (±5%). Now: {pp.toFixed(2)} {Math.abs(err) < 0.05 ? '🎉 Nailed it!' : err > 0 ? '→ too high' : '→ too low'}</p>}
      </div>
    </div>
  )
}
