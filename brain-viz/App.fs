module App

open Fable.Core
open Fable.Core.JsInterop
open Browser.Dom
open Feliz

importSideEffects "./style.css"

let THREE: obj = importAll "three"
let OrbitControls: obj = import "OrbitControls" "three/addons/controls/OrbitControls.js"

type Stage =
    | Healthy
    | Ace9
    | Ketamine

type Synapse =
    { A: int
      B: int
      Vuln: float
      Loss: float
      Regrow: float
      Phase: float }

let aceScore = 9
let neuronCount = 1600
let rnd () = JS.Math.random ()

// ---------- brain model ----------

let samplePoint () =
    let u = rnd () * 2.0 - 1.0
    let th = rnd () * 2.0 * System.Math.PI
    let s = sqrt (1.0 - u * u)
    let dx, dy, dz = s * cos th, u, s * sin th
    let r = 0.5 + 0.5 * (rnd () ** 0.35)
    let roll = rnd ()

    if roll < 0.86 then
        // cerebral hemispheres (front = +z)
        let side = if rnd () < 0.5 then -1.0 else 1.0
        let fold = 1.0 + 0.06 * sin (dx * 9.0 + dy * 7.0) * cos (dz * 8.0)
        (abs dx * 0.72 * r * fold + 0.05) * side, dy * 0.68 * r * fold + 0.18, dz * 1.05 * r * fold
    elif roll < 0.96 then
        // cerebellum
        dx * 0.5 * r, dy * 0.28 * r - 0.55, dz * 0.35 * r - 0.72
    else
        // brainstem
        dx * 0.1, -0.5 - rnd () * 0.6, -0.3 + dz * 0.1

let vulnerability (x: float, y: float, z: float) =
    if z > 0.45 && y > -0.1 then 1.0 // prefrontal cortex
    elif abs x < 0.45 && y > -0.3 && y < 0.15 && abs z < 0.4 then 0.95 // hippocampus + amygdala
    else 0.3

let points = Array.init neuronCount (fun _ -> samplePoint ())
let vulns = points |> Array.map vulnerability

let synapses =
    [| for i in 0 .. neuronCount - 1 do
           let (x, y, z) = points.[i]

           let nearest =
               Array.init 36 (fun _ -> int (rnd () * float neuronCount))
               |> Array.filter (fun j -> j <> i)
               |> Array.map (fun j ->
                   let (a, b, c) = points.[j]
                   j, (a - x) ** 2.0 + (b - y) ** 2.0 + (c - z) ** 2.0)
               |> Array.filter (fun (_, d) -> d < 0.16)
               |> Array.sortBy snd
               |> Array.truncate 3

           for (j, _) in nearest do
               { A = i
                 B = j
                 Vuln = (vulns.[i] + vulns.[j]) / 2.0
                 Loss = rnd ()
                 Regrow = rnd ()
                 Phase = rnd () * 6.283 } |]

// ---------- three.js scene ----------

let scene = createNew THREE?Scene ()
let camera = createNew THREE?PerspectiveCamera (45, 1.0, 0.1, 100)
camera?position?set (2.6, 0.9, 2.6)

let renderer = createNew THREE?WebGLRenderer (createObj [ "antialias" ==> true ])
renderer?setPixelRatio (min window.devicePixelRatio 2.0)
document.getElementById("scene").appendChild (renderer?domElement) |> ignore

let controls = createNew OrbitControls (camera, renderer?domElement)
controls?enableDamping <- true
controls?autoRotate <- true
controls?autoRotateSpeed <- 0.8
controls?target?set (0, -0.05, 0)

let neuronPos = Array.zeroCreate<float32> (neuronCount * 3)
let neuronCol = Array.zeroCreate<float32> (neuronCount * 3)

points
|> Array.iteri (fun i (x, y, z) ->
    neuronPos.[i * 3] <- float32 x
    neuronPos.[i * 3 + 1] <- float32 y
    neuronPos.[i * 3 + 2] <- float32 z)

let synPos = Array.zeroCreate<float32> (synapses.Length * 6)
let synCol = Array.zeroCreate<float32> (synapses.Length * 6)

synapses
|> Array.iteri (fun k s ->
    for c in 0..2 do
        synPos.[k * 6 + c] <- neuronPos.[s.A * 3 + c]
        synPos.[k * 6 + 3 + c] <- neuronPos.[s.B * 3 + c])

let makeGeometry (pos: float32[]) (col: float32[]) =
    let geo = createNew THREE?BufferGeometry ()
    let colAttr = createNew THREE?BufferAttribute (col, 3)
    geo?setAttribute ("position", createNew THREE?BufferAttribute (pos, 3))
    geo?setAttribute ("color", colAttr)
    geo, colAttr

let material (ctor: obj) (extra: (string * obj) list) =
    createNew
        ctor
        (createObj (
            [ "vertexColors" ==> true
              "transparent" ==> true
              "depthWrite" ==> false
              "blending" ==> THREE?AdditiveBlending ]
            @ extra
        ))

let neuronGeo, neuronColAttr = makeGeometry neuronPos neuronCol
let synGeo, synColAttr = makeGeometry synPos synCol

scene?add (createNew THREE?Points (neuronGeo, material THREE?PointsMaterial [ "size" ==> 0.035 ]))
scene?add (createNew THREE?LineSegments (synGeo, material THREE?LineBasicMaterial [ "opacity" ==> 0.55 ]))

let resize _ =
    camera?aspect <- window.innerWidth / window.innerHeight
    camera?updateProjectionMatrix ()
    renderer?setSize (window.innerWidth, window.innerHeight)

window.addEventListener ("resize", resize)
resize ()

// ---------- state + HUD ----------

let mutable stage = Ace9
let mutable stress = 0.0 // toxic-stress load, 0..1
let mutable bdnf = 0.0 // BDNF / synaptogenesis signal, 0..1
let mutable hud = (-1, -1, -1)

let root = ReactDOM.createRoot (document.getElementById "root")

let stageButton (s: Stage) (label: string) (active: string) =
    Html.button [
        prop.className (
            "pointer-events-auto rounded-full border px-4 py-2 text-sm font-medium transition "
            + (if stage = s then active else "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500")
        )
        prop.text label
        prop.onClick (fun _ ->
            stage <- s
            hud <- (-1, -1, -1))
    ]

let stat (label: string) (value: string) (color: string) =
    Html.div [
        Html.div [ prop.className "text-xs uppercase tracking-widest text-slate-400"; prop.text label ]
        Html.div [ prop.className ("text-3xl font-semibold tabular-nums " + color); prop.text value ]
    ]

let view (intact: int) (lost: int) (regrown: int) =
    let title, blurb =
        match stage with
        | Healthy -> "Baseline", "Dense, active synaptic network in a developing brain."
        | Ace9 ->
            "ACE score 9 of 10",
            "Chronic toxic stress: synaptic loss concentrated in prefrontal cortex, hippocampus and amygdala circuits."
        | Ketamine ->
            "Ketamine → BDNF",
            "NMDA blockade triggers a glutamate burst, BDNF release and mTOR-driven regrowth of dendritic spines."

    Html.div [
        prop.className "pointer-events-none fixed inset-0 flex flex-col justify-between p-6 font-sans text-slate-100"
        prop.children [
            Html.div [
                prop.className "max-w-md"
                prop.children [
                    Html.div [
                        prop.className "text-xs uppercase tracking-[0.3em] text-slate-400"
                        prop.text "Developing brain · synaptic connectivity"
                    ]
                    Html.h1 [ prop.className "mt-1 text-4xl font-bold"; prop.text title ]
                    Html.p [ prop.className "mt-2 text-sm leading-relaxed text-slate-300"; prop.text blurb ]
                ]
            ]
            Html.div [
                prop.className "flex flex-wrap items-end justify-between gap-6"
                prop.children [
                    Html.div [
                        prop.className "flex gap-8"
                        prop.children [
                            stat "ACE score" (if stage = Healthy then "0" else string aceScore) "text-rose-400"
                            stat "Intact" (string intact + "%") "text-sky-300"
                            stat "Lost" (string lost + "%") "text-rose-400"
                            stat "BDNF regrowth" (string regrown + "%") "text-emerald-300"
                        ]
                    ]
                    Html.div [
                        prop.className "flex gap-2"
                        prop.children [
                            stageButton Healthy "Baseline" "border-sky-400 bg-sky-500/20 text-sky-200"
                            stageButton Ace9 "ACE 9" "border-rose-400 bg-rose-500/20 text-rose-200"
                            stageButton Ketamine "Ketamine + BDNF" "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                        ]
                    ]
                ]
            ]
            Html.div [
                prop.className "absolute right-6 top-6 text-right text-[11px] text-slate-500"
                prop.text "Illustrative model — not clinical data or medical advice."
            ]
        ]
    ]

// ---------- animation ----------

let approach (current: float) (target: float) (dt: float) (rate: float) =
    if current < target then min target (current + rate * dt)
    else max target (current - rate * dt)

let mutable last = 0.0

let frame (ms: float) =
    let t = ms / 1000.0
    let dt = min 0.1 (t - last)
    last <- t

    let stressTarget, bdnfTarget =
        match stage with
        | Healthy -> 0.0, 0.0
        | Ace9 -> float aceScore / 10.0, 0.0
        | Ketamine -> float aceScore / 10.0, 1.0

    stress <- approach stress stressTarget dt 0.22
    bdnf <- approach bdnf bdnfTarget dt 0.16

    let mutable lostCount = 0
    let mutable regrownCount = 0

    synapses
    |> Array.iteri (fun k s ->
        let isLost = s.Loss < stress * s.Vuln * 0.85
        let isRegrown = isLost && s.Regrow < bdnf * 0.8
        let pulse = 0.5 + 0.5 * sin (t * 2.2 + s.Phase)

        let r, g, b =
            if isRegrown then
                regrownCount <- regrownCount + 1
                0.1 * pulse, 0.35 + 0.65 * pulse, 0.25 + 0.4 * pulse
            elif isLost then
                lostCount <- lostCount + 1
                0.2, 0.015, 0.03
            else
                0.12 + 0.2 * pulse, 0.3 + 0.35 * pulse, 0.55 + 0.45 * pulse

        for v in 0..1 do
            synCol.[k * 6 + v * 3] <- float32 r
            synCol.[k * 6 + v * 3 + 1] <- float32 g
            synCol.[k * 6 + v * 3 + 2] <- float32 b)

    for i in 0 .. neuronCount - 1 do
        let hurt = stress * vulns.[i] * (1.0 - bdnf * 0.8)
        let heal = bdnf * stress * vulns.[i]
        neuronCol.[i * 3] <- float32 (0.35 + 0.65 * hurt - 0.2 * heal)
        neuronCol.[i * 3 + 1] <- float32 (0.6 - 0.45 * hurt + 0.4 * heal)
        neuronCol.[i * 3 + 2] <- float32 (1.0 - 0.8 * hurt - 0.3 * heal)

    synColAttr?needsUpdate <- true
    neuronColAttr?needsUpdate <- true

    let pct n = int (round (100.0 * float n / float synapses.Length))
    let next = (100 - pct lostCount - pct regrownCount, pct lostCount, pct regrownCount)

    if next <> hud then
        hud <- next
        let (a, b, c) = next
        root.render (view a b c)

    controls?update ()
    renderer?render (scene, camera)

renderer?setAnimationLoop frame
